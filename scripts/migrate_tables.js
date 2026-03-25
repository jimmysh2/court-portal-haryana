const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Running table migration...');

    // 1. Table Reordering
    const orders = {
        'trials-disposed': 1,
        'cancellation-decisions': 2,
        'bail-granted': 3,
        'po-pp-bj': 4,
        'gangster-next-day': 5,
        'property-offender-next-day': 6,
        'bail-applications-tomorrow': 7,
        'nbw-arrest-warrants': 8, // New table 17
        'property-attached': 9,
        'police-applications': 10,
        'complaints-against-police': 11,
        'fir-156-3': 12,
        'sho-dsp-appeared': 13,
        'tips-conducted': 14,
        'police-deposition': 15,
        'vc-prisoners': 16,
        'pairvi-witness': 17
    };

    for (const [slug, sortOrder] of Object.entries(orders)) {
        await prisma.dataEntryTable.updateMany({
            where: { slug },
            data: { sortOrder }
        });
    }
    console.log('✅ Tables reordered');

    // 2. Table 2 Enum Change
    await prisma.dataEntryColumn.updateMany({
        where: { table: { slug: 'cancellation-decisions' }, slug: 'decision' },
        data: { enumOptions: ['Accept', 'Further investigation', 'Take cognizance', 'Take protest petition and proceed as complaint'] }
    });
    console.log('✅ Table 2 Enum updated');

    // 3. Table 6 Name Change
    await prisma.dataEntryTable.updateMany({
        where: { slug: 'property-attached' },
        data: { name: '6. Value of Property attached (85 BNSS & 107 BNSS)' }
    });
    console.log('✅ Table 6 renamed');

    // 4. Table 9 Columns
    const t9 = await prisma.dataEntryTable.findUnique({ where: { slug: 'sho-dsp-appeared' } });
    if (t9) {
        await prisma.dataEntryColumn.updateMany({
            where: { tableId: t9.id, slug: 'officer_name' },
            data: { name: 'Name of SHO/ DSP' }
        });
        const rankEx = await prisma.dataEntryColumn.findFirst({ where: { tableId: t9.id, slug: 'rank' }});
        if (!rankEx) {
            await prisma.dataEntryColumn.create({
                data: {
                    tableId: t9.id, name: 'Rank', slug: 'rank', dataType: 'enum', 
                    enumOptions: ['SHO', 'DSP/ASP/Addl SP'], isRequired: true, sortOrder: 0
                }
            });
            // bump other sort orders internally if we wanted, but NaibDataEntry sorts frontend. It's fine.
        }
        console.log('✅ Table 9 updated');
    }

    // 5. Table 15 Columns
    const t15 = await prisma.dataEntryTable.findUnique({ where: { slug: 'property-offender-next-day' } });
    if (t15) {
        await prisma.dataEntryColumn.updateMany({
            where: { tableId: t15.id, slug: { in: ['escort_guard_name', 'escort_guard_mobile'] } },
            data: { deletedAt: new Date() }
        });
        const statusEx = await prisma.dataEntryColumn.findFirst({ where: { tableId: t15.id, slug: 'accused_status' }});
        if (!statusEx) {
            await prisma.dataEntryColumn.create({ data: { tableId: t15.id, name: 'Accused Status', slug: 'accused_status', dataType: 'enum', enumOptions: ['Bail', 'Judicial Custody'], isRequired: true, sortOrder: 5 }});
            await prisma.dataEntryColumn.create({ data: { tableId: t15.id, name: 'Name of Jail', slug: 'jail_name', dataType: 'text', isRequired: false, sortOrder: 6 }});
        }
        console.log('✅ Table 15 updated');
    }

    // 6. Table 16 Name Change
    await prisma.dataEntryTable.updateMany({
        where: { slug: 'bail-applications-tomorrow' },
        data: { name: '16. Fresh Bail Applications listed for tomorrow' }
    });
    console.log('✅ Table 16 renamed');

    // 7. Table 17 Add
    const dev = await prisma.user.findFirst({ where: { username: 'developer' } });
    const ex17 = await prisma.dataEntryTable.findUnique({ where: { slug: 'nbw-arrest-warrants' } });
    if (!ex17 && dev) {
        await prisma.dataEntryTable.create({
            data: {
                name: '17. NBW Arrest Warrants issued today',
                slug: 'nbw-arrest-warrants',
                description: 'NBW Arrest Warrants issued today',
                singleRow: false,
                sortOrder: 8,
                createdBy: dev.id,
                columns: {
                    create: [
                        { name: 'Name of Accused', slug: 'accused_name', dataType: 'text', sortOrder: 0 },
                        { name: 'FIR Number', slug: 'fir_no', dataType: 'text', sortOrder: 1 },
                        { name: 'FIR Year', slug: 'fir_year', dataType: 'year', sortOrder: 2 },
                        { name: 'Sections (U/s)', slug: 'sections', dataType: 'text', sortOrder: 3 },
                        { name: 'Police Station', slug: 'police_station', dataType: 'text', sortOrder: 4 },
                        { name: 'Next Date', slug: 'next_date', dataType: 'date', sortOrder: 5 },
                    ]
                }
            }
        });
        console.log('✅ Table 17 added');
    }

    console.log('🎉 Migration complete');
}

main().catch(console.error).finally(() => prisma.$disconnect());
