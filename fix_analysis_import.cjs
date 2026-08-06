const fs = require('fs');
let code = fs.readFileSync('components/AnalysisPage.tsx', 'utf8');

code = code.replace(
  `import { motion, AnimatePresence } from 'motion/react';`,
  `import { motion, AnimatePresence } from 'motion/react';\nimport { formatOP } from '../lib/formatters';`
);

fs.writeFileSync('components/AnalysisPage.tsx', code);
console.log('Added import to AnalysisPage.tsx');
