const fs = require('fs');
const pdf = require('pdf-parse');

(async () => {
    try {
        const filePath = 'report formats only.pdf';
        if (!fs.existsSync(filePath)) {
            console.error('File does not exist:', filePath);
            return;
        }
        const dataBuffer = fs.readFileSync(filePath);
        console.log('Buffer read, size:', dataBuffer.length);
        const data = await pdf(dataBuffer);
        fs.writeFileSync('new_reports.txt', data.text);
        console.log('PDF parsed successfully to new_reports.txt. Length:', data.text.length);
    } catch (err) {
        console.error('Error parsing PDF:', err.stack);
    }
})();
