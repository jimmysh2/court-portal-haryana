const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    // Get Ambala district
    const ambala = await prisma.district.findFirst({ where: { name: { contains: 'AMBALA', mode: 'insensitive' } } });
    if (!ambala) { console.log('Ambala not found!'); return; }
    console.log('Ambala district:', ambala);

    const courts = await prisma.court.findMany({ where: { districtId: ambala.id, deletedAt: null } });
    console.log(`\nCourts in Ambala: ${courts.length}`);
    courts.forEach((c, i) => console.log(`  ${i + 1}. [${c.courtNo}] ${c.name} (magistrateId: ${c.magistrateId})`));

    const mags = await prisma.magistrate.findMany({ where: { districtId: ambala.id, deletedAt: null } });
    console.log(`\nMagistrates in Ambala: ${mags.length}`);
    mags.forEach((m, i) => console.log(`  ${i + 1}. ${m.name} - ${m.designation} (gender: ${m.gender})`));
}

main().finally(() => prisma.$disconnect());
