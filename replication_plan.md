# AI Query Assistant — Full Replication Plan (PostgreSQL)

## What You Are Building

A chatbot page where users type natural-language questions about the database and get answers as tables, charts, maps, or stat cards. It also supports voice input (speech-to-text via Groq Whisper) and text-to-speech output. The AI generates safe, read-only SQL behind the scenes.

---

## Architecture

```
User (browser) ──► POST /api/chat ──► Express server
                                        │
                                        ├─ getDbSchema() reads PostgreSQL information_schema
                                        ├─ Sends schema + user question to Groq (Llama 3.3 70B)
                                        ├─ Groq returns JSON: { sql, explanation, visualization, chart_config }
                                        ├─ Server executes SQL (SELECT only) via pg Pool
                                        └─ Returns { explanation, sql, data, visualization, chart_config }

User (browser) ──► POST /api/transcribe ──► Multer saves .webm file
                                             └─ Groq Whisper transcribes → returns { text }

Frontend renders: stat_card | table | bar_chart | pie_chart | line_chart | map | none
```

---

## Step 1 — Install Dependencies

```bash
npm install express cors pg groq-sdk multer dotenv
```

## Step 2 — Environment Variables (`.env`)

```
DATABASE_URL=postgresql://user:password@host:5432/your_db_name
GROQ_API_KEY=gsk_your_groq_api_key_here
PORT=3000
```

---

## Step 3 — Backend (`server.js`)

Create `server.js` at the project root. The complete, production-ready code follows.

> **CRITICAL**: The `getDbSchema()` function auto-discovers ALL tables and columns. You do NOT need to hard-code any schema. The `SYSTEM_PROMPT` must tell the AI to use **PostgreSQL syntax** (e.g., `ILIKE`, `TO_CHAR()`, `EXTRACT()` instead of SQLite's `strftime()`).

```javascript
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const Groq = require('groq-sdk');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const app = express();
const upload = multer({ dest: 'uploads/' });
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── PostgreSQL connection ──
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// ── Groq AI setup ──
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ── Dynamic schema extraction (works with ANY Postgres DB) ──
async function getDbSchema() {
    let schema = '';
    const tablesRes = await pool.query(`
        SELECT table_name FROM information_schema.tables
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    `);
    for (const t of tablesRes.rows) {
        const name = t.table_name;
        const colsRes = await pool.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns WHERE table_name = $1
        `, [name]);
        schema += `\nTable: ${name}\nColumns:\n`;
        colsRes.rows.forEach(c => {
            schema += `  - ${c.column_name} (${c.data_type}${c.is_nullable === 'NO' ? ', NOT NULL' : ''})\n`;
        });
        try {
            const sample = await pool.query(`SELECT * FROM "${name}" LIMIT 3`);
            if (sample.rows.length > 0) schema += `Sample data: ${JSON.stringify(sample.rows, null, 2)}\n`;
        } catch (_) { /* skip if permission denied */ }
    }
    return schema;
}

// ── Conversation history (in-memory) ──
const conversations = new Map();

// ── Build system prompt at startup ──
let SYSTEM_PROMPT = '';
(async () => {
    const dbSchema = await getDbSchema();
    SYSTEM_PROMPT = `You are an intelligent database assistant for this portal.
You help users query and analyze data using natural language.

Here is the database schema:
${dbSchema}

IMPORTANT RULES:
1. When the user asks about data, generate a valid PostgreSQL query.
2. Return ONLY this JSON format (no markdown, no code blocks):
{
  "sql": "YOUR SQL QUERY HERE",
  "explanation": "Brief explanation",
  "visualization": "table" | "bar_chart" | "pie_chart" | "line_chart" | "stat_card" | "map" | "none",
  "chart_config": {
    "title": "Title",
    "x_label": "X axis label",
    "y_label": "Y axis label",
    "label_column": "column for labels",
    "value_column": "column for values"
  }
}
3. ONLY use SELECT statements. Never INSERT, UPDATE, DELETE, DROP.
4. Choose the best visualization:
   - "stat_card" for single values (counts, averages)
   - "table" for multi-row, multi-column results
   - "bar_chart" for category comparisons
   - "pie_chart" for proportions
   - "line_chart" for time-series
   - "map" if user asks for geographic view (query MUST select latitude, longitude columns)
   - "none" for conversational responses
5. For non-data questions respond with: { "sql": null, "explanation": "your response", "visualization": "none", "chart_config": null }
6. Limit results to max 100 rows. For maps max 500.
7. Use PostgreSQL syntax: ILIKE for case-insensitive search, TO_CHAR/EXTRACT for dates, double-quote identifiers if needed.
8. Use JOINs when data from multiple tables is needed.`;

    console.log('✅ Database schema loaded into AI context');
})();

