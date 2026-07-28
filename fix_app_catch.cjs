const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

// Ensure disableSupabase is imported
if (!code.includes('disableSupabase')) {
  code = code.replace(
    /import \{ supabase, isSupabaseConfigured \} from '\.\/lib\/supabase';/,
    "import { supabase, isSupabaseConfigured, disableSupabase } from './lib/supabase';"
  );
}

// Modify the catch block
const replacement = `} catch (error: any) {
        console.error('Error loading data from Supabase:', error);
        if (error?.message === 'Failed to fetch' || error?.message?.includes('Failed to fetch') || error?.message?.includes('fetch') || error?.toString().includes('Failed to fetch')) {
          console.warn('Network error detected. Disabling Supabase and falling back to offline mode.');
          disableSupabase();
          setTimeout(() => loadData(), 100);
        } else {
          showNotification('Erro ao carregar dados do servidor Supabase.', 'error');
        }
      }`;

code = code.replace(/\} catch \(error\) \{\s*console\.error\('Error loading data from Supabase:', error\);\s*showNotification\('Erro ao carregar dados do servidor Supabase\.', 'error'\);\s*\}/, replacement);

fs.writeFileSync('App.tsx', code);
console.log('App.tsx updated');
