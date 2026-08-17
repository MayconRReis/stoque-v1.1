import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.from('inventory').select('id, inspections');
  if (error) { console.error(error); return; }
  
  for (const item of data) {
    if (item.inspections && item.inspections.length > 50) {
      console.log(`Deleting anomaly row ${item.id} with ${item.inspections.length} pallets`);
      await supabase.from('inventory').delete().eq('id', item.id);
    }
  }
}
run();
