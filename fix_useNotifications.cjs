const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

// Add import
const importStr = `import { disableSupabase } from './lib/supabase';`;
if (code.includes(importStr)) {
  code = code.replace(importStr, `import { disableSupabase } from './lib/supabase';\nimport { useNotifications } from './hooks/useNotifications';`);
}

// Replace state and function
const stateStr = `  const [notifications, setNotifications] = useState<{ id: string, message: string, type?: 'info' | 'error' | 'success' }[]>([]);`;
code = code.replace(stateStr, `  const { notifications, setNotifications, showNotification } = useNotifications();`);

const fnStr = `  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  };`;
code = code.replace(fnStr, ``);

fs.writeFileSync('App.tsx', code);
console.log('useNotifications applied');
