/**
 * pre-migrate-cleanup.js
 * 
 * Runs BEFORE `prisma migrate deploy` on Render to remove duplicate rows
 * that would block the new unique constraints from being applied.
 * 
 * Deduplicates:
 *  - magistrates (unique: districtId + name)
 *  - police_stations (unique: districtId + name)
 * 
 * For each duplicate group, keeps the oldest record (lowest id) and
 * re-points all foreign key references to the keeper before deleting.
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function deduplicateMagistrates() {
    console.log('\n🔍 Checking for duplicate magistrates...');
    const dups = await p.$queryRawUnsafe(`
        SELECT name, district_id, COUNT(*) as cnt, MIN(id) as keep_id
        FROM magistrates
        GROUP BY name, district_id
        HAVING COUNT(*) > 1
    `);

    if (dups.length === 0) {
        console.log('  ✅ No duplicate magistrates.');
        return;
    }

    console.log(`  Found ${dups.length} duplicate group(s). Cleaning...`);
    let deleted = 0;

    for (const dup of dups) {
        const keepId = Number(dup.keep_id);

        const dupes = await p.magistrate.findMany({
            where: {
                name: dup.name,
                districtId: dup.district_id != null ? Number(dup.district_id) : null,
                id: { not: keepId },
            },
        });

        for (const dupe of dupes) {
            // Re-point courts and data entries to the keeper
            await p.court.updateMany({
                where: { magistrateId: dupe.id },
                data: { magistrateId: keepId },
            });
            await p.dataEntry.updateMany({
                where: { magistrateId: dupe.id },
                data: { magistrateId: keepId },
            });
            await p.magistrate.delete({ where: { id: dupe.id } });
            deleted++;
            console.log(`    🗑️  Deleted duplicate magistrate id=${dupe.id} ("${dupe.name}")`);
        }
    }
    console.log(`  ✅ Removed ${deleted} duplicate magistrate records.`);
}

async function deduplicatePoliceStations() {
    console.log('\n🔍 Checking for duplicate police stations...');
    const dups = await p.$queryRawUnsafe(`
        SELECT name, district_id, COUNT(*) as cnt, MIN(id) as keep_id
        FROM police_stations
        GROUP BY name, district_id
        HAVING COUNT(*) > 1
    `);

    if (dups.length === 0) {
        console.log('  ✅ No duplicate police stations.');
        return;
    }

    console.log(`  Found ${dups.length} duplicate group(s). Cleaning...`);
    let deleted = 0;

    for (const dup of dups) {
        const keepId = Number(dup.keep_id);

        const dupes = await p.policeStation.findMany({
            where: {
                name: dup.name,
                districtId: Number(dup.district_id),
                id: { not: keepId },
            },
        });

        for (const dupe of dupes) {
            await p.policeStation.delete({ where: { id: dupe.id } });
            deleted++;
            console.log(`    🗑️  Deleted duplicate police station id=${dupe.id} ("${dupe.name}")`);
        }
    }
    console.log(`  ✅ Removed ${deleted} duplicate police station records.`);
}

async function main() {
    console.log('🧹 Pre-migration cleanup starting...');
    await deduplicateMagistrates();
    await deduplicatePoliceStations();
    console.log('\n✅ Pre-migration cleanup complete. Safe to run migrate deploy.');
}

main()
    .catch((e) => { console.error('❌ Cleanup failed:', e); process.exit(1); })
    .finally(() => p.$disconnect());
