const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { runBackup } = require('../../scripts/db-backup');

let backupJob = null;

async function refreshBackupJob() {
    try {
        if (backupJob) {
            backupJob.stop();
            console.log('🛑 Stopped existing backup job.');
        }

        // Use Raw SQL for absolute reliability
        const results = await prisma.$queryRaw`SELECT value FROM system_settings WHERE key = 'backup_time'`;
        const timeString = results[0] ? results[0].value : '02:00';
        
        const [hours, minutes] = timeString.split(':');

        // Note: cron format is 'min hour dom mon dow'
        const cronSchedule = `${minutes} ${hours} * * *`;
        const now = new Date();
        console.log(`📡 [CRON] Refreshing backup job for ${hours}:${minutes} (Server Time: ${now.toLocaleTimeString()})`);
        
        backupJob = cron.schedule(cronSchedule, () => {
            console.log(`⏰ [CRON] Triggering Scheduled DB Backup...`);
            runBackup().catch(err => console.error('⏰ [CRON] Scheduled backup failed:', err));
        });

        console.log(`✅ [CRON] Scheduler Reset SUCCESS! Pattern: ${cronSchedule}`);
    } catch (error) {
        console.error('❌ [CRON] CRITICAL Failure in refreshBackupJob:', error.message);
    }
}

module.exports = { refreshBackupJob };
