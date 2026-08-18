import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase.from('inventory').select('id, description, pallets, inspections');
  if (error) { console.error(error); return; }
  
  for (const item of data) {
    if (item.pallets > 100 || (item.inspections && item.inspections.length > 100)) {
      console.log(`Deleting anomaly row ${item.id} - ${item.description} with ${item.pallets} pallets, ${item.inspections ? item.inspections.length : 0} inspections`);
      await supabase.from('inventory').delete().eq('id', item.id);
    }
  }
}
run();
