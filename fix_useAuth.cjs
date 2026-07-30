const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

// Add import
const importThemeStr = `import { useTheme } from './hooks/useTheme';`;
code = code.replace(importThemeStr, `import { useTheme } from './hooks/useTheme';\nimport { useAuth } from './hooks/useAuth';`);

// Replace state
code = code.replace(/  const \[user, setUser\] = useState<AppUser \| null>\(null\);\n/, "");
code = code.replace(/const \[isAuthLoading, setIsAuthLoading\] = useState\(true\);\n  const \[isPublicView, setIsPublicView\] = useState\(false\);\n/, "");

// Replace useEffect
const ueSearch = `  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if we are in public view mode via URL param
        const params = new URLSearchParams(window.location.search);
        if (params.get('view') === 'public') {
          setIsPublicView(true);
          setIsAuthLoading(false);
          return;
        }

        const currentUser = await supabaseService.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Auth check error:', error);
        showNotification('Erro ao verificar sessão. Faça login novamente.', 'error');
      } finally {
        setIsAuthLoading(false);
      }
    };
    checkAuth();
  }, []);`;

code = code.replace(ueSearch, ``);

// Insert hook call right after useTheme()
const useThemeCall = `const { theme, setTheme } = useTheme();`;
code = code.replace(useThemeCall, `${useThemeCall}\n  const { user, setUser, isAuthLoading, isPublicView, setIsPublicView } = useAuth(showNotification);`);

fs.writeFileSync('App.tsx', code);
console.log('useAuth applied');
