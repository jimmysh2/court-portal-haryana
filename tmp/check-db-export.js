const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const tables = await prisma.dataEntryTable.findMany({
    where: { name: { contains: 'Decision' } }
  });
  const fs = require('fs');
  fs.writeFileSync('tmp/decision.json', JSON.stringify(tables, null, 2));
}
check().finally(() => prisma.$disconnect());
