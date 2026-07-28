const fs = require('fs');
let code = fs.readFileSync('services/supabaseService.ts', 'utf8');

const replacement = `async signOut() {
    if (!isSupabaseConfigured) {
      localStorage.removeItem('stoque_plus_logged_user');
      return;
    }
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error: any) {
      if (error?.message === 'Failed to fetch' || error?.message?.includes('fetch') || error?.toString().includes('Failed to fetch')) {
        disableSupabase();
        localStorage.removeItem('stoque_plus_logged_user');
        return;
      }
      throw error;
    }
  },`;

code = code.replace(/async signOut\(\) \{\s*if \(\!isSupabaseConfigured\) \{\s*localStorage\.removeItem\('stoque_plus_logged_user'\);\s*return;\s*\}\s*const \{ error \} = await supabase\.auth\.signOut\(\);\s*if \(error\) throw error;\s*\},/, replacement);

fs.writeFileSync('services/supabaseService.ts', code);
console.log('signOut updated');
