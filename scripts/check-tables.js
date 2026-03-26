const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/*
 * This script finds all DB tables that don't match seed.js slugs
 * and all seed.js slugs that are missing from the DB.
 */

// The correct 17 slugs from seed.js (which matches the PDF)
const CORRECT_SLUGS = [
    'trials-disposed',
    'cancellation-decisions',
    'police-applications',
    'bail-granted',
    'po-pp-bj',
    'property-attached',
    'complaints-against-police',
    'fir-156-3',
    'sho-dsp-appeared',
    'police-deposition',
    'vc-prisoners',
    'tips-conducted',
    'pairvi-witness',
    'gangster-next-day',
    'property-offender-next-day',
    'bail-applications-tomorrow',
    'nbw-arrest-warrants',
];

async function main() {
    const dbTables = await prisma.dataEntryTable.findMany({
        select: { id: true, slug: true, name: true },
    });

    console.log('=== DB Tables NOT in seed.js (ROGUE tables) ===');
    const rogueTables = dbTables.filter(t => !CORRECT_SLUGS.includes(t.slug));
    rogueTables.forEach(t => console.log(`  ❌ ID:${t.id} slug:${t.slug} name:${t.name}`));

    console.log('\n=== Seed.js slugs MISSING from DB ===');
    const dbSlugs = dbTables.map(t => t.slug);
    const missing = CORRECT_SLUGS.filter(s => !dbSlugs.includes(s));
    missing.forEach(s => console.log(`  ⚠️  ${s}`));

    // Check if rogue tables have any data entries
    console.log('\n=== Data entries in ROGUE tables ===');
    for (const t of rogueTables) {
        const count = await prisma.dataEntry.count({ where: { tableId: t.id } });
        console.log(`  ID:${t.id} slug:${t.slug} => ${count} entries`);
    }

    // Check if correct tables have data entries
    console.log('\n=== Data entries in CORRECT tables ===');
    const correctTables = dbTables.filter(t => CORRECT_SLUGS.includes(t.slug));
    for (const t of correctTables) {
        const count = await prisma.dataEntry.count({ where: { tableId: t.id } });
        console.log(`  ID:${t.id} slug:${t.slug} => ${count} entries`);
    }
}

main().then(() => process.exit());
