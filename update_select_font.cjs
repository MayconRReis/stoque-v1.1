const fs = require('fs');
const files = [
  'components/ManualPalletModal.tsx',
  'components/MovementModal.tsx',
  'components/RotativeStockManager.tsx',
  'components/EditPalletModal.tsx'
];

files.forEach(file => {
  let code = fs.readFileSync(file, 'utf-8');
  
  // Make select text sizes standard text-base
  code = code.replace(/text-sm focus:border-blue-500/g, 'text-base focus:border-blue-500');
  code = code.replace(/text-sm focus:border-amber-500/g, 'text-base focus:border-amber-500');
  code = code.replace(/text-sm focus:border-red-500/g, 'text-base focus:border-red-500');
  code = code.replace(/text-\[10px\] uppercase focus:border-purple-600/g, 'text-base uppercase focus:border-purple-600');
  code = code.replace(/text-sm uppercase focus:border-blue-600/g, 'text-base uppercase focus:border-blue-600');

  // Change all options to text-lg just to make sure they are big enough
  code = code.replace(/text-base/g, 'text-lg');

  fs.writeFileSync(file, code);
});
