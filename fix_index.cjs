const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

code = code.replace(
  '<title>Stoque+ | Ybera Paris</title>',
  '<title>Stoque+ | Ybera Paris</title>\n    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />'
);

fs.writeFileSync('index.html', code);
console.log('Added favicon link');
