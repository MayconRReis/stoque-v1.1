const fs = require('fs');
let code = fs.readFileSync('services/supabaseService.ts', 'utf8');

code = code.replace(/query\.in\('id', idsArray\.slice\(0, 100\)\);/g, "query.in('id', idsArray.slice(0, 30));");
code = code.replace(/limit\(10000\)/g, "limit(1500)");

fs.writeFileSync('services/supabaseService.ts', code);
console.log('Fixed search URL limits');
