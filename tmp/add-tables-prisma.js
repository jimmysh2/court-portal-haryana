/**
 * add-tables-prisma.js
 * Directly adds 5 new tables to DB via Prisma, then runs auto-sync.
 * This is equivalent to what Developer Dashboard does.
 */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { syncTableDefinitions } = require('../scripts/auto-sync');

const prisma = new PrismaClient();

const TABLES = [
    {
        name: '10. Deposition of other govt officials',
        slug: 'other-govt-deposition',
        description: 'Deposition of other government officials — aggregate counts per court per day',
        singleRow: true,
        sortOrder: 18,
        columns: [
            { name: 'Supposed to Appear', slug: 'supposed_to_appear_govt', dataType: 'number', isRequired: true, sortOrder: 0 },
            { name: 'Appeared Physically', slug: 'appeared_physically_govt', dataType: 'number', isRequired: true, sortOrder: 1 },
            { name: 'Examined Physically', slug: 'examined_physically_govt', dataType: 'number', isRequired: true, sortOrder: 2 },
            { name: 'Examined via VC', slug: 'examined_via_vc_govt', dataType: 'number', isRequired: true, sortOrder: 3 },
            { name: 'Absent (Unauthorized/No Request)', slug: 'absent_unauthorized_govt', dataType: 'number', isRequired: true, sortOrder: 4 },
        ]
    },
    {
        name: '11. Deposition of private individuals (public)',
        slug: 'private-deposition',
        description: 'Deposition of private individuals/public — aggregate counts per court per day',
        singleRow: true,
        sortOrder: 19,
        columns: [
            { name: 'Supposed to Appear', slug: 'supposed_to_appear_pvt', dataType: 'number', isRequired: true, sortOrder: 0 },
            { name: 'Appeared Physically', slug: 'appeared_physically_pvt', dataType: 'number', isRequired: true, sortOrder: 1 },
            { name: 'Examined Physically', slug: 'examined_physically_pvt', dataType: 'number', isRequired: true, sortOrder: 2 },
            { name: 'Examined via VC', slug: 'examined_via_vc_pvt', dataType: 'number', isRequired: true, sortOrder: 3 },
            { name: 'Absent (Unauthorized/No Request)', slug: 'absent_unauthorized_pvt', dataType: 'number', isRequired: true, sortOrder: 4 },
        ]
    },
    {
        name: '19. List of the accused who surrendered in court',
        slug: 'accused-surrendered',
        description: 'List of accused persons who surrendered in court today',
        singleRow: false,
        sortOrder: 20,
        columns: [
            { name: 'Name of Accused', slug: 'accused_name_surr', dataType: 'text', isRequired: true, sortOrder: 0 },
            { name: 'FIR Number', slug: 'fir_no_surr', dataType: 'text', isRequired: true, sortOrder: 1 },
            { name: 'FIR Year', slug: 'fir_year_surr', dataType: 'text', isRequired: true, sortOrder: 2 },
            { name: 'Sections (U/s)', slug: 'sections_surr', dataType: 'text', isRequired: true, sortOrder: 3 },
            { name: 'Police Station', slug: 'police_station_surr', dataType: 'text', isRequired: true, sortOrder: 4 },
            { name: 'Status of Accused', slug: 'surrender_status', dataType: 'enum', isRequired: true, sortOrder: 5, enumOptions: ['Granted Regular Bail', 'Sent to Judicial Custody', 'Sent to Police Custody'] },
        ]
    },
    {
        name: '20. Details of adverse order passed against police officials',
        slug: 'adverse-orders-police',
        description: 'Details of adverse orders passed against police officials by the court',
        singleRow: false,
        sortOrder: 21,
        columns: [
            { name: 'FIR Number', slug: 'fir_no_adv', dataType: 'text', isRequired: true, sortOrder: 0 },
            { name: 'FIR Year', slug: 'fir_year_adv', dataType: 'text', isRequired: true, sortOrder: 1 },
            { name: 'Sections (U/s)', slug: 'sections_adv', dataType: 'text', isRequired: true, sortOrder: 2 },
            { name: 'Police Station', slug: 'police_station_adv', dataType: 'text', isRequired: true, sortOrder: 3 },
            { name: 'Category', slug: 'adverse_category', dataType: 'enum', isRequired: true, sortOrder: 4, enumOptions: ['Assault/Kumar Violation', 'Ground of Arrest Violation (47 BNSS)', 'Fail to submit replies', 'Summons/Warrant report not submitted', 'Unable to execute BW/SBW', 'Detention for more than 24 Hrs', 'Misbehavior/Cost'] },
        ]
    },
    {
        name: '21. Details of applications filed by police officials: DISMISSED by the court',
        slug: 'police-apps-dismissed',
        description: 'Details of applications filed by police officials that were dismissed by the court',
        singleRow: false,
        sortOrder: 22,
        columns: [
            { name: 'FIR Number', slug: 'fir_no_dis', dataType: 'text', isRequired: true, sortOrder: 0 },
            { name: 'FIR Year', slug: 'fir_year_dis', dataType: 'text', isRequired: true, sortOrder: 1 },
            { name: 'Sections (U/s)', slug: 'sections_dis', dataType: 'text', isRequired: true, sortOrder: 2 },
            { name: 'Police Station', slug: 'police_station_dis', dataType: 'text', isRequired: true, sortOrder: 3 },
            { name: 'Category', slug: 'dismissed_category', dataType: 'enum', isRequired: true, sortOrder: 4, enumOptions: ['Bail Cancellation', 'Disposal of case property', 'Remand from judicial custody'] },
        ]
    },
];

async function main() {
    // Find developer user for createdBy
    const dev = await prisma.user.findFirst({ where: { role: 'developer' } });
    const devId = dev?.id || 1;

    for (const t of TABLES) {
        console.log(`\n📋 Processing: ${t.name}`);

        // Upsert table
        const table = await prisma.dataEntryTable.upsert({
            where: { slug: t.slug },
            update: {
                name: t.name,
                description: t.description,
                singleRow: t.singleRow,
                sortOrder: t.sortOrder,
                deletedAt: null,
            },
            create: {
                name: t.name,
                slug: t.slug,
                description: t.description,
                singleRow: t.singleRow,
                sortOrder: t.sortOrder,
                createdBy: devId,
            },
        });
        console.log(`  ✅ Table upserted (ID: ${table.id})`);

        // Upsert columns
        for (const col of t.columns) {
            await prisma.dataEntryColumn.upsert({
                where: { tableId_slug: { tableId: table.id, slug: col.slug } },
                update: {
                    name: col.name,
                    dataType: col.dataType,
                    enumOptions: col.enumOptions || null,
                    isRequired: col.isRequired,
                    sortOrder: col.sortOrder,
                    deletedAt: null,
                },
                create: {
                    tableId: table.id,
                    name: col.name,
                    slug: col.slug,
                    dataType: col.dataType,
                    enumOptions: col.enumOptions || null,
                    isRequired: col.isRequired,
                    sortOrder: col.sortOrder,
                },
            });
            console.log(`    ➕ Column: ${col.name}`);
        }
    }

    console.log('\n🔄 Running auto-sync to update table-definitions.js...');
    await syncTableDefinitions(prisma);
    console.log('\n🎉 ALL DONE! 5 tables added and table-definitions.js updated!');
}

main()
    .catch(e => { console.error('❌', e.message); process.exit(1); })
    .finally(() => prisma.$disconnect());
