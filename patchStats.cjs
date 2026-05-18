const fs = require('fs');
const file = 'components/StatsSection.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace("onNavigate: (tab: any) => void;", "onNavigate: (tab: any, subtab?: any) => void;");
content = content.replace("onNavigate('history')", "onNavigate('history')");
content = content.replace("onNavigate('analysis')", "onNavigate('operations', 'analysis')");
content = content.replace("onNavigate('shipments')", "onNavigate('shipments')");
content = content.replace("onNavigate('shipments')", "onNavigate('shipments')");

fs.writeFileSync(file, content);
