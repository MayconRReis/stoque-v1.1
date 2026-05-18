const fs = require('fs');
const file = 'App.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "navigateToTab('analysis');\n        } else {\n          navigateToTab('inventory');",
  "navigateToTab('operations', 'analysis');\n        } else {\n          navigateToTab('stock', 'general');"
);

fs.writeFileSync(file, content);
