const fs = require('fs');
const AdmZip = require('adm-zip');

const backupPath = './Báo cáo bài tập lớn.docx.bak';
const zip = new AdmZip(backupPath);
const documentXml = zip.getEntry('word/document.xml').getData().toString('utf8');
const parts = documentXml.split('</w:p>');

function getPlainText(pXml) {
    const tRegex = /<w:t\b[^>]*>([^<]*)<\/w:t>/g;
    let match;
    let text = '';
    while ((match = tRegex.exec(pXml)) !== null) {
        text += match[1];
    }
    return text;
}

console.log('=== ALL HEADINGS IN BODY ===');
let count = 0;
parts.forEach((part, idx) => {
    if (idx >= 113) {
        const text = getPlainText(part + '</w:p>').trim();
        // Match headings: LỜI NÓI ĐẦU, CHƯƠNG x, or x.y.z
        if (text.startsWith('LỜI NÓI ĐẦU') ||
            text.startsWith('CHƯƠNG') ||
            /^[1234]\.\d+(\.\d+)*\b/.test(text)) {
            count++;
            console.log(`${idx}: "${text}"`);
        }
    }
});
console.log('Total headings found in body:', count);