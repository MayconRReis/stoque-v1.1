const fs = require('fs');
const lines = fs.readFileSync('App.tsx', 'utf8').split('\n');
console.log(lines.slice(670, 700).join('\n'));
