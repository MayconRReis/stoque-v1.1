const fs = require('fs');
let code = fs.readFileSync('services/supabaseService.ts', 'utf8');

const replacement = `} catch (error: any) {
      if (error?.message?.includes('stole it') || error?.message?.includes('lock')) {
        console.warn('Supabase Auth lock warning ignored:', error);
        return null;
      }
      console.error('Error in getCurrentUser:', error);
      if (error?.message === 'Failed to fetch' || error?.message?.includes('fetch') || error?.toString().includes('Failed to fetch')) {
        disableSupabase();
        const localUser = localStorage.getItem('stoque_plus_logged_user');
        return localUser ? JSON.parse(localUser) : null;
      }
      return null;
    }`;

code = code.replace(/\} catch \(error: any\) \{\s*console\.error\('Error in getCurrentUser:', error\);\s*if \(error\?\.message === 'Failed to fetch' \|\| error\?\.message\?\.includes\('fetch'\) \|\| error\?\.toString\(\)\.includes\('Failed to fetch'\)\) \{\s*disableSupabase\(\);\s*const localUser = localStorage\.getItem\('stoque_plus_logged_user'\);\s*return localUser \? JSON\.parse\(localUser\) : null;\s*\}\s*return null;\s*\}/, replacement);

fs.writeFileSync('services/supabaseService.ts', code);
console.log('supabaseService lock warning fixed');
