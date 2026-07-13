const fs = require('fs');
let code = fs.readFileSync('services/supabaseService.ts', 'utf8');

// getGlobalStats
code = code.replace(
  "applyInventoryFilter(supabase.from('inventory').select('inspections'), 'ROOT_ONLY')",
  "applyInventoryFilter(supabase.from('inventory').select('inspections, parent_group_id'), 'ROOT_ONLY')"
);

fs.writeFileSync('services/supabaseService.ts', code);
