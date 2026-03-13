const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

const dir = 'TESTING COURT EXCEL FILE';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.xlsx') && !f.startsWith('~$'));
const norm = (s) => s ? s.toString().toLowerCase().replace(/[^a-z0-9]/g, '') : '';

let totalRows = 0;
for (const file of files) {
    if (file.toLowerCase().includes('kaithal') && !file.toLowerCase().includes('new data updated')) continue;

    const wb = xlsx.readFile(path.join(dir, file));
    const rows = xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: null });
    const keys = Object.keys(rows[0] || {});
    const findKey = (kw) => keys.find(k => kw.some(w => norm(k).includes(norm(w))));
    const cisK = findKey(['cis number', 'court number']);
    const desigK = findKey(['designation', 'desig']);
    const distK = findKey(['district']);

    // Count valid rows (those that won't be dropped)
    const valid = rows.filter(r => {
        const d = r[distK] ? r[distK].toString().trim() : null;
        const dg = r[desigK] ? r[desigK].toString().trim() : null;
        return d && dg;
    });

    // Check CIS duplicates
    const cisCounts = {};
    valid.forEach(r => {
        const cis = r[cisK] ? r[cisK].toString().trim() : `GEN-${valid.indexOf(r)}`;
        if (!cisCounts[cis]) cisCounts[cis] = 0;
        cisCounts[cis]++;
    });
    const dupes = Object.entries(cisCounts).filter(([k, v]) => v > 1);

    console.log(`${file}: ${valid.length} valid rows, ${dupes.length} duplicate CIS numbers`);
    if (dupes.length > 0) {
        dupes.forEach(([cis, count]) => console.log(`    CIS "${cis}" appears ${count} times`));
    }
    totalRows += valid.length;
}
console.log(`\nTotal expected courts: ${totalRows}`);
