import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.from('inventory').select('id, inspections, loading_id').neq('status', 'PENDING');
  if (error) { console.error(error); return; }
  
  data.forEach(item => {
    const c11 = (item.inspections || []).filter(i => i.assignedSlot === 'C.1.1').length;
    const b114 = (item.inspections || []).filter(i => i.assignedSlot === 'B.1.14').length;
    if (c11 > 1 || b114 > 1) {
      console.log(`Row ${item.id} (${item.loading_id}) has ${c11} C.1.1 and ${b114} B.1.14 inside its inspections array of size ${(item.inspections || []).length}`);
    }
  });
}
run();
