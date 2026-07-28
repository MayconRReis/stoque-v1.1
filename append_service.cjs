const fs = require('fs');
let code = fs.readFileSync('services/supabaseService.ts', 'utf8');

const newMethod = `
  async getPendingEditRequestsCount(): Promise<number> {
    if (!isSupabaseConfigured) return 0;
    const { count, error } = await supabase
      .from('inventory_edit_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');
    
    if (error) {
      console.error('Error fetching pending edit requests count:', error);
      return 0;
    }
    return count || 0;
  },
`;

code = code.replace(/async getEditRequests\(\)/, newMethod + "  async getEditRequests()");
fs.writeFileSync('services/supabaseService.ts', code);
