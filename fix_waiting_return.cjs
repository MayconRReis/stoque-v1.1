const fs = require('fs');
let code = fs.readFileSync('services/supabaseService.ts', 'utf8');
code = code.replace(
  `      totalBottles,\n      waitingPallets,\n      productDistribution,`,
  `      totalBottles,\n      waitingPallets: waitingPalletsGeneral,\n      productDistribution,`
);
fs.writeFileSync('services/supabaseService.ts', code);
