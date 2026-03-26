const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const prisma = require('../lib/prisma');
const { authenticate, requireRole } = require('../middleware/auth');
const { runBackup, BACKUP_DIR } = require('../../scripts/db-backup');

const execAsync = promisify(exec);
const { refreshBackupJob } = require('../services/cronService');
const router = express.Router();

// ─── 0. SETTINGS ENDPOINTS ───────────────────────────────────────
// Get backup time setting
router.get('/settings/backup-time', authenticate, requireRole('developer'), async (req, res) => {
    try {
        const now = new Date();
        const serverTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        
        // Raw SQL to ensure no ORM or metadata caching issues
        const results = await prisma.$queryRaw`SELECT value FROM system_settings WHERE key = 'backup_time'`;
        let val = results[0] ? results[0].value : '02:00';

        if (!results[0]) {
            await prisma.$executeRaw`INSERT INTO system_settings (key, value) VALUES ('backup_time', '02:00') ON CONFLICT (key) DO NOTHING`;
        }

        res.json({ value: val, serverTime });
    } catch (err) { 
        console.error('❌ Failed to fetch settings:', err);
        res.status(500).json({ error: 'Failed' }); 
    }
});

// Update backup time setting
router.post('/settings/backup-time', authenticate, requireRole('developer'), async (req, res) => {
    try {
        let value = req.body.value;
        
        // Auto-sanitize HH:mm:ss -> HH:mm
        if (value && typeof value === 'string' && value.includes(':')) {
             const parts = value.split(':');
             if (parts.length >= 2) {
                 // Format as HH:mm with padding if needed
                 const hh = parts[0].trim().padStart(2, '0');
                 const mm = parts[1].trim().padStart(2, '0');
                 value = `${hh}:${mm}`;
             }
        }
        
        // Final strict check for DB consistency
        // Final strict check for DB consistency
        if (!value || !/^\d{2}:\d{2}$/.test(value)) {
            return res.status(400).json({ error: 'Invalid time format (HH:mm required)' });
        }
        
        const cleanValue = value;

        // Raw SQL for absolute persistence guarantee
        await prisma.$executeRaw`INSERT INTO system_settings (key, value) VALUES ('backup_time', ${cleanValue}) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`;

        console.log(`📡 [SETTINGS] Updated backup schedule in DB to: ${cleanValue}`);
        await refreshBackupJob();
        res.json({ message: 'Saved' });
    } catch (err) { 
        console.error('❌ [SETTINGS] Failed to save backup schedule:', err);
        res.status(500).json({ error: `Server error: ${err.message}` }); 
    }
});

// Delete a backup file
router.delete('/backups/:filename', authenticate, requireRole('developer'), async (req, res) => {
    try {
        const { filename } = req.params;
        const backupPath = path.join(BACKUP_DIR, filename);
        
        if (!fs.existsSync(backupPath)) {
            return res.status(404).json({ error: 'Backup file not found' });
        }

        fs.unlinkSync(backupPath);
        res.json({ message: `Backup file ${filename} deleted successfully` });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete backup' });
    }
});

// ─── 1. GET /api/v1/system/backups-list ────────────────────────────────────
// List all available .sql backup files
router.get('/backups-list', authenticate, requireRole('developer'), async (req, res, next) => {
    try {
        if (!fs.existsSync(BACKUP_DIR)) {
            return res.json({ backups: [] });
        }
        const files = fs.readdirSync(BACKUP_DIR)
            .filter(f => f.endsWith('.sql.gz') || f.endsWith('.sql'))
            .map(f => {
                const stats = fs.statSync(path.join(BACKUP_DIR, f));
                return {
                    name: f,
                    size: stats.size,
                    createdAt: stats.mtime
                };
            })
            .sort((a, b) => b.createdAt - a.createdAt);
        res.json({ backups: files });
    } catch (err) { next(err); }
});

