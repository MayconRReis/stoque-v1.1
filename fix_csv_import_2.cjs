const fs = require('fs');
let code = fs.readFileSync('components/ImportPage.tsx', 'utf8');

code = code.replace(/\.replace\(\/\/g, ''\)/g, ".replace(/\\ufffd/g, '')");

fs.writeFileSync('components/ImportPage.tsx', code);
console.log('Fixed CSV import sanitization 2');
