const fs = require('fs');
let code = fs.readFileSync('services/supabaseService.ts', 'utf8');

const replacement = `const email = \`\${(username || '').toLowerCase().trim()}@stoqueplus.com\`;
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      return data;
    } catch (error: any) {
      if (error?.message === 'Failed to fetch' || error?.message?.includes('fetch') || error?.toString().includes('Failed to fetch')) {
        disableSupabase();
        // Return mock login
        const mockUser = {
          id: 'offline-user',
          email: \`\${username}@stoqueplus.com\`,
        };
        localStorage.setItem('stoque_plus_logged_user', JSON.stringify({
          id: mockUser.id,
          name: username,
          role: (username || '').toLowerCase() === 'admin' ? 'admin' : 'operator'
        }));
        return { user: mockUser, session: { access_token: 'mock-token' } };
      }
      throw error;
    }`;

code = code.replace(/const email = `\$\{\(username \|\| ''\)\.toLowerCase\(\)\.trim\(\)\}@stoqueplus\.com`;\s*const \{ data, error \} = await supabase\.auth\.signInWithPassword\(\{\s*email,\s*password,\s*\}\);\s*if \(error\) throw error;\s*return data;/, replacement);

fs.writeFileSync('services/supabaseService.ts', code);
console.log('signIn updated');
