const fs = require('fs');
const tableDefs = require('../prisma/table-definitions');

let translations = fs.readFileSync('./client/src/locales/translations.js', 'utf8');

// Split translations into "en" and "hi" sections
const enStart = translations.indexOf('en: {');
const hiStart = translations.indexOf('hi: {');

let enSection = translations.substring(enStart, hiStart);
let hiSection = translations.substring(hiStart);

tableDefs.forEach(def => {
    const expectedEng = def.name;
    const numPrefix = expectedEng.split(' ')[0]; // E.g., "3."
    
    // Process en
    const enRegex = new RegExp(`("${def.slug}"\\s*:\\s*")[^"]*(")`);
    enSection = enSection.replace(enRegex, (match, p1, p2) => {
        return `${p1}${expectedEng}${p2}`;
    });

    // Process hi (just replace the number prefix or add it if missing)
    const hiRegex = new RegExp(`("${def.slug}"\\s*:\\s*")([^"]*)(")`);
    hiSection = hiSection.replace(hiRegex, (match, p1, existingHi, p2) => {
        // Remove existing numeric prefix "1. ", "3. " if any
        const noPrefixHi = existingHi.replace(/^\d+\.\s*/, '');
        return `${p1}${numPrefix} ${noPrefixHi}${p2}`;
    });
});

translations = translations.substring(0, enStart) + enSection + hiSection;

fs.writeFileSync('./client/src/locales/translations.js', translations);
console.log("Translation file fixed!");
