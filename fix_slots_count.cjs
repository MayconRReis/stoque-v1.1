const fs = require('fs');
let code = fs.readFileSync('services/supabaseService.ts', 'utf8');

code = code.replace(
  `const generalSlots = allSlots.filter(s => s.id.startsWith('A') || s.id.startsWith('B') || s.id.startsWith('C') || s.id.startsWith('D') || s.id.startsWith('E') || s.id.startsWith('F'));`,
  `const generalSlots = allSlots.filter(s => s.id.startsWith('A') || s.id.startsWith('B') || s.id.startsWith('C') || s.id.startsWith('D'));`
);

fs.writeFileSync('services/supabaseService.ts', code);
console.log('Fixed slots count logic');
