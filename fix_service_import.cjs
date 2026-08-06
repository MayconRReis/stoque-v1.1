const fs = require('fs');
let code = fs.readFileSync('services/supabaseService.ts', 'utf8');

code = code.replace(
  `import { SheetRow, WarehouseSlot, HistoryEntry, StockStatus, SlotContent, HistoryType, Shipment, ShipmentType, ShipmentStatus, RotativeStockItem, DashboardStats, User, WarehouseDiagnostic, SHAREABLE_SLOT_TYPES } from '../types';`,
  `import { SheetRow, WarehouseSlot, HistoryEntry, StockStatus, SlotContent, HistoryType, Shipment, ShipmentType, ShipmentStatus, RotativeStockItem, DashboardStats, User, WarehouseDiagnostic, SHAREABLE_SLOT_TYPES } from '../types';\nimport { formatOP } from '../lib/formatters';`
);

fs.writeFileSync('services/supabaseService.ts', code);
console.log('Added import to supabaseService.ts');
