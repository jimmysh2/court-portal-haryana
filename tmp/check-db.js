const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const tables = await prisma.dataEntryTable.findMany({
    orderBy: { sortOrder: 'asc' }
  });
  console.log('--- DB Tables ---');
  tables.forEach(t => {
    console.log(`[${t.deletedAt ? 'DEL' : 'OK '}] ${t.sortOrder} | ${t.name}`);
  });
}
check().finally(() => prisma.$disconnect());
