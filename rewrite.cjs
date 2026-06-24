const fs = require('fs');

let code = fs.readFileSync('App.tsx', 'utf8');

// Safely replace classes using regex.
// We look for className="..." or class="{...}" but wait, in React it's `className="bg-slate-900"` or `className={\`...\`}`
// To be very precise, we just look for exact class words. We can split strings by quote/backtick or just use global replaces with word boundaries.

const replacements = {
  // Backgrounds
  'bg-slate-900': 'bg-white dark:bg-slate-900',
  'bg-slate-800': 'bg-slate-100 dark:bg-slate-800',
  'bg-slate-[0-9]+/[0-9]+': (match) => {
    if (match.startsWith('bg-slate-900')) {
      return match.replace('bg-slate-900', 'bg-white/90 dark:bg-slate-900');
    }
    if (match.startsWith('bg-slate-800')) {
      return match.replace('bg-slate-800', 'bg-slate-100/80 dark:bg-slate-800');
    }
    return match;
  },

  // Borders
  'border-slate-800': 'border-slate-200 dark:border-slate-800',
  'border-slate-800/[0-9]+': (match) => {
    return match.replace('border-slate-800', 'border-slate-200 dark:border-slate-800');
  },

  // Texts
  'text-slate-400': 'text-slate-500 dark:text-slate-400',
  'text-slate-500': 'text-slate-600 dark:text-slate-500',
  'text-slate-300': 'text-slate-700 dark:text-slate-300',
  'text-slate-200': 'text-slate-800 dark:text-slate-200',
};

// First pass: replace standard strings
let newCode = code;

// Replace precise class names globally (word boundaries)
for (const [key, val] of Object.entries(replacements)) {
  if (typeof val === 'function') {
    newCode = newCode.replace(new RegExp(`\\b${key}\\b`, 'g'), val);
  } else {
    // Avoid double-replacing if 'dark:bg-slate-900' is already there
    newCode = newCode.replace(new RegExp(`(?<!dark:)\\b${key}\\b`, 'g'), val);
  }
}

// Global text-white handling: change to text-slate-900 dark:text-white
// BUT EXCLUDE lines that contain colored backgrounds like bg-blue, bg-red, etc.
const lines = newCode.split('\n');
const resultLines = lines.map(line => {
  if (line.includes('text-white') && !line.match(/dark:text-white/)) {
    // If it's a prominent colored button, leave it as text-white always
    if (line.match(/bg-(blue|indigo|purple|fuchsia|red|green|amber|pink)-[56]00/)) {
      return line;
    }
    return line.replace(/(?<!dark:)\btext-white\b/g, 'text-slate-900 dark:text-white');
  }
  return line;
});

newCode = resultLines.join('\n');

// Specific fix for HTML tag classes - The user wanted `transition-colors duration-200`
// Actually we can just do that in index.css

fs.writeFileSync('App.tsx', newCode);
console.log('App.tsx rewrite complete.');
