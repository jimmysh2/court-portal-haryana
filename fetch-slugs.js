const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
    const tables = await prisma.dataEntryTable.findMany({ select: { name: true, slug: true } });
    console.log(tables);
    process.exit(0);
}
run();
