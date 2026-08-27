import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Ensure it's a valid url and not a placeholder
export let isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  typeof supabaseUrl === 'string' &&
  supabaseUrl.startsWith('http') &&
  !supabaseUrl.includes('your-supabase-url') &&
  !supabaseUrl.includes('placeholder.supabase.co') &&
  supabaseAnonKey !== 'your-anon-key' &&
  typeof supabaseAnonKey === 'string' &&
  supabaseAnonKey.trim().length > 10
);

export function isFetchOrNetworkError(err: any): boolean {
  if (!err) return false;
  const msg = (err.message || err.error_description || err.details || err.hint || err.toString() || '').toLowerCase();
  return (
    msg.includes('failed to fetch') ||
    msg.includes('networkerror') ||
    msg.includes('network error') ||
    msg.includes('load failed') ||
    msg.includes('fetch') ||
    msg.includes('connection refused') ||
    msg.includes('connection reset') ||
    msg.includes('timeout') ||
    msg.includes('cors') ||
    err.name === 'TypeError' ||
    err.status === 0 ||
    err.code === 'ECONNREFUSED' ||
    err.code === 'ENOTFOUND' ||
    err.code === 'PGRST301'
  );
}

export function disableSupabase() {
  if (isSupabaseConfigured) {
    isSupabaseConfigured = false;
    console.warn('Supabase has been disabled at runtime due to network/fetch error. Falling back to offline mode (LocalStorage).');
  }
}

if (!isSupabaseConfigured) {
  console.warn('Supabase credentials missing or using placeholders. The app will run in offline mode (LocalStorage).');
}

export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl! : 'https://placeholder.supabase.co',
  isSupabaseConfigured ? supabaseAnonKey! : 'placeholder',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false
    }
  }
);

