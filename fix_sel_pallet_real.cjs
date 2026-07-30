const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');
const lines = code.split('\n');

const idx1 = lines.findIndex(l => l.includes("const [selectedPallets, setSelectedPallets] = useState<string[]>(["));
if (idx1 !== -1) lines.splice(idx1, 1);

const idx2 = lines.findIndex(l => l.includes("const [isBulkConfirmOpen, setIsBulkConfirmOpen] = useState(false);"));
if (idx2 !== -1) lines.splice(idx2, 1);

const idx3 = lines.findIndex(l => l.includes("const [selectedPalletsData, setSelectedPalletsData] = useState<{ row: SheetRow"));
if (idx3 !== -1) lines.splice(idx3, 1);

fs.writeFileSync('App.tsx', lines.join('\n'));
console.log('Cleaned');
