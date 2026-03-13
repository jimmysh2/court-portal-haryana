const xlsx = require('xlsx');
const wb = xlsx.readFile('TESTING COURT EXCEL FILE/court portal data AMBALA.xlsx');
const rows = xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: null });

const keys = Object.keys(rows[0]);
const norm = (s) => s ? s.toString().toLowerCase().replace(/[^a-z0-9]/g, '') : '';
const findKey = (kw) => keys.find(k => kw.some(w => norm(k).includes(norm(w))));
const nameK = findKey(['magistrate name', 'judge name', 'magistarte name']);
const desigK = findKey(['designation', 'desig']);

// Simulate the cleaning logic from seed-production.js
const names = rows.map((r, i) => {
    let raw = r[nameK] ? r[nameK].toString().trim() : '';
    let desig = r[desigK] ? r[desigK].toString().trim() : '';

    // Clean designation
    let cleanDesig = desig.replace(/^\s*L\.?D\.?\s*/i, '').replace(/^\s*Ld\.?\s*/i, '').trim();
    if (cleanDesig.length > 0) cleanDesig = cleanDesig.charAt(0).toUpperCase() + cleanDesig.slice(1);

    // Gender detection
    let gender = null;
    const nameLower = raw.toLowerCase().trim();
    if (nameLower.startsWith('ms.') || nameLower.startsWith('ms ') || nameLower.startsWith('smt.') || nameLower.startsWith('smt ') || nameLower.startsWith('mrs.') || nameLower.startsWith('mrs ')) {
        gender = 'Female';
    } else if (nameLower.startsWith('sh.') || nameLower.startsWith('sh ') || nameLower.startsWith('shri') || nameLower.startsWith('mr.') || nameLower.startsWith('mr ') || nameLower.startsWith('dr.') || nameLower.startsWith('dr ')) {
        gender = 'Male';
    }

    // Clean name
    let cleanName = raw.replace(/^(Ms\.?|Mrs\.?|Smt\.?|Sh\.?|Shri\.?|Mr\.?|Dr\.?)\s*/i, '').trim();
    if (gender === 'Female') cleanName = 'Ms. ' + cleanName;
    else if (gender === 'Male') cleanName = 'Mr. ' + cleanName;

    return { row: i + 2, raw, cleanName, cleanDesig };
});

// Find duplicates
const seen = {};
names.forEach(n => {
    const key = n.cleanName;
    if (seen[key]) {
        console.log(`*** DUPLICATE: Row ${n.row} "${n.cleanName}" (desig: ${n.cleanDesig}) -- same as Row ${seen[key].row} (desig: ${seen[key].cleanDesig})`);
    } else {
        seen[key] = n;
    }
});

console.log(`\nTotal rows: ${names.length}, Unique names: ${Object.keys(seen).length}, Duplicates: ${names.length - Object.keys(seen).length}`);
