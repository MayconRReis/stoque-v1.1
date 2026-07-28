const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

// Update Analysis badge
code = code.replace(
  /<NavItem tab="analysis" icon={ClipboardCheck} label="Análise" badge=\{data\.filter\(r => r\.status === StockStatus\.PENDING\)\.length\} isActive=\{activeTab === 'analysis'\}/g,
  `<NavItem tab="analysis" icon={ClipboardCheck} label="Análise" badge={pendingRows.length} isActive={activeTab === 'analysis'}`
);

// Update Approvals badge
code = code.replace(
  /<NavItem tab="approvals" icon={ClipboardCheck} label="Aprovações" isActive=\{activeTab === 'approvals'\}/g,
  `<NavItem tab="approvals" icon={ClipboardCheck} label="Aprovações" badge={pendingApprovalsCount} isActive={activeTab === 'approvals'}`
);

fs.writeFileSync('App.tsx', code);
