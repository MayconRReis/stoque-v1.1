const fs = require('fs');
let code = fs.readFileSync('types.ts', 'utf8');

code = code.replace(
  `  openShipmentsCount: number;\n  productDistribution: Record<string, number>;\n  // Container specific stats\n  containerTotalSlots: number;\n  containerOccupiedSlots: number;\n  containerFreeSlots: number;\n  containerOccupancyRate: number;`,
  `  productDistribution: Record<string, number>;\n  uniqueSkuCount: number;`
);

fs.writeFileSync('types.ts', code);
console.log('Fixed types.ts');
