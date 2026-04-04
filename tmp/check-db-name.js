const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const t = await prisma.dataEntryTable.findUnique({ where: { id: 3 } });
  console.log(JSON.stringify(t, null, 2));
}
check().finally(() => prisma.$disconnect());
