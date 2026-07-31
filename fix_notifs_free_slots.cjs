const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

code = code.replace(
  /const appNotifications = \[\s*\.\.\.\(user\?\.role === 'admin' && pendingApprovalsCount > 0 \? \[\{ id: 'approvals', label: 'Aprovações Pendentes', count: pendingApprovalsCount, tab: 'approvals', icon: ClipboardCheck \}\] : \[\]\),\s*\.\.\.\(pendingRows\.length > 0 \? \[\{ id: 'analysis', label: 'Análises Pendentes', count: pendingRows\.length, tab: 'analysis', icon: ClipboardCheck \}\] : \[\]\),\s*\.\.\.\(shipments\.filter\(s => s\.status === ShipmentStatus\.OPEN\)\.length > 0 \? \[\{ id: 'shipments', label: 'Carregamentos Abertos', count: shipments\.filter\(s => s\.status === ShipmentStatus\.OPEN\)\.length, tab: 'shipments', icon: Truck \}\] : \[\]\),\s*\.\.\.\(warehouseDiagnostic && warehouseDiagnostic\.slotConflicts > 0 \? \[\{ id: 'conflicts', label: 'Vagas em Conflito', count: warehouseDiagnostic\.slotConflicts, tab: 'map', icon: AlertCircle, action: \(\) => setIsDiagnosticDetailsOpen\(true\) \}\] : \[\]\)\s*\];/g,
  `const appNotifications = [
    ...(user?.role === 'admin' && pendingApprovalsCount > 0 ? [{ id: 'approvals', label: 'Aprovações Pendentes', count: pendingApprovalsCount, tab: 'approvals', icon: ClipboardCheck }] : []),
    ...(pendingRows.length > 0 ? [{ id: 'analysis', label: 'Análises Pendentes', count: pendingRows.length, tab: 'analysis', icon: ClipboardCheck }] : []),
    ...(shipments.filter(s => s.status === ShipmentStatus.OPEN).length > 0 ? [{ id: 'shipments', label: 'Carregamentos Abertos', count: shipments.filter(s => s.status === ShipmentStatus.OPEN).length, tab: 'shipments', icon: Truck }] : []),
    ...(warehouseDiagnostic && warehouseDiagnostic.slotConflicts > 0 ? [{ id: 'conflicts', label: 'Vagas em Conflito', count: warehouseDiagnostic.slotConflicts, tab: 'map', icon: AlertCircle, action: () => setIsDiagnosticDetailsOpen(true) }] : []),
    ...(warehouseDiagnostic && warehouseDiagnostic.freeSlotsWithPallets > 0 ? [{ id: 'free-slots', label: 'Vagas Não Marcadas', count: warehouseDiagnostic.freeSlotsWithPallets, tab: 'map', icon: AlertCircle, action: () => setIsDiagnosticDetailsOpen(true) }] : [])
  ];`
);

fs.writeFileSync('App.tsx', code);
console.log('Fixed notifications for free slots with pallets');
