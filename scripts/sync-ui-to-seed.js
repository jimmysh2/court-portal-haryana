const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function sync() {
    try {
        console.log('🔄 Maintenance: Syncing Database UI Changes to Seed and CSV...');

        // 1. Sync Data Entry Tables to prisma/seed-production.js
        console.log('   - Fetching DataEntryTables...');
        const dbTables = await prisma.dataEntryTable.findMany({
            where: { deletedAt: null },
            include: { 
                columns: { 
                    where: { deletedAt: null },
                    orderBy: { sortOrder: 'asc' }
                } 
            },
            orderBy: { id: 'asc' }
        });

        const formattedTables = dbTables.map(t => {
            const columns = t.columns.map(c => {
                const colObj = {
                    name: c.name,
                    slug: c.slug,
                    dataType: c.dataType,
                    sortOrder: c.sortOrder
                };
                if (c.enumOptions) colObj.enumOptions = c.enumOptions;
                if (c.isRequired === false) colObj.isRequired = false;
                return colObj;
            });

            return {
                name: t.name,
                slug: t.slug,
                description: t.description || '',
                singleRow: t.singleRow,
                columns
            };
        });

        const tablesJs = JSON.stringify(formattedTables, null, 8).replace(/"([^"]+)":/g, '$1:');

        const rootDir = path.join(__dirname, '..');
        const seedFilePath = path.join(rootDir, 'prisma/seed-production.js');
        let seedContent = fs.readFileSync(seedFilePath, 'utf8');

        const startMarker = 'const tables = [';
        const followMarker = 'console.log(\'📋 Syncing data entry tables...\');';
        
        const startIndex = seedContent.indexOf(startMarker);
        const followIndex = seedContent.indexOf(followMarker);

        if (startIndex !== -1 && followIndex !== -1) {
            const newTablesArray = `const tables = ${tablesJs};\n\n    `;
            seedContent = seedContent.substring(0, startIndex) + newTablesArray + seedContent.substring(followIndex);
            fs.writeFileSync(seedFilePath, seedContent);
            console.log('   ✅ seed-production.js (Tables) updated.');
        } else {
            console.error('   ❌ Could not find Table markers in seed-production.js');
        }

        // 2. Sync Police Stations to Disrtrict_PS.csv
        console.log('   - Fetching Districts and Police Stations...');
        const districts = await prisma.district.findMany({
            include: { policeStations: { orderBy: { name: 'asc' } } },
            orderBy: { name: 'asc' }
        });

        let csvLines = ['District,PS'];
        for (const d of districts) {
            for (const ps of d.policeStations) {
                // escape quotes for CSV if name has commas
                let name = ps.name;
                if (name.includes(',') || name.includes('"')) {
                    name = `"${name.replace(/"/g, '""')}"`;
                }
                csvLines.push(`${d.name.toUpperCase()},${name}`);
            }
        }

        const csvPath = path.join(rootDir, 'Disrtrict_PS.csv');
        fs.writeFileSync(csvPath, csvLines.join('\n') + '\n');
        console.log('   ✅ Disrtrict_PS.csv updated.');

        // 3. Sync Districts, Courts, and Magistrates to master_structure.json
        console.log('   - Exporting Master Structure (Districts/Courts/Judges)...');
        const fullStructure = await prisma.district.findMany({
            include: {
                courts: {
                    include: {
                        magistrate: true,
                        usersLastSelected: {
                            where: { role: 'naib_court' }
                        }
                    }
                }
            },
            orderBy: { name: 'asc' }
        });

        const structurePath = path.join(rootDir, 'prisma/master_structure.json');
        fs.writeFileSync(structurePath, JSON.stringify(fullStructure, null, 2));
        console.log('   ✅ prisma/master_structure.json updated.');

        console.log('\n✨ Sync Complete. All UI changes including Court/District modifications are now backed up.');

    } catch (err) {
        console.error('   ❌ Sync failed:', err);
    } finally {
        await prisma.$disconnect();
    }
}

sync();
