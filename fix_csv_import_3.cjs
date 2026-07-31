const fs = require('fs');
let code = fs.readFileSync('components/ImportPage.tsx', 'utf8');

code = code.replace(
  `Papa.parse(file, {\n      header: true,`,
  `Papa.parse(file, {\n      header: true,\n      encoding: "ISO-8859-1",`
);

fs.writeFileSync('components/ImportPage.tsx', code);
console.log('Fixed CSV encoding');
