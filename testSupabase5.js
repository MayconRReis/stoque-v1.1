import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  const { data } = await supabase.from('warehouse_slots').select('id, status').eq('status', 'BOTTLES').limit(5);
  console.log("BOTTLES:", data);
  const { data: slots } = await supabase.from('warehouse_slots').select('*').limit(5);
  console.log("slots:", slots.map(s => s.status));
}
run();
