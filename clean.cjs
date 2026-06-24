const fs = require('fs');

let code = fs.readFileSync('App.tsx', 'utf8');

// Cleanup messes
code = code.replace(/bg-white dark:bg-white\/90 dark:bg-slate-900\/([0-9]+)/g, 'bg-slate-100 dark:bg-slate-900/$1');
code = code.replace(/bg-white dark:bg-slate-100\/80 dark:bg-slate-800\/([0-9]+)/g, 'bg-slate-200 dark:bg-slate-800/$1');
code = code.replace(/bg-white dark:bg-slate-900\/([0-9]+)/g, 'bg-slate-100 dark:bg-slate-900/$1');
code = code.replace(/bg-slate-100 dark:bg-slate-100\/80 dark:bg-slate-800\/([0-9]+)/g, 'bg-slate-200 dark:bg-slate-800/$1');

code = code.replace(/border-slate-200 dark:border-slate-200 dark:border-slate-800\/([0-9]+)/g, 'border-slate-300 dark:border-slate-800/$1');
code = code.replace(/border-slate-200 dark:border-slate-800\/([0-9]+)/g, 'border-slate-300 dark:border-slate-800/$1');

code = code.replace(/text-slate-600 dark:text-slate-500 dark:text-slate-400/g, 'text-slate-500 dark:text-slate-400');
code = code.replace(/text-slate-600 dark:text-slate-600 dark:text-slate-500/g, 'text-slate-600 dark:text-slate-500');
code = code.replace(/text-slate-700 dark:text-slate-700 dark:text-slate-300/g, 'text-slate-700 dark:text-slate-300');
code = code.replace(/text-slate-900 dark:text-slate-900 dark:text-white/g, 'text-slate-900 dark:text-white');

// Double text-white fixes
code = code.replace(/text-slate-900 dark:text-slate-900 dark:text-white/g, 'text-slate-900 dark:text-white');

fs.writeFileSync('App.tsx', code);
console.log('App.tsx cleaned');