// ── Chat endpoint ──
app.post('/api/chat', async (req, res) => {
    try {
        const { message, conversationId } = req.body;
        if (!message) return res.status(400).json({ error: 'Message is required' });

        if (!conversations.has(conversationId)) conversations.set(conversationId, []);
        const history = conversations.get(conversationId);

        let contextPrompt = SYSTEM_PROMPT + '\n\n';
        const recent = history.slice(-6);
        if (recent.length > 0) {
            contextPrompt += 'Recent conversation:\n';
            recent.forEach(h => { contextPrompt += `User: ${h.user}\nAssistant: ${h.assistant}\n\n`; });
        }
        contextPrompt += `\nUser's new question: ${message}\n\nRespond with valid JSON only:`;

        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: contextPrompt }],
            model: "llama-3.3-70b-versatile",
            temperature: 0.1,
            response_format: { type: "json_object" },
        });

        let parsed;
        try {
            const text = completion.choices[0]?.message?.content || "";
            const match = text.match(/\{[\s\S]*\}/);
            parsed = match ? JSON.parse(match[0]) : null;
            if (!parsed) throw new Error('No JSON');
        } catch (_) {
            parsed = { sql: null, explanation: 'Could you rephrase that?', visualization: 'none', chart_config: null };
        }

        let queryResult = null, error = null;
        if (parsed.sql) {
            try {
                const sanitized = parsed.sql.trim().toUpperCase();
                if (!sanitized.startsWith('SELECT') && !sanitized.startsWith('WITH')) throw new Error('Only SELECT allowed');
                const result = await pool.query(parsed.sql);
                queryResult = result.rows;
            } catch (dbErr) {
                error = dbErr.message;
                parsed.explanation += `\n\n⚠️ SQL Error: ${dbErr.message}`;
                parsed.visualization = 'none';
            }
        }

        history.push({ user: message, assistant: parsed.explanation });
        if (history.length > 20) history.splice(0, history.length - 20);

        res.json({ explanation: parsed.explanation, sql: parsed.sql, data: queryResult, visualization: parsed.visualization, chart_config: parsed.chart_config, error });
    } catch (err) {
        console.error('Server error:', err);
        res.status(500).json({ error: 'Failed to process request', explanation: 'Something went wrong.', visualization: 'none' });
    }
});

