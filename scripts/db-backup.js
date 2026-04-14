const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const zlib = require('zlib');
const { RELAY_URL } = require('./gdrive-credentials');

/**
 * Deployment Awareness
 */
const IS_CLOUD = !!(process.env.RENDER || process.env.VERCEL);
const BACKUP_DIR = IS_CLOUD ? path.join(require('os').tmpdir(), 'backups') : path.join(__dirname, '../backups');

// Ensure directory exists as soon as module is loaded
if (!fs.existsSync(BACKUP_DIR)) {
    try {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
    } catch (e) {
        console.error(`❌ Failed to create backup directory ${BACKUP_DIR}:`, e.message);
    }
}

/**
 * Uploads a file to Google Drive via the Apps Script Relay
 */
async function uploadToDrive(filePath, fileName) {
    console.log(`☁️  Relaying ${fileName} to Google Drive...`);

    if (!RELAY_URL) {
        console.warn('⚠️  Cloud Backup skipped: No Relay URL configured.');
        return false;
    }

    try {
        const fileBuffer = fs.readFileSync(filePath);
        const base64Content = fileBuffer.toString('base64');

        const response = await fetch(RELAY_URL, {
            method: 'POST',
            body: JSON.stringify({
                name: fileName,
                mimeType: 'application/gzip',
                content: base64Content
            }),
            headers: { 'Content-Type': 'application/json' }
        });

        const result = await response.json();

        if (result.success) {
            console.log(`✅ Cloud Backup Successful via Relay! Drive ID: ${result.id}`);
            return true;
        } else {
            console.error('❌ Relay Upload Failed:', result);
            return false;
        }
    } catch (err) {
        console.error('❌ Relay Process Failed:', err.message);
        return false;
    }
}

async function runBackup() {
    console.log(`📦 Starting ${IS_CLOUD ? 'Cloud' : 'Local'} Compressed Backup...`);
    const result = { success: false, filename: null, cloudSync: false, error: null };

    // Final safety check
    if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `court-portal-backup-${timestamp}.sql.gz`;
    const backupPath = path.join(BACKUP_DIR, filename);

    try {
        let dumpStream;

        // 1. Check if we have a remote DATABASE_URL (e.g. Supabase)
        const isRemoteDB = process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('localhost') && !process.env.DATABASE_URL.includes('127.0.0.1');

        // 2. Check for Docker availability
        let hasDocker = false;
        try {
            execSync('docker -v', { stdio: 'ignore' });
            hasDocker = true;
        } catch (e) { /* No docker */ }

        // 3. Determine if we can use host pg_dump
        let hasHostPgDump = false;
        try {
            execSync('pg_dump --version', { stdio: 'ignore' });
            hasHostPgDump = true;
        } catch (e) { /* No pg_dump on host */ }

        // 4. Select Extraction Method
        if (hasDocker && !IS_CLOUD && !isRemoteDB) {
            console.log('📡 Extracting Full System Snapshot from Local Docker container...');
            dumpStream = spawn('docker', [
                'exec', '-i', 'courtportalantigravity-db-1',
                'sh', '-c', 'PGPASSWORD=password pg_dump -U user --clean --if-exists court_portal'
            ]);
        }
        else if (process.env.DATABASE_URL) {
            if (hasHostPgDump) {
                console.log(`📡 Extracting Full System Snapshot from ${isRemoteDB ? 'Remote' : 'Local'} DATABASE_URL via host pg_dump...`);
                dumpStream = spawn('pg_dump', [
                    process.env.DATABASE_URL,
                    '--clean',
                    '--if-exists'
                ]);
            } else if (hasDocker && !IS_CLOUD) {
                console.log(`📡 Extracting Full System Snapshot from ${isRemoteDB ? 'Remote' : 'Local'} DATABASE_URL via Docker fallback...`);
                dumpStream = spawn('docker', [
                    'run', '--rm', '-i', 'postgres:15-alpine',
                    'pg_dump', process.env.DATABASE_URL, '--clean', '--if-exists'
                ]);
            } else {
                throw new Error('pg_dump not found on host and Docker fallback not available.');
            }
        }
        else {
            throw new Error('No database extraction method available.');
        }

        const gzip = zlib.createGzip();
        const output = fs.createWriteStream(backupPath);
        dumpStream.stdout.pipe(gzip).pipe(output);

        await new Promise((resolve, reject) => {
            // Error in the spawning process
            dumpStream.on('error', (err) => {
                console.error(`❌ Process Error: ${err.message}`);
                reject(new Error(`Failed to start extraction process: ${err.message}`));
            });

            dumpStream.stdout.on('error', (err) => {
                console.error('⚠️ Database extract stdout failed:', err.message);
                reject(new Error(`Extraction stdout failed: ${err.message}`));
            });

            gzip.on('error', (err) => {
                console.error('⚠️ Gzip failed:', err.message);
                reject(err);
            });

            output.on('error', (err) => {
                console.error('⚠️ Write stream failed:', err.message);
                reject(err);
            });

            let stderrData = '';
            dumpStream.stderr.on('data', (d) => { stderrData += d.toString(); });

            // We must wait for BOTH the process to exit and the output to finish
            let processClosed = false;
            let outputFinished = false;

            const checkDone = () => {
                if (processClosed && outputFinished) {
                    resolve();
                }
            };

            output.on('finish', () => {
                outputFinished = true;
                checkDone();
            });

            dumpStream.on('close', (code) => {
                processClosed = true;
                if (code !== 0) {
                    console.error(`⚠️ Extraction exited with code ${code}: ${stderrData}`);
                    reject(new Error(`Extraction failed (exit code ${code}): ${stderrData}`));
                } else {
                    checkDone();
                }
            });
        });

        console.log(`✅ Local backup saved: ${backupPath}`);

        // Sync to cloud via Relay
        result.cloudSync = await uploadToDrive(backupPath, filename);
        result.success = true;
        result.filename = filename;

        // Rotation logic
        const files = fs.readdirSync(BACKUP_DIR)
            .filter(f => f.startsWith('court-portal-backup-') && f.endsWith('.sql.gz'))
            .map(f => ({ name: f, time: fs.statSync(path.join(BACKUP_DIR, f)).mtime.getTime() }))
            .sort((a, b) => b.time - a.time);

        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        let removed = 0;
        files.slice(50).forEach(file => { // Keep 50 latest
            if (file.time < thirtyDaysAgo) {
                fs.unlinkSync(path.join(BACKUP_DIR, file.name));
                removed++;
            }
        });
        if (removed > 0) console.log(`🗑️  Rotated ${removed} backups.`);

        return result;
    } catch (error) {
        console.error('❌ Backup Engine Failed:', error.message);
        result.error = error.message;
        return result;
    }
}

if (require.main === module) {
    runBackup();
}

module.exports = { runBackup, uploadToDrive, BACKUP_DIR };
