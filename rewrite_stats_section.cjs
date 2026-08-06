const fs = require('fs');
let code = fs.readFileSync('components/StatsSection.tsx', 'utf8');

// Replace "Carreg. Abertos" with "SKUs Disponíveis"
code = code.replace(
  `        {/* Carregamentos Abertos */}
        <div 
          className="bg-slate-100/40 dark:bg-slate-900/40 p-5 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-xl flex items-center gap-4 group hover:border-amber-500/30 transition-all cursor-pointer"
          onClick={() => !isPublicView && onNavigate('shipments')}
        >
          <div className="w-10 h-10 bg-amber-600/10 text-amber-500 rounded-xl flex items-center justify-center border border-amber-500/20 group-hover:scale-105 transition-transform">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-0.5">Carreg. Abertos</p>
            <p className="text-xl font-black text-amber-500 tracking-tight leading-none">{stats.openShipmentsCount}</p>
          </div>
        </div>`,
  `        {/* SKUs Disponíveis */}
        <div 
          className="bg-slate-100/40 dark:bg-slate-900/40 p-5 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-xl flex items-center gap-4 group hover:border-amber-500/30 transition-all cursor-pointer"
          onClick={() => !isPublicView && onNavigate('inventory')}
        >
          <div className="w-10 h-10 bg-amber-600/10 text-amber-500 rounded-xl flex items-center justify-center border border-amber-500/20 group-hover:scale-105 transition-transform">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-0.5">SKUs Disponíveis</p>
            <p className="text-xl font-black text-amber-500 tracking-tight leading-none">{stats.uniqueSkuCount}</p>
          </div>
        </div>`
);

// Remove "Container Stats Row" entirely
const containerRowRegex = /\s*\{\/\* Container Stats Row \*\/\}[\s\S]*?<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">[\s\S]*?<\/div>\s*<\/div>\s*\);\s*\};\s*export default memo\(StatsSection\);/m;
code = code.replace(
  containerRowRegex,
  `
    </div>
  );
};
export default memo(StatsSection);`
);

fs.writeFileSync('components/StatsSection.tsx', code);
console.log('StatsSection updated');