// Trigger a manual on-demand backup
router.post('/backup', authenticate, requireRole('developer'), async (req, res, next) => {
    try {
        console.log('📡 [SYSTEM] Triggering manual backup...');
        const result = await runBackup();
        
        if (result.success) {
            console.log('✅ [SYSTEM] Manual backup process completed.');
            res.json({ 
                message: `Backup created successfully! ${result.cloudSync ? '☁️ Pushed to Google Drive.' : '⚠️ Local copy only.'}` 
            });
        } else {
            console.error('❌ [SYSTEM] Manual backup process failed:', result.error);
            res.status(500).json({ error: result.error || 'Backup failed' });
        }
    } catch (err) { 
        console.error('❌ [SYSTEM] INTERNAL ERROR in /backup route:', err);
        res.status(500).json({ error: 'Internal server error during backup' });
    }
});

const zlib = require('zlib');
const { spawn } = require('child_process');

async function restoreDatabase(backupPath) {
    const containerName = 'courtportalantigravity-db-1';
    const isCompressed = backupPath.endsWith('.gz');

    return new Promise((resolve, reject) => {
        // Prepare the psql process inside Docker
        const psql = spawn('docker', [
            'exec', 
            '-i', 
            containerName, 
            'sh', '-c', `PGPASSWORD=password psql -U user -d court_portal`
        ]);

        let errorOutput = '';
        psql.stderr.on('data', (data) => { errorOutput += data.toString(); });

        psql.on('exit', (code) => {
            if (code === 0) resolve();
            else reject(new Error(`Restore process exited with code ${code}: ${errorOutput}`));
        });

        // ─── Stream the file into psql's stdin ───────────────────────────
        const fileStream = fs.createReadStream(backupPath);
        
        if (isCompressed) {
            const gunzip = zlib.createGunzip();
            fileStream.pipe(gunzip).pipe(psql.stdin);
        } else {
            fileStream.pipe(psql.stdin);
        }

        fileStream.on('error', reject);
    });
}

// ─── 3. POST /api/v1/system/restore ────────────────────────────────────────
// Restore from a specific backup file
router.post('/restore', authenticate, requireRole('developer'), async (req, res, next) => {
    try {
        const { filename } = req.body;
        if (!filename) return res.status(400).json({ error: 'filename is required' });

        const backupPath = path.join(BACKUP_DIR, filename);
        if (!fs.existsSync(backupPath)) return res.status(404).json({ error: 'Backup file not found' });

        console.log(`⚠️  RESTORE INITIATED: ${filename}`);
        await restoreDatabase(backupPath);
        
        res.json({ message: `System successfully restored to ${filename}` });
    } catch (err) { 
        console.error('Restore Error:', err);
        res.status(500).json({ error: 'Restore failed', details: err.message });
    }
});

