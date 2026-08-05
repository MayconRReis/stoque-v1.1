const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

code = code.replace(
  /\} catch \(error: any\) \{[\s\S]*?\}\s*\};\s*loadData\(\);/m,
  `} catch (error: any) {
        if (error?.message === 'Failed to fetch' || error?.message?.includes('Failed to fetch') || error?.message?.includes('fetch') || error?.toString().includes('Failed to fetch')) {
          console.warn('Network error detected. Disabling Supabase and falling back to offline mode.');
          disableSupabase();
          setTimeout(() => loadData(), 100);
        } else {
          console.error('Error loading data from Supabase:', error);
          showNotification('Erro ao carregar dados do servidor Supabase.', 'error');
        }
      }
    };
    loadData();`
);

fs.writeFileSync('App.tsx', code);
console.log('Fixed App.tsx catch block correctly');
