const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

const lines = code.split('\n');
const startIndex = lines.findIndex(l => l.includes("const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {"));

if (startIndex !== -1) {
  const endIndex = startIndex + 6;
  lines.splice(startIndex, endIndex - startIndex + 1);
  fs.writeFileSync('App.tsx', lines.join('\n'));
  console.log('Fixed');
}
