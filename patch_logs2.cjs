const fs = require('fs');
let code = fs.readFileSync('services/supabaseService.ts', 'utf8');

// getGlobalStats
code = code.replace(
  "const allInspections = (results[5].data || []).filter(item => Array.isArray(item.inspections) && item.inspections.length > 0);",
  "console.log('--- LOG getGlobalStats (inspections) ---');\n    console.log((results[5].data || []).map((item: any) => ({ parent: item.parent_group_id })));\n    const allInspections = (results[5].data || []).filter(item => Array.isArray(item.inspections) && item.inspections.length > 0);"
);

// getInventoryPaginated
code = code.replace(
  "console.log('--- LOG getInventoryPaginated ---');",
  "console.log('--- LOG getInventoryPaginated ---');"
);

fs.writeFileSync('services/supabaseService.ts', code);
