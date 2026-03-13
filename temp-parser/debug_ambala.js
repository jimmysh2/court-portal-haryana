const xlsx = require('xlsx');
const wb = xlsx.readFile('TESTING COURT EXCEL FILE/court portal data AMBALA.xlsx');
const rows = xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: null });

console.log('Total rows:', rows.length);
const keys = Object.keys(rows[0]);
console.log('Headers:', keys.join(' | '));

const norm = (s) => s ? s.toString().toLowerCase().replace(/[^a-z0-9]/g, '') : '';
const findKey = (kw) => keys.find(k => kw.some(w => norm(k).includes(norm(w))));

const dk = findKey(['designation', 'desig']);
const distK = findKey(['district']);
const nameK = findKey(['magistrate name', 'judge name', 'magistarte name']);
const cisK = findKey(['cis number', 'court number']);

console.log('DesigKey:', dk);
console.log('DistKey:', distK);
console.log('NameKey:', nameK);
console.log('CISKey:', cisK);

rows.forEach((r, i) => {
    const d = r[distK];
    const dg = r[dk];
    const n = r[nameK];
    const cis = r[cisK];

    // Check: would production seed drop this?
    const normVal = (v, l) => v ? v.toString().trim().substring(0, l) : null;
    const distName = normVal(d, 100);
    const desig = normVal(dg, 100);
    const dropped = !distName || !desig;

    console.log(`Row ${i + 2}: dist="${distName}" cis="${cis}" name="${n}" desig="${desig}" ${dropped ? '*** DROPPED ***' : 'OK'}`);
});
