const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

// The ultimate regex to clean duplicate `dark:` prefixes of the SAME style (e.g. bg or text)
code = code.replace(/dark:bg-[a-zA-Z0-9\/-]+ dark:bg-([a-zA-Z0-9\/-]+)/g, 'dark:bg-$1');
code = code.replace(/dark:bg-[a-zA-Z0-9\/-]+ dark:bg-([a-zA-Z0-9\/-]+)/g, 'dark:bg-$1'); 
code = code.replace(/dark:text-[a-zA-Z0-9\/-]+ dark:text-([a-zA-Z0-9\/-]+)/g, 'dark:text-$1');
code = code.replace(/dark:border-[a-zA-Z0-9\/-]+ dark:border-([a-zA-Z0-9\/-]+)/g, 'dark:border-$1');

// Ensure bg-white is replaced with bg-slate-100 instead of white when appropriate (opacity backgrounds), or just let it be bg-white.
code = code.replace(/bg-white\/[0-9]+ dark:/g, 'bg-slate-100 dark:');
code = code.replace(/bg-slate-950 hover:bg-white/g, 'bg-slate-100 hover:bg-slate-200');

fs.writeFileSync('App.tsx', code);
console.log('Final cleanup applied to App.tsx');
