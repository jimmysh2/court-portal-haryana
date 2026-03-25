const fs = require('fs');
const PDFParser = require('pdf2json');

function parse(fin, fout) {
    return new Promise((resolve, reject) => {
        const pdfParser = new PDFParser(this, 1);
        pdfParser.on("pdfParser_dataError", errData => {
            console.error(`Error parsing ${fin}:`, errData.parserError);
            reject(errData.parserError);
        });
        pdfParser.on("pdfParser_dataReady", pdfData => {
            fs.writeFileSync(fout, pdfParser.getRawTextContent().replace(/\r\n/g, '\n'));
            console.log(`Successfully parsed ${fin}`);
            resolve();
        });
        pdfParser.loadPDF(fin);
    });
}

async function main() {
    try {
        await parse('court data tables and report formats.pdf', 'tables.txt');
        await parse('court reports.pdf', 'reports.txt');
        console.log('Finished extraction.');
    } catch (e) {
        console.error('Extraction failed', e);
    }
}

main();
