import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  const { data: inv } = await supabase.from('inventory').select('inspections, status');
  const { data: slots } = await supabase.from('warehouse_slots').select('id, status');
  
  const occupiedByInv = new Set();
  inv.forEach(i => {
    if (i.status !== 'PENDING') {
      i.inspections?.forEach(insp => {
        if (insp.assignedSlot && insp.assignedSlot !== 'AGUARDANDO') occupiedByInv.add(insp.assignedSlot);
      });
    }
  });
  
  const markedEmptyButOccupied = slots.filter(s => s.status === 'EMPTY' && occupiedByInv.has(s.id));
  console.log("Empty in slots but occupied in inv:", markedEmptyButOccupied.length);
  console.log("Sample:", markedEmptyButOccupied.slice(0, 5));
}
run();
