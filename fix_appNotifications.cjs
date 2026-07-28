const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

// The line is: {appNotifications.map(n => (
code = code.replace(/\{appNotifications\.map\(n => \(/, '{notifications.map(n => (');

fs.writeFileSync('App.tsx', code);
