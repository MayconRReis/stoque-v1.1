const fs = require('fs');
let code = fs.readFileSync('services/supabaseService.ts', 'utf8');

const target = `    let query = applyInventoryFilter(
      supabase.from('inventory').select('*', { count: 'exact' }),
      'ROOT_ONLY'
    );

    if (filters?.searchTerm) {
      const originalTerm = filters.searchTerm.trim();
      const upperTerm = originalTerm.toUpperCase();
      const termFragment = \`%\${originalTerm}%\`;
      const isSlotSearch = /^[A-F](\\.\\d+){0,2}$/.test(upperTerm);
      
      let orClause = \`origin_op.ilike.\${termFragment},description.ilike.\${termFragment},lot.ilike.\${termFragment},id.ilike.\${termFragment},loading_id.ilike.\${termFragment}\`;
      const isSemSeloSearch = upperTerm === 'SEM SELO';

      if (isSlotSearch) {
        // Since we can't easily filter JSONB array deep properties in standard PostgREST ilike, 
        // we might have to fetch more and filter locally if it's a complex slot search.
        // But for exact match in assignedSlot, we can use JSONB containment if we had an index.
        // For now, we will rely on local filtering for complex JSON searches if needed, or 
        // just fetch and filter. Actually, a simple approach is to fetch all root nodes and filter locally if slot search.
      }
      
      query = query.or(orClause);
    }`;

console.log(code.includes(target) ? "Target found" : "Target NOT found");
