
import React, { useState, useEffect, useMemo } from 'react';
import { SheetRow, StockStatus, InspectionData, DashboardStats, WarehouseSlot, SlotContent, HistoryEntry, HistoryType } from './types';
import { InventoryDetailModal } from './components/InventoryDetailModal';
import { InventoryBulkConfirmModal } from './components/InventoryBulkConfirmModal';
import { supabaseService } from './services/supabaseService';
import { Login } from './components/Login';
import { MovementModal } from './components/MovementModal';
import { ImportPage } from './components/ImportPage';
import { AnalysisPage } from './components/AnalysisPage';
import { User as AppUser } from './types';

const SPREADSHEET_ID = '1BBsxodwfNx-sB7xtcxA93JRAQCRZ7z_BGC2efOPxu4M';
const SHEET_NAME = 'Dados_Carregamentos';
const GOOGLE_CSV_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${SHEET_NAME}`;

const generateSlots = (): WarehouseSlot[] => {
  const slots: WarehouseSlot[] = [];
  for (let l = 1; l <= 3; l++) {
    for (let p = 1; p <= 16; p++) slots.push({ id: `A.${l}.${p}`, rack: 'A', level: l, position: p, status: SlotContent.EMPTY });
  }
  for (let l = 1; l <= 3; l++) {
    for (let p = 1; p <= 16; p++) slots.push({ id: `B.${l}.${p}`, rack: 'B', level: l, position: p, status: SlotContent.EMPTY });
  }
  for (let l = 1; l <= 3; l++) {
    for (let p = 1; p <= 16; p++) slots.push({ id: `C.${l}.${p}`, rack: 'C', level: l, position: p, status: SlotContent.EMPTY });
  }
  for (let l = 1; l <= 3; l++) {
    for (let p = 1; p <= 18; p++) slots.push({ id: `D.${l}.${p}`, rack: 'D', level: l, position: p, status: SlotContent.EMPTY });
  }
  return slots;
};

const Logo: React.FC<{ size?: 'sm' | 'md' }> = ({ size = 'md' }) => {
  const isSm = size === 'sm';
  return (
    <div className="flex items-center gap-3">
      <svg 
        width={isSm ? "32" : "44"} 
        height={isSm ? "32" : "44"} 
        viewBox="0 0 40 40" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        <rect x="4" y="24" width="32" height="8" rx="3" fill="#3B82F6"/>
        <rect x="4" y="12" width="18" height="8" rx="3" fill="#3B82F6"/>
        <path d="M28 10V20M23 15H33" stroke="#3B82F6" strokeWidth="4" strokeLinecap="round"/>
      </svg>
      <div>
        <h1 className={`${isSm ? 'text-xl' : 'text-3xl'} font-black tracking-tighter text-white flex items-center`}>
          Stoque<span className="text-blue-500">+</span>
        </h1>
        {!isSm && <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em] -mt-1">Ybera Paris</p>}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [data, setData] = useState<SheetRow[]>([]);
  const [slots, setSlots] = useState<WarehouseSlot[]>(generateSlots());
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inventory' | 'movement' | 'map' | 'history' | 'import' | 'analysis'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  
  // Selection and Search State
  const [inventorySearch, setInventorySearch] = useState('');
  const [selectedPallets, setSelectedPallets] = useState<string[]>([]); // Format: "rowId::palletIdx"
  const [isBulkConfirmOpen, setIsBulkConfirmOpen] = useState(false);

  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const [deleteContext, setDeleteContext] = useState<{ type: 'row' | 'pallet', rowId: string, palletIdx?: number } | null>(null);
  const [matrixConfirmContext, setMatrixConfirmContext] = useState<{ rowId: string, palletIdx: number, slotId?: string } | null>(null);
  const [importConfirmationContext, setImportConfirmationContext] = useState<{ targetId: string, entries: SheetRow[] } | null>(null);
  const [notifications, setNotifications] = useState<{ id: string, message: string, type?: 'info' | 'error' }[]>([]);
  
  const [detailContext, setDetailContext] = useState<{ row: SheetRow, inspection: InspectionData, idx: number } | null>(null);
  const [searchLoadingId, setSearchLoadingId] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  const [processedIds, setProcessedIds] = useState<string[]>([]);

  // Load data from Supabase
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await supabaseService.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        setIsAuthLoading(false);
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      try {
        const [invData, slotData, historyData] = await Promise.all([
          supabaseService.getInventory(),
          supabaseService.getSlots(),
          supabaseService.getHistory()
        ]);

        setData(invData);
        setHistory(historyData);
        
        // If no slots in DB, initialize them
        if (slotData.length === 0) {
          const initialSlots = generateSlots();
          await supabaseService.bulkUpdateSlots(initialSlots);
          setSlots(initialSlots);
        } else {
          setSlots(slotData);
        }

        // Extract processed IDs from inventory
        const uniqueLoadingIds = Array.from(new Set(invData.map(item => item.loadingId)));
        setProcessedIds(uniqueLoadingIds);
      } catch (error) {
        console.error('Error loading data from Supabase:', error);
        showNotification('Erro ao carregar dados do servidor Supabase.', 'error');
      }
    };

    loadData();

    // Set up real-time subscriptions
    const inventoryChannel = supabaseService.subscribeToInventory((payload) => {
      if (payload.eventType === 'INSERT') {
        const newItem: SheetRow = {
          id: payload.new.id,
          loadingId: payload.new.loading_id,
          originOP: payload.new.origin_op,
          description: payload.new.description,
          lot: payload.new.lot,
          pallets: payload.new.pallets,
          date: payload.new.date,
          status: payload.new.status as StockStatus,
          inspections: payload.new.inspections || []
        };
        setData(prev => {
          if (prev.find(r => r.id === newItem.id)) return prev;
          return [newItem, ...prev];
        });
      } else if (payload.eventType === 'UPDATE') {
        const updatedItem: SheetRow = {
          id: payload.new.id,
          loadingId: payload.new.loading_id,
          originOP: payload.new.origin_op,
          description: payload.new.description,
          lot: payload.new.lot,
          pallets: payload.new.pallets,
          date: payload.new.date,
          status: payload.new.status as StockStatus,
          inspections: payload.new.inspections || []
        };
        setData(prev => prev.map(r => r.id === updatedItem.id ? updatedItem : r));
      } else if (payload.eventType === 'DELETE') {
        setData(prev => prev.filter(r => r.id !== payload.old.id));
      }
    });

    const slotsChannel = supabaseService.subscribeToSlots((payload) => {
      if (payload.eventType === 'UPDATE') {
        const updatedSlot: WarehouseSlot = {
          id: payload.new.id,
          rack: payload.new.rack as any,
          level: payload.new.level,
          position: payload.new.position,
          status: payload.new.status as SlotContent,
          occupiedBy: payload.new.occupied_by
        };
        setSlots(prev => prev.map(s => s.id === updatedSlot.id ? updatedSlot : s));
      }
    });

    const notificationsChannel = supabaseService.subscribeToNotifications((payload) => {
      if (payload.user !== user.id) {
        showNotification(payload.message, payload.type || 'info');
      }
    });

    return () => {
      inventoryChannel.unsubscribe();
      slotsChannel.unsubscribe();
      notificationsChannel.unsubscribe();
    };
  }, [user]);

  const handleLogout = async () => {
    try {
      await supabaseService.signOut();
      setUser(null);
      setIsLogoutConfirmOpen(false);
      showNotification('Sessão encerrada com sucesso.');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleMovementEntry = async (entryData: any) => {
    try {
      const newEntry: SheetRow = {
        id: entryData.id,
        loadingId: entryData.id,
        originOP: entryData.op || 'N/A',
        description: entryData.name,
        lot: entryData.lot || 'N/A',
        pallets: entryData.quantity,
        date: new Date().toLocaleDateString(),
        status: StockStatus.INSPECTED,
        inspections: [{
          bottles: 0,
          caps: 0,
          boxes: 0,
          assignedSlot: entryData.slotId,
          contentType: entryData.contentType,
          palletNumber: 1
        }]
      };

      // Update Slot
      const targetSlot = slots.find(s => s.id === entryData.slotId);
      if (targetSlot) {
        const updatedSlot: WarehouseSlot = {
          ...targetSlot,
          status: entryData.contentType,
          occupiedBy: entryData.op || entryData.name
        };
        await supabaseService.updateSlot(updatedSlot);
        setSlots(prev => prev.map(s => s.id === entryData.slotId ? updatedSlot : s));
      }

      // Save Inventory
      await supabaseService.saveInventoryItem(newEntry);
      setData(prev => [newEntry, ...prev]);

      // Add History
      await addToHistory({
        id: Math.random().toString(36).substring(2, 9),
        type: HistoryType.ENTRY,
        timestamp: new Date().toLocaleString(),
        loadingId: entryData.id,
        description: entryData.name,
        op: entryData.op || 'N/A',
        lot: entryData.lot || 'N/A',
        palletNumber: 1,
        totalPallets: entryData.quantity,
        slot: entryData.slotId,
        details: `Entrada manual. ID Gerado: ${entryData.id}`
      });

      showNotification(`Entrada realizada com sucesso! ID: ${entryData.id}`);
      setIsMovementModalOpen(false);
    } catch (error: any) {
      console.error('Entry error:', error);
      const errorMessage = error?.message || error?.details || 'Erro desconhecido';
      showNotification(`Erro ao realizar entrada: ${errorMessage}`, 'error');
    }
  };

  const handleImportProcess = async (entries: { row: SheetRow, slotId: string }[]) => {
    try {
      const updatedSlots = [...slots];
      const newRows: SheetRow[] = [];
      const newHistory: HistoryEntry[] = [];

      for (const entry of entries) {
        const { row, slotId } = entry;
        
        // Update Slot in local array if provided
        if (slotId) {
          const slotIdx = updatedSlots.findIndex(s => s.id === slotId);
          if (slotIdx !== -1) {
            updatedSlots[slotIdx] = {
              ...updatedSlots[slotIdx],
              status: row.inspections![0].contentType,
              occupiedBy: row.originOP || row.description
            };
          }
        }

        newRows.push(row);
        // Only add to history if it's a final entry (has slot)
        if (slotId) {
          newHistory.push({
            id: Math.random().toString(36).substring(2, 9),
            type: HistoryType.ENTRY,
            timestamp: new Date().toLocaleString(),
            loadingId: row.loadingId,
            description: row.description,
            op: row.originOP,
            lot: row.lot,
            palletNumber: 1,
            totalPallets: 1,
            slot: slotId,
            details: `Importação via CSV. ID: ${row.loadingId}`
          });
        }
      }

      // Bulk updates in Supabase
      await Promise.all([
        supabaseService.bulkUpdateSlots(updatedSlots),
        ...newRows.map(r => supabaseService.saveInventoryItem(r)),
        ...newHistory.map(h => supabaseService.addHistoryEntry(h))
      ]);

      // Update local state
      setSlots(updatedSlots);
      setData(prev => [...newRows, ...prev]);
      setHistory(prev => [...newHistory, ...prev]);

      showNotification(`${entries.length} pallets importados com sucesso!`);
      
      // Notify other users
      supabaseService.broadcastNotification({
        user: user.id,
        message: `${user.name} importou ${entries.length} novos pallets para análise.`,
        type: 'info'
      });

      // If they were imported as PENDING, go to analysis
      if (entries[0]?.row.status === StockStatus.PENDING) {
        setActiveTab('analysis');
      } else {
        setActiveTab('inventory');
      }
    } catch (error: any) {
      console.error('Import processing error:', error);
      showNotification(`Erro ao processar importação: ${error.message}`, 'error');
    }
  };

  const handleConfirmAnalysis = async (rowId: string, slotId: string, finalId: string) => {
    try {
      const row = data.find(r => r.id === rowId);
      if (!row) return;

      const updatedRow: SheetRow = {
        ...row,
        loadingId: finalId,
        status: StockStatus.INSPECTED,
        inspections: row.inspections?.map(insp => ({ ...insp, assignedSlot: slotId }))
      };

      const targetSlot = slots.find(s => s.id === slotId);
      if (!targetSlot) throw new Error('Vaga não encontrada');

      const updatedSlot: WarehouseSlot = {
        ...targetSlot,
        status: row.inspections![0].contentType,
        occupiedBy: row.originOP || row.description
      };

      const historyEntry: HistoryEntry = {
        id: Math.random().toString(36).substring(2, 9),
        type: HistoryType.ENTRY,
        timestamp: new Date().toLocaleString(),
        loadingId: finalId,
        description: row.description,
        op: row.originOP,
        lot: row.lot,
        palletNumber: 1,
        totalPallets: 1,
        slot: slotId,
        details: `Entrada confirmada após análise. ID Final: ${finalId}`
      };

      await Promise.all([
        supabaseService.saveInventoryItem(updatedRow),
        supabaseService.updateSlot(updatedSlot),
        supabaseService.addHistoryEntry(historyEntry)
      ]);

      setData(prev => prev.map(r => r.id === rowId ? updatedRow : r));
      setSlots(prev => prev.map(s => s.id === slotId ? updatedSlot : s));
      setHistory(prev => [historyEntry, ...prev]);

      showNotification(`Entrada confirmada! ID: ${finalId}`);
    } catch (error: any) {
      console.error('Analysis confirmation error:', error);
      showNotification(`Erro ao confirmar análise: ${error.message}`, 'error');
    }
  };

  const handleRejectAnalysis = async (rowId: string) => {
    try {
      await supabaseService.deleteInventoryItem(rowId);
      setData(prev => prev.filter(r => r.id !== rowId));
      showNotification('Pallet rejeitado e removido da fila.');
    } catch (error: any) {
      console.error('Analysis rejection error:', error);
      showNotification(`Erro ao rejeitar pallet: ${error.message}`, 'error');
    }
  };

  const handleMovementTransfer = async (transferData: any) => {
    try {
      const item = data.find(d => d.loadingId === transferData.id);
      if (!item) {
        showNotification('Produto não encontrado com este ID.', 'error');
        return;
      }

      // Update From Slot
      const fromSlotObj = slots.find(s => s.id === transferData.fromSlot);
      if (fromSlotObj) {
        const updatedFrom: WarehouseSlot = { ...fromSlotObj, status: SlotContent.EMPTY, occupiedBy: undefined };
        await supabaseService.updateSlot(updatedFrom);
        setSlots(prev => prev.map(s => s.id === transferData.fromSlot ? updatedFrom : s));
      }

      // Update To Slot
      const toSlotObj = slots.find(s => s.id === transferData.toSlot);
      if (toSlotObj) {
        const updatedTo: WarehouseSlot = { 
          ...toSlotObj, 
          status: item.inspections?.[0]?.contentType || SlotContent.BOTTLES, 
          occupiedBy: item.originOP || item.description 
        };
        await supabaseService.updateSlot(updatedTo);
        setSlots(prev => prev.map(s => s.id === transferData.toSlot ? updatedTo : s));
      }

      // Update Inventory Item Slot
      const updatedItem = {
        ...item,
        inspections: item.inspections?.map(ins => ({ ...ins, assignedSlot: transferData.toSlot }))
      };
      await supabaseService.saveInventoryItem(updatedItem);
      setData(prev => prev.map(d => d.id === item.id ? updatedItem : d));

      // Add History
      await addToHistory({
        id: Math.random().toString(36).substring(2, 9),
        type: HistoryType.TRANSFER,
        timestamp: new Date().toLocaleString(),
        loadingId: transferData.id,
        description: item.description,
        op: item.originOP,
        lot: item.lot,
        palletNumber: 1,
        totalPallets: item.pallets,
        slot: transferData.toSlot,
        details: `Transferência de ${transferData.fromSlot} para ${transferData.toSlot}`
      });

      showNotification('Transferência concluída com sucesso.');
      setIsMovementModalOpen(false);
    } catch (error) {
      console.error('Transfer error:', error);
      showNotification('Erro ao realizar transferência.', 'error');
    }
  };

  const handleMovementExit = async (exitData: any) => {
    try {
      const item = data.find(d => d.loadingId === exitData.id);
      if (!item) {
        showNotification('Produto não encontrado com este ID.', 'error');
        return;
      }

      // Find slot occupied by this item
      const occupiedSlot = slots.find(s => s.id === item.inspections?.[0]?.assignedSlot);
      if (occupiedSlot) {
        const updatedSlot: WarehouseSlot = { ...occupiedSlot, status: SlotContent.EMPTY, occupiedBy: undefined };
        await supabaseService.updateSlot(updatedSlot);
        setSlots(prev => prev.map(s => s.id === occupiedSlot.id ? updatedSlot : s));
      }

      // Delete Inventory
      await supabaseService.deleteInventoryItem(item.id);
      setData(prev => prev.filter(d => d.id !== item.id));

      // Add History
      await addToHistory({
        id: Math.random().toString(36).substring(2, 9),
        type: HistoryType.EXIT,
        timestamp: new Date().toLocaleString(),
        loadingId: exitData.id,
        description: item.description,
        op: item.originOP,
        lot: item.lot,
        palletNumber: 1,
        totalPallets: item.pallets,
        slot: occupiedSlot?.id || 'N/A',
        details: `Saída: ${exitData.reason}`
      });

      showNotification('Saída registrada com sucesso.');
      setIsMovementModalOpen(false);
    } catch (error) {
      console.error('Exit error:', error);
      showNotification('Erro ao registrar saída.', 'error');
    }
  };

  const stats = useMemo((): DashboardStats => {
    const occupied = slots.filter(s => s.status !== SlotContent.EMPTY).length;
    const total = slots.length;
    const pendingCount = data.filter(r => r.status === StockStatus.PENDING).length;
    
    // Calculate total bottles from inventory data
    const totalBottles = data.reduce((acc, row) => {
      const rowBottles = row.inspections?.reduce((sum, insp) => {
        if (insp.contentType === SlotContent.BOTTLES) {
          return sum + (insp.bottles || 0);
        }
        return sum;
      }, 0) || 0;
      return acc + rowBottles;
    }, 0);

    return {
      freeSlots: total - occupied,
      pendingEntries: pendingCount,
      occupancyRate: Math.round((occupied / total) * 100),
      dailyMovements: history.length,
      totalSlots: total,
      occupiedSlots: occupied,
      totalBottles
    };
  }, [slots, history, data]);

  const showNotification = (message: string, type: 'info' | 'error' = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  };

  const addToHistory = async (entry: HistoryEntry) => {
    try {
      await supabaseService.addHistoryEntry(entry);
      setHistory(prev => [entry, ...prev]);
    } catch (error) {
      console.error('Error adding history entry:', error);
      showNotification('Erro ao salvar histórico no servidor.', 'error');
    }
  };

  const createHistoryEntry = (type: HistoryType, row: SheetRow, details: string, palletNum: number = 1): HistoryEntry => ({
    id: Math.random().toString(36).substring(2, 9),
    type,
    timestamp: new Date().toLocaleString('pt-BR'),
    loadingId: row.loadingId,
    description: row.description,
    op: row.originOP,
    lot: row.lot,
    palletNumber: palletNum,
    totalPallets: row.pallets,
    slot: row.inspections?.[0]?.assignedSlot || 'N/A',
    details: details
  });

  const confirmDelete = async () => {
    if (!deleteContext) return;
    try {
      if (deleteContext.type === 'row') {
        await supabaseService.deleteInventoryItem(deleteContext.rowId);
        setData(prev => prev.filter(item => item.id !== deleteContext.rowId));
      } else if (deleteContext.type === 'pallet' && deleteContext.palletIdx !== undefined) {
        const row = data.find(r => r.id === deleteContext.rowId);
        if (row && row.inspections) {
          const inspection = row.inspections[deleteContext.palletIdx];
          await addToHistory(createHistoryEntry(HistoryType.REMOVAL, row, 'Remoção de pallet', deleteContext.palletIdx + 1));
          
          if (inspection.assignedSlot) {
            const slot = slots.find(s => s.id === inspection.assignedSlot);
            if (slot) {
              const updatedSlot = { ...slot, status: SlotContent.EMPTY, occupiedBy: undefined };
              await supabaseService.updateSlot(updatedSlot);
              setSlots(prev => prev.map(s => s.id === inspection.assignedSlot ? updatedSlot : s));
            }
          }

          const updatedInsps = row.inspections?.filter((_, i) => i !== deleteContext.palletIdx);
          const updatedRow = { ...row, inspections: updatedInsps, status: (updatedInsps?.length === 0) ? StockStatus.PENDING : row.status };
          await supabaseService.saveInventoryItem(updatedRow);
          
          setData(prev => prev.map(r => r.id === deleteContext.rowId ? updatedRow : r));
        }
      }
      setDeleteContext(null);
    } catch (error) {
      console.error('Error deleting:', error);
      showNotification('Erro ao excluir no servidor.', 'error');
    }
  };

  const confirmMatrixSend = async () => {
    if (!matrixConfirmContext) return;
    const { rowId, palletIdx, slotId } = matrixConfirmContext;
    const row = data.find(r => r.id === rowId);
    if (!row || !row.inspections) return;

    try {
      const inspection = row.inspections[palletIdx];
      await addToHistory(createHistoryEntry(HistoryType.EXIT, row, 'Enviado para Matriz', palletIdx + 1));
      
      if (slotId) {
        const slot = slots.find(s => s.id === slotId);
        if (slot) {
          const updatedSlot = { ...slot, status: SlotContent.EMPTY, occupiedBy: undefined };
          await supabaseService.updateSlot(updatedSlot);
          setSlots(prev => prev.map(s => s.id === slotId ? updatedSlot : s));
        }
      }
      
      const newInsps = row.inspections?.filter((_, i) => i !== palletIdx);
      const updatedRow = { ...row, inspections: newInsps, status: (newInsps?.length === 0) ? StockStatus.PENDING : row.status };
      await supabaseService.saveInventoryItem(updatedRow);

      setData(prev => prev.map(r => r.id === rowId ? updatedRow : r));

      showNotification(`A OP ${row.originOP} foi enviada para matriz com sucesso`);
      setMatrixConfirmContext(null);
    } catch (error) {
      console.error('Error sending to matrix:', error);
      showNotification('Erro ao processar envio no servidor.', 'error');
    }
  };

  const handleBulkSend = async () => {
    try {
      const updatedSlots: WarehouseSlot[] = [...slots];
      const rowsToUpdate: Map<string, SheetRow> = new Map();

      for (const key of selectedPallets) {
        const [rowId, palletIdxStr] = key.split('::');
        const palletIdx = parseInt(palletIdxStr);
        const row = data.find(r => r.id === rowId);
        if (row && row.inspections) {
          const inspection = row.inspections[palletIdx];
          await addToHistory(createHistoryEntry(HistoryType.EXIT, row, 'Saída em massa', palletIdx + 1));
          
          if (inspection.assignedSlot) {
            const slotIdx = updatedSlots.findIndex(s => s.id === inspection.assignedSlot);
            if (slotIdx !== -1) {
              updatedSlots[slotIdx] = { ...updatedSlots[slotIdx], status: SlotContent.EMPTY, occupiedBy: undefined };
            }
          }

          // Track row updates
          const currentRow = rowsToUpdate.get(rowId) || { ...row };
          const rowSelectedIndices = selectedPallets
            .filter(k => k.startsWith(`${rowId}::`))
            .map(k => parseInt(k.split('::')[1]));
          
          const newInsps = row.inspections?.filter((_, i) => !rowSelectedIndices.includes(i));
          currentRow.inspections = newInsps;
          currentRow.status = (newInsps?.length === 0) ? StockStatus.PENDING : row.status;
          rowsToUpdate.set(rowId, currentRow);
        }
      }

      // Bulk update slots and rows in Supabase
      await Promise.all([
        supabaseService.bulkUpdateSlots(updatedSlots),
        ...Array.from(rowsToUpdate.values()).map(row => supabaseService.saveInventoryItem(row))
      ]);

      setSlots(updatedSlots);
      setData(prev => prev.map(row => rowsToUpdate.get(row.id) || row));

      showNotification(`${selectedPallets.length} pallets enviados para matriz`);
      setSelectedPallets([]);
      setIsBulkConfirmOpen(false);
    } catch (error) {
      console.error('Error in bulk send:', error);
      showNotification('Erro ao processar envio em massa no servidor.', 'error');
    }
  };

  const handleSendToMatrix = (rowId: string, palletIdx: number, slotId?: string) => {
    setMatrixConfirmContext({ rowId, palletIdx, slotId });
  };

  const togglePalletSelection = (rowId: string, idx: number) => {
    const key = `${rowId}::${idx}`;
    setSelectedPallets(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const pendingItems = [];
  const inspectedItems = data.filter(item => item.status === StockStatus.INSPECTED);

  const filteredInventory = useMemo(() => {
    const term = inventorySearch.toLowerCase().trim();
    const allPallets: { row: SheetRow, inspection: InspectionData, idx: number }[] = [];
    inspectedItems.forEach(item => {
      item.inspections?.forEach((insp, idx) => {
        if (!term || item.description.toLowerCase().includes(term) || item.originOP.includes(term) || item.lot.toLowerCase().includes(term)) {
          allPallets.push({ row: item, inspection: insp, idx });
        }
      });
    });
    return allPallets;
  }, [inspectedItems, inventorySearch]);

  const RackView = ({ rack }: { rack: 'A' | 'B' | 'C' | 'D' }) => {
    const rackSlots = slots.filter(s => s.rack === rack);
    const freeCount = rackSlots.filter(s => s.status === SlotContent.EMPTY).length;
    const totalCount = rackSlots.length;
    
    const rackTitles = {
      'A': 'Frascos (G0)',
      'B': 'Insumos / Acabados',
      'C': 'Insumos / Acabados',
      'D': 'Outros / Acabados'
    };

    return (
      <div className="bg-slate-900 p-4 md:p-6 rounded-3xl border border-slate-800 shadow-xl overflow-hidden mb-8">
        <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
          <div className="flex items-center gap-3">
             <div className={`w-2 h-6 rounded-full ${rack === 'D' ? 'bg-green-600' : rack === 'A' ? 'bg-blue-600' : 'bg-amber-600'}`}></div>
             <div className="flex flex-col">
                <h4 className="text-lg md:text-xl font-black text-white uppercase tracking-tighter flex items-center gap-2">
                  Porta Pallet {rack} - {rackTitles[rack]}
                </h4>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Topografia Interna</p>
             </div>
          </div>
          
          <div className="bg-slate-950 px-4 py-2 rounded-2xl border border-slate-800 flex items-center gap-6">
            <div className="flex flex-col items-center">
              <span className="text-[7px] text-slate-600 font-black uppercase mb-0.5">Livres</span>
              <span className="text-sm font-black text-blue-500">{freeCount}</span>
            </div>
            <div className="w-px h-6 bg-slate-800"></div>
            <div className="flex flex-col items-center">
              <span className="text-[7px] text-slate-600 font-black uppercase mb-0.5">Total</span>
              <span className="text-sm font-black text-white">{totalCount}</span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 md:gap-2.5">
          {rackSlots.map(slot => (
            <div key={slot.id} className={`aspect-square rounded-xl border flex flex-col items-center justify-center p-1 transition-all group relative ${
              slot.status === SlotContent.EMPTY ? 'bg-slate-950/50 border-slate-800 hover:border-slate-700' : 
              slot.status === SlotContent.BOTTLES ? 'bg-blue-600/20 border-blue-600/50' : 
              slot.status === SlotContent.SUPPLIES ? 'bg-amber-600/20 border-amber-600/50' :
              'bg-green-600/20 border-green-600/50'
            }`}>
              <span className="text-[7px] md:text-[8px] font-black text-slate-600 mb-0.5">{slot.id}</span>
              <i className={`fa-solid ${
                slot.status === SlotContent.EMPTY ? 'fa-plus' :
                slot.status === SlotContent.BOTTLES ? 'fa-flask' : 
                slot.status === SlotContent.FINISHED_PRODUCT ? 'fa-dolly' :
                'fa-pallet'
              } ${slot.status === SlotContent.EMPTY ? 'text-[8px] md:text-[9px]' : 'text-[10px] md:text-[11px]'} ${
                slot.status === SlotContent.EMPTY ? 'text-slate-800' : 
                slot.status === SlotContent.BOTTLES ? 'text-blue-500' : 
                slot.status === SlotContent.SUPPLIES ? 'text-amber-500' :
                'text-green-500'
              }`}></i>
              {slot.occupiedBy && (
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-slate-900/95 backdrop-blur-sm rounded-xl flex items-center justify-center z-10 transition-opacity border border-slate-700">
                  <span className="text-[6px] md:text-[7px] font-black text-white px-1 text-center leading-tight">{slot.occupiedBy}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const DonutChart = ({ percentage, color, label }: { percentage: number, color: string, label: string }) => {
    const radius = 36;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div className="flex flex-col items-center">
        <div className="relative w-24 h-24 md:w-32 md:h-32">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle className="text-slate-800 stroke-current" strokeWidth="8" fill="transparent" r={radius} cx="50" cy="50" />
            <circle className={`${color} stroke-current transition-all duration-1000 ease-out`} strokeWidth="8" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" fill="transparent" r={radius} cx="50" cy="50" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl md:text-2xl font-black text-white">{percentage}%</span>
            <span className="text-[6px] md:text-[8px] font-black text-slate-500 uppercase">{label}</span>
          </div>
        </div>
      </div>
    );
  };

  const BarChart = ({ data }: { data: { label: string, value: number, color: string }[] }) => {
    const max = Math.max(...data.map(d => d.value), 1);
    return (
      <div className="space-y-4 w-full">
        {data.map((item, i) => (
          <div key={i} className="space-y-1.5">
            <div className="flex justify-between items-end">
              <span className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</span>
              <span className="text-[10px] md:text-xs font-black text-white">{item.value}</span>
            </div>
            <div className="h-2 md:h-3 bg-slate-950 rounded-full border border-slate-800 overflow-hidden">
              <div 
                className={`h-full ${item.color} transition-all duration-1000 ease-out rounded-full`} 
                style={{ width: `${(item.value / max) * 100}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const NavItem = ({ tab, icon, label, badge }: { tab: typeof activeTab, icon: string, label: string, badge?: number }) => (
    <button 
      onClick={() => { setActiveTab(tab); setIsSidebarOpen(false); }} 
      className={`w-full flex items-center gap-3.5 px-5 py-4 rounded-2xl transition-all ${activeTab === tab ? 'bg-blue-600 shadow-blue-900/20' : 'hover:bg-slate-800/60 text-slate-400'} text-white shadow-xl`}
    >
      <i className={`fa-solid ${icon} text-sm opacity-70`}></i>
      <span className="font-bold text-sm">{label}</span>
      {badge ? <span className="ml-auto text-[10px] font-black px-2.5 py-1 rounded-full bg-slate-950 text-blue-400">{badge}</span> : null}
    </button>
  );

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Carregando Stoque+</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login onLoginSuccess={async () => {
      const currentUser = await supabaseService.getCurrentUser();
      setUser(currentUser);
    }} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col lg:flex-row font-sans selection:bg-blue-600/30 overflow-x-hidden">
      
      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 md:top-6 md:right-6 z-[200] flex flex-col gap-3 pointer-events-none w-full max-w-[90%] md:max-w-sm">
        {notifications.map(n => (
          <div key={n.id} className={`bg-slate-900 border ${n.type === 'error' ? 'border-red-500/30' : 'border-green-500/30'} text-white px-4 md:px-6 py-3 md:py-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-right duration-300 pointer-events-auto`}>
            <div className={`w-8 h-8 md:w-10 md:h-10 ${n.type === 'error' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-green-500/10 text-green-500 border-green-500/20'} rounded-xl flex items-center justify-center border shrink-0`}>
              <i className={`fa-solid ${n.type === 'error' ? 'fa-circle-exclamation' : 'fa-check'}`}></i>
            </div>
            <p className="text-xs md:text-sm font-black uppercase tracking-tight line-clamp-2">{n.message}</p>
          </div>
        ))}
      </div>

      {/* Sidebar Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`fixed lg:sticky top-0 left-0 h-screen w-72 bg-slate-900/80 backdrop-blur-xl border-r border-slate-800 shadow-2xl z-50 transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} flex-shrink-0 flex flex-col`}>
        <div className="p-8 border-b border-slate-800/60 flex justify-between items-center">
          <Logo />
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-500 hover:text-white transition-colors">
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>

        <nav className="p-5 py-8 space-y-2.5 flex-1 overflow-y-auto">
          <NavItem tab="dashboard" icon="fa-chart-line" label="Dashboard" />
          <NavItem tab="movement" icon="fa-dolly" label="Movimentação" />
          <NavItem tab="inventory" icon="fa-boxes-stacked" label="Estoque Geral" />
          <NavItem tab="map" icon="fa-warehouse" label="Mapa de vagas" />
          <NavItem tab="import" icon="fa-file-import" label="Importar CSV" />
          <NavItem tab="analysis" icon="fa-clipboard-check" label="Análise" badge={data.filter(r => r.status === StockStatus.PENDING).length} />
          <NavItem tab="history" icon="fa-clock-rotate-left" label="Histórico" />
        </nav>

        <div className="p-4 space-y-4">
          <div className="p-6 bg-slate-900/40 border border-slate-800 rounded-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center text-xs font-black text-blue-500 border border-blue-500/20 shadow-lg shadow-blue-900/20">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-xs font-black text-white uppercase tracking-tighter">{user.name}</p>
                  <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">{user.role === 'admin' ? 'Administrador' : 'Operador'}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsLogoutConfirmOpen(true)}
                className="w-8 h-8 rounded-lg bg-red-500/10 text-red-500 border border-red-500/20 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-lg shadow-red-900/20"
                title="Sair do Sistema"
              >
                <i className="fa-solid fa-right-from-bracket text-xs"></i>
              </button>
            </div>
            <div className="space-y-2.5">
              <div className="flex justify-between text-[8px] font-black text-slate-500 uppercase tracking-widest">
                <span>Carga Armazém</span>
                <span>{stats.occupancyRate}%</span>
              </div>
              <div className="h-1.5 bg-slate-950 rounded-full border border-slate-800 overflow-hidden shadow-inner">
                 <div className="h-full bg-blue-600 rounded-full shadow-[0_0_10px_rgba(37,99,235,0.5)] transition-all duration-1000" style={{ width: `${stats.occupancyRate}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-screen lg:h-screen overflow-hidden">
        <header className="bg-slate-950/80 backdrop-blur-xl border-b border-slate-900/50 p-4 md:p-6 lg:px-10 flex justify-between items-center sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden w-10 h-10 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-all active:scale-95"
            >
              <i className="fa-solid fa-bars"></i>
            </button>
            <h2 className="text-xl md:text-2xl font-black text-white tracking-tighter uppercase italic line-clamp-1">
              {activeTab === 'dashboard' && 'Painel de Controle'}
              {activeTab === 'movement' && 'Movimentação'}
              {activeTab === 'inventory' && 'Inventário G0'}
              {activeTab === 'map' && 'Mapa de vagas'}
              {activeTab === 'import' && 'Importar CSV'}
              {activeTab === 'analysis' && 'Análise de Recebimento'}
              {activeTab === 'history' && 'Histórico'}
            </h2>
          </div>
          
          <div className="flex items-center gap-2.5 shrink-0">
             <span className={`w-2.5 h-2.5 rounded-full ${isSearching ? 'bg-amber-500 animate-pulse' : 'bg-green-500'}`}></span>
             <span className="hidden sm:inline text-[11px] font-black text-slate-500 uppercase tracking-widest">{isSearching ? 'Sincronizando...' : 'Sistema Ativo'}</span>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-8 lg:p-14">
          {activeTab === 'movement' && (
            <div className="max-w-4xl mx-auto text-center space-y-8 py-20 animate-in fade-in slide-in-from-bottom-10 duration-700">
              <div className="w-24 h-24 bg-blue-600/10 text-blue-500 rounded-[32px] flex items-center justify-center mx-auto border border-blue-500/20 shadow-2xl shadow-blue-900/20 mb-8">
                <i className="fa-solid fa-dolly text-4xl"></i>
              </div>
              <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase italic">Gestão de Movimentação</h2>
              <p className="text-slate-500 text-sm md:text-base font-bold uppercase tracking-[0.3em] max-w-xl mx-auto leading-relaxed">
                Realize entradas, saídas e transferências de pallets no armazém G0 de forma rápida e segura.
              </p>
              <div className="pt-10">
                <button 
                  onClick={() => setIsMovementModalOpen(true)}
                  className="px-12 py-6 bg-blue-600 hover:bg-blue-500 text-white rounded-[32px] font-black text-sm uppercase tracking-[0.4em] transition-all shadow-2xl shadow-blue-900/40 active:scale-95 flex items-center gap-4 mx-auto"
                >
                  Abrir Painel de Movimentação <i className="fa-solid fa-plus"></i>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'dashboard' && (
            <div className="max-w-7xl mx-auto space-y-8 md:space-y-10 animate-in fade-in duration-700">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
                    <div className="bg-slate-900/60 p-6 md:p-8 rounded-[32px] border border-slate-800 shadow-2xl hover:border-blue-500/50 transition-all">
                       <div className="flex justify-between items-center mb-4">
                         <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-600/10 text-blue-500 rounded-2xl flex items-center justify-center border border-blue-500/20 shadow-lg shadow-blue-900/20"><i className="fa-solid fa-pallet"></i></div>
                         <span className="text-[7px] md:text-[8px] font-black text-slate-600 uppercase tracking-widest italic">Capacidade G0</span>
                       </div>
                       <p className="text-[10px] md:text-[11px] text-slate-500 font-black uppercase mb-1 tracking-widest">Pallets Alocados</p>
                       <p className="text-4xl md:text-6xl font-black text-white tracking-tighter">{stats.occupiedSlots}</p>
                       <div className="h-1 bg-slate-950 rounded-full mt-4 overflow-hidden"><div className="h-full bg-blue-600" style={{width: `${stats.occupancyRate}%`}}></div></div>
                    </div>
                    <div className="bg-slate-900/60 p-6 md:p-8 rounded-[32px] border border-slate-800 shadow-2xl hover:border-amber-500/50 transition-all">
                       <div className="flex justify-between items-center mb-4">
                         <div className="w-10 h-10 md:w-12 md:h-12 bg-amber-600/10 text-amber-500 rounded-2xl flex items-center justify-center border border-amber-500/20 shadow-lg shadow-amber-900/20"><i className="fa-solid fa-warehouse"></i></div>
                       </div>
                       <p className="text-[10px] md:text-[11px] text-slate-500 font-black uppercase mb-1 tracking-widest">Vagas Disponíveis</p>
                       <p className="text-4xl md:text-6xl font-black text-white tracking-tighter">{stats.freeSlots}</p>
                       <p className="text-[8px] md:text-[10px] text-slate-600 font-bold mt-2 uppercase italic tracking-widest">Total: {stats.totalSlots}</p>
                    </div>
                    <div className="bg-slate-900/60 p-6 md:p-8 rounded-[32px] border border-slate-800 shadow-2xl hover:border-indigo-500/50 transition-all">
                       <div className="flex justify-between items-center mb-4">
                         <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-600/10 text-indigo-500 rounded-2xl flex items-center justify-center border border-indigo-500/20 shadow-lg shadow-indigo-900/20"><i className="fa-solid fa-clipboard-list"></i></div>
                       </div>
                       <p className="text-[10px] md:text-[11px] text-slate-500 font-black uppercase mb-1 tracking-widest">Cargas Pendentes</p>
                       <p className="text-4xl md:text-6xl font-black text-white tracking-tighter">{stats.pendingEntries}</p>
                       <p className="text-[8px] md:text-[10px] text-slate-600 font-bold mt-2 uppercase italic tracking-widest">Aguardando Análise</p>
                    </div>
                    <div className="bg-slate-900/60 p-6 md:p-8 rounded-[32px] border border-slate-800 shadow-2xl hover:border-green-500/50 transition-all">
                       <div className="flex justify-between items-center mb-4">
                         <div className="w-10 h-10 md:w-12 md:h-12 bg-green-600/10 text-green-500 rounded-2xl flex items-center justify-center border border-green-500/20 shadow-lg shadow-green-900/20"><i className="fa-solid fa-clock-rotate-left"></i></div>
                       </div>
                       <p className="text-[10px] md:text-[11px] text-slate-500 font-black uppercase mb-1 tracking-widest">Movimentações</p>
                       <p className="text-4xl md:text-6xl font-black text-white tracking-tighter">{stats.dailyMovements}</p>
                       <p className="text-[8px] md:text-[10px] text-slate-600 font-bold mt-2 uppercase italic tracking-widest">Últimas 24 Horas</p>
                    </div>
                </div>

                {/* Charts Area */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-8">
                  {/* Occupancy Chart */}
                  <div className="bg-slate-900 p-6 md:p-10 rounded-[32px] md:rounded-[48px] border border-slate-800 shadow-3xl">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                      <div>
                        <h4 className="text-lg md:text-xl font-black text-white uppercase italic tracking-tighter">Ocupação do Armazém</h4>
                        <p className="text-[8px] md:text-[10px] text-slate-600 font-black uppercase tracking-widest">Análise Geográfica de Vagas</p>
                      </div>
                      <div className="flex gap-4">
                        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-600"></div><span className="text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest">Ocupado</span></div>
                        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-slate-800"></div><span className="text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest">Livre</span></div>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-8 md:gap-12">
                       <DonutChart percentage={stats.occupancyRate} color="text-blue-600" label="Ocupação" />
                       <div className="flex-1 space-y-6 w-full">
                          <div className="grid grid-cols-2 gap-3 md:gap-4">
                             <div className="p-3 md:p-4 bg-slate-950/50 rounded-2xl md:rounded-3xl border border-slate-800/50 text-center">
                                <p className="text-[7px] md:text-[9px] font-black text-slate-600 uppercase mb-1">Total Vagas</p>
                                <p className="text-lg md:text-xl font-black text-white italic">{stats.totalSlots}</p>
                             </div>
                             <div className="p-3 md:p-4 bg-slate-950/50 rounded-2xl md:rounded-3xl border border-slate-800/50 text-center">
                                <p className="text-[7px] md:text-[9px] font-black text-slate-600 uppercase mb-1">Vagas Livres</p>
                                <p className="text-lg md:text-xl font-black text-blue-500 italic">{stats.freeSlots}</p>
                             </div>
                          </div>
                          <p className="text-[10px] md:text-[11px] text-slate-500 font-bold leading-relaxed italic text-center sm:text-left">
                            O armazém G0 opera com <span className="text-white font-black">{stats.occupancyRate}%</span> de utilização total.
                          </p>
                       </div>
                    </div>
                  </div>

                  {/* Pending Movements Chart */}
                  <div className="bg-slate-900 p-6 md:p-10 rounded-[32px] md:rounded-[48px] border border-slate-800 shadow-3xl">
                    <div className="flex justify-between items-center mb-8">
                      <div>
                        <h4 className="text-lg md:text-xl font-black text-white uppercase italic tracking-tighter">Logística de Pendências</h4>
                        <p className="text-[8px] md:text-[10px] text-slate-600 font-black uppercase tracking-widest">Status de Movimentação</p>
                      </div>
                      <i className="fa-solid fa-truck-moving text-slate-800 text-xl md:text-2xl"></i>
                    </div>
                    <div className="flex flex-col justify-center min-h-[132px]">
                      <BarChart data={[
                        { label: 'Pendentes de Inspeção', value: stats.pendingEntries, color: 'bg-indigo-600' },
                        { label: 'Armazenados (Estoque)', value: stats.occupiedSlots, color: 'bg-green-600' },
                        { label: 'Saídas Realizadas', value: history.filter(h => h.type === HistoryType.EXIT).length, color: 'bg-blue-600' }
                      ]} />
                    </div>
                  </div>

                  {/* Bottles Counter Chart */}
                  <div className="bg-slate-900 p-6 md:p-10 rounded-[32px] md:rounded-[48px] border border-slate-800 shadow-3xl xl:col-span-2">
                    <div className="flex justify-between items-center mb-8">
                      <div>
                        <h4 className="text-lg md:text-xl font-black text-white uppercase italic tracking-tighter">Total de Frascos em Estoque</h4>
                        <p className="text-[8px] md:text-[10px] text-slate-600 font-black uppercase tracking-widest">Contagem Unitária Consolidada</p>
                      </div>
                      <div className="w-12 h-12 bg-blue-600/10 text-blue-500 rounded-2xl flex items-center justify-center border border-blue-500/20 shadow-lg shadow-blue-900/20">
                        <i className="fa-solid fa-flask text-xl"></i>
                      </div>
                    </div>
                    <div className="flex flex-col md:flex-row items-center gap-10">
                      <div className="flex-1 w-full space-y-6">
                        <div className="flex items-baseline gap-4">
                          <span className="text-5xl md:text-7xl font-black text-white tracking-tighter">{stats.totalBottles.toLocaleString()}</span>
                          <span className="text-slate-500 font-black uppercase text-xs tracking-widest">Unidades</span>
                        </div>
                        <div className="h-4 bg-slate-950 rounded-full border border-slate-800 overflow-hidden p-1">
                          <div className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.4)]" style={{ width: '100%' }}></div>
                        </div>
                        <p className="text-[10px] md:text-xs text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
                          Este valor representa a soma total de frascos registrados em todos os pallets atualmente alocados no armazém G0.
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-4 w-full md:w-auto shrink-0">
                        <div className="p-6 bg-slate-950/50 rounded-3xl border border-slate-800/50 text-center">
                          <p className="text-[8px] font-black text-slate-600 uppercase mb-2">Média por Pallet</p>
                          <p className="text-2xl font-black text-white italic">
                            {stats.occupiedSlots > 0 ? Math.round(stats.totalBottles / stats.occupiedSlots) : 0}
                          </p>
                        </div>
                        <div className="p-6 bg-slate-950/50 rounded-3xl border border-slate-800/50 text-center">
                          <p className="text-[8px] font-black text-slate-600 uppercase mb-2">Capacidade Max</p>
                          <p className="text-2xl font-black text-blue-500 italic">∞</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Map Shortcut Card */}
                <div className="bg-slate-900 border border-slate-800 rounded-[32px] md:rounded-[48px] p-6 md:p-8 flex flex-col sm:flex-row items-center justify-between overflow-hidden relative group cursor-pointer gap-6" onClick={() => setActiveTab('map')}>
                   <div className="absolute inset-0 bg-blue-600/5 opacity-0 group-hover:opacity-100 transition-all duration-700"></div>
                   <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-8 relative z-10 text-center sm:text-left">
                     <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-950 rounded-2xl md:rounded-3xl flex items-center justify-center border border-slate-800 shadow-2xl group-hover:border-blue-600/50 transition-all duration-500"><i className="fa-solid fa-warehouse text-2xl md:text-3xl text-blue-500"></i></div>
                     <div>
                        <h4 className="text-xl md:text-2xl font-black text-white uppercase italic tracking-tighter">Mapa de vagas G0</h4>
                        <p className="text-[10px] md:text-xs text-slate-500 font-black uppercase tracking-widest mt-1">Visualize a alocação física de cada pallet nos racks</p>
                     </div>
                   </div>
                   <div className="w-12 h-12 md:w-16 md:h-16 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-2xl shadow-blue-900/40 transform group-hover:scale-110 transition-all duration-500 shrink-0"><i className="fa-solid fa-arrow-right"></i></div>
                </div>
            </div>
          )}

          {activeTab === 'map' && <div className="animate-in fade-in duration-500 max-w-7xl mx-auto"><RackView rack="A" /><RackView rack="B" /><RackView rack="C" /><RackView rack="D" /></div>}

          {activeTab === 'import' && (
            <ImportPage 
              availableSlots={slots.filter(s => s.status === SlotContent.EMPTY)} 
              onProcess={handleImportProcess} 
            />
          )}

          {activeTab === 'analysis' && (
            <AnalysisPage 
              pendingItems={data.filter(r => r.status === StockStatus.PENDING)}
              availableSlots={slots.filter(s => s.status === SlotContent.EMPTY)}
              onConfirm={handleConfirmAnalysis}
              onReject={handleRejectAnalysis}
            />
          )}

          {activeTab === 'history' && (
            <div className="max-w-6xl mx-auto space-y-4 animate-in fade-in duration-500">
                {history.length === 0 ? (
                    <div className="py-40 text-center border-2 border-dashed border-slate-900 rounded-[48px]">
                        <i className="fa-solid fa-clock-rotate-left text-5xl text-slate-800 mb-6"></i>
                        <p className="text-slate-700 font-black uppercase text-xs tracking-[0.4em]">Sem movimentações registradas</p>
                    </div>
                ) : (
                    history.map(entry => (
                        <div key={entry.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-8 hover:border-slate-700 transition-all">
                            <div className="flex flex-col items-start min-w-[140px] w-full md:w-auto">
                                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border mb-3 ${
                                    entry.type === HistoryType.ENTRY ? 'bg-green-600/10 text-green-500 border-green-500/20' : 
                                    entry.type === HistoryType.EXIT ? 'bg-blue-600/10 text-blue-500 border-blue-500/20' : 
                                    entry.type === HistoryType.TRANSFER ? 'bg-amber-600/10 text-amber-500 border-amber-500/20' :
                                    'bg-red-600/10 text-red-500 border-red-500/20'
                                }`}>
                                  {entry.type === HistoryType.ENTRY && 'Entrada G0'}
                                  {entry.type === HistoryType.EXIT && 'Saída Matriz'}
                                  {entry.type === HistoryType.TRANSFER && 'Transferência'}
                                  {entry.type === HistoryType.REMOVAL && 'Removido'}
                                </span>
                                <p className="text-[10px] text-slate-600 font-black font-mono">{entry.timestamp}</p>
                            </div>
                            <div className="flex-1 space-y-2 w-full md:w-auto">
                                <div className="flex items-center gap-3"><p className="text-[10px] font-black text-slate-400">ID: {entry.loadingId}</p><div className="h-px flex-1 bg-slate-800 rounded-full"></div><span className="text-[10px] font-black text-slate-600 uppercase italic">Vaga {entry.slot}</span></div>
                                <h4 className="text-white font-black uppercase text-sm leading-tight">{entry.description}</h4>
                                <div className="flex flex-wrap gap-4"><span className="text-[10px] font-bold text-blue-500">OP {entry.op}</span><span className="text-[10px] font-bold text-amber-500">Lote {entry.lot}</span><span className="text-[10px] font-bold text-slate-500">P{entry.palletNumber}/{entry.totalPallets}</span></div>
                            </div>
                            <div className="bg-slate-950 px-6 py-4 rounded-2xl border border-slate-800/50 min-w-[160px] w-full md:w-auto text-center"><p className="text-[11px] font-black text-white uppercase">{entry.details}</p></div>
                        </div>
                    ))
                )}
            </div>
          )}

          {activeTab === 'inventory' && (
            <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
                {/* Search and Filter Area */}
                <div className="flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative flex-1 w-full">
                        <i className="fa-solid fa-magnifying-glass absolute left-6 top-1/2 -translate-y-1/2 text-slate-700"></i>
                        <input 
                            type="text" 
                            value={inventorySearch}
                            onChange={(e) => setInventorySearch(e.target.value)}
                            placeholder="Buscar por OP, Produto ou Lote..." 
                            className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-14 py-4 text-white font-bold focus:border-blue-600 outline-none transition-all placeholder:text-slate-700"
                        />
                    </div>
                    {selectedPallets.length > 0 && (
                        <button 
                            onClick={() => setIsBulkConfirmOpen(true)}
                            className="w-full md:w-auto px-8 py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-purple-900/20 animate-in zoom-in duration-200"
                        >
                            <i className="fa-solid fa-paper-plane"></i> Enviar Selecionados ({selectedPallets.length})
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
                    {filteredInventory.length === 0 ? (
                        <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-900 rounded-[48px]">
                            <p className="text-slate-700 font-black uppercase text-xs tracking-[0.4em]">Nenhum item encontrado no estoque</p>
                        </div>
                    ) : (
                        filteredInventory.map(({ row: item, inspection: insp, idx }) => {
                            const isSelected = selectedPallets.includes(`${item.id}::${idx}`);
                            return (
                                <div 
                                    key={`${item.id}::${idx}`} 
                                    onClick={() => togglePalletSelection(item.id, idx)}
                                    className={`bg-slate-900/40 backdrop-blur-xl p-6 md:p-8 rounded-[2.5rem] md:rounded-[3rem] border border-slate-800 shadow-2xl group hover:-translate-y-1.5 transition-all duration-500 border-t-8 cursor-pointer relative overflow-hidden flex flex-col justify-between h-full min-h-[320px] ${isSelected ? 'border-t-purple-500 ring-2 ring-purple-500/50 bg-purple-900/10' : insp.contentType === SlotContent.BOTTLES ? 'border-t-blue-600' : insp.contentType === SlotContent.SUPPLIES ? 'border-t-amber-600' : 'border-t-green-600'}`}
                                >
                                  {/* Selection Indicator */}
                                  <div className={`absolute top-6 left-6 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-purple-600 border-purple-400 text-white' : 'bg-slate-950/50 border-slate-800 text-transparent'}`}>
                                    <i className="fa-solid fa-check text-[10px]"></i>
                                  </div>

                                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-50"></div>
                                  
                                  <div className="mt-4">
                                    <div className="flex justify-between items-start mb-6">
                                      <div className={`w-12 h-12 md:w-14 md:h-14 bg-slate-950/80 rounded-2xl flex items-center justify-center border border-slate-800 shadow-inner ${insp.contentType === SlotContent.BOTTLES ? 'text-blue-400' : insp.contentType === SlotContent.SUPPLIES ? 'text-amber-400' : 'text-green-500'}`}>
                                        <i className={`fa-solid ${
                                            insp.contentType === SlotContent.BOTTLES ? 'fa-flask' : 
                                            insp.contentType === SlotContent.FINISHED_PRODUCT ? 'fa-dolly' :
                                            'fa-box-open'
                                        } text-xl md:text-2xl`}></i>
                                      </div>
                                      <div className="flex flex-col items-end gap-1.5">
                                        <span className={`bg-slate-950/90 text-[8px] md:text-[10px] font-black px-3 md:px-4 py-1.5 rounded-xl border border-slate-800 uppercase shadow-xl tracking-widest ${insp.assignedSlot?.startsWith('D') ? 'text-green-400 border-green-500/20' : 'text-slate-300'}`}>VAGA {insp.assignedSlot}</span>
                                        <span className="text-[8px] md:text-[9px] text-slate-500 font-black uppercase tracking-widest">Pallet {idx + 1} de {item.pallets}</span>
                                      </div>
                                    </div>

                                    <h4 className="font-black text-white text-sm md:text-base mb-6 uppercase tracking-tight min-h-[3rem] md:min-h-[3.5rem] overflow-hidden leading-tight line-clamp-3">{item.description}</h4>

                                    <div className="grid grid-cols-2 gap-3 mb-6">
                                       <div className="bg-slate-950/80 p-3 md:p-3.5 rounded-2xl border border-slate-800/50 flex flex-col items-center">
                                          <p className="text-[7px] md:text-[8px] text-slate-600 font-black uppercase mb-1 tracking-widest">OP</p>
                                          <p className="text-sm md:text-base font-black text-blue-400 font-mono italic">{item.originOP}</p>
                                       </div>
                                       <div className="bg-slate-950/80 p-3 md:p-3.5 rounded-2xl border border-slate-800/50 flex flex-col items-center">
                                          <p className="text-[7px] md:text-[8px] text-slate-600 font-black uppercase mb-1 tracking-widest">Lote</p>
                                          <p className="text-sm md:text-base font-black text-amber-400 font-mono italic">{item.lot}</p>
                                       </div>
                                    </div>
                                  </div>
                                  
                                  <div className="flex gap-2.5">
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); setDetailContext({ row: item, inspection: insp, idx }); }} 
                                      className="flex-1 py-3 bg-slate-950 hover:bg-slate-800 text-slate-400 border border-slate-800 rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2"
                                    >
                                      <i className="fa-solid fa-circle-info"></i> Detalhes
                                    </button>
                                    
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); setDeleteContext({ type: 'pallet', rowId: item.id, palletIdx: idx }); }} 
                                      className="w-12 h-12 bg-slate-950 hover:bg-red-500/10 text-slate-600 hover:text-red-500 border border-slate-800 hover:border-red-600/50 rounded-2xl transition-all flex items-center justify-center shrink-0"
                                    >
                                      <i className="fa-solid fa-trash-alt text-xs"></i>
                                    </button>
                                  </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
          )}
        </div>
      </main>

      {/* Modals & Dialogs */}
      
      {isBulkConfirmOpen && (
        <InventoryBulkConfirmModal 
          isOpen={isBulkConfirmOpen}
          onClose={() => setIsBulkConfirmOpen(false)}
          onConfirm={handleBulkSend}
          onRemovePallet={(key) => setSelectedPallets(prev => prev.filter(k => k !== key))}
          selectedPallets={selectedPallets.map(key => {
            const parts = key.split('::');
            const rowId = parts.slice(0, parts.length - 1).join('::');
            const palletIdx = parseInt(parts[parts.length - 1]);
            const row = data.find(r => r.id === rowId);
            if (!row || !row.inspections || !row.inspections[palletIdx]) return null;
            return { row, inspection: row.inspections[palletIdx], idx: palletIdx, selectionKey: key };
          }).filter((p): p is { row: SheetRow, inspection: InspectionData, idx: number, selectionKey: string } => p !== null)}
        />
      )}

      {deleteContext && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-3xl text-center space-y-6 animate-in zoom-in duration-200">
            <div className="w-14 h-14 md:w-16 md:h-16 bg-red-600/10 text-red-500 rounded-full flex items-center justify-center mx-auto border border-red-500/20"><i className="fa-solid fa-exclamation-triangle text-xl md:text-2xl"></i></div>
            <h3 className="text-white font-black uppercase text-lg md:text-xl italic tracking-tight">Confirmar Exclusão</h3>
            <p className="text-slate-500 text-[10px] md:text-xs font-bold uppercase tracking-widest leading-relaxed">{deleteContext.type === 'row' ? 'Deseja remover este carregamento da fila?' : 'Deseja remover este pallet do inventário?'}</p>
            <div className="flex gap-4 pt-4"><button onClick={() => setDeleteContext(null)} className="flex-1 py-3 md:py-3.5 bg-slate-800 text-slate-400 font-black text-[9px] md:text-[10px] uppercase rounded-2xl transition-all">Cancelar</button><button onClick={confirmDelete} className="flex-1 py-3 md:py-3.5 bg-red-600 text-white font-black text-[9px] md:text-[10px] uppercase rounded-2xl shadow-lg transition-all active:scale-95">Remover</button></div>
          </div>
        </div>
      )}

      {matrixConfirmContext && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-3xl text-center space-y-6 animate-in zoom-in duration-200">
            <div className="w-14 h-14 md:w-16 md:h-16 bg-blue-600/10 text-blue-500 rounded-full flex items-center justify-center mx-auto border border-red-500/20 shadow-xl shadow-blue-900/20"><i className="fa-solid fa-dolly text-xl md:text-2xl"></i></div>
            <h3 className="text-white font-black uppercase text-lg md:text-xl italic tracking-tight">Confirmar Envio</h3>
            <p className="text-slate-500 text-[10px] md:text-xs font-bold uppercase tracking-widest leading-relaxed px-4">Tem certeza que deseja enviar este pallet para processamento na Matriz?</p>
            <div className="flex gap-4 pt-4">
              <button onClick={() => setMatrixConfirmContext(null)} className="flex-1 py-3 md:py-3.5 bg-slate-800 text-slate-400 font-black text-[9px] md:text-[10px] uppercase rounded-2xl transition-all">Não</button>
              <button onClick={confirmMatrixSend} className="flex-1 py-3 md:py-3.5 bg-blue-600 text-white font-black text-[9px] md:text-[10px] uppercase rounded-2xl shadow-lg shadow-blue-900/40 transition-all active:scale-95">Sim, Enviar</button>
            </div>
          </div>
        </div>
      )}

      {isLogoutConfirmOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/80 backdrop-blur-xl p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-[32px] p-8 max-w-sm w-full shadow-3xl text-center space-y-6 animate-in zoom-in duration-300">
            <div className="w-16 h-16 bg-red-600/10 text-red-500 rounded-2xl flex items-center justify-center mx-auto border border-red-500/20 shadow-xl shadow-red-900/20">
              <i className="fa-solid fa-right-from-bracket text-2xl"></i>
            </div>
            <div>
              <h3 className="text-white font-black uppercase text-xl italic tracking-tight mb-2">Encerrar Sessão</h3>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest leading-relaxed px-4">Tem certeza que deseja sair do sistema Stoque+?</p>
            </div>
            <div className="flex gap-4 pt-4">
              <button 
                onClick={() => setIsLogoutConfirmOpen(false)} 
                className="flex-1 py-4 bg-slate-800 text-slate-400 font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all hover:bg-slate-700"
              >
                Cancelar
              </button>
              <button 
                onClick={handleLogout} 
                className="flex-1 py-4 bg-red-600 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-lg shadow-red-900/40 transition-all hover:bg-red-500 active:scale-95"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      )}

      {detailContext && <InventoryDetailModal isOpen={!!detailContext} onClose={() => setDetailContext(null)} row={detailContext.row} inspection={detailContext.inspection} palletIdx={detailContext.idx} />}
      
      <MovementModal 
        isOpen={isMovementModalOpen} 
        onClose={() => setIsMovementModalOpen(false)}
        onEntry={handleMovementEntry}
        onTransfer={handleMovementTransfer}
        onExit={handleMovementExit}
        availableSlots={slots.filter(s => s.status === SlotContent.EMPTY)}
        occupiedSlots={slots.filter(s => s.status !== SlotContent.EMPTY)}
        inventoryData={data}
      />
    </div>
  );
};

export default App;
