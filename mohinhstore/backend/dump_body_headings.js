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

console.log('=== BODY HEADINGS ===');
parts.forEach((part, idx) => {
    if (idx >= 110 && idx < 538) {
        const text = getPlainText(part + '</w:p>').trim();
        // Match headings like 1.1, 1.1.1, CHƯƠNG, LỜI NÓI ĐẦU
        if (/^[1234]\.\d+(\.\d+)*\b/.test(text) || text.startsWith('CHƯƠNG') || text.startsWith('LỜI NÓI ĐẦU')) {
            console.log(`${idx}: "${text}"`);
        }
    }
});