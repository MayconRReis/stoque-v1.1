const fs = require('fs');
const file = 'components/InventoryCard.tsx';
let content = fs.readFileSync(file, 'utf8');

// regex replace
content = content.replace(/\{\/\* Selection Indicator \*\/\}\n\s*<div className=\{\`absolute -top-1 -left-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all \$\{isSelected \? 'bg-purple-600 border-purple-400 text-zinc-50 shadow-lg shadow-purple-500\/20' : 'bg-slate-950 border-slate-800 text-transparent'\}\`\}>\n\s*<CheckCircle2 className="w-3\.5 h-3\.5" \/>\n\s*<\/div>/, '');

content = content.replace(/<div className="flex justify-between items-start mb-5 pl-5">/, '<div className="flex justify-between items-start mb-5">');

fs.writeFileSync(file, content);
