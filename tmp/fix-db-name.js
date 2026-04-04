const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
  await prisma.dataEntryTable.update({
    where: { id: 3 },
    data: { name: 'Decision on any application filed by police officials' }
  });
  console.log('Fixed DB name for ID 3');
}
fix().finally(() => prisma.$disconnect());
