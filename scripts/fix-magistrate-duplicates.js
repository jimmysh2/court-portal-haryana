const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Checking for magistrate duplicates (District + Name)...');
    
    // Find all magistrates
    const mags = await prisma.magistrate.findMany({
        where: { deletedAt: null }
    });

    const counts = {}; // districtId-name -> [ids]
    for (const mag of mags) {
        const key = `${mag.districtId}-${mag.name.toLowerCase().trim()}`;
        if (!counts[key]) counts[key] = [];
        counts[key].push(mag.id);
    }

    let deleted = 0;
    for (const [key, ids] of Object.entries(counts)) {
        if (ids.length > 1) {
            console.log(`   - Found ${ids.length} entries for "${key}". Keeping ID ${ids[0]}.`);
            // Point all courts to the first one
            const keepId = ids[0];
            const others = ids.slice(1);
            
            await prisma.court.updateMany({
                where: { magistrateId: { in: others } },
                data: { magistrateId: keepId }
            });
            
            await prisma.dataEntry.updateMany({
                where: { magistrateId: { in: others } },
                data: { magistrateId: keepId }
            });

            // Hard delete duplicates (to allow the unique constraint migrate)
            await prisma.magistrate.deleteMany({
                where: { id: { in: others } }
            });
            deleted += others.length;
        }
    }

    console.log(`✅ Cleaned up ${deleted} magistrate duplicates.`);
}

main()
    .catch(e => console.error('❌ Magistrate cleanup failed:', e))
    .finally(() => prisma.$disconnect());
