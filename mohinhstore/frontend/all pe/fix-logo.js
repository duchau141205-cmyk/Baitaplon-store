const fs = require('fs');
const path = __dirname;
const files = fs.readdirSync(path).filter(f => f.endsWith('.html') && f !== 'index.html');

const search = '<a href="index.html" class="logo">MÔ HÌNH STORE</a>';
const replace = `<a href="index.html" class="logo">\n                <img src="assets/images/logo.png" alt="Logo">\n                <span>MÔ HÌNH STORE</span>\n            </a>`;

files.forEach(f => {
  let content = fs.readFileSync(`${path}/${f}`, 'utf8');
  if (content.includes(search)) {
    content = content.replace(search, replace);
    fs.writeFileSync(`${path}/${f}`, content);
    console.log('Updated', f);
  } else {
    console.log('Skipped', f);
  }
});
