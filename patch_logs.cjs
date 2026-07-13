const fs = require('fs');
let code = fs.readFileSync('services/supabaseService.ts', 'utf8');

// getInventoryPaginated
code = code.replace(
  "const inventory = (data || []).map(mapInventoryRow).filter(item => Array.isArray(item.inspections) && item.inspections.length > 0);",
  "console.log('--- LOG getInventoryPaginated ---');\n    console.log((data || []).map((item: any) => ({ loading: item.loading_id, parent: item.parent_group_id, isGroup: item.is_group })));\n    const inventory = (data || []).map(mapInventoryRow).filter(item => Array.isArray(item.inspections) && item.inspections.length > 0);"
);

// getInventory
code = code.replace(
  "const inventory = (data || []).map(mapInventoryRow).filter(item => Array.isArray(item.inspections) && item.inspections.length > 0);\n    localStorageHelper.save('inventory', inventory);",
  "console.log('--- LOG getInventory ---');\n    console.log((data || []).map((item: any) => ({ loading: item.loading_id, parent: item.parent_group_id, isGroup: item.is_group })));\n    const inventory = (data || []).map(mapInventoryRow).filter(item => Array.isArray(item.inspections) && item.inspections.length > 0);\n    localStorageHelper.save('inventory', inventory);"
);

// getPendingInventory
code = code.replace(
  "if (error) throw error;\n    return (data || []).map(mapInventoryRow);",
  "if (error) throw error;\n    console.log('--- LOG getPendingInventory ---');\n    console.log((data || []).map((item: any) => ({ loading: item.loading_id, parent: item.parent_group_id, isGroup: item.is_group })));\n    return (data || []).map(mapInventoryRow);"
);

// getWaitingInventory
code = code.replace(
  "if (error) throw error;\n    \n    const inventory = (data || []).map(mapInventoryRow);",
  "if (error) throw error;\n    console.log('--- LOG getWaitingInventory ---');\n    console.log((data || []).map((item: any) => ({ loading: item.loading_id, parent: item.parent_group_id, isGroup: item.is_group })));\n    const inventory = (data || []).map(mapInventoryRow);"
);

// getAllInventoryForExport
code = code.replace(
  "if (error) throw error;\n\n    const filtered = (data || []).filter(item => ",
  "if (error) throw error;\n    console.log('--- LOG getAllInventoryForExport ---');\n    console.log((data || []).map((item: any) => ({ loading: item.loading_id, parent: item.parent_group_id, isGroup: item.is_group })));\n\n    const filtered = (data || []).filter(item => "
);

fs.writeFileSync('services/supabaseService.ts', code);
