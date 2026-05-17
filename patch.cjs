const fs = require('fs');
const file = 'services/supabaseService.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /\s*let query = supabase\s*\.from\('inventory'\)\s*\.select\('\*'\);/,
  "\n    let query = supabase\n      .from('inventory')\n      .select('*')\n      .neq('status', 'PENDING');"
);

fs.writeFileSync(file, content);
