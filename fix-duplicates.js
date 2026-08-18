import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  // 1. Fetch all items to analyze
  const { data, error } = await supabase.from('inventory').select('*');
  if (error) { console.error(error); return; }
  
  console.log(`Analyzing ${data.length} total rows...`);
  
  // 2. Identify duplicates by loading_id (assuming that's the key)
  const map = new Map();
  const toDelete = [];
  
  for (const item of data) {
    if (map.has(item.loading_id)) {
      toDelete.push(item.id);
      console.log(`Duplicate found: ${item.loading_id} (ID: ${item.id})`);
    } else {
      map.set(item.loading_id, item.id);
    }
  }
  
  console.log(`Found ${toDelete.length} duplicates to remove.`);
  
  // 3. Delete
  for (const id of toDelete) {
    await supabase.from('inventory').delete().eq('id', id);
  }
  console.log('Cleanup finished.');
}
run();
