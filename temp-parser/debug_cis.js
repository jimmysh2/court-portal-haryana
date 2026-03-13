const xlsx = require('xlsx');
const wb = xlsx.readFile('TESTING COURT EXCEL FILE/court portal data AMBALA.xlsx');
const rows = xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: null });
const keys = Object.keys(rows[0]);
const norm = (s) => s ? s.toString().toLowerCase().replace(/[^a-z0-9]/g, '') : '';
const findKey = (kw) => keys.find(k => kw.some(w => norm(k).includes(norm(w))));

const cisK = findKey(['cis number', 'court number']);
const desigK = findKey(['designation', 'desig']);
const nameK = findKey(['magistrate name', 'judge name', 'magistarte name']);

// Check CIS numbers 
const cisNums = rows.map((r, i) => ({
    row: i + 2,
    cis: r[cisK],
    desig: r[desigK]?.toString().trim(),
    name: r[nameK]?.toString().trim()
}));

console.log('CIS numbers:');
cisNums.forEach(c => console.log(`  Row ${c.row}: CIS="${c.cis}" name="${c.name}"`));

// Check for duplicate CIS (which would cause upsert to overwrite)
const cisCounts = {};
cisNums.forEach(c => {
    const key = c.cis?.toString();
    if (!cisCounts[key]) cisCounts[key] = [];
    cisCounts[key].push(c);
});

console.log('\nDuplicate CIS numbers:');
Object.entries(cisCounts).filter(([k, v]) => v.length > 1).forEach(([k, v]) => {
    console.log(`  CIS "${k}" appears ${v.length} times: rows ${v.map(x => x.row).join(', ')}`);
});

// Check courtNoStr generation - the seed uses CIS as courtNo
// But Rewari has CIS numbers 1,2,3... and Ambala also has 1,2,3...
// Since the unique key is (districtId, courtNo), this SHOULD be fine
// Let me check if the normalized courtNo values collide
console.log('\nNormalized courtNo values:');
cisNums.forEach(c => {
    const cisStr = c.cis ? c.cis.toString().trim().substring(0, 50) : null;
    const courtNoStr = cisStr ? cisStr.substring(0, 20) : `GEN-AMB-${c.row}`;
    console.log(`  Row ${c.row}: courtNo="${courtNoStr}"`);
});
