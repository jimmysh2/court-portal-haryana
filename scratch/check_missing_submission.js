
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const court = await prisma.court.findFirst({
      where: {
        name: { contains: 'ACJM' },
        district: { name: 'Panchkula' }
      },
      select: { id: true, name: true }
    });

    if (!court) {
      console.log('Court not found');
      return;
    }

    console.log('Court Found:', court);

    const submission = await prisma.dailySubmission.findFirst({
      where: {
        courtId: court.id,
        entryDate: new Date('2026-04-13')
      }
    });

    console.log('Daily Submission:', submission);

    const entries = await prisma.dataEntry.findMany({
      where: {
        courtId: court.id,
        entryDate: new Date('2026-04-13'),
        tableId: 3
      }
    });

    console.log('Data Entries for Table 3:', entries.length);
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
