/**
 * check-db-tables.js — Diagnostic: show ALL DataEntryTable rows from DB
 * Run: node scripts/check-db-tables.js
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const all = await prisma.dataEntryTable.findMany({
        orderBy: { sortOrder: 'asc' },
        select: { id: true, slug: true, name: true, sortOrder: true }
    });

    console.log(`\nTotal rows in DataEntryTable: ${all.length}\n`);
    console.log('sortOrder | slug                        | name');
    console.log('─'.repeat(100));
    all.forEach(t => {
        console.log(`  ${String(t.sortOrder).padEnd(8)} | ${t.slug.padEnd(30)} | ${t.name}`);
    });

    // Detect duplicates by sortOrder
    const byOrder = {};
    all.forEach(t => {
        if (!byOrder[t.sortOrder]) byOrder[t.sortOrder] = [];
        byOrder[t.sortOrder].push(t);
    });
    const dups = Object.entries(byOrder).filter(([, arr]) => arr.length > 1);
    if (dups.length) {
        console.log('\n⚠️  DUPLICATE sortOrders detected:');
        dups.forEach(([order, arr]) => {
            console.log(`\n  sortOrder ${order}:`);
            arr.forEach(t => console.log(`    ID=${t.id}  slug=${t.slug}  name=${t.name}`));
        });
    } else {
        console.log('\n✅ No duplicate sortOrders found.');
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
