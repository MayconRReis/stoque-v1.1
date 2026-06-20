import fs from 'fs';

let code = fs.readFileSync('App.tsx', 'utf-8');

// Replace with regex to handle \r and whitespace
code = code.replace(/Users\r?\n\} from 'lucide-react';/s, "Users,\n  Sun,\n  Moon\n} from 'lucide-react';");

fs.writeFileSync('App.tsx', code);
console.log("Fixed lucide imports");
