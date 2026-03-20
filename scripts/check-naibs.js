const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const activeNaibs = await prisma.user.findMany({
        where: { role: 'naib_court', deletedAt: null }
    });
    const deletedNaibs = await prisma.user.findMany({
        where: { role: 'naib_court', NOT: { deletedAt: null } }
    });
    
    console.log('--- Naib Court Status ---');
    console.log(`Active   : ${activeNaibs.length}`);
    console.log(`Deleted  : ${deletedNaibs.length}`);
    console.log('-------------------------');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
