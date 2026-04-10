/**
 * fix-table-names-db.js
 * One-time migration script to:
 *  1. Update existing DataEntryTable names and sortOrders to match table-definitions.js
 *  2. Insert missing tables (18-22) that were absent from the old seed.js
 *
 * Run: node scripts/fix-table-names-db.js
 */

const { PrismaClient } = require('@prisma/client');
const tableDefs = require('../prisma/table-definitions.js');

const prisma = new PrismaClient();

async function main() {
    console.log('🔧 Fixing table names and sort orders in the database...\n');

    // Find the developer user (needed for createdBy when inserting new tables)
    const developer = await prisma.user.findFirst({ where: { role: 'developer' } });
    if (!developer) {
        console.error('❌ No developer user found. Run seed first.');
        process.exit(1);
    }

    for (const def of tableDefs) {
        const existing = await prisma.dataEntryTable.findUnique({ where: { slug: def.slug } });

        if (existing) {
            // Update name and sortOrder if they differ
            if (existing.name !== def.name || existing.sortOrder !== def.sortOrder) {
                await prisma.dataEntryTable.update({
                    where: { slug: def.slug },
                    data: {
                        name: def.name,
                        sortOrder: def.sortOrder,
                        description: def.description,
                        singleRow: def.singleRow,
                    },
                });
                console.log(`  ✅ Updated: [${def.sortOrder}] ${def.name}`);
            } else {
                console.log(`  ⏭️  OK:      [${def.sortOrder}] ${def.name}`);
            }
        } else {
            // Insert missing table with its columns
            await prisma.dataEntryTable.create({
                data: {
                    name: def.name,
                    slug: def.slug,
                    description: def.description,
                    singleRow: def.singleRow,
                    sortOrder: def.sortOrder,
                    createdBy: developer.id,
                    columns: {
                        create: def.columns.map((col) => ({
                            name: col.name,
                            slug: col.slug,
                            dataType: col.dataType,
                            enumOptions: col.enumOptions || null,
                            isRequired: col.isRequired !== undefined ? col.isRequired : true,
                            sortOrder: col.sortOrder,
                        })),
                    },
                },
            });
            console.log(`  ➕ Inserted: [${def.sortOrder}] ${def.name}`);
        }
    }

    console.log('\n✅ Done! Verifying final state:');
    const all = await prisma.dataEntryTable.findMany({ orderBy: { sortOrder: 'asc' }, select: { sortOrder: true, name: true } });
    all.forEach(t => console.log(`  ${t.sortOrder}. ${t.name}`));
}

main()
    .catch((e) => {
        console.error('❌ Error:', e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
