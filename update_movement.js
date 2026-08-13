const fs = require('fs');
let code = fs.readFileSync('components/MovementModal.tsx', 'utf-8');

code = code.replace(
  /<select value=\{targetSlot\} onChange=\{e => setTargetSlot\(e\.target\.value\)\} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-slate-900 dark:text-white font-bold text-sm focus:border-amber-500 outline-none">/g,
  '<select value={targetSlot} onChange={e => setTargetSlot(e.target.value)} className="w-full bg-[#0B1120] border border-slate-800 rounded-xl px-4 py-3 text-white font-bold text-sm focus:border-amber-500 outline-none appearance-none">'
);

code = code.replace(
  /<option value="">Selecione a nova vaga...<\/option>/g,
  '<option value="" className="bg-[#0B1120] text-blue-300">SELECIONAR</option>'
);

code = code.replace(
  /<option value="AGUARDANDO">AGUARDANDO VAGA<\/option>/g,
  '<option value="AGUARDANDO" className="text-amber-500 font-bold bg-[#0B1120]">AGUARDANDO VAGA</option>'
);

code = code.replace(
  /<option key=\{s\.id\} value=\{s\.id\}>\{s\.id\} \(\{s\.zone\}\)<\/option>/g,
  '<option key={s.id} value={s.id} className="text-slate-200 bg-[#0B1120]">{s.id} ({s.zone})</option>'
);

fs.writeFileSync('components/MovementModal.tsx', code);
