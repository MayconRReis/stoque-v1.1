const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

code = code.replace(
  `        console.error('Error loading data from Supabase:', error);\n        if (error?.message === 'Failed to fetch' || error?.message?.includes('Failed to fetch') || error?.message?.includes('fetch') || error?.toString().includes('Failed to fetch')) {`,
  `        if (error?.message === 'Failed to fetch' || error?.message?.includes('Failed to fetch') || error?.message?.includes('fetch') || error?.toString().includes('Failed to fetch')) {\n          console.warn('Network error detected. Disabling Supabase and falling back to offline mode.');\n          disableSupabase();\n          setTimeout(() => loadData(), 100);\n        } else {\n          console.error('Error loading data from Supabase:', error);\n          showNotification('Erro ao carregar dados do servidor Supabase.', 'error');\n        }`
);

// We need to just fix the catch block if the above replace doesn't work correctly.
fs.writeFileSync('App.tsx', code);
console.log('Fixed App.tsx catch block');
