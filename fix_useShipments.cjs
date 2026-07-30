const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');
const lines = code.split('\n');

// Import
const hookImportIdx = lines.findIndex(l => l.includes("import { usePalletSelection } from './hooks/usePalletSelection';"));
if (hookImportIdx !== -1) {
  lines.splice(hookImportIdx + 1, 0, "import { useShipments } from './hooks/useShipments';");
}

const statesToRemove = [
  "const [shipments, setShipments] = useState<Shipment[]>([]);",
  "const [isShipmentModalOpen, setIsShipmentModalOpen] = useState(false);",
  "const [shipmentCounts, setShipmentCounts] = useState<Record<string, number>>({});",
  "const [shipmentDetailContext, setShipmentDetailContext] = useState<Shipment | null>(null);",
  "const [shipmentDetailPallets, setShipmentDetailPallets] = useState<SheetRow[]>([]);",
  "const [isDetailLoading, setIsDetailLoading] = useState(false);"
];

for (const stateStr of statesToRemove) {
  const idx = lines.findIndex(l => l.includes(stateStr));
  if (idx !== -1) lines.splice(idx, 1);
}

// Find fetchShipmentDetailPallets and handleOpenShipmentDetail
const fn1Start = lines.findIndex(l => l.includes("const fetchShipmentDetailPallets = async (shipmentId: string) => {"));
if (fn1Start !== -1) {
  let fn1End = fn1Start;
  while(fn1End < lines.length && !lines[fn1End].includes('};')) {
    fn1End++;
  }
  
  // handleOpenShipmentDetail starts immediately after usually, but let's look for it specifically
  const fn2Start = lines.findIndex((l, i) => i >= fn1End && l.includes("const handleOpenShipmentDetail = async (shipment: Shipment) => {"));
  if (fn2Start !== -1) {
    let fn2End = fn2Start;
    while(fn2End < lines.length && !lines[fn2End].includes('};')) {
      fn2End++;
    }
    lines.splice(fn2Start, fn2End - fn2Start + 1);
  }
  lines.splice(fn1Start, fn1End - fn1Start + 1);
}

// Insert hook call right after usePalletSelection
const hookCallIdx = lines.findIndex(l => l.includes("} = usePalletSelection(showNotification);"));
if (hookCallIdx !== -1) {
  const hookCall = `  const {
    shipments, setShipments,
    isShipmentModalOpen, setIsShipmentModalOpen,
    shipmentCounts, setShipmentCounts,
    shipmentDetailContext, setShipmentDetailContext,
    shipmentDetailPallets, setShipmentDetailPallets,
    isDetailLoading, setIsDetailLoading,
    fetchShipmentDetailPallets,
    handleOpenShipmentDetail
  } = useShipments(history, showNotification);`;
  lines.splice(hookCallIdx + 1, 0, hookCall);
}

fs.writeFileSync('App.tsx', lines.join('\n'));
console.log('useShipments applied');
