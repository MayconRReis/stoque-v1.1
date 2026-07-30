const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

code = code.replace(/  const \[selectedPallets, setSelectedPallets\] = useState<string\[\]>\(\[\]\); \/\/ Format: "rowId::palletIdx"\n/, "");
code = code.replace(/  const \[isConsolidateDrawerOpen, setIsConsolidateDrawerOpen\] = useState\(false\);\n/, "");
code = code.replace(/  const \[isBulkConfirmOpen, setIsBulkConfirmOpen\] = useState\(false\);\n/, "");
code = code.replace(/  const \[selectedPalletsData, setSelectedPalletsData\] = useState<\{ row: SheetRow, inspection: InspectionData, idx: number, selectionKey: string \}\[\]>\(\[\]\);\n/, "");

// For the useEffect, let's just find its start and end
const lines = code.split('\n');
const ueStart = lines.findIndex(l => l.includes('if ((isBulkConfirmOpen || isConsolidateDrawerOpen) && selectedPallets.length > 0) {'));
if (ueStart !== -1) {
  let ueActualStart = ueStart - 1;
  while(ueActualStart > 0 && !lines[ueActualStart].includes('useEffect(() => {')) {
    ueActualStart--;
  }
  
  let ueEnd = ueStart;
  while(ueEnd < lines.length && !lines[ueEnd].includes('}, [isBulkConfirmOpen, isConsolidateDrawerOpen, selectedPallets]);')) {
    ueEnd++;
  }
  
  lines.splice(ueActualStart, ueEnd - ueActualStart + 1);
  code = lines.join('\n');
}

fs.writeFileSync('App.tsx', code);
console.log('App.tsx cleaned up');
