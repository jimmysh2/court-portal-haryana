/**
 * add-tables-script.js  — Robust version
 * Adds tables 10, 11, 19, 20, 21 via API (same as Developer Dashboard)
 */

const http = require('http');
let TOKEN = '';

function request(method, path, body = null) {
    return new Promise((resolve, reject) => {
        const data = body ? JSON.stringify(body) : null;
        const options = {
            hostname: 'localhost',
            port: 3000,
            path,
            method,
            headers: {
                'Content-Type': 'application/json',
                ...(TOKEN ? { 'Authorization': `Bearer ${TOKEN}` } : {})
            }
        };
        const req = http.request(options, (res) => {
            let chunks = '';
            res.on('data', d => chunks += d);
            res.on('end', () => {
                try { resolve({ status: res.statusCode, body: JSON.parse(chunks) }); }
                catch (e) { resolve({ status: res.statusCode, body: chunks }); }
            });
        });
        req.on('error', reject);
        if (data) req.write(data);
        req.end();
    });
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function login() {
    console.log('🔐 Logging in as developer...');
    const res = await request('POST', '/api/v1/auth/login', { username: 'developer', password: 'admin123' });
    if (res.status !== 200) throw new Error('Login failed: ' + JSON.stringify(res.body));
    TOKEN = res.body.token;
    console.log('✅ Logged in\n');
}

async function getAllTables() {
    const res = await request('GET', '/api/v1/data-tables');
    return res.body.tables || [];
}

async function ensureTable(tableData, existingTables) {
    const found = existingTables.find(t => t.slug === tableData.slug);
    if (found) {
        console.log(`⏭️  Table "${tableData.name}" already exists (ID: ${found.id})`);
        return found;
    }
    console.log(`📋 Creating: ${tableData.name}`);
    const res = await request('POST', '/api/v1/data-tables', tableData);
    if (res.status !== 201) throw new Error(`Failed: ${JSON.stringify(res.body)}`);
    console.log(`✅ Created (ID: ${res.body.table.id})`);
    await sleep(1500); // wait for auto-sync + nodemon stability
    return res.body.table;
}

async function ensureColumn(tableId, colData, existingCols) {
    const found = existingCols && existingCols.find(c => c.slug === colData.slug);
    if (found) {
        process.stdout.write(`    ⏭️  Col "${colData.name}" exists\n`);
        return;
    }
    process.stdout.write(`    ➕ Adding: ${colData.name} ... `);
    const res = await request('POST', `/api/v1/data-tables/${tableId}/columns`, colData);
    if (res.status !== 201) {
        console.log(`FAIL: ${JSON.stringify(res.body)}`);
        return;
    }
    console.log('✅');
}

const TABLES = [
    {
        table: { name: '10. Deposition of other govt officials', slug: 'other-govt-deposition', description: 'Deposition of other government officials — aggregate counts per court per day', singleRow: true },
        columns: [
            { name: 'Supposed to Appear', slug: 'supposed_to_appear_govt', dataType: 'number', isRequired: true, sortOrder: 0 },
            { name: 'Appeared Physically', slug: 'appeared_physically_govt', dataType: 'number', isRequired: true, sortOrder: 1 },
            { name: 'Examined Physically', slug: 'examined_physically_govt', dataType: 'number', isRequired: true, sortOrder: 2 },
            { name: 'Examined via VC', slug: 'examined_via_vc_govt', dataType: 'number', isRequired: true, sortOrder: 3 },
            { name: 'Absent (Unauthorized/No Request)', slug: 'absent_unauthorized_govt', dataType: 'number', isRequired: true, sortOrder: 4 },
        ]
    },
    {
        table: { name: '11. Deposition of private individuals (public)', slug: 'private-deposition', description: 'Deposition of private individuals/public — aggregate counts per court per day', singleRow: true },
        columns: [
            { name: 'Supposed to Appear', slug: 'supposed_to_appear_pvt', dataType: 'number', isRequired: true, sortOrder: 0 },
            { name: 'Appeared Physically', slug: 'appeared_physically_pvt', dataType: 'number', isRequired: true, sortOrder: 1 },
            { name: 'Examined Physically', slug: 'examined_physically_pvt', dataType: 'number', isRequired: true, sortOrder: 2 },
            { name: 'Examined via VC', slug: 'examined_via_vc_pvt', dataType: 'number', isRequired: true, sortOrder: 3 },
            { name: 'Absent (Unauthorized/No Request)', slug: 'absent_unauthorized_pvt', dataType: 'number', isRequired: true, sortOrder: 4 },
        ]
    },
    {
        table: { name: '19. List of the accused who surrendered in court', slug: 'accused-surrendered', description: 'List of accused persons who surrendered in court today', singleRow: false },
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
        table: { name: '20. Details of adverse order passed against police officials', slug: 'adverse-orders-police', description: 'Details of adverse orders passed against police officials by the court', singleRow: false },
        columns: [
            { name: 'FIR Number', slug: 'fir_no_adv', dataType: 'text', isRequired: true, sortOrder: 0 },
            { name: 'FIR Year', slug: 'fir_year_adv', dataType: 'text', isRequired: true, sortOrder: 1 },
            { name: 'Sections (U/s)', slug: 'sections_adv', dataType: 'text', isRequired: true, sortOrder: 2 },
            { name: 'Police Station', slug: 'police_station_adv', dataType: 'text', isRequired: true, sortOrder: 3 },
            { name: 'Category', slug: 'adverse_category', dataType: 'enum', isRequired: true, sortOrder: 4, enumOptions: ['Assault/Kumar Violation', 'Ground of Arrest Violation (47 BNSS)', 'Fail to submit replies', 'Summons/Warrant report not submitted', 'Unable to execute BW/SBW', 'Detention for more than 24 Hrs', 'Misbehavior/Cost'] },
        ]
    },
    {
        table: { name: '21. Details of applications filed by police officials: DISMISSED by the court', slug: 'police-apps-dismissed', description: 'Details of applications filed by police officials that were dismissed by the court', singleRow: false },
        columns: [
            { name: 'FIR Number', slug: 'fir_no_dis', dataType: 'text', isRequired: true, sortOrder: 0 },
            { name: 'FIR Year', slug: 'fir_year_dis', dataType: 'text', isRequired: true, sortOrder: 1 },
            { name: 'Sections (U/s)', slug: 'sections_dis', dataType: 'text', isRequired: true, sortOrder: 2 },
            { name: 'Police Station', slug: 'police_station_dis', dataType: 'text', isRequired: true, sortOrder: 3 },
            { name: 'Category', slug: 'dismissed_category', dataType: 'enum', isRequired: true, sortOrder: 4, enumOptions: ['Bail Cancellation', 'Disposal of case property', 'Remand from judicial custody'] },
        ]
    }
];

async function main() {
    try {
        await login();

        // Fetch all current tables once
        let existingTables = await getAllTables();
        console.log(`Found ${existingTables.length} existing tables in DB.\n`);

        for (const entry of TABLES) {
            console.log(`\n─── ${entry.table.name} ───`);
            const table = await ensureTable(entry.table, existingTables);

            // Fetch fresh column list for this table
            const tableRes = await request('GET', `/api/v1/data-tables/${table.id}`);
            const existingCols = tableRes.body.table?.columns || [];

            for (const col of entry.columns) {
                await ensureColumn(table.id, col, existingCols);
                await sleep(300); // small delay between column adds
            }

            // Update existing tables list so next iteration doesn't re-create
            existingTables = await getAllTables();
        }

        console.log('\n\n🎉 ALL DONE! Tables and columns are set up.');
        console.log('✅ auto-sync was triggered — table-definitions.js updated.');

    } catch (err) {
        console.error('\n❌ Error:', err.message);
        process.exit(1);
    }
}

main();
