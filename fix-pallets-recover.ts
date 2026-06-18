import fs from 'fs';

let code = fs.readFileSync('App.tsx', 'utf-8');

code = code.replace(/pallets:\s*fullRow\s*\?\s*row\.pallets\s*:\s*1\s*,?/g, 'pallets: row.pallets,');

fs.writeFileSync('App.tsx', code);
console.log("Fixed pallets assignment in createRecoverableExitEntry");
