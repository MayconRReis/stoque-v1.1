const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

const lines = code.split('\n');

// Remove original state declarations that start around line 163-169
// We will look for them and remove
const uIdx = lines.findIndex(l => l.includes("const [user, setUser] = useState<AppUser | null>(null);"));
if (uIdx !== -1) lines.splice(uIdx, 1);

const lIdx = lines.findIndex(l => l.includes("const [isAuthLoading, setIsAuthLoading] = useState(true);"));
if (lIdx !== -1) lines.splice(lIdx, 1);

const pIdx = lines.findIndex(l => l.includes("const [isPublicView, setIsPublicView] = useState(false);"));
if (pIdx !== -1) lines.splice(pIdx, 1);

// Look for our added hook: const { user, setUser, isAuthLoading, isPublicView, setIsPublicView } = useAuth(showNotification);
// Make sure it is positioned AFTER useNotifications and showNotification are defined.
// First remove it if it exists.
const hookIdx = lines.findIndex(l => l.includes("useAuth(showNotification);"));
if (hookIdx !== -1) {
  lines.splice(hookIdx, 1);
}

// Insert it after `const { notifications, setNotifications, showNotification } = useNotifications();`
const notifIdx = lines.findIndex(l => l.includes("const { notifications, setNotifications, showNotification } = useNotifications();"));
if (notifIdx !== -1) {
  lines.splice(notifIdx + 1, 0, "  const { user, setUser, isAuthLoading, isPublicView, setIsPublicView } = useAuth(showNotification);");
}

fs.writeFileSync('App.tsx', lines.join('\n'));
console.log('App.tsx cleaned');
