const fs = require('fs');
let file = fs.readFileSync('client/src/locales/translations.js', 'utf8');
const search = '"fir_year": "प्राथमिकी वर्ष",';
const replacement = '"fir_year": "प्राथमिकी वर्ष",\n        "fir_date": "प्राथमिकी की तिथि",';
file = file.replace(search, replacement);
fs.writeFileSync('client/src/locales/translations.js', file);
