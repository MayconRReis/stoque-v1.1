const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

const regex = /const inventoryChannel = supabaseService\.subscribeToInventory\(\(payload\) => \{[\s\S]*?\}\);/;
const replacement = `const inventoryChannel = supabaseService.subscribeToInventory((payload) => {
      if (payload.eventType === 'INSERT') {
        const newItem = mapInventoryItem(payload.new);
        setData(prev => {
          if (prev.find(r => r.id === newItem.id)) return prev;
          return [newItem, ...prev];
        });
        if (newItem.status === 'PENDING') {
          setPendingRows(prev => [newItem, ...prev]);
          showNotification('Novo pallet aguardando análise', 'info');
        }
      } else if (payload.eventType === 'UPDATE') {
        const updatedItem = mapInventoryItem(payload.new);
        setData(prev => prev.map(r => r.id === updatedItem.id ? updatedItem : r));
        if (updatedItem.status === 'PENDING') {
          setPendingRows(prev => {
            if (prev.find(r => r.id === updatedItem.id)) return prev.map(r => r.id === updatedItem.id ? updatedItem : r);
            return [updatedItem, ...prev];
          });
        } else {
          setPendingRows(prev => prev.filter(r => r.id !== updatedItem.id));
        }
      } else if (payload.eventType === 'DELETE') {
        setData(prev => prev.filter(r => r.id !== payload.old.id));
        setPendingRows(prev => prev.filter(r => r.id !== payload.old.id));
      }
    });

    const editRequestsChannel = supabaseService.subscribeToEditRequests((payload) => {
      if (payload.eventType === 'INSERT' && payload.new.status === 'pending') {
        setPendingApprovalsCount(prev => prev + 1);
        if (user?.role === 'admin') {
          showNotification('Nova solicitação de aprovação', 'info');
        }
      } else if (payload.eventType === 'UPDATE') {
        if (payload.old.status === 'pending' && payload.new.status !== 'pending') {
          setPendingApprovalsCount(prev => Math.max(0, prev - 1));
        } else if (payload.old.status !== 'pending' && payload.new.status === 'pending') {
          setPendingApprovalsCount(prev => prev + 1);
        }
      } else if (payload.eventType === 'DELETE' && payload.old.status === 'pending') {
        setPendingApprovalsCount(prev => Math.max(0, prev - 1));
      }
    });
`;

code = code.replace(regex, replacement);

const shipRegex = /const shipmentsChannel = supabaseService\.subscribeToShipments\(\(\) => \{\s*supabaseService\.getShipments\(\)\.then\(setShipments\);\s*\}\);/;
const shipReplacement = `const shipmentsChannel = supabaseService.subscribeToShipments((payload) => {
      supabaseService.getShipments().then(setShipments);
      if (payload && payload.eventType === 'INSERT' && payload.new.status === 'OPEN') {
        showNotification('Novo carregamento criado', 'info');
      }
    });`;

code = code.replace(shipRegex, shipReplacement);

// Add editRequestsChannel.unsubscribe() to the cleanup
code = code.replace(
  /inventoryChannel\.unsubscribe\(\);/,
  `inventoryChannel.unsubscribe();\n      editRequestsChannel.unsubscribe();`
);

fs.writeFileSync('App.tsx', code);
