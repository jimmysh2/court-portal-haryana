/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  COURT PORTAL — PURE NODE.JS DATABASE BACKUP ENGINE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  Uses the `pg` npm package (already installed) to connect directly to the
 *  database and generate a complete SQL backup. NO external binary required.
 *
 *  ✅ Works with: Supabase Cloud (current production)
 *  ✅ Works with: Local Windows PostgreSQL server (future government server)
 *  ✅ Works with: Any DATABASE_URL — no pg_dump binary, no Docker needed
 *  ✅ Self-contained: Node.js + pg npm package is the only requirement
 *
 *  Backup format: COPY-based SQL dump (gzip compressed), restorable via psql.
 *  Inserts are batched for memory efficiency with large tables.
 * ═══════════════════════════════════════════════════════════════════════════
 */

const { Client } = require('pg');
const path = require('path');
const fs = require('fs');
const zlib = require('zlib');
const { RELAY_URL } = require('./gdrive-credentials');

// ─── Deployment Awareness ────────────────────────────────────────────────────
const IS_CLOUD = !!(process.env.RENDER || process.env.VERCEL);
const BACKUP_DIR = IS_CLOUD
    ? path.join(require('os').tmpdir(), 'backups')
    : path.join(__dirname, '../backups');

if (!fs.existsSync(BACKUP_DIR)) {
    try { fs.mkdirSync(BACKUP_DIR, { recursive: true }); }
    catch (e) { console.error(`❌ Failed to create backup dir: ${e.message}`); }
}

// ─── Table export order (respects FK dependencies) ───────────────────────────
// Parents first, children after — ensures restore works without FK violations.
const TABLE_ORDER = [
    'districts',
    'magistrates',
    'users',
    'courts',
    'police_stations',
    'data_entry_tables',
    'data_entry_columns',
    'data_entries',
    'daily_submissions',
    'grievances',
    'grievance_comments',
    'grievance_attachments',
    'transfer_logs',
    'alerts',
    'system_settings',
];

// ─── SQL Helpers ─────────────────────────────────────────────────────────────

function quoteIdentifier(name) {
    return `"${name.replace(/"/g, '""')}"`;
}

function escapeValue(val) {
    if (val === null || val === undefined) return 'NULL';
    if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
    if (typeof val === 'number') return String(val);
    if (val instanceof Date) return `'${val.toISOString()}'`;
    if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
    // String — escape single quotes
    return `'${String(val).replace(/'/g, "''")}'`;
}

