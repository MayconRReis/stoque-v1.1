const fs = require('fs');
const lines = fs.readFileSync('App.tsx', 'utf8').split('\n');

const topPart = lines.slice(0, 2557); // 0-indexed, so 0 to 2556 which are lines 1 to 2557.
const bottomPart = lines.slice(5041); // 5041 is line 5042.

const newContent = [...topPart, ...bottomPart].join('\n');
fs.writeFileSync('App.tsx', newContent);
console.log('Fixed duplication');
