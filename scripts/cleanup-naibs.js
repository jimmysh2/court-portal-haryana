const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🧹 Starting Naib Court cleanup...');

    // 1. Mark all naibs as deleted
    console.log('   - Marking all naib accounts as deleted...');
    await prisma.user.updateMany({
        where: { role: 'naib_court', deletedAt: null },
        data: { deletedAt: new Date() }
    });

    console.log('✅ Local database prepared for fresh sync.');
    console.log('👉 Please run "node prisma/seed-production.js" now to re-load active naibs.');
}

main()
    .catch(e => console.error('❌ Cleanup failed:', e))
    .finally(() => prisma.$disconnect());
