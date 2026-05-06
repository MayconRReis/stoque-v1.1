import { createClient } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { SheetRow, WarehouseSlot, HistoryEntry, StockStatus, SlotContent, HistoryType, Shipment, ShipmentType, ShipmentStatus, RotativeStockItem, DashboardStats, User } from '../types';

/**
 * SQL for Supabase Setup (Run this in Supabase SQL Editor):
 * 
 * -- 1. Create Tables
 * CREATE TABLE inventory (
 *   id TEXT PRIMARY KEY,
 *   loading_id TEXT NOT NULL,
 *   origin_op TEXT NOT NULL,
 *   description TEXT,
 *   lot TEXT,
 *   pallets INTEGER DEFAULT 0,
 *   date TEXT,
 *   status TEXT DEFAULT 'PENDING',
 *   inspections JSONB DEFAULT '[]'::jsonb,
 *   created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
 * );
 * 
 * CREATE TABLE warehouse_slots (
 *   id TEXT PRIMARY KEY,
 *   rack TEXT NOT NULL,
 *   level INTEGER NOT NULL,
 *   position INTEGER NOT NULL,
 *   status TEXT DEFAULT 'EMPTY',
 *   occupied_by TEXT,
 *   updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
 * );
 * 
 * CREATE TABLE history (
 *   id TEXT PRIMARY KEY,
 *   type TEXT NOT NULL,
 *   timestamp TEXT NOT NULL,
 *   loading_id TEXT NOT NULL,
 *   description TEXT,
 *   op TEXT,
 *   lot TEXT,
 *   pallet_number INTEGER,
 *   total_pallets INTEGER,
 *   slot TEXT,
 *   details TEXT,
 *   operator_name TEXT,
 *   created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
 * );
 * 
 * CREATE TABLE profiles (
 *   id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
 *   name TEXT,
 *   role TEXT DEFAULT 'operator',
 *   active BOOLEAN DEFAULT true,
 *   created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
 *   updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
 * );
 * 
 * -- Enable RLS for profiles
 * ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
 * 
 * -- Policies for profiles
 * CREATE POLICY "Profiles are viewable by authenticated users" 
 * ON public.profiles FOR SELECT TO authenticated USING (true);
 * 
 * CREATE POLICY "Only admins can update profiles" 
 * ON public.profiles FOR UPDATE TO authenticated 
 * USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
 * WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
 * 
 * CREATE POLICY "Only admins can insert profiles" 
 * ON public.profiles FOR INSERT TO authenticated 
 * WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
 * 
 * CREATE TABLE shipments (
 *   id TEXT PRIMARY KEY,
 *   type TEXT NOT NULL,
 *   status TEXT DEFAULT 'OPEN',
 *   created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
 *   scheduled_date TEXT,
 *   operator_name TEXT,
 *   closed_at TIMESTAMP WITH TIME ZONE
 * );
 * 
 * CREATE TABLE rotative_stock (
 *   id TEXT PRIMARY KEY,
 *   product_name TEXT NOT NULL,
 *   quantity INTEGER NOT NULL DEFAULT 0,
 *   slot_id TEXT NOT NULL REFERENCES warehouse_slots(id),
 *   type TEXT,
 *   updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
 * );
 * 
 * ALTER TABLE inventory ADD COLUMN shipment_id TEXT REFERENCES shipments(id);
 * 
 * -- 2. Disable RLS (or add policies)
 * ALTER TABLE inventory DISABLE ROW LEVEL SECURITY;
 * ALTER TABLE warehouse_slots DISABLE ROW LEVEL SECURITY;
 * ALTER TABLE history DISABLE ROW LEVEL SECURITY;
 * ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
 * ALTER TABLE shipments DISABLE ROW LEVEL SECURITY;
 * ALTER TABLE rotative_stock DISABLE ROW LEVEL SECURITY;
 */

