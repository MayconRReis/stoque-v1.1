const fs = require('fs');
let code = fs.readFileSync('hooks/useWarehouseData.ts', 'utf8');

code = code.replace(
  `    finishedShipments24h: 0,\n    openShipmentsCount: 0,\n    productDistribution: {},\n    containerTotalSlots: 0,\n    containerOccupiedSlots: 0,\n    containerFreeSlots: 0,\n    containerOccupancyRate: 0`,
  `    finishedShipments24h: 0,\n    productDistribution: {},\n    uniqueSkuCount: 0`
);

fs.writeFileSync('hooks/useWarehouseData.ts', code);
console.log('Fixed hooks/useWarehouseData.ts');