// ─── 4. POST /api/v1/system/cleanup ─────────────────────────────────────────
// Wipe sections of the database or entire database
router.post('/cleanup', authenticate, requireRole('developer'), async (req, res, next) => {
    try {
        const { scope, districtId } = req.body;
        const dId = districtId ? parseInt(districtId) : null;
        
        let msg = '';

        if (scope === 'entries_only') {
            const where = dId ? { districtId: dId } : {};
            await prisma.dataEntry.deleteMany({ where });
            msg = `All data entries cleared${dId ? ` for District ID ${dId}` : ''}.`;
        }
        else if (scope === 'grievances_only') {
            const where = dId ? { districtId: dId } : {};
            await prisma.grievance.deleteMany({ where });
            msg = `All grievances cleared${dId ? ` for District ID ${dId}` : ''}.`;
        }
        else if (scope === 'courts_only') {
            const where = dId ? { districtId: dId } : {};
            await prisma.court.deleteMany({ where });
            msg = `All courts cleared ${dId ? ` for District ID ${dId}` : ''}.`;
        }
        else if (scope === 'magistrates_only') {
            const where = dId ? { districtId: dId } : {};
            await prisma.magistrate.deleteMany({ where });
            msg = `All judicial officers cleared ${dId ? ` for District ID ${dId}` : ''}.`;
        }
        else if (scope === 'naib_courts_only') {
            const where = { role: 'naib_court' };
            if (dId) where.districtId = dId;
            await prisma.user.deleteMany({ where });
            msg = `All naib court user accounts cleared ${dId ? ` for District ID ${dId}` : ''}.`;
        }
        else if (scope === 'police_stations_only') {
            const where = dId ? { districtId: dId } : {};
            await prisma.policeStation.deleteMany({ where });
            msg = `All police stations cleared ${dId ? ` for District ID ${dId}` : ''}.`;
        }
        else if (scope === 'districts_only' && !dId) {
            // Cannot delete all districts easily without cascade, but we'll try
            await prisma.dataEntry.deleteMany({});
            await prisma.grievance.deleteMany({});
            await prisma.court.deleteMany({});
            await prisma.magistrate.deleteMany({});
            await prisma.policeStation.deleteMany({});
            await prisma.user.deleteMany({ where: { role: { not: 'developer' } } });
            await prisma.district.deleteMany({});
            msg = 'All districts and their associated data (full wipe) cleared.';
        }
        else if (scope === 'full_wipe') {
            // Delete in order to satisfy foreign key constraints
            await prisma.dataEntry.deleteMany({});
            await prisma.grievance.deleteMany({});
            await prisma.user.deleteMany({ where: { role: { not: 'developer' } } });
            await prisma.magistrate.deleteMany({});
            await prisma.court.deleteMany({});
            await prisma.policeStation.deleteMany({});
            await prisma.district.deleteMany({});
            msg = 'Full database cleanup complete (only Developer account remains).';
        }

        if (msg) return res.json({ message: msg });
        res.status(400).json({ error: 'Invalid cleanup scope' });
    } catch (err) { next(err); }
});

// ─── 5. POST /api/v1/system/finalize-submissions ──────────────────────────
// Mark data entries as submitted for reports (Developer bypass)
router.post('/finalize-submissions', authenticate, requireRole('developer'), async (req, res, next) => {
    try {
        const { districtId, courtId, date } = req.body;
        
        let where = {};
        if (courtId) where.courtId = parseInt(courtId);
        else if (districtId) where.districtId = parseInt(districtId);
        
        if (date) where.entryDate = new Date(date);

        // Find all unique courtId + entryDate pairs that have existing data entries
        const entries = await prisma.dataEntry.findMany({
            where,
            select: { courtId: true, entryDate: true, createdBy: true },
            distinct: ['courtId', 'entryDate']
        });

        let createdCount = 0;
        for (const entry of entries) {
            await prisma.dailySubmission.upsert({
                where: {
                    courtId_entryDate: {
                        courtId: entry.courtId,
                        entryDate: entry.entryDate
                    }
                },
                update: {
                    submittedAt: new Date()
                },
                create: {
                    courtId: entry.courtId,
                    entryDate: entry.entryDate,
                    submittedBy: entry.createdBy,
                    submittedAt: new Date()
                }
            });
            createdCount++;
        }

        res.json({ 
            message: `Successfully finalized ${createdCount} reporting days across the selected scope.` 
        });
    } catch (err) { next(err); }
});

// ─── 6. POST /api/v1/system/sync-table-sort-order ──────────────────────────
// Update table sort orders based on the standard 17-table sequence
router.post('/sync-table-sort-order', authenticate, requireRole('developer'), async (req, res, next) => {
    try {
        const orderMap = {
            'trials-disposed': 1,
            'cancellation-decisions': 2,
            'police-applications': 3,
            'bail-granted': 4,
            'po-pp-bj': 5,
            'property-attached': 6,
            'complaints-against-police': 7,
            'fir-156-3': 8,
            'sho-dsp-appeared': 9,
            'police-deposition': 10,
            'vc-prisoners': 11,
            'tips-conducted': 12,
            'pairvi-witness': 13,
            'gangster-next-day': 14,
            'property-offender-next-day': 15,
            'bail-applications-tomorrow': 16,
            'nbw-arrest-warrants': 17
        };

        let updated = 0;
        for (const [slug, order] of Object.entries(orderMap)) {
            const table = await prisma.dataEntryTable.updateMany({
                where: { slug },
                data: { sortOrder: order }
            });
            updated += table.count;
        }

        res.json({ message: `Successfully synchronized sort orders for ${updated} tables.` });
    } catch (err) { next(err); }
});

