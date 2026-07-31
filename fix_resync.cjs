const fs = require('fs');
let code = fs.readFileSync('services/supabaseService.ts', 'utf8');

code = code.replace(
  `const inventory = await this.getInventory();`,
  `const inventory = await this.getAllInventoryForExport({ includeGrouped: true });`
);

fs.writeFileSync('services/supabaseService.ts', code);
console.log('Fixed resyncSlots');
