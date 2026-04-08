/**
 * auto-sync.js
 * Reads the live database structure and writes it to:
 * 1. prisma/table-definitions.js (The primary UI source of truth)
 * 2. prisma/seed-production.js (The database initialization source)
 * 3. server/routes/system.js (Backup structure for system routes)
 * 4. Disrtrict_PS.csv (The police station master list)
 * 
 * This is called automatically after any table, column, district, or police station modification
 * via the UI, ensuring the repository always matches the current database state.
 */

const fs = require('fs');
const path = require('path');

const TABLE_DEFS_PATH = path.join(__dirname, '../prisma/table-definitions.js');
const SEED_FILE_PATH = path.join(__dirname, '../prisma/seed-production.js');
const SYSTEM_ROUTE_PATH = path.join(__dirname, '../server/routes/system.js');
const DISTRICT_CSV_PATH = path.join(__dirname, '../Disrtrict_PS.csv');

async function syncTableDefinitions(prisma) {
    try {
        const dbTables = await prisma.dataEntryTable.findMany({
            where: { deletedAt: null },
            include: {
                columns: {
                    where: { deletedAt: null },
                    orderBy: { sortOrder: 'asc' }
                }
            },
            orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }]
        });

        const tables = dbTables.map(t => ({
            name: t.name,
            slug: t.slug,
            description: t.description || '',
            singleRow: t.singleRow,
            sortOrder: t.sortOrder,
            columns: t.columns.map(c => ({
                name: c.name,
                slug: c.slug,
                dataType: c.dataType,
                enumOptions: c.enumOptions || null,
                isRequired: c.isRequired,
                sortOrder: c.sortOrder
            }))
        }));

        // 1. Sync prisma/table-definitions.js
        const fileContent = `// ─── AUTO-GENERATED: Single Source of Truth for Table Definitions ───────────
// This file is automatically updated whenever a table or column is modified
// via the Developer Dashboard. You may also edit it manually if needed.

module.exports = ${JSON.stringify(tables, null, 4)};
`;
        fs.writeFileSync(TABLE_DEFS_PATH, fileContent, 'utf8');
        console.log('✅ [AUTO-SYNC] prisma/table-definitions.js updated.');

        // Seed scripts now dynamically require('./table-definitions.js'), 
        // so we NO LONGER need to manually string-replace them here.

    } catch (err) {
        console.error('⚠️ [AUTO-SYNC] Table sync failed:', err.message);
    }
}

async function syncPoliceStations(prisma) {
    try {
        const districts = await prisma.district.findMany({
            include: { policeStations: { orderBy: { name: 'asc' } } },
            orderBy: { name: 'asc' }
        });

        let csvLines = ['District,PS'];
        for (const d of districts) {
            for (const ps of d.policeStations) {
                let psName = ps.name;
                if (psName.includes(',') || psName.includes('"')) {
                    psName = `"${psName.replace(/"/g, '""')}"`;
                }
                csvLines.push(`${d.name},${psName}`);
            }
        }

        fs.writeFileSync(DISTRICT_CSV_PATH, csvLines.join('\n'), 'utf8');
        console.log('✅ [AUTO-SYNC] Disrtrict_PS.csv updated.');
    } catch (err) {
        console.error('⚠️ [AUTO-SYNC] Police station sync failed:', err.message);
    }
}

module.exports = { syncTableDefinitions, syncPoliceStations };
