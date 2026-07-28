const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

if (!code.includes('const [pendingApprovalsCount, setPendingApprovalsCount]')) {
  code = code.replace(
    /const \[waitingRows, setWaitingRows\] = useState<SheetRow\[\]>\(\[\]\);/,
    `const [waitingRows, setWaitingRows] = useState<SheetRow[]>([]);
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState<number>(0);`
  );
}

// In refreshCombinedData
if (code.includes('const [invResult, globalStats, pendingRes, waitingRes, countsData, diagnostic] = await Promise.all([')) {
  code = code.replace(
    /const \[invResult, globalStats, pendingRes, waitingRes, countsData, diagnostic\] = await Promise.all\(\[/,
    `const [invResult, globalStats, pendingRes, waitingRes, countsData, diagnostic, approvalsCount] = await Promise.all([`
  );
  
  code = code.replace(
    /supabaseService\.getWarehouseDiagnostic\(\)\n\s*\]\);/,
    `supabaseService.getWarehouseDiagnostic(),
        supabaseService.getPendingEditRequestsCount()
      ]);`
  );
  
  code = code.replace(
    /setWarehouseDiagnostic\(diagnostic\);/,
    `setWarehouseDiagnostic(diagnostic);
      setPendingApprovalsCount(approvalsCount);`
  );
}

// In loadData
if (code.includes('const [invPaginatied, slotData, historyData, shipData, globalStats, pendingRes, waitingRes, countsData] = await Promise.all([')) {
  code = code.replace(
    /const \[invPaginatied, slotData, historyData, shipData, globalStats, pendingRes, waitingRes, countsData\] = await Promise.all\(\[/,
    `const [invPaginatied, slotData, historyData, shipData, globalStats, pendingRes, waitingRes, countsData, approvalsCount] = await Promise.all([`
  );
  
  code = code.replace(
    /supabaseService\.getShipmentPalletCounts\(\)\n\s*\]\);/,
    `supabaseService.getShipmentPalletCounts(),
          supabaseService.getPendingEditRequestsCount()
        ]);`
  );
  
  code = code.replace(
    /setShipmentCounts\(countsData\);/,
    `setShipmentCounts(countsData);
        setPendingApprovalsCount(approvalsCount);`
  );
}

fs.writeFileSync('App.tsx', code);
