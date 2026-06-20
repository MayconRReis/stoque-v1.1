import fs from 'fs';

let code = fs.readFileSync('App.tsx', 'utf-8');

code = code.replace("Users\n} from 'lucide-react';", "Users,\n  Sun,\n  Moon\n} from 'lucide-react';");

// Add theme state and effect inside App component
const stateHookPos = code.indexOf('const [isAuthLoading, setIsAuthLoading] = useState(true);');
if (stateHookPos !== -1) {
  const themeState = `
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
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
  }, [theme]);

`;
  code = code.slice(0, stateHookPos) + themeState + code.slice(stateHookPos);
}

// Add the button
const buttonHtml = `
            <button
              onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
              className="w-10 h-10 bg-slate-900/80 border border-slate-800/50 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-all active:scale-95 shadow-lg"
              title={theme === 'dark' ? 'Mudar para Tema Claro' : 'Mudar para Tema Escuro'}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
`;

code = code.replace('<div className="flex items-center gap-3 shrink-0">', '<div className="flex items-center gap-3 shrink-0">' + buttonHtml);

fs.writeFileSync('App.tsx', code);
console.log("Updated App.tsx");
