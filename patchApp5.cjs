const fs = require('fs');
const file = 'App.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/navigateToTab\('analysis'\);/g, "navigateToTab('operations', 'analysis');");
content = content.replace(/navigateToTab\('inventory'\);/g, "navigateToTab('stock', 'general');");

fs.writeFileSync(file, content);
