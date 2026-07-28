const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

code = code.replace(/const notifications = \[/g, 'const appNotifications = [');
code = code.replace(/const totalNotifications = notifications\.reduce/g, 'const totalAppNotifications = appNotifications.reduce');
code = code.replace(/totalNotifications/g, 'totalAppNotifications');
code = code.replace(/notifications\.length > 0/g, 'appNotifications.length > 0');
code = code.replace(/notifications\.map/g, 'appNotifications.map');

fs.writeFileSync('App.tsx', code);