// ─── Core: dump one table into the write stream ───────────────────────────────
async function dumpTable(client, tableName, stream, stats) {
    // Get ordered column list from information_schema for consistency
    const colRes = await client.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position
    `, [tableName]);

    const columns = colRes.rows.map(r => r.column_name);
    if (columns.length === 0) {
        stream.write(`-- Table ${tableName}: no columns found, skipping\n`);
        return 0;
    }

    // Row count
    const countRes = await client.query(`SELECT COUNT(*) FROM ${quoteIdentifier(tableName)}`);
    const rowCount = parseInt(countRes.rows[0].count, 10);

    stream.write(`\n-- ─────────────────────────────────────────────────────────\n`);
    stream.write(`-- TABLE: ${tableName} (${rowCount} rows)\n`);
    stream.write(`-- ─────────────────────────────────────────────────────────\n`);

    if (rowCount === 0) {
        stream.write(`-- (empty table)\n`);
        stats[tableName] = 0;
        return 0;
    }

    // Use cursor-based pagination for large tables (avoids memory blow-up)
    const BATCH_SIZE = 1000;
    const colList = columns.map(quoteIdentifier).join(', ');
    let offset = 0;
    let totalRows = 0;

    stream.write(`ALTER TABLE ${quoteIdentifier(tableName)} DISABLE TRIGGER ALL;\n`);

    while (true) {
        const res = await client.query(
            `SELECT ${colList} FROM ${quoteIdentifier(tableName)} ORDER BY id LIMIT $1 OFFSET $2`,
            [BATCH_SIZE, offset]
        );

        if (res.rows.length === 0) break;

        // Batch INSERT
        stream.write(`INSERT INTO ${quoteIdentifier(tableName)} (${colList}) VALUES\n`);
        const valueLines = res.rows.map(row =>
            `(${columns.map(c => escapeValue(row[c])).join(', ')})`
        );
        stream.write(valueLines.join(',\n'));
        stream.write(`\nON CONFLICT DO NOTHING;\n`);

        totalRows += res.rows.length;
        offset += BATCH_SIZE;
        if (res.rows.length < BATCH_SIZE) break;
    }

    stream.write(`ALTER TABLE ${quoteIdentifier(tableName)} ENABLE TRIGGER ALL;\n`);

    stats[tableName] = totalRows;
    return totalRows;
}

// ─── Google Drive Upload ──────────────────────────────────────────────────────
async function uploadToDrive(filePath, fileName) {
    console.log(`☁️  Relaying ${fileName} to Google Drive...`);

    if (!RELAY_URL) {
        console.warn('⚠️  Cloud Backup skipped: No RELAY_URL configured.');
        return false;
    }

    try {
        const fileBuffer = fs.readFileSync(filePath);
        const base64Content = fileBuffer.toString('base64');

        const response = await fetch(RELAY_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: fileName,
                mimeType: 'application/gzip',
                content: base64Content
            })
        });

        const result = await response.json();

        if (result.success) {
            console.log(`✅ Google Drive backup successful! File ID: ${result.id}`);
            return true;
        } else {
            console.error('❌ Google Drive relay failed:', JSON.stringify(result));
            return false;
        }
    } catch (err) {
        console.error('❌ Google Drive upload error:', err.message);
        return false;
    }
}

// ─── Main Backup Function ─────────────────────────────────────────────────────
async function runBackup() {
    console.log(`\n📦 ═══════════════════════════════════════════════════════`);
    console.log(`📦  Court Portal DB Backup (Pure Node.js Engine)`);
    console.log(`📦  Time: ${new Date().toISOString()}`);
    console.log(`📦 ═══════════════════════════════════════════════════════`);

    const result = { success: false, filename: null, cloudSync: false, error: null };

    if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });

    // ── GUARD ──────────────────────────────────────────────────────────────
    if (!process.env.DATABASE_URL) {
        const msg = 'DATABASE_URL is not set. Cannot perform backup.';
        console.error(`❌ ${msg}`);
        result.error = msg;
        return result;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `court-portal-backup-${timestamp}.sql.gz`;
    const backupPath = path.join(BACKUP_DIR, filename);

    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DATABASE_URL.includes('supabase.co')
            ? { rejectUnauthorized: false }
            : false,
        connectionTimeoutMillis: 15000,
    });

    try {
        // ── CONNECT ────────────────────────────────────────────────────────
        console.log(`🔌 Connecting to database...`);
        await client.connect();
        console.log(`✅ Connected.`);

        // ── DETERMINE WHICH TABLES TO DUMP ────────────────────────────────
        const existingTablesRes = await client.query(`
            SELECT table_name FROM information_schema.tables
            WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
        `);
        const existingTables = new Set(existingTablesRes.rows.map(r => r.table_name));

        // Use ordered list, skip any that don't exist yet
        const tablesToDump = TABLE_ORDER.filter(t => existingTables.has(t));
        // Also catch any tables not in our hardcoded list (future additions)
        const extraTables = [...existingTables].filter(t => !TABLE_ORDER.includes(t));
        if (extraTables.length > 0) {
            console.warn(`⚠️  Found extra tables not in backup order list: ${extraTables.join(', ')}`);
            tablesToDump.push(...extraTables);
        }

        // ── GET SEQUENCES (for ID auto-increment restore) ─────────────────
        const seqRes = await client.query(`
            SELECT sequencename AS sequence_name, last_value
            FROM pg_sequences
            WHERE schemaname = 'public'
        `);

        // ── GET ENUM TYPES ────────────────────────────────────────────────
        const enumRes = await client.query(`
            SELECT t.typname AS enum_name,
                   string_agg(e.enumlabel, ',' ORDER BY e.enumsortorder) AS enum_values_csv
            FROM pg_type t
            JOIN pg_enum e ON t.oid = e.enumtypid
            JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
            WHERE n.nspname = 'public'
            GROUP BY t.typname
        `);

        // ── WRITE BACKUP ───────────────────────────────────────────────────
        const gzip = zlib.createGzip({ level: zlib.constants.Z_BEST_COMPRESSION });
        const output = fs.createWriteStream(backupPath);
        gzip.pipe(output);

        const stats = {};

        // Write SQL header
        gzip.write(`-- ═══════════════════════════════════════════════════════════\n`);
        gzip.write(`-- Court Portal Haryana — Database Backup\n`);
        gzip.write(`-- Generated: ${new Date().toISOString()}\n`);
        gzip.write(`-- Engine: Pure Node.js (pg client) — no pg_dump required\n`);
        gzip.write(`-- Tables: ${tablesToDump.join(', ')}\n`);
        gzip.write(`-- ═══════════════════════════════════════════════════════════\n\n`);

        gzip.write(`SET client_encoding = 'UTF8';\n`);
        gzip.write(`SET standard_conforming_strings = on;\n`);
        gzip.write(`SET session_replication_role = replica; -- Disables FK checks during restore\n\n`);

        // Write enum type declarations (safe CREATE IF NOT EXISTS equivalent)
        if (enumRes.rows.length > 0) {
            gzip.write(`-- ── ENUM TYPES ─────────────────────────────────────────────\n`);
            for (const row of enumRes.rows) {
                const values = row.enum_values_csv.split(',').map(v => `'${v}'`).join(', ');
                gzip.write(`DO $$ BEGIN\n`);
                gzip.write(`  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = '${row.enum_name}') THEN\n`);
                gzip.write(`    CREATE TYPE "${row.enum_name}" AS ENUM (${values});\n`);
                gzip.write(`  END IF;\n`);
                gzip.write(`END $$;\n`);
            }
            gzip.write(`\n`);
        }

        // Dump each table
        for (const table of tablesToDump) {
            process.stdout.write(`  📋 Dumping ${table}...`);
            const rows = await dumpTable(client, table, gzip, stats);
            console.log(` ${rows} rows`);
        }

        // Write sequence resets (so next INSERT gets the right ID)
        if (seqRes.rows.length > 0) {
            gzip.write(`\n-- ── RESET SEQUENCES ────────────────────────────────────────\n`);
            for (const row of seqRes.rows) {
                const lastVal = row.last_value || 1;
                gzip.write(`SELECT setval('${row.sequence_name}', ${lastVal}, true);\n`);
            }
        }

        gzip.write(`\nSET session_replication_role = DEFAULT;\n`);
        gzip.write(`\n-- ── END OF BACKUP ──────────────────────────────────────────\n`);

        // Close streams and wait for file to be fully written
        await new Promise((resolve, reject) => {
            gzip.on('error', reject);
            output.on('error', reject);
            output.on('finish', resolve);
            gzip.end();
        });

        await client.end();

        // ── VALIDATE FILE SIZE ─────────────────────────────────────────────
        const fileSizeBytes = fs.statSync(backupPath).size;
        const fileSizeKB = (fileSizeBytes / 1024).toFixed(1);

        if (fileSizeBytes < 1024) {
            try { fs.unlinkSync(backupPath); } catch (_) { /* ignore */ }
            throw new Error(
                `Backup file too small (${fileSizeBytes} bytes). ` +
                `Database may be empty or connection failed silently.`
            );
        }

        console.log(`\n✅ Backup written: ${filename}`);
        console.log(`   Size: ${fileSizeKB} KB`);
        console.log(`   Tables: ${tablesToDump.length} | Rows: ${Object.values(stats).reduce((a, b) => a + b, 0)}`);

        // ── UPLOAD TO GOOGLE DRIVE ─────────────────────────────────────────
        result.cloudSync = await uploadToDrive(backupPath, filename);
        result.success = true;
        result.filename = filename;

        // ── ROTATION ───────────────────────────────────────────────────────
        try {
            const allFiles = fs.readdirSync(BACKUP_DIR)
                .filter(f => f.startsWith('court-portal-backup-') && f.endsWith('.sql.gz'))
                .map(f => ({ name: f, time: fs.statSync(path.join(BACKUP_DIR, f)).mtime.getTime() }))
                .sort((a, b) => b.time - a.time);

            let removed = 0;
            const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
            allFiles.slice(50).forEach(file => {
                if (file.time < Date.now() - thirtyDaysMs) {
                    fs.unlinkSync(path.join(BACKUP_DIR, file.name));
                    removed++;
                }
            });
            if (removed > 0) console.log(`🗑️  Rotated ${removed} expired backup(s).`);
        } catch (rotErr) {
            console.warn('⚠️  Rotation failed (non-critical):', rotErr.message);
        }

        console.log(`📦 ═══════════════════════════════════════════════════════\n`);
        return result;

    } catch (error) {
        // Ensure client is closed on error
        try { await client.end(); } catch (_) { /* ignore */ }
        // Delete partial/corrupt file if it exists
        if (fs.existsSync(backupPath)) {
            try { fs.unlinkSync(backupPath); } catch (_) { /* ignore */ }
        }

        console.error('\n❌ ═══════════════════════════════════════════════════════');
        console.error('❌  BACKUP FAILED:', error.message);
        console.error('❌ ═══════════════════════════════════════════════════════\n');
        result.error = error.message;
        return result;
    }
}

// Allow direct execution: node scripts/db-backup.js
if (require.main === module) {
    runBackup().then(res => process.exit(res.success ? 0 : 1));
}

module.exports = { runBackup, uploadToDrive, BACKUP_DIR };
