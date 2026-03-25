const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Synchronizing database schema and master data...');

    // ─── 1. Developer User ─────────────────────────────────
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
    console.log('✅ Developer user verified');

    // ─── 2. 17 Predefined Data Entry Tables ───────────────
    const tables = [
        {
            name: '1. Trials Disposed/Completed Today',
            slug: 'trials-disposed',
            description: 'List of trials disposed/completed today',
            sortOrder: 1,
            columns: [
                { name: 'FIR Number', slug: 'fir_no', dataType: 'text', sortOrder: 1 },
                { name: 'FIR Year', slug: 'fir_year', dataType: 'year', sortOrder: 2 },
                { name: 'Sections (U/s)', slug: 'sections', dataType: 'text', sortOrder: 3 },
                { name: 'Police Station', slug: 'police_station', dataType: 'text', sortOrder: 4 },
                { name: 'Name of Accused', slug: 'accused_name', dataType: 'text', sortOrder: 5 },
            ],
        },
        {
            name: '2. Decision on Cancellation/Untraced Files',
            slug: 'cancellation-decisions',
            description: 'Decision on Cancellation/Untraced Files',
            sortOrder: 2,
            columns: [
                { name: 'FIR Number', slug: 'fir_no', dataType: 'text', sortOrder: 1 },
                { name: 'FIR Year', slug: 'fir_year', dataType: 'year', sortOrder: 2 },
                { name: 'Sections (U/s)', slug: 'sections', dataType: 'text', sortOrder: 3 },
                { name: 'Police Station', slug: 'police_station', dataType: 'text', sortOrder: 4 },
                { name: 'Decision', slug: 'decision', dataType: 'enum', enumOptions: ['Accept', 'Further investigation', 'Take cognizance', 'Take protest petition and proceed as complaint'], sortOrder: 5 },
            ],
        },
        {
            name: '3. Accused Granted Bail',
            slug: 'bail-granted',
            description: 'List of accused granted bail',
            sortOrder: 3,
            columns: [
                { name: 'Name of Accused', slug: 'accused_name', dataType: 'text', sortOrder: 1 },
                { name: 'FIR Number', slug: 'fir_no', dataType: 'text', sortOrder: 2 },
                { name: 'FIR Year', slug: 'fir_year', dataType: 'year', sortOrder: 3 },
                { name: 'Sections (U/s)', slug: 'sections', dataType: 'text', sortOrder: 4 },
                { name: 'Police Station', slug: 'police_station', dataType: 'text', sortOrder: 5 },
                { name: 'Bail Type', slug: 'bail_type', dataType: 'enum', enumOptions: ['Regular Bail', 'Interim Bail', 'Anticipatory Bail'], sortOrder: 6 },
                { name: 'Name of Surety', slug: 'surety_name', dataType: 'text', sortOrder: 7 },
                { name: 'Name of Identifier', slug: 'identifier_name', dataType: 'text', sortOrder: 8 },
                { name: 'Photo Taken', slug: 'photo_taken', dataType: 'enum', enumOptions: ['Yes', 'No'], sortOrder: 9 },
            ],
        },
        {
            name: '4. Declared POs/PPs/BJs',
            slug: 'po-pp-bj',
            description: 'List of declared POs/PPs/BJs',
            sortOrder: 4,
            columns: [
                { name: 'Name of Accused', slug: 'accused_name', dataType: 'text', sortOrder: 1 },
                { name: 'FIR Number', slug: 'fir_no', dataType: 'text', sortOrder: 2 },
                { name: 'FIR Year', slug: 'fir_year', dataType: 'year', sortOrder: 3 },
                { name: 'Sections (U/s)', slug: 'sections', dataType: 'text', sortOrder: 4 },
                { name: 'Police Station', slug: 'police_station', dataType: 'text', sortOrder: 5 },
                { name: 'Declaration Type', slug: 'declaration_type', dataType: 'enum', enumOptions: ['PO', 'PP', 'BJ'], sortOrder: 6 },
            ],
        },
        {
            name: '5. Conviction and Sentencing Today',
            slug: 'sentencing',
            description: 'Details of Conviction and Sentencing Today',
            sortOrder: 5,
            columns: [
                { name: 'Name of Accused', slug: 'accused_name', dataType: 'text', sortOrder: 1 },
                { name: 'FIR Number', slug: 'fir_no', dataType: 'text', sortOrder: 2 },
                { name: 'FIR Year', slug: 'fir_year', dataType: 'year', sortOrder: 3 },
                { name: 'Sections (U/s)', slug: 'sections', dataType: 'text', sortOrder: 4 },
                { name: 'Police Station', slug: 'police_station', dataType: 'text', sortOrder: 5 },
                { name: 'Sentence Details', slug: 'sentence_details', dataType: 'text', sortOrder: 6 },
            ],
        },
        {
            name: '6. Deposition of Prosecution Witnesses',
            slug: 'deposition-prosecution',
            description: 'Deposition of Prosecution Witnesses',
            sortOrder: 6,
            columns: [
                { name: 'Witness Name', slug: 'witness_name', dataType: 'text', sortOrder: 1 },
                { name: 'FIR Number', slug: 'fir_no', dataType: 'text', sortOrder: 2 },
                { name: 'FIR Year', slug: 'fir_year', dataType: 'year', sortOrder: 3 },
                { name: 'Sections (U/s)', slug: 'sections', dataType: 'text', sortOrder: 4 },
                { name: 'Police Station', slug: 'police_station', dataType: 'text', sortOrder: 5 },
                { name: 'Next Date', slug: 'next_date', dataType: 'date', sortOrder: 6 },
            ],
        },
        {
            name: '7. Deposition of Official Witnesses',
            slug: 'deposition-official',
            description: 'Deposition of Official Witnesses',
            sortOrder: 7,
            columns: [
                { name: 'Official Name & Rank', slug: 'official_details', dataType: 'text', sortOrder: 1 },
                { name: 'FIR Number', slug: 'fir_no', dataType: 'text', sortOrder: 2 },
                { name: 'FIR Year', slug: 'fir_year', dataType: 'year', sortOrder: 3 },
                { name: 'Sections (U/s)', slug: 'sections', dataType: 'text', sortOrder: 4 },
                { name: 'Police Station', slug: 'police_station', dataType: 'text', sortOrder: 5 },
                { name: 'Type of Official', slug: 'official_type', dataType: 'enum', enumOptions: ['Nodal Officer', 'FSL Expert', 'Other'], sortOrder: 6 },
            ],
        },
        {
            name: '8. Deposition of Medical Witnesses',
            slug: 'deposition-medical',
            description: 'Deposition of Medical Witnesses',
            sortOrder: 8,
            columns: [
                { name: 'Doctor Name', slug: 'doctor_name', dataType: 'text', sortOrder: 1 },
                { name: 'Hospital', slug: 'hospital', dataType: 'text', sortOrder: 2 },
                { name: 'FIR Number', slug: 'fir_no', dataType: 'text', sortOrder: 3 },
                { name: 'FIR Year', slug: 'fir_year', dataType: 'year', sortOrder: 4 },
                { name: 'Police Station', slug: 'police_station', dataType: 'text', sortOrder: 5 },
            ],
        },
        {
            name: '9. Deposition of Forensic/FSL Experts',
            slug: 'deposition-forensic',
            description: 'Deposition of Forensic/FSL Experts',
            sortOrder: 9,
            columns: [
                { name: 'Expert Name', slug: 'expert_name', dataType: 'text', sortOrder: 1 },
                { name: 'Lab/Institute', slug: 'lab_name', dataType: 'text', sortOrder: 2 },
                { name: 'FIR Number', slug: 'fir_no', dataType: 'text', sortOrder: 3 },
                { name: 'FIR Year', slug: 'fir_year', dataType: 'year', sortOrder: 4 },
            ],
        },
        {
            name: '10. Deposition of Police Officials (T10)',
            slug: 'deposition-police',
            description: 'Aggregate counts of police official deposition',
            singleRow: true,
            sortOrder: 10,
            columns: [
                { name: 'Total supposed to appear', slug: 'supposed_to_appear', dataType: 'number', sortOrder: 1 },
                { name: 'Appeared physically', slug: 'appeared_physically', dataType: 'number', sortOrder: 2 },
                { name: 'Examined Physically', slug: 'examined_physically', dataType: 'number', sortOrder: 3 },
                { name: 'Examined via VC', slug: 'examined_via_vc', dataType: 'number', sortOrder: 4 },
                { name: 'Request of Multi PWs on same day', slug: 'multi_pw_request', dataType: 'number', sortOrder: 5 },
                { name: 'Exemption application filed', slug: 'exemption_filed', dataType: 'number', sortOrder: 6 },
                { name: 'Allowed (Exemption)', slug: 'exemption_allowed', dataType: 'number', sortOrder: 7 },
                { name: 'Dismissed (Exemption)', slug: 'exemption_dismissed', dataType: 'number', sortOrder: 8 },
                { name: 'Died', slug: 'died', dataType: 'number', sortOrder: 9 },
                { name: 'Retired & No Response', slug: 'retired_no_response', dataType: 'number', sortOrder: 10 },
                { name: 'On Medical Leave', slug: 'medical_leave', dataType: 'number', sortOrder: 11 },
                { name: 'Transfer & No Response', slug: 'transfer_no_response', dataType: 'number', sortOrder: 12 },
                { name: 'Training', slug: 'training', dataType: 'number', sortOrder: 13 },
                { name: 'Absent (No Request/Unauthorized)', slug: 'absent_unauthorized', dataType: 'number', sortOrder: 14 },
            ],
        },
        {
            name: '11. Official/Prosecution Witnesses Not Appearing',
            slug: 'witnesses-no-appearance',
            description: 'Reasons for Prosecution / Official Witness not appearing',
            sortOrder: 11,
            columns: [
                { name: 'Witness Name', slug: 'witness_name', dataType: 'text', sortOrder: 1 },
                { name: 'Type', slug: 'witness_type', dataType: 'enum', enumOptions: ['Official', 'Prosecution'], sortOrder: 2 },
                { name: 'Reason for Non-Appearance', slug: 'reason', dataType: 'text', sortOrder: 3 },
                { name: 'Police Station', slug: 'police_station', dataType: 'text', sortOrder: 4 },
            ],
        },
        {
            name: '12. Summons/Warrants Served',
            slug: 'summons-warrants-served',
            description: 'Summons/Warrants served today',
            sortOrder: 12,
            columns: [
                { name: 'Type', slug: 'type', dataType: 'enum', enumOptions: ['Summons', 'Warrants'], sortOrder: 1 },
                { name: 'Recipient Name', slug: 'recipient_name', dataType: 'text', sortOrder: 2 },
                { name: 'Police Station', slug: 'police_station', dataType: 'text', sortOrder: 3 },
            ],
        },
        {
            name: '13. Summons/Warrants Unserved',
            slug: 'summons-warrants-unserved',
            description: 'Summons/Warrants returned unserved',
            sortOrder: 13,
            columns: [
                { name: 'Type', slug: 'type', dataType: 'enum', enumOptions: ['Summons', 'Warrants'], sortOrder: 1 },
                { name: 'Recipient Name', slug: 'recipient_name', dataType: 'text', sortOrder: 2 },
                { name: 'Reason for Unserved', slug: 'reason', dataType: 'text', sortOrder: 3 },
                { name: 'Police Station', slug: 'police_station', dataType: 'text', sortOrder: 4 },
            ],
        },
        {
            name: '14. NBW Served',
            slug: 'nbw-served',
            description: 'Non-Bailable Warrants served',
            sortOrder: 14,
            columns: [
                { name: 'Accused Name', slug: 'accused_name', dataType: 'text', sortOrder: 1 },
                { name: 'FIR Number', slug: 'fir_no', dataType: 'text', sortOrder: 2 },
                { name: 'Police Station', slug: 'police_station', dataType: 'text', sortOrder: 3 },
            ],
        },
        {
            name: '15. NBW Unserved',
            slug: 'nbw-unserved',
            description: 'Non-Bailable Warrants unserved',
            sortOrder: 15,
            columns: [
                { name: 'Accused Name', slug: 'accused_name', dataType: 'text', sortOrder: 1 },
                { name: 'Reason', slug: 'reason', dataType: 'text', sortOrder: 2 },
                { name: 'Police Station', slug: 'police_station', dataType: 'text', sortOrder: 3 },
            ],
        },
        {
            name: '16. Decision on Applications by Police',
            slug: 'police-applications',
            description: 'Decision on any application filed by police officials',
            sortOrder: 16,
            columns: [
                { name: 'Application Type', slug: 'application_type', dataType: 'enum', enumOptions: ['Case Property Disposal', 'Bail Cancellation', 'Other'], sortOrder: 1 },
                { name: 'Decision', slug: 'decision', dataType: 'enum', enumOptions: ['Allowed', 'Dismissed', 'Abated'], sortOrder: 2 },
                { name: 'Police Station', slug: 'police_station', dataType: 'text', sortOrder: 3 },
            ],
        },
        {
            name: '17. Remarks on Judicial Misconduct / Police Negligence',
            slug: 'judicial-misconduct',
            description: 'Remarks passed by Judicial Officers regarding police negligence',
            sortOrder: 17,
            columns: [
                { name: 'Police Official Name', slug: 'official_name', dataType: 'text', sortOrder: 1 },
                { name: 'District', slug: 'district', dataType: 'text', sortOrder: 2 },
                { name: 'Remarks Content', slug: 'remarks', dataType: 'text', sortOrder: 3 },
            ],
        },
    ];

    for (const t of tables) {
        // ── 1. UPSERT THE TABLE ───────────────────────────────────
        const table = await prisma.dataEntryTable.upsert({
            where: { slug: t.slug },
            update: {
                name: t.name,
                description: t.description,
                singleRow: t.singleRow || false,
                sortOrder: t.sortOrder,
            },
            create: {
                name: t.name,
                slug: t.slug,
                description: t.description,
                singleRow: t.singleRow || false,
                sortOrder: t.sortOrder,
                createdBy: developer.id,
            },
        });

        // ── 2. SYNC THE COLUMNS ────────────────────────────────────
        for (const col of t.columns) {
            await prisma.dataEntryColumn.upsert({
                where: {
                    tableId_slug: {
                        tableId: table.id,
                        slug: col.slug
                    }
                },
                update: {
                    name: col.name,
                    dataType: col.dataType,
                    enumOptions: col.enumOptions || null,
                    sortOrder: col.sortOrder,
                    isRequired: col.isRequired !== undefined ? col.isRequired : true,
                },
                create: {
                    tableId: table.id,
                    name: col.name,
                    slug: col.slug,
                    dataType: col.dataType,
                    enumOptions: col.enumOptions || null,
                    sortOrder: col.sortOrder,
                    isRequired: col.isRequired !== undefined ? col.isRequired : true,
                }
            });
        }
        console.log(`✅ Table Synced: ${table.name}`);
    }

    // State Admin
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

    console.log('\n🎉 System synchronization complete!');
}

main()
    .catch((e) => {
        console.error('❌ Sync error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
