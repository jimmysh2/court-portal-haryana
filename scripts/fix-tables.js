const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🔧 Fixing table structure to match PDF specifications...\n');

    // Step 1: Delete rogue tables (all have 0 entries, safe to remove)
    const rogueSlugs = [
        'sentencing',
        'judicial-misconduct',
        'deposition-prosecution',
        'deposition-official',
        'deposition-medical',
        'deposition-forensic',
        'deposition-police',
        'witnesses-no-appearance',
        'summons-warrants-served',
        'summons-warrants-unserved',
        'nbw-served',
        'nbw-unserved',
    ];

    for (const slug of rogueSlugs) {
        const table = await prisma.dataEntryTable.findUnique({ where: { slug } });
        if (table) {
            // Double-check no data entries exist
            const count = await prisma.dataEntry.count({ where: { tableId: table.id } });
            if (count > 0) {
                console.log(`  ⚠️ SKIPPING ${slug} — has ${count} entries!`);
                continue;
            }
            // Delete columns first
            await prisma.dataEntryColumn.deleteMany({ where: { tableId: table.id } });
            await prisma.dataEntryTable.delete({ where: { id: table.id } });
            console.log(`  🗑️  Deleted rogue table: ${slug}`);
        }
    }

    // Step 2: Get developer user ID for createdBy
    const developer = await prisma.user.findFirst({ where: { role: 'developer' } });
    if (!developer) {
        console.error('❌ No developer user found!');
        return;
    }

    // Step 3: Create the 12 missing tables from the PDF
    const missingTables = [
        {
            name: '6. Value of Property attached (85 BNSS & 107 BNSS)',
            slug: 'property-attached',
            description: 'Detail of Property attached (85 BNSS & 107 BNSS)',
            singleRow: false,
            sortOrder: 6,
            columns: [
                { name: 'Name of Accused', slug: 'accused_name', dataType: 'text', sortOrder: 0 },
                { name: 'FIR Number', slug: 'fir_no', dataType: 'text', sortOrder: 1 },
                { name: 'FIR Year', slug: 'fir_year', dataType: 'year', sortOrder: 2 },
                { name: 'Sections (U/s)', slug: 'sections', dataType: 'text', sortOrder: 3 },
                { name: 'Police Station', slug: 'police_station', dataType: 'text', sortOrder: 4 },
                { name: 'BNSS Section', slug: 'bnss_section', dataType: 'enum', enumOptions: ['85 BNSS', '107 BNSS'], sortOrder: 5 },
                { name: 'Property Details', slug: 'property_details', dataType: 'text', sortOrder: 6 },
                { name: 'Property Value', slug: 'property_value', dataType: 'number', sortOrder: 7 },
            ],
        },
        {
            name: '7. Applications/Complaints Against Police Officials',
            slug: 'complaints-against-police',
            description: 'Applications/Complaints/Istgasa filed against Police Officials',
            singleRow: false,
            sortOrder: 7,
            columns: [
                { name: 'Details of Applicant', slug: 'applicant_details', dataType: 'text', sortOrder: 0 },
                { name: 'Brief Facts', slug: 'brief_facts', dataType: 'text', sortOrder: 1 },
                { name: 'Next Hearing Date', slug: 'next_hearing_date', dataType: 'date', sortOrder: 2 },
            ],
        },
        {
            name: '8. FIR Registration under 156(3) CrPC',
            slug: 'fir-156-3',
            description: 'FIR Registration under 156(3) CrPC',
            singleRow: false,
            sortOrder: 8,
            columns: [
                { name: 'Details of Applicant', slug: 'applicant_details', dataType: 'text', sortOrder: 0 },
                { name: 'Sections in Complaint', slug: 'complaint_sections', dataType: 'text', sortOrder: 1 },
                { name: 'Police Station', slug: 'police_station', dataType: 'text', sortOrder: 2 },
                { name: 'Details of Police Officials', slug: 'police_official_details', dataType: 'text', sortOrder: 3 },
            ],
        },
        {
            name: '9. SHOs and DSPs Who Appeared in Court',
            slug: 'sho-dsp-appeared',
            description: 'List of SHOs and DSPs who appeared in court today',
            singleRow: false,
            sortOrder: 9,
            columns: [
                { name: 'Name of SHO/ DSP', slug: 'officer_name', dataType: 'text', sortOrder: 0 },
                { name: 'Rank', slug: 'rank', dataType: 'enum', enumOptions: ['SHO', 'DSP/ASP/Addl SP'], sortOrder: 1 },
                { name: 'Place of Posting', slug: 'posting_place', dataType: 'text', sortOrder: 2 },
                { name: 'Reason', slug: 'reason', dataType: 'text', sortOrder: 3 },
                { name: 'Remarks', slug: 'remarks', dataType: 'text', isRequired: false, sortOrder: 4 },
            ],
        },
        {
            name: '10. Deposition of Police Officials',
            slug: 'police-deposition',
            description: 'Deposition of police officials — aggregate counts per court per day',
            singleRow: true,
            sortOrder: 10,
            columns: [
                { name: 'Supposed to Appear', slug: 'supposed_to_appear', dataType: 'number', sortOrder: 0 },
                { name: 'Appeared Physically', slug: 'appeared_physically', dataType: 'number', sortOrder: 1 },
                { name: 'Examined Physically', slug: 'examined_physically', dataType: 'number', sortOrder: 2 },
                { name: 'Examined via VC', slug: 'examined_via_vc', dataType: 'number', sortOrder: 3 },
                { name: 'Absent (Unauthorized/No Request)', slug: 'absent_unauthorized', dataType: 'number', sortOrder: 4 },
            ],
        },
        {
            name: '11. VC of Prisoners',
            slug: 'vc-prisoners',
            description: 'VC of prisoners — aggregate counts per court per day',
            singleRow: true,
            sortOrder: 11,
            columns: [
                { name: 'Produced Physically', slug: 'produced_physically', dataType: 'number', sortOrder: 0 },
                { name: 'Produced via VC', slug: 'produced_via_vc', dataType: 'number', sortOrder: 1 },
            ],
        },
        {
            name: '12. TIPs Conducted Today',
            slug: 'tips-conducted',
            description: 'TIPs conducted today',
            singleRow: false,
            sortOrder: 12,
            columns: [
                { name: 'FIR Number', slug: 'fir_no', dataType: 'text', sortOrder: 0 },
                { name: 'FIR Year', slug: 'fir_year', dataType: 'year', sortOrder: 1 },
                { name: 'Sections (U/s)', slug: 'sections', dataType: 'text', sortOrder: 2 },
                { name: 'Police Station', slug: 'police_station', dataType: 'text', sortOrder: 3 },
            ],
        },
        {
            name: '13. Pairvi for Private Witness',
            slug: 'pairvi-witness',
            description: 'Pairvi for private witness — aggregate counts per court per day',
            singleRow: true,
            sortOrder: 13,
            columns: [
                { name: 'Witnesses Examined', slug: 'witnesses_examined', dataType: 'number', sortOrder: 0 },
                { name: 'Witnesses Prepared to Testify', slug: 'witnesses_prepared', dataType: 'number', sortOrder: 1 },
            ],
        },
        {
            name: '14. Gangster/Notorious Criminal Appearing Next Day',
            slug: 'gangster-next-day',
            description: 'Any Gangster/Notorious Criminal appearing in Court the next day',
            singleRow: false,
            sortOrder: 14,
            columns: [
                { name: 'Gangster & Gang Details', slug: 'gangster_details', dataType: 'text', sortOrder: 0 },
                { name: 'FIR Number', slug: 'fir_no', dataType: 'text', sortOrder: 1 },
                { name: 'FIR Year', slug: 'fir_year', dataType: 'year', sortOrder: 2 },
                { name: 'Sections (U/s)', slug: 'sections', dataType: 'text', sortOrder: 3 },
                { name: 'Police Station', slug: 'police_station', dataType: 'text', sortOrder: 4 },
                { name: 'Accused Status', slug: 'accused_status', dataType: 'enum', enumOptions: ['Bail', 'Judicial Custody'], sortOrder: 5 },
                { name: 'Name of Jail', slug: 'jail_name', dataType: 'text', isRequired: false, sortOrder: 6 },
            ],
        },
        {
            name: '15. Crime Against Property Offender Appearing Next Day',
            slug: 'property-offender-next-day',
            description: 'Any Crime against Property offender appearing in court the next day',
            singleRow: false,
            sortOrder: 15,
            columns: [
                { name: 'Details of Accused', slug: 'accused_details', dataType: 'text', sortOrder: 0 },
                { name: 'FIR Number', slug: 'fir_no', dataType: 'text', sortOrder: 1 },
                { name: 'FIR Year', slug: 'fir_year', dataType: 'year', sortOrder: 2 },
                { name: 'Sections (U/s)', slug: 'sections', dataType: 'text', sortOrder: 3 },
                { name: 'Police Station', slug: 'police_station', dataType: 'text', sortOrder: 4 },
                { name: 'Accused Status', slug: 'accused_status', dataType: 'enum', enumOptions: ['Bail', 'Judicial Custody'], sortOrder: 5 },
                { name: 'Name of Jail', slug: 'jail_name', dataType: 'text', isRequired: false, sortOrder: 6 },
            ],
        },
        {
            name: '16. Fresh Bail Applications listed for tomorrow',
            slug: 'bail-applications-tomorrow',
            description: 'Bail Applications listed for tomorrow',
            singleRow: false,
            sortOrder: 16,
            columns: [
                { name: 'Name of Accused', slug: 'accused_name', dataType: 'text', sortOrder: 0 },
                { name: 'FIR Number', slug: 'fir_no', dataType: 'text', sortOrder: 1 },
                { name: 'FIR Year', slug: 'fir_year', dataType: 'year', sortOrder: 2 },
                { name: 'Sections (U/s)', slug: 'sections', dataType: 'text', sortOrder: 3 },
                { name: 'Police Station', slug: 'police_station', dataType: 'text', sortOrder: 4 },
                { name: 'Bail Type', slug: 'bail_type', dataType: 'enum', enumOptions: ['Regular Bail', 'Anticipatory Bail'], sortOrder: 5 },
            ],
        },
        {
            name: '17. NBW Arrest Warrants issued today',
            slug: 'nbw-arrest-warrants',
            description: 'NBW Arrest Warrants issued today',
            singleRow: false,
            sortOrder: 17,
            columns: [
                { name: 'Name of Accused', slug: 'accused_name', dataType: 'text', sortOrder: 0 },
                { name: 'FIR Number', slug: 'fir_no', dataType: 'text', sortOrder: 1 },
                { name: 'FIR Year', slug: 'fir_year', dataType: 'year', sortOrder: 2 },
                { name: 'Sections (U/s)', slug: 'sections', dataType: 'text', sortOrder: 3 },
                { name: 'Police Station', slug: 'police_station', dataType: 'text', sortOrder: 4 },
                { name: 'Next Date', slug: 'next_date', dataType: 'date', sortOrder: 5 },
            ],
        },
    ];

    // Step 4: Also fix sort orders for the 5 existing correct tables
    const sortFixes = {
        'trials-disposed': 1,
        'cancellation-decisions': 2,
        'police-applications': 3,
        'bail-granted': 4,
        'po-pp-bj': 5,
    };

    for (const [slug, order] of Object.entries(sortFixes)) {
        await prisma.dataEntryTable.updateMany({ where: { slug }, data: { sortOrder: order } });
        console.log(`  ✅ Fixed sortOrder for ${slug} => ${order}`);
    }

    // Step 5: Create missing tables
    for (const t of missingTables) {
        const existing = await prisma.dataEntryTable.findUnique({ where: { slug: t.slug } });
        if (existing) {
            console.log(`  ⏭️  Already exists: ${t.slug}`);
            continue;
        }

        await prisma.dataEntryTable.create({
            data: {
                name: t.name,
                slug: t.slug,
                description: t.description,
                singleRow: t.singleRow,
                sortOrder: t.sortOrder,
                createdBy: developer.id,
                columns: {
                    create: t.columns.map(col => ({
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
        console.log(`  ✅ Created: ${t.name}`);
    }

    console.log('\n🎉 Table structure restored to match PDF specifications!');
}

main()
    .catch(e => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
