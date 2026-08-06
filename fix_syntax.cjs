const fs = require('fs');
let code = fs.readFileSync('services/supabaseService.ts', 'utf8');

code = code.replace(
  `    };\n  }\n\n  async saveInventoryItem`,
  `    };\n  },\n\n  async saveInventoryItem`
);

fs.writeFileSync('services/supabaseService.ts', code);
console.log('Syntax fixed');
