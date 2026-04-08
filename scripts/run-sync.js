/**
 * run-sync.js
 * Manually trigger auto-sync: updates table-definitions.js from database
 * Run with: node scripts/run-sync.js
 */
const { PrismaClient } = require('@prisma/client');
const { syncTableDefinitions } = require('./auto-sync');

const prisma = new PrismaClient();

syncTableDefinitions(prisma)
    .then(() => {
        console.log('✅ Sync complete! table-definitions.js updated from database.');
        return prisma.$disconnect();
    })
    .catch(e => {
        console.error('❌ Error:', e.message);
        return prisma.$disconnect();
    });
