const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const districtsToClear = ['PNP', 'PKL']; // Panipat, Panchkula

    for (const code of districtsToClear) {
        console.log(`Clearing district ${code}...`);
        const district = await prisma.district.findUnique({ where: { code } });
        if (!district) {
            console.log(`District ${code} not found, skipping.`);
            continue;
        }

        const districtId = district.id;

        console.log(`- Nullifying lastSelectedCourtId...`);
        await prisma.user.updateMany({
            where: { districtId },
            data: { lastSelectedCourtId: null }
        });

        console.log(`- Deleting courts...`);
        // Deleting courts will also cascade/nullify depending on schema, but let's just delete
        // If dataEntries reference courts, we might need to delete dataEntries.
        await prisma.dataEntry.deleteMany({
            where: { court: { districtId } }
        });

        await prisma.court.deleteMany({
            where: { districtId }
        });

        console.log(`- Deleting magistrates...`);
        await prisma.magistrate.deleteMany({
            where: { districtId }
        });

        console.log(`- Deleting users...`);
        await prisma.user.deleteMany({
            where: { districtId } // District Adimns, District Viewers, Naib Courts
        });

        // Finally delete the district itself to ensure completely fresh start
        await prisma.district.delete({
            where: { id: districtId }
        });

        console.log(`✅ Cleared ${code}.`);
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
