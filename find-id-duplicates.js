import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase.from('inventory').select('id, loading_id, inspections');
  if (error) { console.error(error); return; }
  
  // Checking for the specific ID reported by user
  const targetId = 'BIYR9I';
  const matching = data.filter(i => i.loading_id === targetId);
  
  if (matching.length > 0) {
      console.log(`Found ${matching.length} instances of ${targetId}`);
      matching.forEach(m => console.log(` - ID: ${m.id}, Inspections length: ${m.inspections ? m.inspections.length : 0}`));
      
      // If there are multiple, keep the one with most inspections (assuming it's the 'real' one)
      if (matching.length > 1) {
          matching.sort((a,b) => (b.inspections?.length || 0) - (a.inspections?.length || 0));
          const keep = matching[0];
          console.log(`Keeping ID: ${keep.id}`);
          for (let i = 1; i < matching.length; i++) {
              console.log(`Deleting ID: ${matching[i].id}`);
              await supabase.from('inventory').delete().eq('id', matching[i].id);
          }
      }
  } else {
      console.log(`${targetId} not found.`);
  }
}
run();
