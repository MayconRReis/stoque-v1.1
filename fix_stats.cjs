const fs = require('fs');
let code = fs.readFileSync('hooks/useWarehouseData.ts', 'utf8');

code = code.replace(
  "  const [stats, setStats] = useState<DashboardStats>({\n    totalProducts: 0,\n    totalPallets: 0,\n    totalSpaces: 600,\n    occupation: 0,\n    byType: {}\n  });",
  "  const [stats, setStats] = useState<DashboardStats>({\n    freeSlots: 0,\n    pendingEntries: 0,\n    occupancyRate: 0,\n    dailyMovements: 0,\n    totalSlots: 600,\n    occupiedSlots: 0,\n    totalBottles: 0,\n    waitingPallets: 0,\n    finishedShipments24h: 0,\n    openShipmentsCount: 0,\n    productDistribution: {},\n    containerTotalSlots: 0,\n    containerOccupiedSlots: 0,\n    containerFreeSlots: 0,\n    containerOccupancyRate: 0\n  });"
);

fs.writeFileSync('hooks/useWarehouseData.ts', code);
console.log('Fixed stats init');
