import { supabase } from '../lib/supabase';
import { SheetRow, WarehouseSlot, HistoryEntry, StockStatus, SlotContent, HistoryType, Shipment, ShipmentType, ShipmentStatus } from '../types';

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
 * ALTER TABLE inventory ADD COLUMN shipment_id TEXT REFERENCES shipments(id);
 * 
 * -- 2. Disable RLS (or add policies)
 * ALTER TABLE inventory DISABLE ROW LEVEL SECURITY;
 * ALTER TABLE warehouse_slots DISABLE ROW LEVEL SECURITY;
 * ALTER TABLE history DISABLE ROW LEVEL SECURITY;
 * ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
 * ALTER TABLE shipments DISABLE ROW LEVEL SECURITY;
 */

export const supabaseService = {
  // Inventory
  async getInventory(): Promise<SheetRow[]> {
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
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

  async saveInventoryItem(item: SheetRow) {
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
      throw new Error(`Erro ao salvar item no estoque: ${error.message} (${error.details || 'Sem detalhes'})`);
    }
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
    const { data, error } = await supabase
      .from('warehouse_slots')
      .select('*')
      .order('rack')
      .order('level')
      .order('position');
    
    if (error) throw error;
    return (data || []).map(slot => ({
      id: slot.id,
      rack: slot.rack as any,
      level: slot.level,
      position: slot.position,
      status: slot.status as SlotContent,
      occupiedBy: slot.occupied_by
    }));
  },

  async updateSlot(slot: WarehouseSlot) {
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
      throw new Error(`Erro ao atualizar vaga: ${error.message}`);
    }
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
    const { data, error } = await supabase
      .from('history')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (data || []).map(entry => ({
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
  },

  async addHistoryEntry(entry: HistoryEntry) {
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
      throw new Error(`Erro ao salvar histórico: ${error.message}`);
    }
  },

  // Auth
  async signIn(username: string, password: string) {
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
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getCurrentUser() {
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
    return supabase
      .channel('inventory-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory' }, callback)
      .subscribe();
  },

  subscribeToSlots(callback: (payload: any) => void) {
    return supabase
      .channel('slot-changes')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'warehouse_slots' }, callback)
      .subscribe();
  },

  subscribeToNotifications(callback: (payload: any) => void) {
    const channel = supabase.channel('app-notifications');
    channel
      .on('broadcast', { event: 'new-import' }, ({ payload }) => callback(payload))
      .subscribe();
    return channel;
  },

  broadcastNotification(payload: { user: string, message: string, type?: string }) {
    supabase.channel('app-notifications').send({
      type: 'broadcast',
      event: 'new-import',
      payload
    });
  },

  // Shipments
  async getShipments(): Promise<Shipment[]> {
    const { data, error } = await supabase
      .from('shipments')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (data || []).map(s => ({
      id: s.id,
      type: s.type as ShipmentType,
      status: s.status as ShipmentStatus,
      createdAt: s.created_at,
      scheduledDate: s.scheduled_date,
      operatorName: s.operator_name,
      closedAt: s.closed_at
    }));
  },

  async saveShipment(shipment: Shipment) {
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
    
    if (error) throw error;
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

  subscribeToShipments(callback: (payload: any) => void) {
    return supabase
      .channel('shipment-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shipments' }, callback)
      .subscribe();
  }
};
