import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const targetId = 'BIYR9I';
  
  // 1. Fetch the specific item
  const { data: items, error } = await supabase.from('inventory').select('*').eq('loading_id', targetId);
  
  if (error || !items || items.length === 0) {
      console.log('Item not found or error:', error);
      return;
  }
  
  console.log(`Found ${items.length} rows for ${targetId}`);
  
  // 2. Keep the one with most inspections, delete others
  items.sort((a,b) => (b.inspections?.length || 0) - (a.inspections?.length || 0));
  const keep = items[0];
  console.log(`Keeping ID: ${keep.id} with ${keep.inspections?.length} inspections.`);
  
  for (let i = 1; i < items.length; i++) {
      console.log(`Deleting ID: ${items[i].id}`);
      await supabase.from('inventory').delete().eq('id', items[i].id);
  }
  
  console.log('Cleanup specific conflict finished.');
}
run();
