/**
 * reorder-tables-11-22.js
 * Fixes the physical row order of DataEntryTable rows 11-22 in the database.
 * 
 * Problem: rows for tables 11 & 12 were inserted AFTER 13-20, so pgAdmin shows them
 * out of order. The app orders by sortOrder correctly, but pgAdmin shows insertion order.
 *
 * This script:
 *   1. Reads all table+column definitions for sortOrders 11-22
 *   2. Checks for any user data entries (and aborts if found, to preserve data)
 *   3. Deletes and re-inserts those rows in correct sortOrder sequence
 *
 * Run: node scripts/reorder-tables-11-22.js
 */

const { PrismaClient } = require('@prisma/client');
const tableDefs = require('../prisma/table-definitions.js');
const prisma = new PrismaClient();

async function main() {
    console.log('🔄 Reordering tables 11-22 for correct physical DB row sequence...\n');

    const developer = await prisma.user.findFirst({ where: { role: 'developer' } });
    if (!developer) {
        console.error('❌ Developer user not found.');
        process.exit(1);
    }

    // Get tables 11-22 from the DB
    const tablesToFix = await prisma.dataEntryTable.findMany({
        where: { sortOrder: { gte: 11 } },
        orderBy: { sortOrder: 'asc' },
        include: { columns: { orderBy: { sortOrder: 'asc' } } }
    });

    console.log(`Found ${tablesToFix.length} tables with sortOrder >= 11:`);
    tablesToFix.forEach(t => console.log(`  [ID=${t.id}] sortOrder=${t.sortOrder} slug=${t.slug}`));
    console.log('');

    // Safety check: any real user data?
    let hasData = false;
    for (const t of tablesToFix) {
        const count = await prisma.dataEntry.count({ where: { tableId: t.id } });
        if (count > 0) {
            console.log(`  ⚠️  Table ${t.slug} has ${count} data entries — will skip delete but update order.`);
            hasData = true;
        }
    }

    if (hasData) {
        console.log('\n⚠️  Some tables have user data. Doing safe name/sortOrder update only...');
        // Just make sure sortOrders are correct (they already are), nothing destructive
        for (const t of tablesToFix) {
            const def = tableDefs.find(d => d.slug === t.slug);
            if (def) {
                await prisma.dataEntryTable.update({
                    where: { id: t.id },
                    data: { name: def.name, sortOrder: def.sortOrder }
                });
            }
        }
        console.log('✅ Names and sortOrders confirmed. Data preserved.\n');
        console.log('ℹ️  pgAdmin shows rows in insertion order — your app reads by sortOrder (correct).');
        console.log('   To see correct order in pgAdmin: click the "sortOrder" column header.\n');
        return;
    }

    // No user data — safe to delete and recreate in proper order
    console.log('✅ No user data found in tables 11-22. Safe to recreate in order.\n');

    // Delete in reverse order to avoid FK issues
    const reversed = [...tablesToFix].reverse();
    for (const t of reversed) {
        await prisma.dataEntryColumn.deleteMany({ where: { tableId: t.id } });
        await prisma.dataEntryTable.delete({ where: { id: t.id } });
        console.log(`  🗑️  Deleted: [${t.sortOrder}] ${t.slug}`);
    }

    console.log('');

    // Re-insert in correct sortOrder (11 → 22)
    const defsToInsert = tableDefs.filter(d => d.sortOrder >= 11).sort((a, b) => a.sortOrder - b.sortOrder);
    for (const def of defsToInsert) {
        await prisma.dataEntryTable.create({
            data: {
                name: def.name,
                slug: def.slug,
                description: def.description,
                singleRow: def.singleRow,
                sortOrder: def.sortOrder,
                createdBy: developer.id,
                columns: {
                    create: def.columns.map(col => ({
                        name: col.name,
                        slug: col.slug,
                        dataType: col.dataType,
                        enumOptions: col.enumOptions || null,
                        isRequired: col.isRequired !== undefined ? col.isRequired : true,
                        sortOrder: col.sortOrder,
                    }))
                }
            }
        });
        console.log(`  ➕ Inserted: [${def.sortOrder}] ${def.name}`);
    }

    // Final verification
    const all = await prisma.dataEntryTable.findMany({
        orderBy: { id: 'asc' },  // Show in physical row order (as pgAdmin would)
        select: { id: true, sortOrder: true, slug: true, name: true }
    });

    console.log('\n✅ Final DB state (in physical row order, as seen in pgAdmin):');
    console.log('ID    | sortOrder | slug');
    console.log('─'.repeat(80));
    all.forEach(t => {
        console.log(`${String(t.id).padEnd(6)}| ${String(t.sortOrder).padEnd(10)}| ${t.slug}`);
    });

    const total = await prisma.dataEntryTable.count();
    console.log(`\n🎉 Total tables: ${total} (expected: 22)`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
