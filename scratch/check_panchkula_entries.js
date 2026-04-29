
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const districts = await prisma.district.findMany({
      where: { name: 'Panchkula' }
    });
    const entries = await prisma.dataEntry.findMany({
      where: {
        districtId: districts[0].id
      },
      include: {
          court: true,
          table: true
      },
      orderBy: { entryDate: 'desc' },
      take: 20
    });

    console.log('Last 20 entries for Panchkula:');
    entries.forEach(e => {
        console.log(`ID: ${e.id}, Court: ${e.court.name}, Table: ${e.table.name}, Date: ${e.entryDate.toISOString()}`);
    });

  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
