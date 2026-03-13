const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

const dir = 'C:\\Users\\harsh\\court portal antigravity\\TESTING COURT EXCEL FILE';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.xlsx') && !f.startsWith('~$'));

for (const file of files) {
    const filepath = path.join(dir, file);
    try {
        const workbook = xlsx.readFile(filepath);
        const sheetName = workbook.SheetNames[0];
        const rawRows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: null });
        if (rawRows.length > 0) {
            console.log(`\nFile: ${file}`);
            console.log(`Headers: ${Object.keys(rawRows[0]).join(' | ')}`);
        }
    } catch (e) {
        console.log(`Error reading ${file}: ${e.message}`);
    }
}