// ─── 7. POST /api/v1/system/fix-tables ──────────────────────────────────────
// One-click repair: delete rogue tables, create correct PDF tables
router.post('/fix-tables', authenticate, requireRole('developer'), async (req, res, next) => {
    try {
        const developer = await prisma.user.findFirst({ where: { role: 'developer' } });
        if (!developer) return res.status(500).json({ error: 'No developer user found' });

        // Rogue slugs that should NOT exist
        const rogueSlugs = [
            'sentencing', 'judicial-misconduct', 'deposition-prosecution',
            'deposition-official', 'deposition-medical', 'deposition-forensic',
            'deposition-police', 'witnesses-no-appearance', 'summons-warrants-served',
            'summons-warrants-unserved', 'nbw-served', 'nbw-unserved'
        ];

        let deleted = 0;
        for (const slug of rogueSlugs) {
            const table = await prisma.dataEntryTable.findUnique({ where: { slug } });
            if (table) {
                const count = await prisma.dataEntry.count({ where: { tableId: table.id } });
                if (count > 0) continue; // Safety: skip if has data
                await prisma.dataEntryColumn.deleteMany({ where: { tableId: table.id } });
                await prisma.dataEntryTable.delete({ where: { id: table.id } });
                deleted++;
            }
        }

        // The 12 correct tables from the PDF that may be missing
        const missingTables = [
            { name: '6. Value of Property attached (85 BNSS & 107 BNSS)', slug: 'property-attached', singleRow: false, sortOrder: 6, columns: [
                { name: 'Name of Accused', slug: 'accused_name', dataType: 'text', sortOrder: 0 },
                { name: 'FIR Number', slug: 'fir_no', dataType: 'text', sortOrder: 1 },
                { name: 'FIR Year', slug: 'fir_year', dataType: 'year', sortOrder: 2 },
                { name: 'Sections (U/s)', slug: 'sections', dataType: 'text', sortOrder: 3 },
                { name: 'Police Station', slug: 'police_station', dataType: 'text', sortOrder: 4 },
                { name: 'BNSS Section', slug: 'bnss_section', dataType: 'enum', enumOptions: ['85 BNSS', '107 BNSS'], sortOrder: 5 },
                { name: 'Property Details', slug: 'property_details', dataType: 'text', sortOrder: 6 },
                { name: 'Property Value', slug: 'property_value', dataType: 'number', sortOrder: 7 },
            ]},
            { name: '7. Applications/Complaints Against Police Officials', slug: 'complaints-against-police', singleRow: false, sortOrder: 7, columns: [
                { name: 'Details of Applicant', slug: 'applicant_details', dataType: 'text', sortOrder: 0 },
                { name: 'Brief Facts', slug: 'brief_facts', dataType: 'text', sortOrder: 1 },
                { name: 'Next Hearing Date', slug: 'next_hearing_date', dataType: 'date', sortOrder: 2 },
            ]},
            { name: '8. FIR Registration under 156(3) CrPC', slug: 'fir-156-3', singleRow: false, sortOrder: 8, columns: [
                { name: 'Details of Applicant', slug: 'applicant_details', dataType: 'text', sortOrder: 0 },
                { name: 'Sections in Complaint', slug: 'complaint_sections', dataType: 'text', sortOrder: 1 },
                { name: 'Police Station', slug: 'police_station', dataType: 'text', sortOrder: 2 },
                { name: 'Details of Police Officials', slug: 'police_official_details', dataType: 'text', sortOrder: 3 },
            ]},
            { name: '9. SHOs and DSPs Who Appeared in Court', slug: 'sho-dsp-appeared', singleRow: false, sortOrder: 9, columns: [
                { name: 'Name of SHO/ DSP', slug: 'officer_name', dataType: 'text', sortOrder: 0 },
                { name: 'Rank', slug: 'rank', dataType: 'enum', enumOptions: ['SHO', 'DSP/ASP/Addl SP'], sortOrder: 1 },
                { name: 'Place of Posting', slug: 'posting_place', dataType: 'text', sortOrder: 2 },
                { name: 'Reason', slug: 'reason', dataType: 'text', sortOrder: 3 },
                { name: 'Remarks', slug: 'remarks', dataType: 'text', isRequired: false, sortOrder: 4 },
            ]},
            { name: '10. Deposition of Police Officials', slug: 'police-deposition', singleRow: true, sortOrder: 10, columns: [
                { name: 'Supposed to Appear', slug: 'supposed_to_appear', dataType: 'number', sortOrder: 0 },
                { name: 'Appeared Physically', slug: 'appeared_physically', dataType: 'number', sortOrder: 1 },
                { name: 'Examined Physically', slug: 'examined_physically', dataType: 'number', sortOrder: 2 },
                { name: 'Examined via VC', slug: 'examined_via_vc', dataType: 'number', sortOrder: 3 },
                { name: 'Absent (Unauthorized/No Request)', slug: 'absent_unauthorized', dataType: 'number', sortOrder: 4 },
            ]},
            { name: '11. VC of Prisoners', slug: 'vc-prisoners', singleRow: true, sortOrder: 11, columns: [
                { name: 'Produced Physically', slug: 'produced_physically', dataType: 'number', sortOrder: 0 },
                { name: 'Produced via VC', slug: 'produced_via_vc', dataType: 'number', sortOrder: 1 },
            ]},
            { name: '12. TIPs Conducted Today', slug: 'tips-conducted', singleRow: false, sortOrder: 12, columns: [
                { name: 'FIR Number', slug: 'fir_no', dataType: 'text', sortOrder: 0 },
                { name: 'FIR Year', slug: 'fir_year', dataType: 'year', sortOrder: 1 },
                { name: 'Sections (U/s)', slug: 'sections', dataType: 'text', sortOrder: 2 },
                { name: 'Police Station', slug: 'police_station', dataType: 'text', sortOrder: 3 },
            ]},
            { name: '13. Pairvi for Private Witness', slug: 'pairvi-witness', singleRow: true, sortOrder: 13, columns: [
                { name: 'Witnesses Examined', slug: 'witnesses_examined', dataType: 'number', sortOrder: 0 },
                { name: 'Witnesses Prepared to Testify', slug: 'witnesses_prepared', dataType: 'number', sortOrder: 1 },
            ]},
            { name: '14. Gangster/Notorious Criminal Appearing Next Day', slug: 'gangster-next-day', singleRow: false, sortOrder: 14, columns: [
                { name: 'Gangster & Gang Details', slug: 'gangster_details', dataType: 'text', sortOrder: 0 },
                { name: 'FIR Number', slug: 'fir_no', dataType: 'text', sortOrder: 1 },
                { name: 'FIR Year', slug: 'fir_year', dataType: 'year', sortOrder: 2 },
                { name: 'Sections (U/s)', slug: 'sections', dataType: 'text', sortOrder: 3 },
                { name: 'Police Station', slug: 'police_station', dataType: 'text', sortOrder: 4 },
                { name: 'Accused Status', slug: 'accused_status', dataType: 'enum', enumOptions: ['Bail', 'Judicial Custody'], sortOrder: 5 },
                { name: 'Name of Jail', slug: 'jail_name', dataType: 'text', isRequired: false, sortOrder: 6 },
            ]},
            { name: '15. Crime Against Property Offender Appearing Next Day', slug: 'property-offender-next-day', singleRow: false, sortOrder: 15, columns: [
                { name: 'Details of Accused', slug: 'accused_details', dataType: 'text', sortOrder: 0 },
                { name: 'FIR Number', slug: 'fir_no', dataType: 'text', sortOrder: 1 },
                { name: 'FIR Year', slug: 'fir_year', dataType: 'year', sortOrder: 2 },
                { name: 'Sections (U/s)', slug: 'sections', dataType: 'text', sortOrder: 3 },
                { name: 'Police Station', slug: 'police_station', dataType: 'text', sortOrder: 4 },
                { name: 'Accused Status', slug: 'accused_status', dataType: 'enum', enumOptions: ['Bail', 'Judicial Custody'], sortOrder: 5 },
                { name: 'Name of Jail', slug: 'jail_name', dataType: 'text', isRequired: false, sortOrder: 6 },
            ]},
            { name: '16. Fresh Bail Applications listed for tomorrow', slug: 'bail-applications-tomorrow', singleRow: false, sortOrder: 16, columns: [
                { name: 'Name of Accused', slug: 'accused_name', dataType: 'text', sortOrder: 0 },
                { name: 'FIR Number', slug: 'fir_no', dataType: 'text', sortOrder: 1 },
                { name: 'FIR Year', slug: 'fir_year', dataType: 'year', sortOrder: 2 },
                { name: 'Sections (U/s)', slug: 'sections', dataType: 'text', sortOrder: 3 },
                { name: 'Police Station', slug: 'police_station', dataType: 'text', sortOrder: 4 },
                { name: 'Bail Type', slug: 'bail_type', dataType: 'enum', enumOptions: ['Regular Bail', 'Anticipatory Bail'], sortOrder: 5 },
            ]},
            { name: '17. NBW Arrest Warrants issued today', slug: 'nbw-arrest-warrants', singleRow: false, sortOrder: 17, columns: [
                { name: 'Name of Accused', slug: 'accused_name', dataType: 'text', sortOrder: 0 },
                { name: 'FIR Number', slug: 'fir_no', dataType: 'text', sortOrder: 1 },
                { name: 'FIR Year', slug: 'fir_year', dataType: 'year', sortOrder: 2 },
                { name: 'Sections (U/s)', slug: 'sections', dataType: 'text', sortOrder: 3 },
                { name: 'Police Station', slug: 'police_station', dataType: 'text', sortOrder: 4 },
                { name: 'Next Date', slug: 'next_date', dataType: 'date', sortOrder: 5 },
            ]},
        ];

        // Fix sort orders for the 5 correct tables already in DB
        const sortFixes = { 'trials-disposed': 1, 'cancellation-decisions': 2, 'police-applications': 3, 'bail-granted': 4, 'po-pp-bj': 5 };
        for (const [slug, order] of Object.entries(sortFixes)) {
            await prisma.dataEntryTable.updateMany({ where: { slug }, data: { sortOrder: order } });
        }

        let created = 0;
        for (const t of missingTables) {
            const exists = await prisma.dataEntryTable.findUnique({ where: { slug: t.slug } });
            if (exists) continue;
            await prisma.dataEntryTable.create({
                data: {
                    name: t.name, slug: t.slug, description: t.name, singleRow: t.singleRow,
                    sortOrder: t.sortOrder, createdBy: developer.id,
                    columns: { create: t.columns.map(c => ({
                        name: c.name, slug: c.slug, dataType: c.dataType,
                        enumOptions: c.enumOptions || null,
                        isRequired: c.isRequired !== undefined ? c.isRequired : true,
                        sortOrder: c.sortOrder
                    }))}
                }
            });
            created++;
        }

        res.json({ message: `Fix complete! Deleted ${deleted} rogue tables, created ${created} correct tables, fixed sort orders.` });
    } catch (err) { next(err); }
});

module.exports = router;
