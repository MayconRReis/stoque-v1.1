import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const historyEntry = {
    id: "hist-1234",
    type: "ENTRY",
    timestamp: new Date().toLocaleString(),
    loading_id: "L-1234",
    description: "Test",
    op: "OP-1",
    lot: "L1",
    pallet_number: 1,
    total_pallets: 1,
    slot: "AGUARDANDO",
    details: `Entrada confirmada por Test. ID Final: L-1234 (Aguardando Vaga)`,
    operator_name: "Test"
  };

  const { error } = await supabase
    .from('history')
    .insert(historyEntry);
    
  console.log("Insert Error:", error);
}

run();
