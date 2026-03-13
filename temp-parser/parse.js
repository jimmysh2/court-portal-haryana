const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

const dir = 'C:\\Users\\harsh\\court portal antigravity\\TESTING COURT EXCEL FILE';
const files = fs.readdirSync(dir);

for (const file of files) {
    if (file.endsWith('.xlsx')) {
        console.log(`\n\n--- FILE: ${file} ---`);
        const filepath = path.join(dir, file);
        const workbook = xlsx.readFile(filepath);
        for (const sheetName of workbook.SheetNames) {
            console.log(`\nSheet: ${sheetName}`);
            let rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: null });
            console.log(`Rows: ${rows.length}`);
            if (rows.length > 0) {
                console.log(`Columns: ${Object.keys(rows[0]).join(', ')}`);
                console.log('Sample Data (First 3 rows):');
                console.log(JSON.stringify(rows.slice(0, 3), null, 2));
            }
        }
        // Only check the first file for brevity, they all have the same format
        break;
    }
}
