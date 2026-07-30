const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

// We have:
// const { inventorySearch, ... } = useInventoryFilters(..., setData);
// const { data, setData, ... } = useWarehouseData(inventorySearch, ...);

// Let's use a proxy object or just declare `let setData;`? No, let's use a stable ref for setData.
// Wait, we can't change the hook's signature but we can change HOW we call it in App.tsx.

code = code.replace(
  "  const { notifications, setNotifications, showNotification } = useNotifications();",
  `  const { notifications, setNotifications, showNotification } = useNotifications();\n  const setDataRef = React.useRef<any>(null);\n  const handleSetData = React.useCallback((val: any) => setDataRef.current?.(val), []);`
);

code = code.replace(
  "useInventoryFilters(user, isPublicView, showNotification, setData);",
  "useInventoryFilters(user, isPublicView, showNotification, handleSetData);"
);

code = code.replace(
  "} = useWarehouseData(",
  `} = useWarehouseData(\n    (() => { setDataRef.current = setData; return inventoryPage; })(),`
);

fs.writeFileSync('App.tsx', code);
console.log('Fixed cyclic dependency via ref');
