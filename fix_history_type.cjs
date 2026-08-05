const fs = require('fs');
let code = fs.readFileSync('services/supabaseService.ts', 'utf8');

code = code.replace(
  /operator_name: entry\.operatorName\s*\}\);/g,
  "operator_name: entry.operatorName,\n          pallet_type: entry.palletType\n        });"
);

code = code.replace(
  /operatorName: entry\.operator_name\s*\}\)\);/g,
  "operatorName: entry.operator_name,\n      palletType: entry.pallet_type\n    }));"
);

code = code.replace(
  /\*   operator_name TEXT/g,
  "*   operator_name TEXT,\n *   pallet_type TEXT"
);

fs.writeFileSync('services/supabaseService.ts', code);
console.log('Fixed history type');
