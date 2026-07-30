const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

const importStr = `import { useNotifications } from './hooks/useNotifications';`;
code = code.replace(importStr, `import { useNotifications } from './hooks/useNotifications';\nimport { useTheme } from './hooks/useTheme';`);

const stateStr = `  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('theme') as 'dark' | 'light') || 'dark';
  });

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);`;

code = code.replace(stateStr, `  const { theme, setTheme } = useTheme();`);

fs.writeFileSync('App.tsx', code);
console.log('useTheme applied');
