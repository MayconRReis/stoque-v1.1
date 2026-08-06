const fs = require('fs');
let code = fs.readFileSync('services/supabaseService.ts', 'utf8');

const oldFuncStart = code.indexOf('async getGlobalStats(): Promise<DashboardStats> {');
const nextFuncStart = code.indexOf('async saveInventoryItem(item: SheetRow) {');
const oldFunc = code.substring(oldFuncStart, nextFuncStart);

const newFunc = `async getGlobalStats(): Promise<DashboardStats> {
    if (!isSupabaseConfigured) {
      // Basic mock fallback for offline
      return {
        totalSlots: 264,
        freeSlots: 200,
        pendingEntries: 0,
        occupancyRate: 24,
        dailyMovements: 0,
        occupiedSlots: 64,
        totalBottles: 0,
        waitingPallets: 0,
        finishedShipments24h: 0,
        productDistribution: {},
        uniqueSkuCount: 0
      };
    }

    const results = await Promise.all([
      supabase.from('warehouse_slots').select('id, status'),
      applyInventoryFilter(supabase.from('inventory').select('*', { count: 'exact', head: true }), 'ROOT_ONLY').eq('status', 'PENDING'),
      supabase.from('history').select('*', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
      supabase.from('shipments').select('*', { count: 'exact', head: true }).eq('status', 'CLOSED').gte('closed_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
      applyInventoryFilter(supabase.from('inventory').select('inspections, parent_group_id, origin_op'), 'ROOT_ONLY') 
    ]);

    const allSlots = results[0].data || [];
    const pendingCount = results[1].count || 0;
    const movements24h = results[2].count || 0;
    const finishedShipments = results[3].count || 0;
    const allInspections = (results[4].data || []).filter(item => Array.isArray(item.inspections) && item.inspections.length > 0);

    // Filter slots by category
    const generalSlots = allSlots.filter(s => s.id.startsWith('A') || s.id.startsWith('B') || s.id.startsWith('C') || s.id.startsWith('D') || s.id.startsWith('E') || s.id.startsWith('F'));

    const totalGeneral = generalSlots.length;
    const occupiedGeneralPhysical = generalSlots.filter(s => s.status !== 'EMPTY').length;
    
    let totalBottles = 0;
    let waitingPallets = 0;
    const productDistribution: Record<string, number> = {};
    const uniqueOps = new Set<string>();

    const opRegex = /\\b\\d{3}-\\d{3}\\b/;

    allInspections.forEach(item => {
      // Find OPs
      if (item.origin_op) {
        const match = item.origin_op.match(opRegex);
        if (match) {
          uniqueOps.add(match[0]);
        }
      }

      (item.inspections || []).forEach((insp: any) => {
        totalBottles += (insp.bottles || 0);
        if (insp.assignedSlot === 'AGUARDANDO') {
          waitingPallets += 1;
        }
        
        // Count content type distribution
        const type = insp.contentType || 'OTHER';
        productDistribution[type] = (productDistribution[type] || 0) + 1;
      });
    });

    return {
      totalSlots: totalGeneral,
      occupiedSlots: occupiedGeneralPhysical + waitingPallets,
      freeSlots: totalGeneral - occupiedGeneralPhysical,
      occupancyRate: totalGeneral > 0 ? Math.round(((occupiedGeneralPhysical + waitingPallets) / totalGeneral) * 100) : 0,
      
      pendingEntries: pendingCount,
      dailyMovements: movements24h,
      finishedShipments24h: finishedShipments,
      totalBottles,
      waitingPallets,
      productDistribution,
      uniqueSkuCount: uniqueOps.size
    };
  }

  `;

code = code.replace(oldFunc, newFunc);
fs.writeFileSync('services/supabaseService.ts', code);
console.log('Stats updated');
