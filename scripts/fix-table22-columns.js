/**
 * fix-table22-columns.js
 * Updates table 22 (applications-dismissed) columns to:
 *   FIR Number, FIR Year, Sections (U/s), Police Station, Category
 *
 * Run: node scripts/fix-table22-columns.js
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const NEW_COLUMNS = [
    { name: "FIR Number",       slug: "fir_no",          dataType: "text",   enumOptions: null,  isRequired: true, sortOrder: 0 },
    { name: "FIR Year",         slug: "fir_year",         dataType: "year",   enumOptions: null,  isRequired: true, sortOrder: 1 },
    { name: "Sections (U/s)",   slug: "sections",         dataType: "text",   enumOptions: null,  isRequired: true, sortOrder: 2 },
    { name: "Police Station",   slug: "police_station",   dataType: "text",   enumOptions: null,  isRequired: true, sortOrder: 3 },
    {
        name: "Category", slug: "category", dataType: "enum", isRequired: true, sortOrder: 4,
        enumOptions: [
            "Bail Cancellation",
            "Disposal of case property",
            "Remand from judicial custody"
        ]
    }
];

async function main() {
    const table = await prisma.dataEntryTable.findUnique({ where: { slug: 'applications-dismissed' } });
    if (!table) { console.error('Table applications-dismissed not found'); process.exit(1); }

    console.log(`Found table: [${table.sortOrder}] ${table.name}`);

    // Check for existing data
    const dataCount = await prisma.dataEntry.count({ where: { tableId: table.id } });
    console.log(`Existing data entries: ${dataCount}`);
    if (dataCount > 0) console.log('⚠️  Note: existing entries will lose unmapped column values');

    // Delete old columns
    const deleted = await prisma.dataEntryColumn.deleteMany({ where: { tableId: table.id } });
    console.log(`\n🗑️  Deleted ${deleted.count} old columns`);

    // Insert new columns
    for (const col of NEW_COLUMNS) {
        await prisma.dataEntryColumn.create({
            data: { ...col, tableId: table.id }
        });
        console.log(`  ➕ Added column: ${col.name}`);
    }

    // Verify
    const cols = await prisma.dataEntryColumn.findMany({
        where: { tableId: table.id }, orderBy: { sortOrder: 'asc' }
    });
    console.log('\n✅ Table 22 columns now:');
    cols.forEach(c => console.log(`  ${c.sortOrder}. ${c.name} (${c.dataType}) slug=${c.slug}`));
    console.log('\n🎉 Done — table 22 column layout updated. Serial numbers unchanged.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
