import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  console.log("Fetching slots and inventory for conflict analysis...");
  
  const { data: slots, error: slotsError } = await supabase.from('warehouse_slots').select('*');
  const { data: inventory, error: invError } = await supabase.from('inventory').select('*');
  
  if (slotsError || invError) { console.error(slotsError || invError); return; }
  
  // Find slots with multiple pallets assigned
  const slotMap = new Map();
  inventory.forEach(item => {
      (item.inspections || []).forEach(insp => {
          const slotId = insp.assignedSlot;
          if (slotId && slotId !== 'AGUARDANDO') {
              if (!slotMap.has(slotId)) slotMap.set(slotId, []);
              slotMap.get(slotId).push({ rowId: item.id, inspection: insp });
          }
      });
  });
  
  for (const [slotId, assignments] of slotMap) {
      if (assignments.length > 1) {
          console.log(`Conflict in slot ${slotId}: ${assignments.length} assignments.`);
          // Simple resolution: mark as occupied by the first one, others need to be AGUARDANDO
          for (let i = 1; i < assignments.length; i++) {
              const assignment = assignments[i];
              console.log(` - Reverting assignment for ${assignment.rowId}`);
              
              // This part requires updating the inventory JSONB.
              // For simplicity, we just mark the slot as fixed by updating the inventory directly.
              const updatedInspections = assignments[i].row.inspections.map(insp => {
                  if (insp.assignedSlot === slotId) return { ...insp, assignedSlot: 'AGUARDANDO' };
                  return insp;
              });
              await supabase.from('inventory').update({ inspections: updatedInspections }).eq('id', assignment.rowId);
          }
      }
  }
}
run();
