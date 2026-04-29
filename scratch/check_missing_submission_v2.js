
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const districts = await prisma.district.findMany({
      where: { name: 'Panchkula' }
    });
    console.log('Districts:', districts);

    const courts = await prisma.court.findMany({
      where: { districtId: districts[0].id }
    });
    console.log('Courts in Panchkula:', courts.map(c => ({ id: c.id, name: c.name })));

    const tables = await prisma.dataEntryTable.findMany({
      select: { id: true, name: true }
    });
    console.log('Tables:', tables);

    const entries = await prisma.dataEntry.findMany({
      where: {
        districtId: districts[0].id,
        entryDate: {
            gte: new Date('2026-04-13T00:00:00Z'),
            lte: new Date('2026-04-13T23:59:59Z')
        }
      },
      include: {
          court: true,
          table: true
      }
    });

    console.log('Found Entries for 13/04/2026:', entries.map(e => ({
        id: e.id,
        courtId: e.courtId,
        courtName: e.court.name,
        tableId: e.tableId,
        tableName: e.table.name,
        entryDate: e.entryDate
    })));

    // Check DailySubmission for these court/date combinations
    const courtIds = [...new Set(entries.map(e => e.courtId))];
    const submissions = await prisma.dailySubmission.findMany({
        where: {
            courtId: { in: courtIds },
            entryDate: {
                gte: new Date('2026-04-13T00:00:00Z'),
                lte: new Date('2026-04-13T23:59:59Z')
            }
        }
    });
    console.log('Submissions found:', submissions);

  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