// ── Stats endpoint (CUSTOMIZE for your portal's tables) ──
app.get('/api/stats', async (req, res) => {
    try {
        // Replace these with queries relevant to YOUR data entry portal
        const total = await pool.query('SELECT COUNT(*) as count FROM your_main_table');
        // Add more stats as needed...
        res.json({ totalRecords: parseInt(total.rows[0].count) });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Speech-to-Text via Groq Whisper ──
app.post('/api/transcribe', upload.single('audio'), async (req, res) => {
    let filePath = req.file ? req.file.path : null;
    try {
        if (!req.file) return res.status(400).json({ error: 'No audio file provided' });
        const newPath = filePath + '.webm';
        fs.renameSync(filePath, newPath);
        filePath = newPath;
        const transcription = await groq.audio.transcriptions.create({
            file: fs.createReadStream(filePath), model: "whisper-large-v3",
        });
        fs.unlink(filePath, () => {});
        res.json({ text: transcription.text });
    } catch (err) {
        console.error('Transcription error:', err);
        if (filePath) fs.unlink(filePath, () => {});
        res.status(500).json({ error: 'Failed to transcribe audio' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`\n🚀 AI Query Assistant running at http://localhost:${PORT}\n`));
```

---

## Step 4 — Frontend

Create a `public/` folder with three files: `index.html`, `style.css`, `app.js`.

### Key Frontend Features to Implement

1. **Chat UI**: A sidebar with stats + suggestion buttons, a main chat area with message bubbles (user on the right, AI on the left), a textarea input with mic button and send button.
2. **Visualization Renderer** (`app.js`): Based on the `visualization` field in the API response, render:
   - `stat_card` → big number display
   - `table` → HTML table with column headers
   - `bar_chart` / `pie_chart` / `line_chart` → Chart.js canvas
   - `map` → Leaflet.js map with marker clustering
3. **Voice Recording** (`app.js`): Use `navigator.mediaDevices.getUserMedia({ audio: true })` + `MediaRecorder` API to record audio, then POST the blob to `/api/transcribe`. On success, fill the chat input with the transcribed text and auto-send.
4. **Text-to-Speech** (`app.js`): Use the browser's `SpeechSynthesisUtterance` API to read AI responses aloud when user clicks a speaker button.
5. **SQL Display**: Show the generated SQL in a styled code block with syntax highlighting and a copy button.

### CDN Dependencies (in `index.html` `<head>`)

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.7/dist/chart.umd.min.js"></script>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css" />
<link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css" />
<script src="https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js"></script>
```

### Design System (CSS Variables for `style.css`)

Use a premium dark theme:
```css
:root {
  --bg-primary: #0a0e1a;
  --bg-secondary: #111827;
  --bg-tertiary: #1a2236;
  --bg-surface: #1e293b;
  --bg-hover: #243044;
  --bg-input: #0f172a;
  --accent-primary: #3b82f6;
  --accent-secondary: #6366f1;
  --accent-gradient: linear-gradient(135deg, #3b82f6, #8b5cf6);
  --accent-glow: rgba(59, 130, 246, 0.15);
  --accent-success: #10b981;
  --accent-warning: #f59e0b;
  --accent-danger: #ef4444;
  --text-primary: #f1f5f9;
  --text-secondary: #94a3b8;
  --text-muted: #64748b;
  --text-accent: #60a5fa;
  --border-color: rgba(148, 163, 184, 0.08);
  --border-light: rgba(148, 163, 184, 0.12);
}
```

### API Contract (what the frontend sends/receives)

**POST `/api/chat`**
- Request: `{ "message": "string", "conversationId": "string" }`
- Response: `{ "explanation": "string", "sql": "string|null", "data": "array|null", "visualization": "string", "chart_config": "object|null", "error": "string|null" }`

**POST `/api/transcribe`**
- Request: `FormData` with field `audio` (Blob, type `audio/webm`)
- Response: `{ "text": "transcribed string" }`

**GET `/api/stats`**
- Response: `{ "totalRecords": number, ... }` (customize for your portal)

---

## Step 5 — Customize for Your Portal

1. **`SYSTEM_PROMPT`**: Change the assistant's identity text (e.g., "You are an assistant for the Data Entry Portal...").
2. **`/api/stats`**: Write queries against YOUR tables to show relevant sidebar stats.
3. **Sidebar suggestions**: Write sample questions relevant to your data.
4. **Welcome message**: Update the greeting and example queries in `index.html`.
5. **Map visualization**: Only relevant if your data has lat/lng columns. If not, you can remove the map-related code.

---

## Summary Checklist

- [ ] `npm install express cors pg groq-sdk multer dotenv`
- [ ] Create `.env` with `DATABASE_URL` and `GROQ_API_KEY`
- [ ] Create `server.js` (copy from Step 3 above, customize `/api/stats`)
- [ ] Create `public/index.html` with CDN imports + chat layout
- [ ] Create `public/style.css` with dark theme design system
- [ ] Create `public/app.js` with chat, visualization, voice, and TTS logic
- [ ] Update sidebar stats, suggestions, and welcome message for your portal
- [ ] Run with `node server.js`
