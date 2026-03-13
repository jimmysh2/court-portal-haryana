const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

const dir = 'C:\\Users\\harsh\\court portal antigravity\\TESTING COURT EXCEL FILE';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.xlsx') && !f.startsWith('~$'));

let totalRows = 0;
const errors = [];
const warnings = [];

// Helper to normalize strings for robust matching
const normalize = (str) => {
    if (!str) return '';
    return str.toString().toLowerCase().replace(/[^a-z0-9]/g, '');
};

for (const file of files) {
    const filepath = path.join(dir, file);
    try {
        const workbook = xlsx.readFile(filepath);
        for (const sheetName of workbook.SheetNames) {
            let rawRows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: null });
            if (rawRows.length === 0) continue;

            // Determine columns flexibly based on the first row's keys
            const rawKeys = Object.keys(rawRows[0]);
            let keyMap = {};

            const findKey = (keywords) => {
                return rawKeys.find(k => {
                    const nk = normalize(k);
                    return keywords.some(keyword => nk.includes(normalize(keyword)));
                });
            };

            keyMap.district = findKey(['district']);
            keyMap.cisNumber = findKey(['cis number', 'court number', 'cis']);
            keyMap.judgeName = findKey(['magistrate name', 'judge name', 'magistarte name']);
            keyMap.judgeDesignation = findKey(['designation', 'desig']);
            keyMap.naibRank = findKey(['naib', 'rank']) && findKey(['rank', 'naib court rank']); // Need specifically rank
            keyMap.naibName = findKey(['naib court name', 'naib name']);
            keyMap.naibPhone = findKey(['phone', 'phone no', 'phone number', 'phoneno']);

            rawRows.forEach((rawRow, i) => {
                totalRows++;
                const rowNum = i + 2;
                const loc = `[${file} | Row ${rowNum}]`;

                const district = rawRow[keyMap.district];
                const cis = rawRow[keyMap.cisNumber];
                const judgeName = rawRow[keyMap.judgeName];
                const judgeDesig = rawRow[keyMap.judgeDesignation];
                const naibName = rawRow[keyMap.naibName];
                const naibRank = rawRow[keyMap.naibRank];
                const naibPhone = rawRow[keyMap.naibPhone];

                // 1. District
                if (!district) errors.push(`${loc} Missing district name.`);

                // 2. Judge Designation
                if (!judgeDesig) errors.push(`${loc} Missing judge/magistrate designation (Required for Court Name).`);

                // 3. Naib Info
                if (!naibName) warnings.push(`${loc} Missing Naib Court name (No user account will be generated for this court).`);
                if (naibName && !naibPhone) warnings.push(`${loc} Missing Naib Court phone number for ${naibName}.`);
                if (naibName && !naibRank) warnings.push(`${loc} Missing Naib Court rank for ${naibName}.`);

                // 4. CIS Number
                if (!cis) warnings.push(`${loc} Missing Court CIS/Court Number (A generic Court ID will be assigned instead).`);

                // 5. Judge Name
                if (!judgeName) warnings.push(`${loc} Missing Judge/Magistrate Name (Seat will be marked vacant).`);
            });
        }
    } catch (error) {
        errors.push(`Failed to process ${file}: ${error.message}`);
    }
}

console.log(`\n--- VALIDATION REPORT: ${files.length} EXCEL FILES, ${totalRows} ROWS ANALYZED ---`);
console.log(`\n🔴 CRITICAL ERRORS (${errors.length}):`);
if (errors.length === 0) {
    console.log("None! All essential columns are present.");
} else {
    errors.slice(0, 15).forEach(e => console.log(e));
    if (errors.length > 15) console.log(`... and ${errors.length - 15} more errors.\n`);
}

console.log(`\n🟡 NON-ESSENTIAL WARNINGS (${warnings.length}):`);
if (warnings.length === 0) {
    console.log("None! No missing non-essential data.");
} else {
    const CIS_Warnings = warnings.filter(w => w.includes("CIS") || w.includes("Generic"));
    const NaibMissing = warnings.filter(w => w.includes("Missing Naib Court name"));
    const PhoneRankMissing = warnings.filter(w => w.includes("phone") || w.includes("rank"));
    const JudgeMissing = warnings.filter(w => w.includes("vacant"));

    console.log(`- ${CIS_Warnings.length} courts are missing a CIS/Court Number.`);
    console.log(`- ${NaibMissing.length} courts have NO Naib Court assigned.`);
    console.log(`- ${PhoneRankMissing.length} Naib Courts are missing rank/phone info.`);
    console.log(`- ${JudgeMissing.length} courts have a blank Judge/Magistrate Name.`);
}
