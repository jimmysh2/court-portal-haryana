/**
 * Database Backup Script
 * This script performs a pg_dump of the system database and stores it in the 'backups/' folder.
 * It also automatically rotates backups, keeping only the last 30 days.
 */
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');

const execAsync = promisify(exec);

async function runBackup() {
    console.log('📦 Starting Database Backup...');
    
    // ─── 1. Prepare Paths ──────────────────────────────────────────────────
    const backupDir = path.join(__dirname, '../backups');
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `court-portal-backup-${timestamp}.sql`;
    const backupPath = path.join(backupDir, filename);

    // ─── 2. Get DB Connection String ─────────────────────────────────────────
    // On a VM, the DATABASE_URL will be in .env or environment variables.
    const dbUrl = process.env.DATABASE_URL || '';
    if (!dbUrl) {
        console.error('❌ Error: DATABASE_URL not found in environment.');
        return;
    }

    try {
        // ─── 3. Run pg_dump ──────────────────────────────────────────────────
        // Note: pg_dump utility must be installed and in the system PATH.
        // We use the full URL directly if possible, or extract components.
        console.log(`📡 Dumping to ${filename}...`);
        
        // Command for pg_dump (works on both Linux and Windows if pg_dump is in PATH)
        const cmd = `pg_dump "${dbUrl}" > "${backupPath}"`;
        
        await execAsync(cmd);
        console.log(`✅ Backup saved successfully: ${backupPath}`);

        // ─── 4. Rotation (Keep only last 30 days) ───────────────────────────
        console.log('🔄 Checking for old backups to rotate...');
        const files = fs.readdirSync(backupDir)
            .filter(f => f.startsWith('court-portal-backup-') && f.endsWith('.sql'))
            .map(f => ({ name: f, time: fs.statSync(path.join(backupDir, f)).mtime.getTime() }))
            .sort((a, b) => b.time - a.time); // Newest first

        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        
        let removed = 0;
        for (const file of files) {
            // Keep at least 7 latest backups regardless of age, then delete > 30 days
            if (files.indexOf(file) > 7 && file.time < thirtyDaysAgo) {
                fs.unlinkSync(path.join(backupDir, file.name));
                removed++;
            }
        }
        if (removed > 0) console.log(`🗑️  Rotated ${removed} old backup files.`);
        
    } catch (error) {
        console.error('❌ Backup Failed:', error.message);
        if (error.stderr) console.error('Stderr:', error.stderr);
    }
}

// Allow running manually (node scripts/db-backup.js) or being imported
if (require.main === module) {
    // Load local environment for testing if needed
    require('dotenv').config();
    runBackup();
}

module.exports = runBackup;
