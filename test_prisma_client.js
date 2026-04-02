const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  console.log('Connecting with Prisma Client...');
  try {
    await prisma.$connect();
    console.log('✅ Connected successfully with Prisma Client');
    const districtCount = await prisma.district.count();
    console.log(`District count: ${districtCount}`);
    await prisma.$disconnect();
  } catch (err) {
    console.error('❌ Fail with Prisma Client:', err.message);
  }
}

test();
