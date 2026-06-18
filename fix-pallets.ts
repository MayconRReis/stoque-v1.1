import fs from 'fs';

let code = fs.readFileSync('App.tsx', 'utf-8');

code = code.replace(/pallets:\s*remainingInspections\.length\s*,?/g, '');
code = code.replace(/pallets:\s*updatedInsps\?\.length\s*\|\|\s*0\s*,?/g, '');
code = code.replace(/pallets:\s*newInsps\?\.length\s*\|\|\s*0\s*,?/g, '');

fs.writeFileSync('App.tsx', code);
console.log("Fixed pallets assignment in App.tsx");
