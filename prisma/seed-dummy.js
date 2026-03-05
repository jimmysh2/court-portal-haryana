const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function addDummyData() {
    console.log('🌱 Adding extensive dummy data...');

    const dev = await prisma.user.findFirst({ where: { role: 'developer' } });
    if (!dev) {
        console.log('No developer found. Please run regular seed first.');
        return;
    }

    const districts = await prisma.district.findMany();
    if (districts.length === 0) {
        console.log('No districts found. Run regular seed first.');
        return;
    }

    const passwordHash = await bcrypt.hash('password123', 10);

    // 1. Create 20+ Courts and Magistrates
    console.log('1. Adding Courts and Magistrates...');
    for (let i = 1; i <= 25; i++) {
        const dist = districts[i % districts.length];

        // Add Magistrate
        const mag = await prisma.magistrate.create({
            data: {
                name: `Dummy Magistrate ${i}`,
                designation: i % 2 === 0 ? 'CJM' : 'ADJ',
                districtId: dist.id,
                phone: `98765432${i.toString().padStart(2, '0')}`,
            }
        });

        // Add Court
        await prisma.court.create({
            data: {
                name: `Court ${i} of ${dist.name}`,
                courtNo: `${dist.code}-DUMMY-${i.toString().padStart(2, '0')}`,
                districtId: dist.id,
                magistrateId: mag.id,
            }
        });
    }

    // 2. Create 20+ Naib Courts and generic Users
    console.log('2. Adding Users (Naib Courts, Admins)...');
    for (let i = 1; i <= 25; i++) {
        const dist = districts[i % districts.length];

        // Naib Court
        await prisma.user.upsert({
            where: { username: `naib_dummy_${i}` },
            update: {},
            create: {
                username: `naib_dummy_${i}`,
                passwordHash,
                name: `Naib Person ${i}`,
                role: 'naib_court',
                districtId: dist.id,
                phone: `99999999${i.toString().padStart(2, '0')}`,
            }
        });

        if (i <= 5) {
            // Also create some district admins for tests
            await prisma.user.upsert({
                where: { username: `admin_dummy_${i}` },
                update: {},
                create: {
                    username: `admin_dummy_${i}`,
                    passwordHash,
                    name: `Dist Admin ${i}`,
                    role: 'district_admin',
                    districtId: dist.id,
                }
            });
        }
    }

    // 3. Create 25+ Grievances
    console.log('3. Adding Grievances and Comments...');
    const naibs = await prisma.user.findMany({ where: { role: 'naib_court' } });
    for (let i = 1; i <= 25; i++) {
        const raiser = naibs[i % naibs.length];
        const statuses = ['open', 'in_progress', 'escalated', 'resolved'];
        const levels = ['district', 'state', 'developer'];

        const grievance = await prisma.grievance.create({
            data: {
                subject: `Dummy Issue ${i}: Need assistance with portal`,
                description: `This is a dummy grievance description ${i}. We are facing issues entering data for certain courts.`,
                status: statuses[i % statuses.length],
                currentLevel: levels[i % levels.length],
                districtId: raiser.districtId,
                raisedBy: raiser.id,
            }
        });

        // Add a comment
        await prisma.grievanceComment.create({
            data: {
                grievanceId: grievance.id,
                userId: raiser.id,
                body: `Just adding more details to ticket ${i}...`,
            }
        });
    }

    // 4. Create Data Entries
    console.log('4. Adding Data Entries...');
    const tables = await prisma.dataEntryTable.findMany({ include: { columns: true } });
    const courtsList = await prisma.court.findMany();
    const today = new Date();

    for (const table of tables) {
        if (!table.columns || table.columns.length === 0) continue;

        // Approx 20 entries per table
        for (let i = 1; i <= 20; i++) {
            const court = courtsList[Math.floor(Math.random() * courtsList.length)];
            const entryDate = new Date(today);
            entryDate.setDate(today.getDate() - (i % 5)); // Spread over last 5 days

            // Build dummy values respecting data types
            const values = {};
            table.columns.forEach(col => {
                if (col.dataType === 'text') values[col.slug] = `Sample Text ${col.name} ${i}`;
                else if (col.dataType === 'number') values[col.slug] = Math.floor(Math.random() * 100);
                else if (col.dataType === 'date') values[col.slug] = entryDate.toISOString().split('T')[0];
                else if (col.dataType === 'enum') {
                    const ops = col.enumOptions || [];
                    values[col.slug] = ops.length > 0 ? ops[i % ops.length] : '';
                }
                else if (col.dataType === 'boolean') values[col.slug] = i % 2 === 0;
            });

            try {
                await prisma.dataEntry.create({
                    data: {
                        tableId: table.id,
                        districtId: court.districtId,
                        courtId: court.id,
                        entryDate: entryDate,
                        values: values,
                        createdBy: dev.id,
                    }
                });
            } catch (err) {
                // Ignore errors
            }
        }
    }

    console.log('✅ Dummy data generation complete!');
    console.log('----------------------------------------------------');
    console.log('Dummy credentials added for your testing:');
    console.log('   Naib Court (x25): username -> naib_dummy_1 to naib_dummy_25 | password: password123');
    console.log('   District Admin (x5): username -> admin_dummy_1 to admin_dummy_5 | password: password123');
    console.log('----------------------------------------------------');
}

addDummyData()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
