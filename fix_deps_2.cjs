const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

code = code.replace(
  `  } = useWarehouseData(
    (() => { setDataRef.current = setData; return inventoryPage; })(),
    inventoryPage,`,
  `  } = useWarehouseData(
    (() => { setDataRef.current = setData; return inventoryPage; })(),`
);

fs.writeFileSync('App.tsx', code);
console.log('Fixed arguments');
