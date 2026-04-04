const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTables() {
    const tables = await prisma.dataEntryTable.findMany({
        where: { deletedAt: null },
        orderBy: { sortOrder: 'asc' }
    });
    
    console.log("CURRENT TABLES IN DATABASE:");
    tables.forEach((t, i) => {
        console.log(`ID: ${t.id} | SortOrder: ${t.sortOrder} | Name: ${t.name} (Slug: ${t.slug})`);
    });
}

checkTables()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
