const fs = require('fs');
let code = fs.readFileSync('services/supabaseService.ts', 'utf8');

const searchRegex = /query = query\.in\('id', Array\.from\(matchedRootIds\)\);/g;

code = code.replace(searchRegex, `
            const idsArray = Array.from(matchedRootIds);
            // Limit to 100 to prevent URI Too Long (Failed to fetch)
            query = query.in('id', idsArray.slice(0, 100));
`);

fs.writeFileSync('services/supabaseService.ts', code);
