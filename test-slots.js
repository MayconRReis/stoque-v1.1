import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.from('inventory').select('id, inspections, status, loading_id, origin_op').neq('status', 'PENDING');
  if (error) { console.error(error); return; }
  
  const slotMap = {};
  data.forEach(item => {
    (item.inspections || []).forEach(insp => {
      const s = insp.assignedSlot;
      if (s && s !== 'AGUARDANDO') {
        if (!slotMap[s]) slotMap[s] = [];
        slotMap[s].push({ loadingId: item.loading_id, op: item.origin_op });
      }
    });
  });

  for (const [slot, items] of Object.entries(slotMap)) {
    if (items.length > 1) {
      console.log(`Slot ${slot} has ${items.length} items:`, items);
    }
  }
}
run();
