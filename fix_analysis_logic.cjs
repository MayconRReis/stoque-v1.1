const fs = require('fs');
let code = fs.readFileSync('components/AnalysisPage.tsx', 'utf8');

code = code.replace(
  `        {
          description: description.toUpperCase(),
          originOP: op.toUpperCase(),
          lot: lot.toUpperCase()
        },`,
  `        {
          description: description.toUpperCase(),
          originOP: formatOP(op),
          lot: lot.toUpperCase()
        },`
);

fs.writeFileSync('components/AnalysisPage.tsx', code);
console.log('Fixed AnalysisPage logic');
