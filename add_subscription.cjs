const fs = require('fs');
let code = fs.readFileSync('services/supabaseService.ts', 'utf8');

const newSub = `
  subscribeToEditRequests(callback: (payload: any) => void) {
    if (!isSupabaseConfigured) return { unsubscribe: () => {} };
    return supabase
      .channel('edit-requests-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_edit_requests' }, callback)
      .subscribe();
  },
`;

code = code.replace(/subscribeToShipments\(callback: \(payload: any\) => void\) \{/, newSub + "  subscribeToShipments(callback: (payload: any) => void) {");

fs.writeFileSync('services/supabaseService.ts', code);
