const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

const targetStr = `      try {
        const [invPaginatied, slotData, historyData, shipData, globalStats, pendingRes, waitingRes, countsData, approvalsCount] = await Promise.all([
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
          supabaseService.getShipmentPalletCounts(), supabaseService.getPendingEditRequestsCount()
        ]);
        setData(invPaginatied.data);
        setHasMoreInventory(invPaginatied.data.length < invPaginatied.count);
        setInventoryPage(0);
        setStats(globalStats);
        setPendingRows(pendingRes);
        setWaitingRows(waitingRes);
        setShipmentCounts(countsData);        
        setHistory(historyData);
        setShipments(shipData);`;

const repStr = `      try {
        const [invPaginatied, slotData, historyData, shipData, globalStats, pendingRes, waitingRes, countsData, approvalsCount, diagnostic] = await Promise.all([
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

if (code.includes(targetStr)) {
  code = code.replace(targetStr, repStr);
  fs.writeFileSync('App.tsx', code);
  console.log('Fixed loadData!');
} else {
  console.log('Not found');
}
