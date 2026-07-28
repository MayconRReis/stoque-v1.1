const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

// First, make sure disableSupabase is imported
if (!code.includes('disableSupabase')) {
  code = code.replace(
    /import \{ supabase, isSupabaseConfigured \} from '\.\/lib\/supabase';/,
    "import { supabase, isSupabaseConfigured, disableSupabase } from './lib/supabase';"
  );
}

// Then update loadData
// We will find the catch block inside loadData
const loadDataRegex = /const loadData = async \(\) => \{[\s\S]*?\} catch \(error\) \{[\s\S]*?console\.error\('Failed to load data:', error\);([\s\S]*?)\} finally \{/m;
const match = code.match(loadDataRegex);

if (match) {
  const replacement = `} catch (error: any) {
        console.error('Failed to load data:', error);
        if (error?.message === 'Failed to fetch' || error?.message?.includes('Failed to fetch') || error?.message?.includes('fetch') || error?.toString().includes('Failed to fetch')) {
          console.warn('Network error detected. Disabling Supabase and falling back to offline mode.');
          disableSupabase();
          // Schedule a reload of data to use offline mode immediately
          setTimeout(() => {
            loadData();
          }, 100);
        }
      } finally {`;
  
  code = code.replace(/\} catch \(error\) \{[\s\S]*?console\.error\('Failed to load data:', error\);[\s\S]*?\} finally \{/m, replacement);
  fs.writeFileSync('App.tsx', code);
  console.log('App.tsx updated');
} else {
  console.log('Could not find loadData catch block');
}
