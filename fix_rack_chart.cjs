const fs = require('fs');
let code = fs.readFileSync('components/RackDistributionChart.tsx', 'utf8');

code = code.replace(
  `return (['A', 'B', 'C', 'D', 'E', 'F'] as const).map(rack => {`,
  `return (['A', 'B', 'C', 'D'] as const).map(rack => {`
);

fs.writeFileSync('components/RackDistributionChart.tsx', code);
console.log('Fixed RackDistributionChart');
