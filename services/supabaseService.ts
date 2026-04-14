import { supabase } from '../lib/supabase';
import { SheetRow, WarehouseSlot, HistoryEntry, StockStatus, SlotContent, HistoryType } from '../types';

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
 * -- 2. Disable RLS (or add policies)
 * ALTER TABLE inventory DISABLE ROW LEVEL SECURITY;
 * ALTER TABLE warehouse_slots DISABLE ROW LEVEL SECURITY;
 * ALTER TABLE history DISABLE ROW LEVEL SECURITY;
 * ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
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
      inspections: item.inspections || []
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
        inspections: item.inspections || []
      })
      .select();
    if (error) throw error;
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
      })
      .select();
    if (error) throw error;
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
      details: entry.details
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
        details: entry.details
      })
      .select();
    if (error) throw error;
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
  }
};
