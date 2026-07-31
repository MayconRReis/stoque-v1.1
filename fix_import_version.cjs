const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

code = code.replace(
  `import { useWarehouseData, generateSlots } from './hooks/useWarehouseData';`,
  `import { useWarehouseData, generateSlots } from './hooks/useWarehouseData';\nimport { useVersionCheck } from './hooks/useVersionCheck';`
);

fs.writeFileSync('App.tsx', code);
console.log('Import added');
