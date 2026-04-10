const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // ─── Developer User ─────────────────────────────────
    const devPassword = await bcrypt.hash('admin123', 10);
    const developer = await prisma.user.upsert({
        where: { username: 'developer' },
        update: {},
        create: {
            username: 'developer',
            password: devPassword,
            name: 'System Developer',
            role: 'developer',
        },
    });
    console.log('✅ Developer user created');

    // Districts are created by the production seed script (seed-production.js)
    // which reads them from the Excel files.

        const tables = require('./table-definitions.js');

    for (const t of tables) {
        const existing = await prisma.dataEntryTable.findUnique({ where: { slug: t.slug } });
        if (!existing) {
            await prisma.dataEntryTable.create({
                data: {
                    name: t.name,
                    slug: t.slug,
                    description: t.description,
                    singleRow: t.singleRow,
                    sortOrder: t.sortOrder,
                    createdBy: developer.id,
                    columns: {
                        create: t.columns.map((col) => ({
                            name: col.name,
                            slug: col.slug,
                            dataType: col.dataType,
                            enumOptions: col.enumOptions || null,
                            isRequired: col.isRequired !== undefined ? col.isRequired : true,
                            sortOrder: col.sortOrder,
                        })),
                    },
                },
            });
            console.log(`  ✅ Table: ${t.name}`);
        } else {
            console.log(`  ⏭️  Table exists: ${t.name}`);
            // Update sortOrder on existing tables if needed using the migration script we already ran
        }
    }

    // ─── State Admin ───────────────────────────────────
    const stateAdminPassword = await bcrypt.hash('state123', 10);
    await prisma.user.upsert({
        where: { username: 'state_admin' },
        update: {},
        create: {
            username: 'state_admin',
            password: stateAdminPassword,
            name: 'State Administrator',
            role: 'state_admin',
        },
    });
    console.log('✅ State admin user created');

    // District admins, viewers, courts, and naib courts are created
    // by the production seed script (seed-production.js)

    console.log('\n🎉 Base seeding complete!');
    console.log('\n📋 Login credentials:');
    console.log('   Developer:      developer / admin123');
    console.log('   State Admin:    state_admin / state123');
}

main()
    .catch((e) => {
        console.error('❌ Seed error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
