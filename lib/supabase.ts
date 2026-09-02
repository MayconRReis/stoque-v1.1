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

export function isRetryableError(err: any): boolean {
  if (!err) return false;
  const msg = (err.message || err.error_description || err.details || err.hint || err.toString() || '').toLowerCase();
  const code = (err.code || '').toString().toUpperCase();
  return (
    code === 'PGRST002' ||
    code === 'PGRST000' ||
    code === 'PGRST001' ||
    code === 'PGRST003' ||
    code === '57P01' ||
    code === '57P02' ||
    code === '57P03' ||
    code === '53300' ||
    code === 'ECONNRESET' ||
    code === 'ECONNREFUSED' ||
    code === 'ETIMEDOUT' ||
    msg.includes('schema cache') ||
    msg.includes('could not query the database') ||
    msg.includes('connection reset') ||
    msg.includes('connection refused') ||
    msg.includes('failed to fetch') ||
    msg.includes('networkerror') ||
    msg.includes('network error') ||
    msg.includes('load failed') ||
    msg.includes('timeout') ||
    err.status === 502 ||
    err.status === 503 ||
    err.status === 504 ||
    err.status === 0
  );
}

export function isFetchOrNetworkError(err: any): boolean {
  if (!err) return false;
  const msg = (err.message || err.error_description || err.details || err.hint || err.toString() || '').toLowerCase();
  const code = (err.code || '').toString().toUpperCase();
  return (
    isRetryableError(err) ||
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

const safeFetch: typeof fetch = async (input, init) => {
  if (!isSupabaseConfigured) {
    return new Response(
      JSON.stringify({ code: 'PGRST000', message: 'Offline mode active', details: null, hint: null }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const res = await fetch(input, init);
    return res;
  } catch (err: any) {
    if (isFetchOrNetworkError(err)) {
      try {
        await new Promise(r => setTimeout(r, 400));
        const retryRes = await fetch(input, init);
        return retryRes;
      } catch (retryErr: any) {
        console.warn('Supabase fetch failed after retry, activating offline fallback mode:', retryErr?.message || retryErr);
        disableSupabase();
        return new Response(
          JSON.stringify({ code: 'PGRST000', message: 'Offline mode active', details: null, hint: null }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }
    throw err;
  }
};

export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl! : 'https://placeholder.supabase.co',
  isSupabaseConfigured ? supabaseAnonKey! : 'placeholder',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: isSupabaseConfigured,
      detectSessionInUrl: false
    },
    global: {
      fetch: safeFetch
    }
  }
);

