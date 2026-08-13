const fs = require('fs');
const files = [
  'components/ManualPalletModal.tsx',
  'components/MovementModal.tsx',
  'components/RotativeStockManager.tsx',
  'components/EditPalletModal.tsx'
];

files.forEach(file => {
  let code = fs.readFileSync(file, 'utf-8');
  
  code = code.replace(
    /className="bg-blue-300 text-slate-900 font-bold uppercase tracking-widest"/g,
    'className="bg-blue-300 text-slate-900 font-bold uppercase tracking-widest text-base"'
  );
  
  code = code.replace(
    /className="text-amber-500 font-bold bg-\[#0B1120\]"/g,
    'className="text-amber-500 font-bold bg-[#0B1120] text-base"'
  );
  
  code = code.replace(
    /className="text-slate-200 bg-\[#0B1120\]"/g,
    'className="text-slate-200 bg-[#0B1120] text-base"'
  );

  fs.writeFileSync(file, code);
});
