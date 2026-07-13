const fs = require('fs');
let code = fs.readFileSync('services/supabaseService.ts', 'utf8');

const regex = /if \(searchData\) \{\s*const matchedRootIds = new Set<string>\(\);/g;

code = code.replace(regex, `if (searchData) {
          const matchedRootIds = new Set<string>();
          console.log('Search Data Count:', searchData.length, 'Search Term:', term);
`);

const regex2 = /if \(matchedRootIds\.size > 0\) \{/g;
code = code.replace(regex2, `console.log('Matched Root IDs:', Array.from(matchedRootIds));
          if (matchedRootIds.size > 0) {`);

fs.writeFileSync('services/supabaseService.ts', code);
