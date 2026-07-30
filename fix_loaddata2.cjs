const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');
const lines = code.split('\n');

const startIndex = lines.findIndex(l => l.includes('const [invPaginatied, slotData, historyData, shipData, globalStats, pendingRes, waitingRes, countsData, approvalsCount] = await Promise.all(['));
if (startIndex !== -1) {
  const endIndex = lines.findIndex((l, i) => i > startIndex && l.includes('setShipments(shipData);'));
  if (endIndex !== -1) {
    const repStr = `        const [invPaginatied, slotData, historyData, shipData, globalStats, pendingRes, waitingRes, countsData, approvalsCount, diagnostic] = await Promise.all([
          supabaseService.getInventoryPaginated(0, PAGE_SIZE, { 
            searchTerm: inventorySearch, 
            typeFilter: inventoryTypeFilter 
          }),
          supabaseService.getSlots(),
          supabaseService.getHistory(),
          supabaseService.getShipments(),
          supabaseService.getGlobalStats(),
          supabaseService.getPendingInventory(),
          supabaseService.getWaitingInventory(),
          supabaseService.getShipmentPalletCounts(),
          supabaseService.getPendingEditRequestsCount(),
          supabaseService.getWarehouseDiagnostic()
        ]);
        setData(invPaginatied.data);
        setHasMoreInventory(invPaginatied.data.length < invPaginatied.count);
        setInventoryPage(0);
        setStats(globalStats);
        setPendingRows(pendingRes);
        setWaitingRows(waitingRes);
        setShipmentCounts(countsData);
        setPendingApprovalsCount(approvalsCount);
        setWarehouseDiagnostic(diagnostic);        
        setHistory(historyData);
        setShipments(shipData);`;
    lines.splice(startIndex, endIndex - startIndex + 1, repStr);
    fs.writeFileSync('App.tsx', lines.join('\n'));
    console.log('Fixed loadData exactly!');
  } else {
    console.log('End index not found');
  }
} else {
  console.log('Start index not found');
}
