const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

code = code.replace(
  `className="flex items-center justify-center w-10 h-6 bg-slate-100 dark:bg-slate-900/50 hover:bg-slate-200 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-800/50 rounded-full text-slate-600 dark:text-slate-500 hover:text-slate-700 dark:text-slate-300 transition-all active:scale-95 group"`,
  `className="flex items-center justify-center w-10 h-10 bg-slate-100 dark:bg-slate-900/50 hover:bg-slate-200 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-800/50 rounded-full text-slate-600 dark:text-slate-500 hover:text-slate-900 dark:text-white transition-all active:scale-95 shadow-sm group"`
);

code = code.replace(
  `{theme === 'dark' ? <Sun className="w-3 h-3 group-hover:rotate-90 transition-transform duration-500" /> : <Moon className="w-3 h-3 group-hover:-rotate-12 transition-transform duration-500" />}`,
  `{theme === 'dark' ? <Sun className="w-4 h-4 group-hover:rotate-90 transition-transform duration-500" /> : <Moon className="w-4 h-4 group-hover:-rotate-12 transition-transform duration-500" />}`
);

fs.writeFileSync('App.tsx', code);
console.log('Fixed theme button');
