const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');
const lines = code.split('\n');

const startIndex = lines.findIndex(l => l.includes('const checkAuth = async () => {'));
if (startIndex !== -1) {
  // It's inside a useEffect. Find the surrounding useEffect:
  let ueStart = startIndex - 1;
  while(ueStart > 0 && !lines[ueStart].includes('useEffect(() => {')) {
    ueStart--;
  }
  
  let ueEnd = startIndex;
  while(ueEnd < lines.length && !lines[ueEnd].includes('}, []);')) {
    ueEnd++;
  }
  
  lines.splice(ueStart, ueEnd - ueStart + 1);
  fs.writeFileSync('App.tsx', lines.join('\n'));
  console.log('Removed checkAuth useEffect');
}
