import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { SheetRow, WarehouseSlot, HistoryEntry, StockStatus, SlotContent, HistoryType, Shipment, ShipmentType, ShipmentStatus, RotativeStockItem } from '../types';

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
 *   updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
 * );
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
        const term = filters.searchTerm.toLowerCase();
        filtered = filtered.filter(row => 
          row.originOP.toLowerCase().includes(term) ||
          row.description.toLowerCase().includes(term) ||
          row.lot.toLowerCase().includes(term) ||
          row.id.toLowerCase().includes(term)
        );
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
      const term = `%${filters.searchTerm}%`;
      query = query.or(`origin_op.ilike.${term},description.ilike.${term},lot.ilike.${term},id.ilike.${term}`);
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

  async getAllInventoryForExport(filters?: { searchTerm?: string, typeFilter?: string }): Promise<SheetRow[]> {
    if (!isSupabaseConfigured) return localStorageHelper.get('inventory');

    let query = supabase
      .from('inventory')
      .select('*');

    if (filters?.searchTerm) {
      const term = `%${filters.searchTerm}%`;
      query = query.or(`origin_op.ilike.${term},description.ilike.${term},lot.ilike.${term},id.ilike.${term}`);
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
        .single();
        
      return {
        id: user.id,
        name: profile?.name || user.email?.split('@')[0] || 'Usuário',
        role: profile?.role || 'operator'
      };
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
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
    const { data: items, error: fetchError } = await supabase
      .from('inventory')
      .select('*');
    
    if (fetchError) throw fetchError;

    const updates = (items || []).filter(item => {
      return (item.inspections || []).some((insp: any) => 
        insp.shipmentId === shipmentId || insp.shipment_id === shipmentId
      );
    });

    for (const item of updates) {
      const updatedInspections = item.inspections.map((insp: any) => {
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
          inspections[idx] = { ...inspections[idx], shipmentId: shipmentId || undefined };
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
