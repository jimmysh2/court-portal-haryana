const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const zlib = require('zlib');
const { RELAY_URL } = require('./gdrive-credentials');

// ─────────────────────────────────────────────────────────────────────────────
//  COURT PORTAL — DATABASE BACKUP ENGINE
//
//  Designed to work across ALL deployment phases WITHOUT Docker dependency:
//
//  Phase 1 (Current):  Supabase Cloud DB  + Vercel/PM2  → pg_dump via DATABASE_URL
//  Phase 2 (Future):   Local Windows PostgreSQL + Windows Server → pg_dump native
//  Dev only (local):   Docker Compose local container → docker exec pg_dump
//
//  PRODUCTION REQUIREMENT: PostgreSQL client tools must be installed on the host.
//  Windows: https://www.postgresql.org/download/windows/ (select "Command Line Tools")
//  Linux:   apt install postgresql-client  OR  yum install postgresql
// ─────────────────────────────────────────────────────────────────────────────

const IS_CLOUD = !!(process.env.RENDER || process.env.VERCEL);
const BACKUP_DIR = IS_CLOUD
    ? path.join(require('os').tmpdir(), 'backups')
    : path.join(__dirname, '../backups');

// Ensure backup directory exists when this module is loaded
if (!fs.existsSync(BACKUP_DIR)) {
    try {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
    } catch (e) {
        console.error(`❌ Failed to create backup directory: ${e.message}`);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
//  ENVIRONMENT DETECTOR
//  Returns a human-readable description of the current DB backend for logs.
// ─────────────────────────────────────────────────────────────────────────────
function detectDatabaseLabel() {
    const url = process.env.DATABASE_URL || '';
    if (!url) return 'UNKNOWN';
    if (url.includes('supabase.co')) return 'Supabase Cloud';
    if (url.includes('localhost') || url.includes('127.0.0.1')) return 'Local PostgreSQL';
    return 'Remote PostgreSQL';
}

// ─────────────────────────────────────────────────────────────────────────────
//  pg_dump AVAILABILITY CHECK
//  Production servers (Supabase now, Windows Postgres later) both have pg_dump
//  available on the host. Docker is NOT required and NOT used in production.
// ─────────────────────────────────────────────────────────────────────────────
function checkPgDump() {
    try {
        const version = execSync('pg_dump --version', { encoding: 'utf8' }).trim();
        return { available: true, version };
    } catch (e) {
        return { available: false };
    }
}

// ─────────────────────────────────────────────────────────────────────────────
//  DOCKER LOCAL DEV CHECK
//  Only used when Docker daemon is running AND the DB is local (dev docker-compose).
//  This is never the production path.
// ─────────────────────────────────────────────────────────────────────────────
function checkDockerLocalDev() {
    const url = process.env.DATABASE_URL || '';
    const isLocalUrl = url.includes('localhost') || url.includes('127.0.0.1');
    if (!isLocalUrl) return false;  // Supabase / remote — skip Docker entirely

    try {
        execSync('docker info', { stdio: 'ignore' });  // Checks daemon is running
        return true;
    } catch (e) {
        return false;  // Docker daemon not running → fall through to host pg_dump
    }
}

// ─────────────────────────────────────────────────────────────────────────────
//  GOOGLE DRIVE UPLOAD
//  Uploads backup via the Google Apps Script relay to avoid service account
//  credentials being stored in environment variables.
// ─────────────────────────────────────────────────────────────────────────────
async function uploadToDrive(filePath, fileName) {
    console.log(`☁️  Relaying ${fileName} to Google Drive...`);

    if (!RELAY_URL) {
        console.warn('⚠️  Cloud Backup skipped: No RELAY_URL configured in gdrive-credentials.js');
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

// ─────────────────────────────────────────────────────────────────────────────
//  CORE BACKUP ENGINE
// ─────────────────────────────────────────────────────────────────────────────
async function runBackup() {
    const dbLabel = detectDatabaseLabel();
    console.log(`\n📦 ═══════════════════════════════════════════════════`);
    console.log(`📦  Court Portal DB Backup — Target: ${dbLabel}`);
    console.log(`📦 ═══════════════════════════════════════════════════`);

    const result = { success: false, filename: null, cloudSync: false, error: null };

    if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `court-portal-backup-${timestamp}.sql.gz`;
    const backupPath = path.join(BACKUP_DIR, filename);

    try {
        // ── GUARD: DATABASE_URL is mandatory ──────────────────────────────
        if (!process.env.DATABASE_URL) {
            throw new Error(
                'DATABASE_URL is not set. Cannot perform backup.\n' +
                '  • For Supabase: set the Supabase connection string\n' +
                '  • For local Windows Postgres: set postgresql://user:pass@localhost:5432/dbname'
            );
        }

        // ── SELECT EXTRACTION METHOD ──────────────────────────────────────
        //
        //  PRODUCTION PATH (Supabase now / Windows Postgres later):
        //    → pg_dump on the host OS. No Docker needed.
        //
        //  LOCAL DEV FALLBACK (Docker Compose):
        //    → docker exec into the running container.
        //    This branch is ONLY reached when Docker daemon is running AND
        //    DATABASE_URL points to localhost (pure local dev scenario).
        //
        let dumpStream;

        const pgDump = checkPgDump();
        const useDockerLocalDev = !pgDump.available && checkDockerLocalDev();

        if (pgDump.available) {
            // ─── PRIMARY PRODUCTION PATH ───────────────────────────────────
            // Works for: Supabase, local Windows Postgres, any DATABASE_URL
            console.log(`📡 Using host pg_dump (${pgDump.version})`);
            console.log(`📡 Connecting to: ${dbLabel} via DATABASE_URL...`);

            dumpStream = spawn('pg_dump', [
                process.env.DATABASE_URL,
                '--clean',
                '--if-exists',
                '--no-password'
            ]);

        } else if (useDockerLocalDev) {
            // ─── LOCAL DEV ONLY FALLBACK ───────────────────────────────────
            // Only reached on developer machines with Docker running and localhost DB.
            // NEVER runs in production because production always has pg_dump installed.
            console.warn('⚠️  pg_dump not found on host. Using Docker local-dev fallback.');
            console.log('📡 Extracting from local Docker container (dev only)...');

            dumpStream = spawn('docker', [
                'exec', '-i', 'courtportalantigravity-db-1',
                'sh', '-c',
                'PGPASSWORD=password pg_dump -U user --clean --if-exists court_portal'
            ]);

        } else {
            // ─── FATAL: Production is misconfigured ───────────────────────
            throw new Error(
                'pg_dump is not installed on this server. Backup cannot proceed.\n\n' +
                '  REQUIRED ACTION (run once on the production server):\n' +
                '  ┌─ Windows Server (current Supabase / future local Postgres):\n' +
                '  │   Download PostgreSQL for Windows:\n' +
                '  │   https://www.postgresql.org/download/windows/\n' +
                '  │   Select "Command Line Tools" component (no DB server needed).\n' +
                '  │   Then add PostgreSQL\\bin to the system PATH.\n' +
                '  └─ Linux server:\n' +
                '      sudo apt install postgresql-client  (Debian/Ubuntu)\n' +
                '      sudo yum install postgresql          (RHEL/CentOS)\n\n' +
                '  After installing, restart PM2: pm2 restart court-portal'
            );
        }

        // ── PIPE: pg_dump → gzip → file ──────────────────────────────────
        const gzip = zlib.createGzip();
        const output = fs.createWriteStream(backupPath);
        dumpStream.stdout.pipe(gzip).pipe(output);

        await new Promise((resolve, reject) => {
            let stderrData = '';
            let processDone = false;
            let writeDone = false;

            const tryResolve = () => {
                if (processDone && writeDone) resolve();
            };

            // Capture stderr (credentials errors, connection refused, etc.)
            dumpStream.stderr.on('data', (chunk) => {
                stderrData += chunk.toString();
            });

            // Process-level errors (binary not found, permission denied, etc.)
            dumpStream.on('error', (err) => {
                reject(new Error(`pg_dump process failed to start: ${err.message}`));
            });

            // Wait for pg_dump to exit with code 0
            dumpStream.on('close', (code) => {
                processDone = true;
                if (code !== 0) {
                    // Delete the corrupt empty/partial file so it is not uploaded
                    try { fs.unlinkSync(backupPath); } catch (_) { /* ignore */ }
                    reject(new Error(
                        `pg_dump exited with code ${code}.\n` +
                        `  Stderr: ${stderrData.trim() || '(no output)'}\n` +
                        `  Check: DATABASE_URL credentials, firewall rules, SSL settings.`
                    ));
                } else {
                    tryResolve();
                }
            });

            // Errors in the pipeline
            dumpStream.stdout.on('error', (err) => reject(new Error(`stdout pipe error: ${err.message}`)));
            gzip.on('error', (err) => reject(new Error(`gzip error: ${err.message}`)));
            output.on('error', (err) => reject(new Error(`file write error: ${err.message}`)));

            // Confirm file write is complete before resolving
            output.on('finish', () => {
                writeDone = true;
                tryResolve();
            });
        });

        // ── VALIDATE: Reject suspiciously small backups ───────────────────
        const fileSizeBytes = fs.statSync(backupPath).size;
        console.log(`✅ Backup written: ${filename} (${(fileSizeBytes / 1024).toFixed(1)} KB)`);

        if (fileSizeBytes < 1024) {  // Less than 1 KB is always wrong
            try { fs.unlinkSync(backupPath); } catch (_) { /* ignore */ }
            throw new Error(
                `Backup file is suspiciously small (${fileSizeBytes} bytes). ` +
                `pg_dump likely produced no output — check DATABASE_URL and DB connectivity.`
            );
        }

        // ── UPLOAD TO GOOGLE DRIVE ────────────────────────────────────────
        result.cloudSync = await uploadToDrive(backupPath, filename);
        result.success = true;
        result.filename = filename;

        // ── ROTATION: Keep last 50 backups, remove files >30 days old ────
        try {
            const allFiles = fs.readdirSync(BACKUP_DIR)
                .filter(f => f.startsWith('court-portal-backup-') && f.endsWith('.sql.gz'))
                .map(f => ({ name: f, time: fs.statSync(path.join(BACKUP_DIR, f)).mtime.getTime() }))
                .sort((a, b) => b.time - a.time);

            const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
            let removed = 0;
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

        console.log(`📦 ═══════════════════════════════════════════════════\n`);
        return result;

    } catch (error) {
        console.error('\n❌ ═══════════════════════════════════════════════════');
        console.error('❌  BACKUP FAILED:', error.message);
        console.error('❌ ═══════════════════════════════════════════════════\n');
        result.error = error.message;
        return result;
    }
}

// Allow running directly: node scripts/db-backup.js
if (require.main === module) {
    runBackup().then(res => {
        process.exit(res.success ? 0 : 1);
    });
}

module.exports = { runBackup, uploadToDrive, BACKUP_DIR };
