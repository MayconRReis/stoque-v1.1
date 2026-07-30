const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');
const lines = code.split('\n');

// Import
const invImportIdx = lines.findIndex(l => l.includes("import { useInventoryFilters, PAGE_SIZE } from './hooks/useInventoryFilters';"));
if (invImportIdx !== -1) {
  lines.splice(invImportIdx + 1, 0, "import { usePalletSelection } from './hooks/usePalletSelection';");
}

// State removals
const statesToRemove = [
  '  const [selectedPallets, setSelectedPallets] = useState<string[]>([]); // Format: "rowId::palletIdx"',
  '  const [isConsolidateDrawerOpen, setIsConsolidateDrawerOpen] = useState(false);',
  '  const [isBulkConfirmOpen, setIsBulkConfirmOpen] = useState(false);',
  '  const [selectedPalletsData, setSelectedPalletsData] = useState<{ row: SheetRow, inspection: InspectionData, idx: number, selectionKey: string }[]>([]);'
];

for (const stateStr of statesToRemove) {
  const idx = lines.findIndex(l => l === stateStr);
  if (idx !== -1) lines.splice(idx, 1);
}

// Find useEffect
const ueStart = lines.findIndex(l => l.includes('if ((isBulkConfirmOpen || isConsolidateDrawerOpen) && selectedPallets.length > 0) {'));
if (ueStart !== -1) {
  // It's inside a useEffect. Find the surrounding useEffect:
  let ueActualStart = ueStart - 1;
  while(ueActualStart > 0 && !lines[ueActualStart].includes('useEffect(() => {')) {
    ueActualStart--;
  }
  
  let ueEnd = ueStart;
  while(ueEnd < lines.length && !lines[ueEnd].includes('}, [isBulkConfirmOpen, isConsolidateDrawerOpen, selectedPallets]);')) {
    ueEnd++;
  }
  
  lines.splice(ueActualStart, ueEnd - ueActualStart + 1);
}

// Hook call insertion
const invHookIdx = lines.findIndex(l => l.includes('} = useInventoryFilters(user, isPublicView, showNotification, setData);'));
if (invHookIdx !== -1) {
  const hookCall = `  const {
    selectedPallets, setSelectedPallets,
    isConsolidateDrawerOpen, setIsConsolidateDrawerOpen,
    isBulkConfirmOpen, setIsBulkConfirmOpen,
    selectedPalletsData, setSelectedPalletsData
  } = usePalletSelection(showNotification);`;
  lines.splice(invHookIdx + 1, 0, hookCall);
}

fs.writeFileSync('App.tsx', lines.join('\n'));
console.log('usePalletSelection applied');
