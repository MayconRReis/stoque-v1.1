const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

const replacement = `} catch (error: any) {
      console.error('Error refreshing data:', error);
      if (error?.message === 'Failed to fetch' || error?.message?.includes('Failed to fetch') || error?.message?.includes('fetch') || error?.toString().includes('Failed to fetch')) {
        console.warn('Network error detected. Disabling Supabase and falling back to offline mode.');
        disableSupabase();
        setTimeout(() => refreshCombinedData(), 100);
      }
    }`;

code = code.replace(/\} catch \(error\) \{\s*console\.error\('Error refreshing data:', error\);\s*\}/, replacement);

fs.writeFileSync('App.tsx', code);
console.log('App.tsx refreshed updated');
