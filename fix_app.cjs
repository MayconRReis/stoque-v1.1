const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

// 1. fetchSelectedData catch block
code = code.replace(
  /console\.error\('Error fetching selected pallets data:', error\);/g,
  "console.error('Error fetching selected pallets data:', error);\n          showNotification('Erro ao carregar dados dos pallets selecionados', 'error');"
);

// 2. refreshCombinedData catch block
const rcdSearch = `if (error?.message === 'Failed to fetch' || error?.message?.includes('Failed to fetch') || error?.message?.includes('fetch') || error?.toString().includes('Failed to fetch')) {
        console.warn('Network error detected. Disabling Supabase and falling back to offline mode.');
        disableSupabase();
        setTimeout(() => refreshCombinedData(), 100);
      }`;
const rcdReplace = `if (error?.message === 'Failed to fetch' || error?.message?.includes('Failed to fetch') || error?.message?.includes('fetch') || error?.toString().includes('Failed to fetch')) {
        console.warn('Network error detected. Disabling Supabase and falling back to offline mode.');
        disableSupabase();
        setTimeout(() => refreshCombinedData(), 100);
      } else {
        showNotification('Erro ao atualizar dados. Os dados exibidos podem estar desatualizados.', 'error');
      }`;
code = code.replace(rcdSearch, rcdReplace);

// 3. getInventoryPaginated search catch block
code = code.replace(
  /console\.error\('Error searching inventory:', error\);/g,
  "console.error('Error searching inventory:', error);\n          showNotification('Erro ao buscar itens no estoque', 'error');"
);

// 4. checkAuth catch block
code = code.replace(
  /console\.error\('Auth check error:', error\);/g,
  "console.error('Auth check error:', error);\n        showNotification('Erro ao verificar sessão. Faça login novamente.', 'error');"
);

// 5. Stack reorganization catch block
code = code.replace(
  /console\.error\('Stack reorganization failed:', error\);/g,
  "console.error('Stack reorganization failed:', error);\n        showNotification('Erro ao reorganizar pilhas E/F. Verifique o estoque manualmente.', 'error');"
);

// 6. handleLogout catch block
code = code.replace(
  /console\.error\('Logout error:', error\);/g,
  "console.error('Logout error:', error);\n      showNotification('Erro ao encerrar sessão. Tente novamente.', 'error');"
);

// 7. Remove loadStats
const lines = code.split('\n');
const lsStart = lines.findIndex(l => l.includes('const loadStats = useCallback(async () => {'));
if (lsStart !== -1) {
  const lsEnd = lines.findIndex((l, i) => i > lsStart && l.includes('}, []);'));
  if (lsEnd !== -1) {
    lines.splice(lsStart, lsEnd - lsStart + 1);
  }
}

fs.writeFileSync('App.tsx', lines.join('\n'));
console.log('App.tsx fixed');