export const supabaseService = {
  // Inventory
  async getInventory(): Promise<SheetRow[]> {
    if (!isSupabaseConfigured) return localStorageHelper.get('inventory');

    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.warn('Supabase getInventory failed, falling back to local storage:', error);
      return localStorageHelper.get('inventory');
    }
    const inventory = (data || []).map(item => ({
      id: item.id,
      loadingId: item.loading_id,
      originOP: item.origin_op,
      description: item.description,
      lot: item.lot,
      pallets: item.pallets,
      date: item.date,
      status: item.status as StockStatus,
      inspections: item.inspections || [],
      operatorName: item.operator_name
    }));
    localStorageHelper.save('inventory', inventory);
    return inventory;
  },

  async getInventoryPaginated(page: number, pageSize: number, filters?: { searchTerm?: string, typeFilter?: string }): Promise<{ data: SheetRow[], count: number }> {
    if (!isSupabaseConfigured) {
      const all = localStorageHelper.get('inventory');
      let filtered = [...all];
      if (filters?.searchTerm) {
        const originalTerm = filters.searchTerm.trim();
        const upperTerm = originalTerm.toUpperCase();
        const term = originalTerm.toLowerCase();
        const isSlot = /^[A-F](\.\d+){0,2}$/.test(upperTerm);

        filtered = filtered.filter(row => {
          const matchesText = 
            row.originOP.toLowerCase().includes(term) ||
            row.description.toLowerCase().includes(term) ||
            row.lot.toLowerCase().includes(term) ||
            row.id.toLowerCase().includes(term) ||
            row.loadingId?.toLowerCase().includes(term);
          
          if (matchesText) return true;
          
          if (isSlot) {
            return row.inspections?.some((i: any) => {
              const s = i.assignedSlot?.toUpperCase() || '';
              return s === upperTerm || s.startsWith(upperTerm + '.');
            });
          }

          return row.inspections?.some((i: any) => i.assignedSlot?.toLowerCase().includes(term));
        });
      }
      if (filters?.typeFilter && filters.typeFilter !== 'ALL') {
        filtered = filtered.filter(row => {
          if (filters.typeFilter === 'CONTAINER') {
             return row.inspections?.some((i: any) => 
               [SlotContent.CONTAINER_SJ, SlotContent.CONTAINER_LP, SlotContent.CONTAINER_CP].includes(i.contentType)
             );
          }
          return row.inspections?.some((i: any) => i.contentType === filters.typeFilter);
        });
      }

      const from = page * pageSize;
      const to = from + pageSize;
      return {
        data: filtered.slice(from, to),
        count: filtered.length
      };
    }

    const from = page * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('inventory')
      .select('*', { count: 'exact' });

    if (filters?.searchTerm) {
      const originalTerm = filters.searchTerm.trim();
      const upperTerm = originalTerm.toUpperCase();
      const termFragment = `%${originalTerm}%`;
      const isSlot = /^[A-F](\.\d+){0,2}$/.test(upperTerm);
      
      console.log('[Busca] Termo pesquisado:', originalTerm);
      console.log('[Busca] É padrão de vaga?', isSlot);

      let orClause = `origin_op.ilike.${termFragment},description.ilike.${termFragment},lot.ilike.${termFragment},id.ilike.${termFragment},loading_id.ilike.${termFragment}`;

      if (isSlot) {
        try {
          // Find all slot IDs that match the pattern
          const { data: slots } = await supabase
            .from('warehouse_slots')
            .select('id')
            .ilike('id', `${upperTerm}%`);
          
          if (slots && slots.length > 0) {
            const slotClauses = slots.map(s => `inspections.cs.[{"assignedSlot":"${s.id}"}]`);
            orClause += `,${slotClauses.join(',')}`;
            console.log(`[Busca] Encontradas ${slots.length} vagas correspondentes para o filtro.`);
          }
        } catch (e) {
          console.warn('Erro ao processar busca por vaga:', e);
        }
      }
      
      query = query.or(orClause);
    }

    if (filters?.typeFilter && filters.typeFilter !== 'ALL') {
      if (filters.typeFilter === 'CONTAINER') {
        const sj = JSON.stringify([{ contentType: SlotContent.CONTAINER_SJ }]);
        const lp = JSON.stringify([{ contentType: SlotContent.CONTAINER_LP }]);
        const cp = JSON.stringify([{ contentType: SlotContent.CONTAINER_CP }]);
        query = query.or(`inspections.cs.${sj},inspections.cs.${lp},inspections.cs.${cp}`);
      } else {
        query = query.filter('inspections', 'cs', JSON.stringify([{ contentType: filters.typeFilter }]));
      }
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('Supabase getInventoryPaginated error:', error);
      throw error;
    }

    const inventory = (data || []).map(item => ({
      id: item.id,
      loadingId: item.loading_id,
      originOP: item.origin_op,
      description: item.description,
      lot: item.lot,
      pallets: item.pallets,
      date: item.date,
      status: item.status as StockStatus,
      inspections: item.inspections || [],
      operatorName: item.operator_name
    }));

    return { data: inventory, count: count || 0 };
  },

  async getPendingInventory(): Promise<SheetRow[]> {
    if (!isSupabaseConfigured) return localStorageHelper.get('inventory').filter((r: any) => r.status === StockStatus.PENDING);
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .eq('status', 'PENDING')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(item => ({
      id: item.id,
      loadingId: item.loading_id,
      originOP: item.origin_op,
      description: item.description,
      lot: item.lot,
      pallets: item.pallets,
      date: item.date,
      status: item.status as StockStatus,
      inspections: item.inspections || [],
      operatorName: item.operator_name
    }));
  },

  async getWaitingInventory(): Promise<SheetRow[]> {
    if (!isSupabaseConfigured) return localStorageHelper.get('inventory');
    // We need to find items where inspections have assignedSlot === 'AGUARDANDO'
    // Since we can't easily filter by nested JSON array value in a simple .eq(), 
    // we fetch items that likely have it or just fetch and filter.
    // Given 'AGUARDANDO' is a specific use case, we fetch all non-pending and filter.
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .neq('status', 'PENDING');
    
    if (error) throw error;
    
    const inventory = (data || []).map(item => ({
      id: item.id,
      loadingId: item.loading_id,
      originOP: item.origin_op,
      description: item.description,
      lot: item.lot,
      pallets: item.pallets,
      date: item.date,
      status: item.status as StockStatus,
      inspections: item.inspections || [],
      operatorName: item.operator_name
    }));

    return inventory.filter(row => row.inspections?.some(insp => insp.assignedSlot === 'AGUARDANDO'));
  },

  async getInventoryItemById(id: string): Promise<SheetRow | null> {
    if (!isSupabaseConfigured) {
      const all = localStorageHelper.get('inventory');
      return all.find((r: any) => r.id === id) || null;
    }
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    return {
      id: data.id,
      loadingId: data.loading_id,
      originOP: data.origin_op,
      description: data.description,
      lot: data.lot,
      pallets: data.pallets,
      date: data.date,
      status: data.status as StockStatus,
      inspections: data.inspections || [],
      operatorName: data.operator_name
    };
  },

  async getInventoryItemByLoadingId(loadingId: string): Promise<SheetRow | null> {
    if (!isSupabaseConfigured) {
      const all = localStorageHelper.get('inventory');
      return all.find((r: any) => r.loadingId === loadingId) || null;
    }
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .eq('loading_id', loadingId)
      .maybeSingle(); // multiple might exist if not unique, but usually it is
    
    if (error) throw error;
    if (!data) return null;

    return {
      id: data.id,
      loadingId: data.loading_id,
      originOP: data.origin_op,
      description: data.description,
      lot: data.lot,
      pallets: data.pallets,
      date: data.date,
      status: data.status as StockStatus,
      inspections: data.inspections || [],
      operatorName: data.operator_name
    };
  },

  async getInventoryItemsByShipmentId(shipmentId: string): Promise<SheetRow[]> {
    if (!isSupabaseConfigured) {
      const all = localStorageHelper.get('inventory');
      return all.filter((r: any) => r.inspections?.some((i: any) => i.shipmentId === shipmentId || i.shipment_id === shipmentId));
    }
    
    // We fetch using both camelCase and snake_case to ensure we catch all records
    const [camelCaseRes, snakeCaseRes] = await Promise.all([
      supabase
        .from('inventory')
        .select('*')
        .filter('inspections', 'cs', JSON.stringify([{ shipmentId: shipmentId }])),
      supabase
        .from('inventory')
        .select('*')
        .filter('inspections', 'cs', JSON.stringify([{ shipment_id: shipmentId }]))
    ]);

    if (camelCaseRes.error) throw camelCaseRes.error;
    if (snakeCaseRes.error) throw snakeCaseRes.error;

    // Merge results and remove duplicates (some items might have both or we might have fetched them twice)
    const combinedData = [...(camelCaseRes.data || []), ...(snakeCaseRes.data || [])];
    const uniqueMap = new Map<string, any>();
    combinedData.forEach(item => uniqueMap.set(item.id, item));
    
    return Array.from(uniqueMap.values()).map(item => ({
      id: item.id,
      loadingId: item.loading_id,
      originOP: item.origin_op,
      description: item.description,
      lot: item.lot,
      pallets: item.pallets,
      date: item.date,
      status: item.status as StockStatus,
      inspections: item.inspections || [],
      operatorName: item.operator_name
    }));
  },

  async getInventoryItemsByIds(ids: string[]): Promise<SheetRow[]> {
    if (!isSupabaseConfigured) {
      const all = localStorageHelper.get('inventory');
      return all.filter((r: any) => ids.includes(r.id));
    }
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .in('id', ids);
    
    if (error) throw error;

    return (data || []).map(item => ({
      id: item.id,
      loadingId: item.loading_id,
      originOP: item.origin_op,
      description: item.description,
      lot: item.lot,
      pallets: item.pallets,
      date: item.date,
      status: item.status as StockStatus,
      inspections: item.inspections || [],
      operatorName: item.operator_name
    }));
  },

  async getAllInventoryForExport(filters?: { searchTerm?: string, typeFilter?: string }): Promise<SheetRow[]> {
    if (!isSupabaseConfigured) return localStorageHelper.get('inventory');

    let query = supabase
      .from('inventory')
      .select('*');

    if (filters?.searchTerm) {
      const originalTerm = filters.searchTerm.trim();
      const upperTerm = originalTerm.toUpperCase();
      const termFragment = `%${originalTerm}%`;
      const isSlot = /^[A-F](\.\d+){0,2}$/.test(upperTerm);
      
      let orClause = `origin_op.ilike.${termFragment},description.ilike.${termFragment},lot.ilike.${termFragment},id.ilike.${termFragment},loading_id.ilike.${termFragment}`;

      if (isSlot) {
        try {
          const { data: slots } = await supabase
            .from('warehouse_slots')
            .select('id')
            .ilike('id', `${upperTerm}%`);
          
          if (slots && slots.length > 0) {
            const slotClauses = slots.map(s => `inspections.cs.[{"assignedSlot":"${s.id}"}]`);
            orClause += `,${slotClauses.join(',')}`;
          }
        } catch (e) {
          console.warn('Erro ao processar busca por vaga (export):', e);
        }
      }
      
      query = query.or(orClause);
    }

    if (filters?.typeFilter && filters.typeFilter !== 'ALL') {
      if (filters.typeFilter === 'CONTAINER') {
        const sj = JSON.stringify([{ contentType: SlotContent.CONTAINER_SJ }]);
        const lp = JSON.stringify([{ contentType: SlotContent.CONTAINER_LP }]);
        const cp = JSON.stringify([{ contentType: SlotContent.CONTAINER_CP }]);
        query = query.or(`inspections.cs.${sj},inspections.cs.${lp},inspections.cs.${cp}`);
      } else {
        query = query.filter('inspections', 'cs', JSON.stringify([{ contentType: filters.typeFilter }]));
      }
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;

    return (data || []).map(item => ({
      id: item.id,
      loadingId: item.loading_id,
      originOP: item.origin_op,
      description: item.description,
      lot: item.lot,
      pallets: item.pallets,
      date: item.date,
      status: item.status as StockStatus,
      inspections: item.inspections || [],
      operatorName: item.operator_name
    }));
  },

  async getGlobalStats(): Promise<DashboardStats> {
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
        openShipmentsCount: 0
      };
    }

    const results = await Promise.all([
      supabase.from('warehouse_slots').select('*', { count: 'exact', head: true }),
      supabase.from('warehouse_slots').select('*', { count: 'exact', head: true }).neq('status', 'EMPTY'),
      supabase.from('inventory').select('*', { count: 'exact', head: true }).eq('status', 'PENDING'),
      supabase.from('shipments').select('*', { count: 'exact', head: true }).eq('status', 'OPEN'),
      supabase.from('history').select('*', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
      supabase.from('shipments').select('*', { count: 'exact', head: true }).eq('status', 'CLOSED').gte('closed_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
      supabase.from('inventory').select('inspections') 
    ]);

    const totalSlotsCount = results[0].count || 0;
    const occupiedSlotsCount = results[1].count || 0;
    const pendingCount = results[2].count || 0;
    const openShipments = results[3].count || 0;
    const movements24h = results[4].count || 0;
    const finishedShipments = results[5].count || 0;
    const allInspections = results[6].data || [];

    let totalBottles = 0;
    let waitingPallets = 0;

    allInspections.forEach(item => {
      (item.inspections || []).forEach((insp: any) => {
        totalBottles += (insp.bottles || 0);
        if (insp.assignedSlot === 'AGUARDANDO') {
          waitingPallets += 1;
        }
      });
    });

    return {
      totalSlots: totalSlotsCount,
      occupiedSlots: occupiedSlotsCount,
      freeSlots: totalSlotsCount - occupiedSlotsCount,
      occupancyRate: totalSlotsCount > 0 ? Math.round((occupiedSlotsCount / totalSlotsCount) * 100) : 0,
      pendingEntries: pendingCount,
      openShipmentsCount: openShipments,
      dailyMovements: movements24h,
      finishedShipments24h: finishedShipments,
      totalBottles,
      waitingPallets
    };
  },

  async saveInventoryItem(item: SheetRow) {
    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('inventory')
        .upsert({
          id: item.id,
          loading_id: item.loadingId,
          origin_op: item.originOP,
          description: item.description,
          lot: item.lot,
          pallets: item.pallets,
          date: item.date,
          status: item.status,
          inspections: item.inspections || [],
          operator_name: item.operatorName
        });
      
      if (error) {
        console.error('Supabase saveInventoryItem error:', error);
      }
    }
    localStorageHelper.update('inventory', item);
  },

  async deleteInventoryItem(id: string) {
    const { error } = await supabase
      .from('inventory')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // Slots
  async getSlots(): Promise<WarehouseSlot[]> {
    if (!isSupabaseConfigured) return localStorageHelper.get('warehouse_slots');

    const { data, error } = await supabase
      .from('warehouse_slots')
      .select('*')
      .order('rack')
      .order('level')
      .order('position');
    
    if (error) {
      console.warn('Supabase getSlots failed, falling back to local storage:', error);
      return localStorageHelper.get('warehouse_slots');
    }
    const slots = (data || []).map(slot => ({
      id: slot.id,
      rack: slot.rack as any,
      level: slot.level,
      position: slot.position,
      status: slot.status as SlotContent,
      occupiedBy: slot.occupied_by
    }));
    localStorageHelper.save('warehouse_slots', slots);
    return slots;
  },

  async getSlotById(id: string): Promise<WarehouseSlot | null> {
    if (!isSupabaseConfigured) {
      const all = localStorageHelper.get('warehouse_slots');
      return all.find((s: any) => s.id === id) || null;
    }
    const { data, error } = await supabase
      .from('warehouse_slots')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    
    if (error) throw error;
    if (!data) return null;

    return {
      id: data.id,
      rack: data.rack as any,
      level: data.level,
      position: data.position,
      status: data.status as SlotContent,
      occupiedBy: data.occupied_by
    };
  },

  async updateSlot(slot: WarehouseSlot) {
    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('warehouse_slots')
        .upsert({
          id: slot.id,
          rack: slot.rack,
          level: slot.level,
          position: slot.position,
          status: slot.status,
          occupied_by: slot.occupiedBy,
          updated_at: new Date().toISOString()
        });
      
      if (error) {
        console.error('Supabase updateSlot error:', error);
      }
    }
    localStorageHelper.update('warehouse_slots', slot);
  },

  async bulkUpdateSlots(slots: WarehouseSlot[]) {
    const { error } = await supabase
      .from('warehouse_slots')
      .upsert(slots.map(slot => ({
        id: slot.id,
        rack: slot.rack,
        level: slot.level,
        position: slot.position,
        status: slot.status,
        occupied_by: slot.occupiedBy,
        updated_at: new Date().toISOString()
      })))
      .select();
    if (error) throw error;
  },

  // History
  async getHistory(): Promise<HistoryEntry[]> {
    if (!isSupabaseConfigured) return localStorageHelper.get('history');

    const { data, error } = await supabase
      .from('history')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.warn('Supabase getHistory failed, falling back to local storage:', error);
      return localStorageHelper.get('history');
    }
    const history = (data || []).map(entry => ({
      id: entry.id,
      type: entry.type as HistoryType,
      timestamp: entry.timestamp,
      loadingId: entry.loading_id,
      description: entry.description,
      op: entry.op,
      lot: entry.lot,
      palletNumber: entry.pallet_number,
      totalPallets: entry.total_pallets,
      slot: entry.slot,
      details: entry.details,
      operatorName: entry.operator_name
    }));
    localStorageHelper.save('history', history);
    return history;
  },

  async addHistoryEntry(entry: HistoryEntry) {
    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('history')
        .insert({
          id: entry.id,
          type: entry.type,
          timestamp: entry.timestamp,
          loading_id: entry.loadingId,
          description: entry.description,
          op: entry.op,
          lot: entry.lot,
          pallet_number: entry.palletNumber,
          total_pallets: entry.totalPallets,
          slot: entry.slot,
          details: entry.details,
          operator_name: entry.operatorName
        });
      
      if (error) {
        console.error('Supabase addHistoryEntry error:', error);
      }
    }
    localStorageHelper.add('history', entry);
  },

  // Auth
  async signIn(username: string, password: string) {
    if (!isSupabaseConfigured) {
      // Mock login for offline mode
      const mockUser = {
        id: 'offline-user',
        email: `${username}@stoqueplus.com`,
      };
      localStorage.setItem('stoque_plus_logged_user', JSON.stringify({
        id: mockUser.id,
        name: username,
        role: username.toLowerCase() === 'admin' ? 'admin' : 'operator'
      }));
      return { user: mockUser, session: { access_token: 'mock-token' } };
    }

    // We append a domain to the username to use Supabase Auth's email system
    const email = `${username.toLowerCase().trim()}@stoqueplus.com`;
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  async signOut() {
    if (!isSupabaseConfigured) {
      localStorage.removeItem('stoque_plus_logged_user');
      return;
    }
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getCurrentUser() {
    if (!isSupabaseConfigured) {
      const localUser = localStorage.getItem('stoque_plus_logged_user');
      return localUser ? JSON.parse(localUser) : null;
    }

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) return null;

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) return null;
      
      // Get profile info (name)
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      
      if (!profile) {
        // If profile doesn't exist but user does, create a default one
        const newProfile = {
          id: user.id,
          name: user.email?.split('@')[0] || 'Usuário',
          role: 'operator',
          active: true
        };
        await supabase.from('profiles').insert(newProfile);
        return {
          id: user.id,
          name: newProfile.name,
          role: 'operator'
        } as User;
      }

      if (!profile.active) {
        await this.signOut();
        throw new Error('Sua conta está desativada. Entre em contato com o administrador.');
      }

      return {
        id: user.id,
        name: profile.name || user.email?.split('@')[0] || 'Usuário',
        role: profile.role || 'operator'
      } as User;
    } catch (error) {
      console.error('Error in getCurrentUser:', error);
      return null;
    }
  },

  async getProfiles() {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return (data || []).map(p => ({
      id: p.id,
      name: p.name,
      role: p.role,
      active: p.active,
      createdAt: p.created_at
    }));
  },

  async updateProfile(id: string, updates: { name?: string, role?: string, active?: boolean }) {
    if (isSupabaseConfigured) {
      // Step 0: Verify if current user is admin
      const currentUser = await this.getCurrentUser();
      if (!currentUser || currentUser.role !== 'admin') {
        throw new Error('Apenas administradores podem gerenciar perfis.');
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      
      if (error) throw error;
    }
  },

  async signUpNewUser(username: string, name: string, password: string, role: 'admin' | 'operator') {
    if (!isSupabaseConfigured) {
      throw new Error('O Supabase não está configurado.');
    }

    // Step 0: Verify if current user is admin
    const currentUser = await this.getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      throw new Error('Apenas administradores podem criar novos usuários.');
    }

    const email = `${username.toLowerCase().trim()}@stoqueplus.com`;
    
    // Step 1: Create a temporary client that doesn't persist session
    // This prevents the admin from being logged out when creating a new user
    const tempClient = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false
        }
      }
    );

    // Step 2: Sign up in Auth using the temp client
    const { data: signUpData, error: signUpError } = await tempClient.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name
        }
      }
    });

    if (signUpError) throw signUpError;
    if (!signUpData.user) throw new Error('Não foi possível criar o usuário no Auth.');

    // Step 3: Create the profile using the MAIN supabase client (authenticating as Admin)
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: signUpData.user.id,
        name: name,
        role: role,
        active: true
      });
    
    if (profileError) throw profileError;
    
    return signUpData;
  },

  // Edit Requests
  async createEditRequest(request: {
    inventory_id: string,
    requested_by: string,
    before_data: any,
    after_data: any,
    reason: string
  }) {
    if (!isSupabaseConfigured) throw new Error('O Supabase não está configurado.');
    const { data, error } = await supabase
      .from('inventory_edit_requests')
      .insert(request)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async findPalletByLoadingId(id: string) {
    if (!isSupabaseConfigured) {
      const all = localStorageHelper.get('inventory');
      return all.find((row: any) => row.loadingId === id || row.id === id) || null;
    }

    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .or(`loading_id.eq."${id}",id.eq."${id}"`)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    // Map to application standard
    return {
      id: data.id,
      loadingId: data.loading_id,
      originOP: data.origin_op,
      description: data.description,
      lot: data.lot,
      pallets: data.pallets,
      date: data.date || data.created_at,
      status: data.status as StockStatus,
      operatorName: data.operator_name,
      inspections: data.inspections || [],
    } as SheetRow;
  },

  async getEditRequests(): Promise<any[]> {
    if (!isSupabaseConfigured) return [];
    
    // Using a manual join approach since simple joins depend on FK structure and Supabase config
    // First, get the requests
    const { data: requests, error } = await supabase
      .from('inventory_edit_requests')
      .select('*')
      .order('requested_at', { ascending: false });
    
    if (error) throw error;
    if (!requests || requests.length === 0) return [];

    // Get all relevant profiles and inventory items to "join" them manually
    const userIds = [...new Set([
      ...requests.map(r => r.requested_by),
      ...requests.map(r => r.reviewed_by).filter(Boolean)
    ])];
    
    const inventoryIds = [...new Set(requests.map(r => r.inventory_id))];

    const [profilesRes, inventoryRes] = await Promise.all([
      supabase.from('profiles').select('id, name').in('id', userIds),
      supabase.from('inventory').select('id, description').in('id', inventoryIds)
    ]);

    const profilesMap = new Map((profilesRes.data || []).map(p => [p.id, p.name]));
    const inventoryMap = new Map((inventoryRes.data || []).map(i => [i.id, i.description]));

    return requests.map(r => ({
      ...r,
      requester_name: profilesMap.get(r.requested_by) || 'Desconhecido',
      reviewer_name: r.reviewed_by ? profilesMap.get(r.reviewed_by) : undefined,
      product_description: inventoryMap.get(r.inventory_id) || 'Produto não encontrado'
    }));
  },

  async processEditRequest(requestId: string, adminId: string, status: 'approved' | 'rejected', adminComment?: string) {
    if (!isSupabaseConfigured) throw new Error('O Supabase não está configurado.');

    // 1. Get the request
    const { data: request, error: fetchError } = await supabase
      .from('inventory_edit_requests')
      .select('*')
      .eq('id', requestId)
      .single();
    
    if (fetchError) throw fetchError;

    // 2. If approved, apply changes to inventory
    if (status === 'approved') {
      const { error: updateError } = await supabase
        .from('inventory')
        .update({
          loading_id: request.after_data.loadingId,
          origin_op: request.after_data.originOP,
          description: request.after_data.description,
          lot: request.after_data.lot,
          pallets: request.after_data.pallets,
          status: request.after_data.status,
          inspections: request.after_data.inspections
        })
        .eq('id', request.inventory_id);
      
      if (updateError) throw updateError;
    }

    // 3. Update the request status
    const { error: statusError } = await supabase
      .from('inventory_edit_requests')
      .update({
        status,
        reviewed_by: adminId,
        reviewed_at: new Date().toISOString(),
        admin_comment: adminComment
      })
      .eq('id', requestId);
    
    if (statusError) throw statusError;
  },

  // Real-time Subscriptions
  subscribeToInventory(callback: (payload: any) => void) {
    if (!isSupabaseConfigured) return { unsubscribe: () => {} };
    return supabase
      .channel('inventory-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory' }, callback)
      .subscribe();
  },

  subscribeToSlots(callback: (payload: any) => void) {
    if (!isSupabaseConfigured) return { unsubscribe: () => {} };
    return supabase
      .channel('slot-changes')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'warehouse_slots' }, callback)
      .subscribe();
  },

  subscribeToNotifications(callback: (payload: any) => void) {
    if (!isSupabaseConfigured) return { unsubscribe: () => {} };
    const channel = supabase.channel('app-notifications');
    channel
      .on('broadcast', { event: 'pallet-change' }, ({ payload }) => callback(payload))
      .subscribe();
    return channel;
  },

  broadcastNotification(payload: { user: string, message: string, type?: string }) {
    if (!isSupabaseConfigured) return;
    supabase.channel('app-notifications').send({
      type: 'broadcast',
      event: 'pallet-change',
      payload
    });
  },

  // Shipments
  async getShipments(): Promise<Shipment[]> {
    if (!isSupabaseConfigured) return localStorageHelper.get('shipments');

    const { data, error } = await supabase
      .from('shipments')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
       console.warn('Supabase getShipments failed, falling back to local storage:', error);
       return localStorageHelper.get('shipments');
    }
    const shipments = (data || []).map(s => ({
      id: s.id,
      type: s.type as ShipmentType,
      status: s.status as ShipmentStatus,
      createdAt: s.created_at,
      scheduledDate: s.scheduled_date,
      operatorName: s.operator_name,
      closedAt: s.closed_at
    }));
    localStorageHelper.save('shipments', shipments);
    return shipments;
  },

  async saveShipment(shipment: Shipment) {
    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('shipments')
        .upsert({
          id: shipment.id,
          type: shipment.type,
          status: shipment.status,
          created_at: shipment.createdAt,
          scheduled_date: shipment.scheduledDate,
          operator_name: shipment.operatorName,
          closed_at: shipment.closedAt
        });
      
      if (error) console.error('Supabase saveShipment error:', error);
    }
    localStorageHelper.update('shipments', shipment);
  },

  async deleteShipment(shipmentId: string) {
    // 1. Unlink all inventory items from this shipment
    const items = await this.getInventoryItemsByShipmentId(shipmentId);
    
    for (const item of items) {
      const updatedInspections = (item.inspections || []).map((insp: any) => {
        if (insp.shipmentId === shipmentId || insp.shipment_id === shipmentId) {
          const newInsp = { ...insp };
          delete newInsp.shipmentId;
          delete newInsp.shipment_id;
          return newInsp;
        }
        return insp;
      });

      const { error: updateError } = await supabase
        .from('inventory')
        .update({ inspections: updatedInspections })
        .eq('id', item.id);
      
      if (updateError) throw updateError;
    }

    // 2. Delete the shipment record
    const { error: deleteError } = await supabase
      .from('shipments')
      .delete()
      .eq('id', shipmentId);
    
    if (deleteError) throw deleteError;
  },

  async updateInventoryShipment(selections: { rowId: string, palletIdx: number }[], shipmentId: string | null) {
    // Group by rowId to minimize database calls
    const grouped = selections.reduce((acc, sel) => {
      if (!acc[sel.rowId]) acc[sel.rowId] = [];
      acc[sel.rowId].push(sel.palletIdx);
      return acc;
    }, {} as Record<string, number[]>);

    for (const rowId in grouped) {
      // 1. Get current item
      const { data: item, error: getError } = await supabase
        .from('inventory')
        .select('inspections')
        .eq('id', rowId)
        .single();
      
      if (getError) throw getError;

      // 2. Update inspections array
      const inspections = [...(item.inspections || [])];
      grouped[rowId].forEach(idx => {
        if (inspections[idx]) {
          if (shipmentId === null) {
            const newInsp = { ...inspections[idx] };
            delete newInsp.shipmentId;
            delete (newInsp as any).shipment_id;
            inspections[idx] = newInsp;
          } else {
            inspections[idx] = { ...inspections[idx], shipmentId: shipmentId };
          }
        }
      });

      // 3. Save back
      const { error: updateError } = await supabase
        .from('inventory')
        .update({ inspections })
        .eq('id', rowId);
      
      if (updateError) throw updateError;
    }
  },

  async getShipmentPalletCounts(): Promise<Record<string, number>> {
    if (!isSupabaseConfigured) return {};
    const { data, error } = await supabase
      .from('inventory')
      .select('inspections');
    
    if (error) throw error;
    
    const counts: Record<string, number> = {};
    data?.forEach(row => {
      row.inspections?.forEach((insp: any) => {
        const sId = insp.shipmentId || insp.shipment_id;
        if (sId) {
          counts[sId] = (counts[sId] || 0) + 1;
        }
      });
    });
    return counts;
  },

  // Rotative Stock
  async getRotativeStock(): Promise<RotativeStockItem[]> {
    if (!isSupabaseConfigured) return localStorageHelper.get('rotative_stock');

    const { data, error } = await supabase
      .from('rotative_stock')
      .select('*')
      .order('updated_at', { ascending: false });
    
    if (error) {
       console.warn('Supabase getRotativeStock failed, falling back to local storage:', error);
       return localStorageHelper.get('rotative_stock');
    }
    const rotativeStock = (data || []).map(item => ({
      id: item.id,
      productName: item.product_name,
      quantity: item.quantity,
      slotId: item.slot_id,
      type: item.type || 'Frasco',
      updatedAt: item.updated_at
    }));
    localStorageHelper.save('rotative_stock', rotativeStock);
    return rotativeStock;
  },

  async saveRotativeStockItem(item: RotativeStockItem) {
    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('rotative_stock')
        .upsert({
          id: item.id,
          product_name: item.productName,
          quantity: item.quantity,
          slot_id: item.slotId,
          type: item.type,
          updated_at: new Date().toISOString()
        });
      
      if (error) console.error('Supabase saveRotativeStockItem error:', error);
    }
    localStorageHelper.update('rotative_stock', item);
  },

  async deleteRotativeStockItem(id: string) {
    const { error } = await supabase
      .from('rotative_stock')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  subscribeToRotativeStock(callback: (payload: any) => void) {
    return supabase
      .channel('rotative-stock-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rotative_stock' }, callback)
      .subscribe();
  },

  subscribeToShipments(callback: (payload: any) => void) {
    return supabase
      .channel('shipment-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shipments' }, callback)
      .subscribe();
  }
};

const localStorageHelper = {
  get: (key: string) => {
    const data = localStorage.getItem(`stoque_plus_${key}`);
    return data ? JSON.parse(data) : [];
  },
  save: (key: string, data: any) => {
    localStorage.setItem(`stoque_plus_${key}`, JSON.stringify(data));
  },
  add: (key: string, item: any) => {
    const data = localStorageHelper.get(key);
    localStorageHelper.save(key, [item, ...data]);
  },
  update: (key: string, item: any, idField: string = 'id') => {
    const data = localStorageHelper.get(key);
    const index = data.findIndex((i: any) => i[idField] === item[idField]);
    if (index !== -1) {
      data[index] = item;
      localStorageHelper.save(key, data);
    } else {
      localStorageHelper.add(key, item);
    }
  },
  remove: (key: string, id: string, idField: string = 'id') => {
    const data = localStorageHelper.get(key);
    localStorageHelper.save(key, data.filter((i: any) => i[idField] !== id));
  }
};
