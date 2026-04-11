/**
 * remove-duplicate-tables.js — Removes old duplicate DataEntryTable rows
 * Deletes rows whose slugs were superseded by canonical slugs from table-definitions.js
 *
 * Run: node scripts/remove-duplicate-tables.js
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// These are OLD slugs that are duplicates — their canonical replacement exists in the DB already.
const STALE_SLUGS = [
    'other-govt-deposition',   // replaced by deposition-govt-officials (sortOrder 11)
    'private-deposition',      // replaced by deposition-private (sortOrder 12)
    'adverse-orders-police',   // replaced by adverse-order-police (sortOrder 21)
    'police-apps-dismissed',   // replaced by applications-dismissed (sortOrder 22)
];

async function main() {
    console.log('🗑️  Removing stale duplicate DataEntryTable rows...\n');

    for (const slug of STALE_SLUGS) {
        const table = await prisma.dataEntryTable.findUnique({ where: { slug } });
        if (!table) {
            console.log(`  ⏭️  Not found (already removed): ${slug}`);
            continue;
        }

        // Delete related data first (columns, entries) to avoid FK violations
        // 1. Delete any dataEntry records linked to this table
        const entries = await prisma.dataEntry.deleteMany({ where: { tableId: table.id } });
        if (entries.count > 0) console.log(`    Deleted ${entries.count} data entries for ${slug}`);

        // 2. Delete columns
        await prisma.dataEntryColumn.deleteMany({ where: { tableId: table.id } });

        // 3. Delete the table itself
        await prisma.dataEntryTable.delete({ where: { slug } });
        console.log(`  ✅ Deleted stale table: ${slug} (was sortOrder ${table.sortOrder})`);
    }

    // Final count
    const remaining = await prisma.dataEntryTable.count();
    console.log(`\n✅ Done. Remaining tables in DB: ${remaining}`);

    if (remaining === 22) {
        console.log('🎉 Perfect — exactly 22 tables, as expected!\n');
        const all = await prisma.dataEntryTable.findMany({
            orderBy: { sortOrder: 'asc' },
            select: { sortOrder: true, slug: true, name: true }
        });
        all.forEach(t => console.log(`  ${t.sortOrder}. [${t.slug}] ${t.name}`));
    } else {
        console.log(`⚠️  WARNING: Expected 22 but got ${remaining}. Check for other issues.`);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
