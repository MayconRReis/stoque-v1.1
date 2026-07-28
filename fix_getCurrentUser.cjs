const fs = require('fs');
let code = fs.readFileSync('services/supabaseService.ts', 'utf8');

const replacement = `} catch (error: any) {
      console.error('Error in getCurrentUser:', error);
      if (error?.message === 'Failed to fetch' || error?.message?.includes('fetch') || error?.toString().includes('Failed to fetch')) {
        disableSupabase();
        const localUser = localStorage.getItem('stoque_plus_logged_user');
        return localUser ? JSON.parse(localUser) : null;
      }
      return null;
    }`;

code = code.replace(/\} catch \(error\) \{\s*console\.error\('Error in getCurrentUser:', error\);\s*return null;\s*\}/, replacement);

fs.writeFileSync('services/supabaseService.ts', code);
console.log('supabaseService updated');
