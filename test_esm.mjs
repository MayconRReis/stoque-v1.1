import { isSupabaseConfigured, disableSupabase } from './test_supabase.mjs';
console.log("before:", isSupabaseConfigured);
disableSupabase();
console.log("after:", isSupabaseConfigured);
