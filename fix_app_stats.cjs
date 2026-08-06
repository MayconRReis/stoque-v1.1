const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

// Replace the Container Occupancy block
code = code.replace(
  /                  \{\/\* Container Occupancy \(E-F\) \*\/\}[\s\S]*?Em uso: \{stats\.containerOccupiedSlots\} \/ \{stats\.containerTotalSlots\} unidades[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/,
  `                  </div>`
);

fs.writeFileSync('App.tsx', code);
console.log('App.tsx updated');
