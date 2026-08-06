const fs = require('fs');
let code = fs.readFileSync('hooks/useWarehouseData.ts', 'utf8');
code = code.replace(/totalSlots: 600/, 'totalSlots: 198');
fs.writeFileSync('hooks/useWarehouseData.ts', code);

let code2 = fs.readFileSync('services/supabaseService.ts', 'utf8');
code2 = code2.replace(/totalSlots: 264/, 'totalSlots: 198');
fs.writeFileSync('services/supabaseService.ts', code2);
