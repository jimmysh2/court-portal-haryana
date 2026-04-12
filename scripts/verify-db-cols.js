const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Checking DB for Table 21 & 22 columns...\n");
    
    for (const slug of ['adverse-order-police', 'applications-dismissed']) {
        const table = await prisma.dataEntryTable.findUnique({
            where: { slug },
            include: { columns: { orderBy: { sortOrder: 'asc' } } }
        });
        
        if (table) {
            console.log(`Table: ${table.name}`);
            table.columns.forEach(col => {
                console.log(`  - [${col.sortOrder}] ${col.name} (${col.slug}) | Required: ${col.isRequired} | Type: ${col.dataType}`);
            });
            console.log("-------------------------------------------------");
        }
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
