const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const tables = await prisma.dataEntryTable.findMany({
    orderBy: { sortOrder: 'asc' }
  });
  console.log('--- DB Tables ---');
  tables.forEach(t => {
   if (t.name.toLowerCase().includes('decision')) {
     console.log(`[${t.deletedAt ? 'DEL' : 'OK '}] ID: ${t.id} | Name: ${t.name}`);
   }
  });
}
check().finally(() => prisma.$disconnect());
