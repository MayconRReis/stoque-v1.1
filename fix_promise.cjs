const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

const targetStr = `      const [invResult, globalStats, pendingRes, waitingRes, countsData, diagnostic, approvalsCount] = await Promise.all([
        supabaseService.getInventoryPaginated(0, (inventoryPage + 1) * PAGE_SIZE, { 
          searchTerm: inventorySearch, 
          typeFilter: inventoryTypeFilter 
        }),
        supabaseService.getGlobalStats(),
        supabaseService.getPendingInventory(),
        supabaseService.getWaitingInventory(),
        supabaseService.getShipmentPalletCounts(), supabaseService.getPendingEditRequestsCount(),
        supabaseService.getWarehouseDiagnostic(), supabaseService.getPendingEditRequestsCount()
      ]);`;

const repStr = `      const [invResult, globalStats, pendingRes, waitingRes, countsData, diagnostic, approvalsCount] = await Promise.all([
        supabaseService.getInventoryPaginated(0, (inventoryPage + 1) * PAGE_SIZE, { 
          searchTerm: inventorySearch, 
          typeFilter: inventoryTypeFilter 
        }),
        supabaseService.getGlobalStats(),
        supabaseService.getPendingInventory(),
        supabaseService.getWaitingInventory(),
        supabaseService.getShipmentPalletCounts(),
        supabaseService.getWarehouseDiagnostic(),
        supabaseService.getPendingEditRequestsCount()
      ]);`;

if (code.includes(targetStr)) {
  code = code.replace(targetStr, repStr);
  fs.writeFileSync('App.tsx', code);
  console.log('Fixed exactly!');
} else {
  // Maybe whitespace is different
  const lines = code.split('\n');
  const startIndex = lines.findIndex(l => l.includes('const [invResult, globalStats, pendingRes, waitingRes, countsData, diagnostic, approvalsCount] = await Promise.all(['));
  if (startIndex !== -1) {
    const endIndex = lines.findIndex((l, i) => i > startIndex && l.includes(']);'));
    if (endIndex !== -1) {
      lines.splice(startIndex, endIndex - startIndex + 1, repStr);
      fs.writeFileSync('App.tsx', lines.join('\n'));
      console.log('Fixed by line replacement');
    }
  } else {
    console.log('Not found');
  }
}
