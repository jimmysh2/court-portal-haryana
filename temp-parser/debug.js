const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

const dir = 'C:\\Users\\harsh\\court portal antigravity\\TESTING COURT EXCEL FILE';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.xlsx') && !f.startsWith('~$'));

const normalize = (str) => str ? str.toString().toLowerCase().replace(/[^a-z0-9]/g, '') : '';

for (const file of files) {
    const filepath = path.join(dir, file);
    const workbook = xlsx.readFile(filepath);
    const sheetName = workbook.SheetNames[0];
    let rawRows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: null });

    const rawKeys = Object.keys(rawRows[0] || {});
    const findKey = (keywords) => rawKeys.find(k => {
        const nk = normalize(k);
        return keywords.some(keyword => nk.includes(normalize(keyword)));
    });

    const desigKey = findKey(['designation', 'desig']);

    let total = rawRows.length;
    let withDesig = rawRows.filter(r => r[desigKey]).length;
    let withoutDesig = total - withDesig;

    console.log(`${file}: Total=${total}, WithDesig=${withDesig}, MissingDesig=${withoutDesig}, DesigKey="${desigKey}"`);
}
