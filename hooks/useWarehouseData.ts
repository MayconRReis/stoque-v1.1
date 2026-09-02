import React, { useState, useCallback } from 'react';
import { supabaseService } from '../services/supabaseService';
import { disableSupabase, isFetchOrNetworkError } from '../lib/supabase';
import { 
  SheetRow, 
  DashboardStats, 
  WarehouseDiagnostic, 
  WarehouseSlot, 
  SlotContent 
} from '../types';

export const generateSlots = (): WarehouseSlot[] => {
  const slots: WarehouseSlot[] = [];
  const racks: ('A' | 'B' | 'C' | 'D' | 'E' | 'F')[] = ['A', 'B', 'C', 'D', 'E', 'F'];
  racks.forEach(rack => {
    let levels = 3;
    let positions = 16;
    
    if (rack === 'D') {
      positions = 18;
    } else if (rack === 'E' || rack === 'F') {
      levels = 5;
      positions = 9;
    }
    
    for (let l = 1; l <= levels; l++) {
      for (let p = 1; p <= positions; p++) {
        slots.push({ id: `${rack}.${l}.${p}`, rack, level: l, position: p, status: SlotContent.EMPTY });
      }
    }
  });
  return slots;
};

export function useWarehouseData(
  inventoryPage: number,
  PAGE_SIZE: number,
  inventorySearch: string,
  inventoryTypeFilter: string,
  setHasMoreInventory: (val: boolean) => void,
  setShipmentCounts: React.Dispatch<React.SetStateAction<Record<string, number>>>,
  showNotification: (msg: string, type?: 'success'|'error'|'info') => void
) {
  const [data, setData] = useState<SheetRow[]>([]);
  const [pendingRows, setPendingRows] = useState<SheetRow[]>([]);
  const [waitingRows, setWaitingRows] = useState<SheetRow[]>([]);
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState<number>(0);
  const [stats, setStats] = useState<DashboardStats>({
    freeSlots: 0,
    pendingEntries: 0,
    occupancyRate: 0,
    dailyMovements: 0,
    totalSlots: 198,
    occupiedSlots: 0,
    totalBottles: 0,
    waitingPallets: 0,
    finishedShipments24h: 0,
    productDistribution: {},
    uniqueSkuCount: 0
  });
  const [warehouseDiagnostic, setWarehouseDiagnostic] = useState<WarehouseDiagnostic | null>(null);
  const [isDiagnosticDetailsOpen, setIsDiagnosticDetailsOpen] = useState(false);
  const [slots, setSlots] = useState<WarehouseSlot[]>(generateSlots());

  const refreshCombinedData = useCallback(async () => {
    // Refresh current page of inventory, global stats, pending and waiting rows
    try {
      const [invResult, globalStats, pendingRes, waitingRes, countsData, diagnostic, approvalsCount] = await Promise.all([
        supabaseService.getInventoryPaginated(0, (inventoryPage + 1) * PAGE_SIZE, { 
          searchTerm: inventorySearch, 
          typeFilter: inventoryTypeFilter 
        }),
        supabaseService.getGlobalStats(),
        supabaseService.getPendingInventory(),
        supabaseService.getWaitingInventory(),
        supabaseService.getShipmentPalletCounts(),
        supabaseService.getWarehouseDiagnostic(),
        supabaseService.getPendingEditRequestsCount()
      ]);
      setData(invResult.data);
      setStats(globalStats);
      setPendingRows(pendingRes);
      setWaitingRows(waitingRes);
      setShipmentCounts(countsData);
      setPendingApprovalsCount(approvalsCount);
      setWarehouseDiagnostic(diagnostic);
      setHasMoreInventory(invResult.data.length < invResult.count);
    } catch (error: any) {
      console.warn('Error refreshing data:', error);
      if (isFetchOrNetworkError(error)) {
        console.warn('Network error detected. Disabling Supabase and falling back to offline mode.');
        disableSupabase();
        setTimeout(() => refreshCombinedData(), 100);
      } else {
        showNotification('Erro ao atualizar dados. Os dados exibidos podem estar desatualizados.', 'error');
      }
    }
  }, [inventoryPage, inventorySearch, inventoryTypeFilter, PAGE_SIZE, setHasMoreInventory, setShipmentCounts, showNotification]);

  return {
    data, setData,
    pendingRows, setPendingRows,
    waitingRows, setWaitingRows,
    pendingApprovalsCount, setPendingApprovalsCount,
    stats, setStats,
    warehouseDiagnostic, setWarehouseDiagnostic,
    isDiagnosticDetailsOpen, setIsDiagnosticDetailsOpen,
    slots, setSlots,
    refreshCombinedData
  };
}
