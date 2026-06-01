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

console.log('=== BACKUP TOC ===');
for (let i = 19; i <= 112; i++) {
    if (i < parts.length) {
        const text = getPlainText(parts[i] + '</w:p>').trim();
        console.log(`${i}: "${text}"`);
    }
}