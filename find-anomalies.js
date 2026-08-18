import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase.from('inventory').select('id, description, status, pallets, loading_id, inspections').order('created_at', { ascending: false }).limit(50);
  if (error) { console.error(error); return; }
  
  data.forEach(item => {
    if (item.pallets > 10 || (item.inspections && item.inspections.length > 10)) {
      console.log(`[${item.status}] Row ${item.id} (${item.loading_id}) - ${item.description}: ${item.pallets} pallets, ${item.inspections ? item.inspections.length : 0} inspections`);
    }
  });
}
run();
