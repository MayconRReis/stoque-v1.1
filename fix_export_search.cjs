const fs = require('fs');
let code = fs.readFileSync('services/supabaseService.ts', 'utf8');

code = code.replace(
  "orClause += `,id.in.(${palletsInTargetSlots.join(',')})`;",
  "orClause += `,id.in.(${palletsInTargetSlots.slice(0, 30).join(',')})`;"
);

fs.writeFileSync('services/supabaseService.ts', code);
console.log('Fixed export search limits');
