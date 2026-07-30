const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');
const lines = code.split('\n');

// Import
const authImportIdx = lines.findIndex(l => l.includes("import { useAuth } from './hooks/useAuth';"));
if (authImportIdx !== -1) {
  lines.splice(authImportIdx + 1, 0, "import { useInventoryFilters, PAGE_SIZE } from './hooks/useInventoryFilters';");
}

// Remove PAGE_SIZE const
const pageIdx = lines.findIndex(l => l.includes("const PAGE_SIZE = 50;"));
if (pageIdx !== -1) {
  lines.splice(pageIdx, 1);
}

// Remove state declarations
const statesToRemove = [
  "const [inventorySearch, setInventorySearch] = useState('');",
  "const [inventoryTypeFilter, setInventoryTypeFilter] = useState<SlotContent | 'ALL' | 'CONTAINER' | 'SEM_SELO'>('ALL');",
  "const [isInventoryFilterOpen, setIsInventoryFilterOpen] = useState(false);",
  "const [inventoryPage, setInventoryPage] = useState(0);",
  "const [hasMoreInventory, setHasMoreInventory] = useState(true);",
  "const [isLoadingMore, setIsLoadingMore] = useState(false);"
];

for (const stateStr of statesToRemove) {
  const idx = lines.findIndex(l => l.trim() === stateStr);
  if (idx !== -1) lines.splice(idx, 1);
}

// Find loadMoreInventory
const loadStart = lines.findIndex(l => l.includes('const loadMoreInventory = async () => {'));
if (loadStart !== -1) {
  let loadEnd = loadStart;
  while(loadEnd < lines.length && !lines[loadEnd].includes('};')) {
    loadEnd++;
  }
  lines.splice(loadStart, loadEnd - loadStart + 1);
}

// Find debounced search useEffect
const searchStart = lines.findIndex(l => l.includes('// Debounced search for server-side filtering'));
if (searchStart !== -1) {
  let searchEnd = searchStart + 1; // It's useEffect(() => {
  // Let's count braces or just find the end
  // We know it ends with }, [inventorySearch, inventoryTypeFilter, user, isPublicView]);
  while (searchEnd < lines.length && !lines[searchEnd].includes('}, [inventorySearch, inventoryTypeFilter, user, isPublicView]);')) {
    searchEnd++;
  }
  if (searchEnd < lines.length) {
    lines.splice(searchStart, searchEnd - searchStart + 1);
  }
}

// Insert hook call
const authHookIdx = lines.findIndex(l => l.includes('const { user, setUser, isAuthLoading, isPublicView, setIsPublicView } = useAuth(showNotification);'));
if (authHookIdx !== -1) {
  const hookCall = `  const {
    inventorySearch, setInventorySearch,
    inventoryTypeFilter, setInventoryTypeFilter,
    isInventoryFilterOpen, setIsInventoryFilterOpen,
    inventoryPage, setInventoryPage,
    hasMoreInventory, setHasMoreInventory,
    isLoadingMore, setIsLoadingMore,
    loadMoreInventory
  } = useInventoryFilters(user, isPublicView, showNotification, setData);`;
  lines.splice(authHookIdx + 1, 0, hookCall);
}

fs.writeFileSync('App.tsx', lines.join('\n'));
console.log('useInventoryFilters applied');
