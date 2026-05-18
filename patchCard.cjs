const fs = require('fs');
const file = 'components/InventoryCard.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `      <div className="relative z-10 flex flex-col h-full">
        {/* Selection Indicator */}
        <div className={\`absolute -top-1 -left-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all \${isSelected ? 'bg-purple-600 border-purple-400 text-zinc-50 shadow-lg shadow-purple-500/20' : 'bg-slate-950 border-slate-800 text-transparent'}\`}>
          <CheckCircle2 className="w-3.5 h-3.5" />
        </div>

        {/* Header Info */}
        <div className="flex justify-between items-start mb-5 pl-5">`;
        
const replacement = `      <div className="relative z-10 flex flex-col h-full">
        {/* Header Info */}
        <div className="flex justify-between items-start mb-5">`;

content = content.replace(target, replacement);

fs.writeFileSync(file, content);
