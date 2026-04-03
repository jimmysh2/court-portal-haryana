/**
 * ONE-TIME DELTA SYNC: Render → Supabase
 * Triggered by calling GET /api/delta-sync?secret=sync-court-portal-2026
 * DELETE THIS FILE after successful sync.
 */

const express = require('express');
const { Client } = require('pg');
const router = express.Router();

const RENDER_URL = 'postgresql://court_portal_user:fvB80LdUCWXn0IzbtuVTbBkQ9IVg4o0V@dpg-d6k2gg4r85hc73bt1ulg-a.oregon-postgres.render.com/court_portal';
const SUPABASE_URL = process.env.DATABASE_URL;
const SYNC_SECRET = 'sync-court-portal-2026';

// Last confirmed sync timestamp (UTC) — data after this is potentially missing
// Supabase latest: 2026-04-02T10:04:52Z, use 2026-04-01 to be safe
const DELTA_FROM = '2026-04-01T00:00:00Z';

router.get('/delta-sync', async (req, res) => {
    // Secret guard so random people can't trigger this
    if (req.query.secret !== SYNC_SECRET) {
        return res.status(403).json({ error: 'Forbidden' });
    }

    const render = new Client({ connectionString: RENDER_URL, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 20000 });
    const supabase = new Client({ connectionString: SUPABASE_URL, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 20000 });
    const log = [];

    try {
        log.push('Connecting to Render...');
        await render.connect();
        log.push('✅ Render connected.');

        log.push('Connecting to Supabase...');
        await supabase.connect();
        log.push('✅ Supabase connected.');

        // ── data_entries ─────────────────────────────────
        log.push('Fetching delta data_entries from Render...');
        const renderEntries = await render.query(
            `SELECT * FROM data_entries WHERE created_at > $1 ORDER BY id`, [DELTA_FROM]
        );
        log.push(`Found ${renderEntries.rows.length} new data_entries in Render.`);

        let deInserted = 0, deSkipped = 0;
        for (const row of renderEntries.rows) {
            try {
                await supabase.query(
                    `INSERT INTO data_entries (id, submission_id, column_id, value, created_at, updated_at)
                     VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (id) DO NOTHING`,
                    [row.id, row.submission_id, row.column_id, row.value, row.created_at, row.updated_at]
                );
                deInserted++;
            } catch (e) { deSkipped++; }
        }
        log.push(`data_entries: inserted=${deInserted}, skipped=${deSkipped}`);

        // ── daily_submissions ─────────────────────────────
        log.push('Fetching delta daily_submissions from Render...');
        const renderSubs = await render.query(
            `SELECT * FROM daily_submissions WHERE submitted_at > $1 ORDER BY id`, [DELTA_FROM]
        );
        log.push(`Found ${renderSubs.rows.length} new daily_submissions in Render.`);

        let dsInserted = 0, dsSkipped = 0;
        for (const row of renderSubs.rows) {
            try {
                // Build dynamic insert from row keys
                const cols = Object.keys(row);
                const vals = cols.map((c, i) => `$${i + 1}`).join(',');
                const colNames = cols.map(c => `"${c}"`).join(',');
                await supabase.query(
                    `INSERT INTO daily_submissions (${colNames}) VALUES (${vals}) ON CONFLICT (id) DO NOTHING`,
                    Object.values(row)
                );
                dsInserted++;
            } catch (e) { dsSkipped++; log.push(`  Skip DS id=${row.id}: ${e.message}`); }
        }
        log.push(`daily_submissions: inserted=${dsInserted}, skipped=${dsSkipped}`);

        // ── Final count verification ──────────────────────
        const renderDeCount = await render.query('SELECT COUNT(*) FROM data_entries');
        const supDeCount = await supabase.query('SELECT COUNT(*) FROM data_entries');
        const renderDsCount = await render.query('SELECT COUNT(*) FROM daily_submissions');
        const supDsCount = await supabase.query('SELECT COUNT(*) FROM daily_submissions');

        const summary = {
            data_entries: { render: renderDeCount.rows[0].count, supabase: supDeCount.rows[0].count },
            daily_submissions: { render: renderDsCount.rows[0].count, supabase: supDsCount.rows[0].count },
        };
        log.push('FINAL COUNTS: ' + JSON.stringify(summary));

        res.json({ success: true, log, summary });
    } catch (err) {
        log.push('FATAL ERROR: ' + err.message);
        res.status(500).json({ success: false, error: err.message, log });
    } finally {
        await render.end().catch(() => { });
        await supabase.end().catch(() => { });
    }
});

module.exports = router;
