const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

code = code.replace(
  /const App: React\.FC = \(\) => \{\s*const \{ theme, setTheme \} = useTheme\(\);/,
  `const App: React.FC = () => {\n  const { updateAvailable, reloadPage } = useVersionCheck();\n  const { theme, setTheme } = useTheme();`
);

fs.writeFileSync('App.tsx', code);
console.log('Hook added to App');
