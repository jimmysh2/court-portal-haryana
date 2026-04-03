const { Pool } = require('pg');
const Groq = require('groq-sdk');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

/**
 * Dynamically extract the database schema from PostgreSQL information_schema.
 */
async function getDbSchema() {
  let schema = '';
  try {
    const tablesRes = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        AND table_name NOT LIKE '_prisma_migrations'
    `);

    for (const t of tablesRes.rows) {
      const name = t.table_name;
      const colsRes = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = $1
      `, [name]);

      schema += `\nTable: ${name}\nColumns:\n`;
      colsRes.rows.forEach(c => {
        schema += `  - ${c.column_name} (${c.data_type}${c.is_nullable === 'NO' ? ', NOT NULL' : ''})\n`;
      });

      // Attempt to get sample data (limited to 3 rows)
      try {
        const sample = await pool.query(`SELECT * FROM "${name}" LIMIT 3`);
        if (sample.rows.length > 0) {
          schema += `Sample data: ${JSON.stringify(sample.rows, null, 2)}\n`;
        }
      } catch (err) {
        // Skip sample if error (e.g. permission issues or internal tables)
      }
    }
  } catch (error) {
    console.error('Error extracting DB schema:', error);
    schema = 'Error extracting schema. Please check database permissions.';
  }
  return schema;
}

let cachedSchema = null;
let SYSTEM_PROMPT = '';

async function initializeSystemPrompt() {
  if (!cachedSchema) {
    cachedSchema = await getDbSchema();
  }

  SYSTEM_PROMPT = `You are an intelligent database assistant for the Court Portal Haryana.
You help Naib Courts and Admins query and analyze court data using natural language.

Here is the database schema:
${cachedSchema}

IMPORTANT RULES:
1. When the user asks about data, generate a valid PostgreSQL query.
2. Return ONLY this JSON format (no markdown, no code blocks):
{
  "sql": "YOUR SQL QUERY HERE",
  "explanation": "Brief explanation of what the data shows",
  "visualization": "table" | "bar_chart" | "pie_chart" | "line_chart" | "stat_card" | "map" | "none",
  "chart_config": {
    "title": "Title for the chart/stat",
    "x_label": "X axis label (if applicable)",
    "y_label": "Y axis label (if applicable)",
    "label_column": "exact column name for labels/categories",
    "value_column": "exact column name for values/quantities"
  }
}
3. ONLY use SELECT statements. Never INSERT, UPDATE, DELETE, DROP.
4. Choose the best visualization:
   - "stat_card" for single numeric values (counts, averages, sums)
   - "table" for multi-row, multi-column detailed results
   - "bar_chart" for comparing categories
   - "pie_chart" for showing proportions/percentages
   - "line_chart" for time-series data (dates/months)
   - "map" if geographic data (lat, lng) is requested
   - "none" for conversational responses or errors
5. For non-data questions, respond with: { "sql": null, "explanation": "your response", "visualization": "none", "chart_config": null }
6. Limit results to max 100 rows.
7. Use PostgreSQL syntax: ILIKE for case-insensitive search, TO_CHAR/EXTRACT for dates.
8. Use JOINs when data from multiple tables is needed.
9. If you are unsure about columns, stick to the schema provided above.`;
}

/**
 * Handle chat interactions with Groq AI.
 */
async function chatWithAI(message, history = []) {
  if (!SYSTEM_PROMPT) {
    await initializeSystemPrompt();
  }

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history.map(h => ([
      { role: 'user', content: h.user },
      { role: 'assistant', content: h.assistant }
    ])).flat(),
    { role: 'user', content: message }
  ];

  const completion = await groq.chat.completions.create({
    messages,
    model: "llama-3.3-70b-versatile",
    temperature: 0.1,
    response_format: { type: "json_object" },
  });

  const responseText = completion.choices[0]?.message?.content || "{}";
  let parsed;
  try {
    parsed = JSON.parse(responseText);
  } catch (e) {
    parsed = {
      explanation: "I encountered an error parsing the AI response. Please try again.",
      sql: null,
      visualization: "none",
      chart_config: null
    };
  }

  let data = null;
  let error = null;

  if (parsed.sql) {
    try {
      // Basic safety check
      const upperSql = parsed.sql.trim().toUpperCase();
      if (!upperSql.startsWith('SELECT') && !upperSql.startsWith('WITH')) {
        throw new Error('Only read-only SELECT queries are allowed.');
      }

      const result = await pool.query(parsed.sql);
      data = result.rows;
    } catch (dbErr) {
      error = dbErr.message;
      parsed.explanation += `\n\n⚠️ SQL Error: ${dbErr.message}`;
      parsed.visualization = 'none';
      data = null;
    }
  }

  return { ...parsed, data, error };
}

module.exports = {
  chatWithAI,
  initializeSystemPrompt,
  getDbSchema
};
