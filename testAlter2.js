import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  const query = `
    ALTER TABLE inventory ADD COLUMN IF NOT EXISTS is_group BOOLEAN DEFAULT false;
    ALTER TABLE inventory ADD COLUMN IF NOT EXISTS parent_group_id TEXT REFERENCES inventory(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_inventory_parent_group_id ON inventory(parent_group_id);
  `;
  const { data, error } = await supabase.rpc('exec_sql', { query });
  console.log("exec_sql result:", error);
}
run();
