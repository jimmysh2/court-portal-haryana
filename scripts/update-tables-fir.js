const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../prisma/table-definitions.js');
const tables = require(filePath);

const targetSlugs = [
    'bail-granted',                 // 4
    'po-pp-bj',                     // 5
    'property-attached',            // 6
    'tips-conducted',               // 14
    'gangster-next-day',            // 16
    'property-offender-next-day',   // 17
    'bail-applications-tomorrow',   // 18
    'nbw-arrest-warrants',          // 19
    'accused-surrendered',          // 20
    'adverse-order-police',         // 21
    'applications-dismissed'        // 22
];

let changedAny = false;

for (let table of tables) {
    if (targetSlugs.includes(table.slug)) {
        // Find the fir_year column and modify it
        const firYearCol = table.columns.find(c => c.slug === 'fir_year');
        if (firYearCol) {
            console.log(`Modifying table: ${table.name}`);
            firYearCol.name = 'FIR Date';
            firYearCol.slug = 'fir_date';
            firYearCol.dataType = 'date';
            changedAny = true;
        } else {
            console.log(`WARNING: Table ${table.name} (${table.slug}) does NOT have a fir_year column!`);
        }
    }
}

if (changedAny) {
    const fileHeader = `// ─── AUTO-GENERATED: Single Source of Truth for Table Definitions ───────────
// This file is automatically updated whenever a table or column is modified
// via the Developer Dashboard. You may also edit it manually if needed.

module.exports = `;
    const newContent = fileHeader + JSON.stringify(tables, null, 4) + ';\n';
    fs.writeFileSync(filePath, newContent);
    console.log('Successfully updated table-definitions.js');
} else {
    console.log('No fir_year columns found in target tables.');
}
