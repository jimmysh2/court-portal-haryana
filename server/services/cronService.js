const cron = require('node-cron');
const prisma = require('../lib/prisma');
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

// Generates an alert for District Admins containing a list of courts
// that failed to finalize their entries yesterday.
async function checkPendingDataEntries() {
    console.log('⏰ [CRON] Executing checkPendingDataEntries job...');
    try {
        const yesterday = new Date(Date.now() - 86400000);
        yesterday.setHours(0, 0, 0, 0);

        // Fetch active courts with missing submissions for yesterday
        const courts = await prisma.court.findMany({
            where: { deletedAt: null },
            include: { district: true }
        });

        const missingCourtsByDistrict = {};

        for (const court of courts) {
            const hasSubmission = await prisma.dailySubmission.findFirst({
                where: {
                    courtId: court.id,
                    entryDate: yesterday
                }
            });

            if (!hasSubmission) {
                if (!missingCourtsByDistrict[court.districtId]) {
                    missingCourtsByDistrict[court.districtId] = [];
                }
                missingCourtsByDistrict[court.districtId].push(court.courtNo);
            }
        }

        // Generate alerts per district
        for (const districtId in missingCourtsByDistrict) {
            const adminDistrictId = parseInt(districtId);
            const missingNos = missingCourtsByDistrict[districtId];
            
            // Generate standard date string for yesterday
            const timestampStr = yesterday.toISOString().split('T')[0];
            const message = `Data entry pending for yesterday (${timestampStr}) for ${missingNos.length} courts. Courts: ${missingNos.join(', ')}`;

            // Find District Admins for this district
            const districtAdmins = await prisma.user.findMany({
                where: { role: 'district_admin', districtId: adminDistrictId, deletedAt: null }
            });

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            for (const admin of districtAdmins) {
                // Avoid duplicating the alert if cron runs twice accidentally
                const existingAlert = await prisma.alert.findFirst({
                    where: {
                        userId: admin.id,
                        alertType: 'pending_data_entry',
                        alertDate: today
                    }
                });

                if (!existingAlert) {
                    await prisma.alert.create({
                        data: {
                            districtId: adminDistrictId,
                            userId: admin.id,
                            alertType: 'pending_data_entry',
                            message: message,
                            alertDate: today,
                        }
                    });
                }
            }
        }
        
        console.log('✅ [CRON] Completed checkPendingDataEntries job successfully.');
    } catch (err) {
        console.error('❌ [CRON] Failed generating pending data entry alerts:', err);
    }
}

// Initializes standard daily system chron jobs not dependent on variable config
function initDailyJobs() {
    // Run at 08:00 AM every single day
    cron.schedule('0 8 * * *', () => {
        checkPendingDataEntries();
    });
    console.log('✅ [CRON] Registered Daily Pending Entry Auditor (08:00 AM)');
}

module.exports = { refreshBackupJob, initDailyJobs, checkPendingDataEntries };
