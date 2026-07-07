import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const item = {
    id: "test-id-1234",
    loadingId: "L-1234",
    originOP: "OP-1",
    description: "Test",
    lot: "L1",
    pallets: 1,
    date: "2023-01-01",
    status: "INSPECTED",
    inspections: [
      {
        assignedSlot: "AGUARDANDO",
        contentType: "EMPTY",
        bottles: 0,
        boxes: 0,
        cradles: 0,
        caps: 0
      }
    ],
    operatorName: "Test Operator"
  };

  const { error } = await supabase
    .from('inventory')
    .upsert({
      id: item.id,
      loading_id: item.loadingId,
      origin_op: item.originOP,
      description: item.description,
      lot: item.lot,
      pallets: item.pallets,
      date: item.date,
      status: item.status,
      inspections: item.inspections || [],
      operator_name: item.operatorName
    });
    
  console.log("Upsert Error:", error);
}

run();
