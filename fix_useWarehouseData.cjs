const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');
const lines = code.split('\n');

// Import
const importIdx = lines.findIndex(l => l.includes("import { useShipments } from './hooks/useShipments';"));
if (importIdx !== -1) {
  lines.splice(importIdx + 1, 0, "import { useWarehouseData, generateSlots } from './hooks/useWarehouseData';");
}

// Remove generateSlots from App.tsx
const genStart = lines.findIndex(l => l.includes('const generateSlots = (): WarehouseSlot[] => {'));
if (genStart !== -1) {
  let genEnd = genStart;
  while(genEnd < lines.length && !lines[genEnd].includes('return slots;')) {
    genEnd++;
  }
  genEnd++; // include };
  lines.splice(genStart, genEnd - genStart + 1);
}

// Remove states
const statesToRemove = [
  "const [data, setData] = useState<SheetRow[]>([]);",
  "const [pendingRows, setPendingRows] = useState<SheetRow[]>([]);",
  "const [waitingRows, setWaitingRows] = useState<SheetRow[]>([]);",
  "const [pendingApprovalsCount, setPendingApprovalsCount] = useState<number>(0);",
  "const [warehouseDiagnostic, setWarehouseDiagnostic] = useState<WarehouseDiagnostic | null>(null);",
  "const [isDiagnosticDetailsOpen, setIsDiagnosticDetailsOpen] = useState(false);",
  "const [slots, setSlots] = useState<WarehouseSlot[]>(generateSlots());"
];

for (const stateStr of statesToRemove) {
  const idx = lines.findIndex(l => l.includes(stateStr));
  if (idx !== -1) lines.splice(idx, 1);
}

// setStats is multi-line
const statsStart = lines.findIndex(l => l.includes('const [stats, setStats] = useState<DashboardStats>({'));
if (statsStart !== -1) {
  let statsEnd = statsStart;
  while(statsEnd < lines.length && !lines[statsEnd].includes('});')) {
    statsEnd++;
  }
  lines.splice(statsStart, statsEnd - statsStart + 1);
}

// Find refreshCombinedData
const refStart = lines.findIndex(l => l.includes('const refreshCombinedData = useCallback(async () => {'));
if (refStart !== -1) {
  let refEnd = refStart;
  while(refEnd < lines.length && !lines[refEnd].includes('}, [inventoryPage, inventorySearch, inventoryTypeFilter]);')) {
    refEnd++;
  }
  lines.splice(refStart, refEnd - refStart + 1);
}

// Insert hook call right after useShipments
const hookCallIdx = lines.findIndex(l => l.includes('} = useShipments(history, showNotification);'));
if (hookCallIdx !== -1) {
  // But wait, useWarehouseData uses PAGE_SIZE from useInventoryFilters.
  // And useWarehouseData needs to be called after useInventoryFilters.
  // But we also need to pass `setShipmentCounts` to useWarehouseData which comes from useShipments.
  // We can just put it after useShipments.
  
  const hookCall = `  const {
    data, setData,
    pendingRows, setPendingRows,
    waitingRows, setWaitingRows,
    pendingApprovalsCount, setPendingApprovalsCount,
    stats, setStats,
    warehouseDiagnostic, setWarehouseDiagnostic,
    isDiagnosticDetailsOpen, setIsDiagnosticDetailsOpen,
    slots, setSlots,
    refreshCombinedData
  } = useWarehouseData(
    inventoryPage,
    PAGE_SIZE,
    inventorySearch,
    inventoryTypeFilter,
    setHasMoreInventory,
    setShipmentCounts,
    showNotification
  );`;
  lines.splice(hookCallIdx + 1, 0, hookCall);
}

fs.writeFileSync('App.tsx', lines.join('\n'));
console.log('useWarehouseData applied');
