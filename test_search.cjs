const fs = require('fs');
let code = fs.readFileSync('services/supabaseService.ts', 'utf8');

const regex = /const \{ data: searchData \} = await supabase\.from\('inventory'\)\.select\('id, parent_group_id, origin_op, description, lot, loading_id, inspections'\);/g;

code = code.replace(regex, `
        // Adding limit to avoid missing rows if >1000, or maybe we just do a text search
        const { data: searchData, error: searchErr } = await supabase.from('inventory').select('id, parent_group_id, origin_op, description, lot, loading_id, inspections').limit(10000);
        if (searchErr) console.error("Search fetch error:", searchErr);
`);

fs.writeFileSync('services/supabaseService.ts', code);
