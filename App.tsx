
import React, { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Package, 
  ArrowLeftRight, 
  History, 
  FileUp, 
  ClipboardCheck, 
  LogOut, 
  Menu, 
  X, 
  FlaskConical, 
  Warehouse, 
  Boxes, 
  CheckCircle2, 
  AlertCircle,
  Share2,
  Download,
  ArrowRight,
  Truck,
  Search,
  Trash2,
  Info,
  Send,
  Plus,
  Pencil,
  RefreshCw
} from 'lucide-react';
import { SheetRow, StockStatus, InspectionData, DashboardStats, WarehouseSlot, SlotContent, HistoryEntry, HistoryType, translateSlotContent } from './types';
import { InventoryDetailModal } from './components/InventoryDetailModal';
import { InventoryBulkConfirmModal } from './components/InventoryBulkConfirmModal';
import { EditPalletModal } from './components/EditPalletModal';
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
    <div className="flex items-center gap-2">
      <div className={`${isSm ? 'w-8 h-8' : 'w-10 h-10'} bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/20`}>
        <Warehouse className={`${isSm ? 'w-5 h-5' : 'w-6 h-6'} text-white`} />
      </div>
      <div>
        <h1 className={`${isSm ? 'text-lg' : 'text-2xl'} font-black tracking-tighter text-white flex items-center leading-none`}>
          Stoque<span className="text-blue-500">+</span>
        </h1>
        {!isSm && <p className="text-[8px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-0.5">Ybera Paris</p>}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isPublicView, setIsPublicView] = useState(false);
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
  const [editPalletContext, setEditPalletContext] = useState<{ row: SheetRow, inspection: InspectionData, idx: number } | null>(null);
  const [searchLoadingId, setSearchLoadingId] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  const [processedIds, setProcessedIds] = useState<string[]>([]);

  // Load data from Supabase
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if we are in public view mode via URL param
        const params = new URLSearchParams(window.location.search);
        if (params.get('view') === 'public') {
          setIsPublicView(true);
          setIsAuthLoading(false);
          return;
        }

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
    if (!user && !isPublicView) return;

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
          // Auto-sanitize slots based on inventory to prevent ghost data
          const occupiedSlotsMap = new Map();
          invData.forEach(item => {
            if (item.inspections && item.inspections[0]?.assignedSlot) {
              occupiedSlotsMap.set(item.inspections[0].assignedSlot, {
                status: item.inspections[0].contentType,
                occupiedBy: item.originOP || item.description
              });
            }
          });

          const sanitizedSlots = slotData.map(slot => {
            const inventoryInfo = occupiedSlotsMap.get(slot.id);
            if (inventoryInfo) {
              return {
                ...slot,
                status: inventoryInfo.status,
                occupiedBy: inventoryInfo.occupiedBy
              };
            }
            return {
              ...slot,
              status: SlotContent.EMPTY,
              occupiedBy: undefined
            };
          });

          setSlots(sanitizedSlots);
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
      if (payload.user !== user?.id) {
        showNotification(payload.message, payload.type || 'info');
      }
    });

    return () => {
      inventoryChannel.unsubscribe();
      slotsChannel.unsubscribe();
      notificationsChannel.unsubscribe();
    };
  }, [user, isPublicView]);

  const handleExportInventory = () => {
    try {
      // Prepare data for export
      // We want: op, nome, lote, quantidade, tipo
      const exportData = data.flatMap(row => {
        // Only export items that are in stock (not pending analysis)
        if (row.status === StockStatus.PENDING) return [];

        return (row.inspections || []).map(insp => ({
          op: row.originOP,
          nome: row.description,
          lote: row.lot,
          quantidade: insp.bottles || 0,
          tipo: translateSlotContent(insp.contentType)
        }));
      });

      if (exportData.length === 0) {
        showNotification('Não há dados para exportar.', 'error');
        return;
      }

      const csv = Papa.unparse(exportData);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `estoque_geral_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showNotification('Estoque exportado com sucesso!');
    } catch (error) {
      console.error('Export error:', error);
      showNotification('Erro ao exportar estoque.', 'error');
    }
  };

  const handleShareDashboard = () => {
    const publicUrl = `${window.location.origin}${window.location.pathname}?view=public`;
    navigator.clipboard.writeText(publicUrl);
    showNotification('Link do Dashboard Público copiado para a área de transferência!');
  };

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
          bottles: entryData.supplyDetails?.bottles || 0,
          caps: entryData.supplyDetails?.caps || 0,
          boxes: entryData.supplyDetails?.boxes || 0,
          cradles: entryData.supplyDetails?.cradles || 0,
          supplyDescription: entryData.supplyDetails?.description || '',
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
        details: `Entrada manual por ${user?.name || 'Operador'}. ID Gerado: ${entryData.id}`
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
            details: `Importação via CSV por ${user?.name || 'Sistema'}. ID: ${row.loadingId}`
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
        details: `Entrada confirmada por ${user?.name || 'Operador'}. ID Final: ${finalId}`
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
        details: `Transferência por ${user?.name || 'Operador'} de ${transferData.fromSlot} para ${transferData.toSlot}`
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
        details: `Saída por ${user?.name || 'Operador'}: ${exitData.reason}`
      });

      showNotification('Saída registrada com sucesso.');
      setIsMovementModalOpen(false);
    } catch (error) {
      console.error('Exit error:', error);
      showNotification('Erro ao registrar saída.', 'error');
    }
  };

  const handleResyncSlots = async () => {
    try {
      showNotification('Iniciando sincronização de vagas...', 'info');
      
      // 1. Get current inventory and slots
      const [invData, slotData] = await Promise.all([
        supabaseService.getInventory(),
        supabaseService.getSlots()
      ]);

      // 2. Map of occupied slots from inventory
      const occupiedSlotsMap = new Map();
      invData.forEach(item => {
        if (item.inspections && item.inspections[0]?.assignedSlot) {
          occupiedSlotsMap.set(item.inspections[0].assignedSlot, {
            status: item.inspections[0].contentType,
            occupiedBy: item.originOP || item.description
          });
        }
      });

      // 3. Prepare updated slots
      const updatedSlots = slotData.map(slot => {
        const inventoryInfo = occupiedSlotsMap.get(slot.id);
        if (inventoryInfo) {
          return {
            ...slot,
            status: inventoryInfo.status,
            occupiedBy: inventoryInfo.occupiedBy
          };
        } else {
          return {
            ...slot,
            status: SlotContent.EMPTY,
            occupiedBy: undefined
          };
        }
      });

      // 4. Bulk update in Supabase
      await supabaseService.bulkUpdateSlots(updatedSlots);
      
      // 5. Update local state
      setSlots(updatedSlots);
      
      showNotification('Vagas sincronizadas com sucesso!', 'info');
    } catch (error: any) {
      console.error('Resync error:', error);
      showNotification(`Erro ao sincronizar: ${error.message}`, 'error');
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

  const handleUpdatePallet = async (updatedData: { description: string; op: string; lot: string }) => {
    if (!editPalletContext) return;

    try {
      const { row } = editPalletContext;
      const updatedRow = { ...row };
      
      updatedRow.description = updatedData.description;
      updatedRow.originOP = updatedData.op;
      updatedRow.lot = updatedData.lot;

      await supabaseService.saveInventoryItem(updatedRow);
      setData(prev => prev.map(r => r.id === updatedRow.id ? updatedRow : r));
      
      showNotification('Dados do pallet atualizados com sucesso!');
      setEditPalletContext(null);
    } catch (error: any) {
      console.error('Update error:', error);
      showNotification('Erro ao atualizar pallet', 'error');
    }
  };

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
    return allPallets.sort((a, b) => {
      const slotA = a.inspection.assignedSlot || '';
      const slotB = b.inspection.assignedSlot || '';
      return slotA.localeCompare(slotB, undefined, { numeric: true });
    });
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
      <div className="bg-slate-900/40 p-5 md:p-8 rounded-[2.5rem] border border-slate-800/50 shadow-2xl overflow-hidden mb-6">
        <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
          <div className="flex items-center gap-3">
             <div className={`w-1.5 h-8 rounded-full ${rack === 'D' ? 'bg-green-600' : rack === 'A' ? 'bg-blue-600' : 'bg-amber-600'}`}></div>
             <div className="flex flex-col">
                <h4 className="text-lg font-black text-white uppercase tracking-tighter flex items-center gap-2">
                  Porta Pallet {rack} <span className="text-slate-500 font-medium text-sm">/ {rackTitles[rack]}</span>
                </h4>
                <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">Topografia Interna</p>
             </div>
          </div>
          
          <div className="bg-slate-950/50 px-4 py-2 rounded-xl border border-slate-800/50 flex items-center gap-6">
            <div className="flex flex-col items-center">
              <span className="text-[8px] text-slate-600 font-bold uppercase mb-0.5">Livres</span>
              <span className="text-sm font-black text-blue-500">{freeCount}</span>
            </div>
            <div className="w-px h-6 bg-slate-800/50"></div>
            <div className="flex flex-col items-center">
              <span className="text-[8px] text-slate-600 font-bold uppercase mb-0.5">Total</span>
              <span className="text-sm font-black text-white">{totalCount}</span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-2">
          {rackSlots.map(slot => {
            const ContentIcon = slot.status === SlotContent.EMPTY ? undefined : slot.status === SlotContent.BOTTLES ? FlaskConical : slot.status === SlotContent.FINISHED_PRODUCT ? Truck : Package;
            
            return (
              <div key={slot.id} className={`aspect-square rounded-xl border flex flex-col items-center justify-center p-1 transition-all group relative ${
                slot.status === SlotContent.EMPTY ? 'bg-slate-950/30 border-slate-800/50 hover:border-slate-700' : 
                slot.status === SlotContent.BOTTLES ? 'bg-blue-600/10 border-blue-600/30' : 
                slot.status === SlotContent.SUPPLIES ? 'bg-amber-600/10 border-amber-600/30' :
                'bg-green-600/10 border-green-600/30'
              }`}>
                <span className="text-[7px] font-bold text-slate-600 mb-1">{slot.id.split('.').slice(1).join('.')}</span>
                {ContentIcon ? (
                  <ContentIcon className={`w-3.5 h-3.5 ${
                    slot.status === SlotContent.BOTTLES ? 'text-blue-500' : 
                    slot.status === SlotContent.SUPPLIES ? 'text-amber-500' :
                    'text-green-500'
                  }`} />
                ) : (
                  <div className="w-1 h-1 rounded-full bg-slate-800 group-hover:bg-slate-700 transition-colors"></div>
                )}
                
                {slot.occupiedBy && (
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-slate-900/95 backdrop-blur-sm rounded-xl flex items-center justify-center z-10 transition-opacity border border-slate-700 p-1">
                    <span className="text-[7px] font-bold text-white text-center leading-tight line-clamp-3">{slot.occupiedBy}</span>
                  </div>
                )}
              </div>
            );
          })}
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

  const NavItem = ({ tab, icon: Icon, label, badge }: { tab: typeof activeTab, icon: React.ElementType, label: string, badge?: number }) => (
    <button 
      onClick={() => { setActiveTab(tab); setIsSidebarOpen(false); }} 
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all relative group ${activeTab === tab ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'hover:bg-slate-800/60 text-slate-400 hover:text-slate-200'}`}
    >
      <Icon className={`w-4 h-4 ${activeTab === tab ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`} />
      <span className="font-semibold text-sm">{label}</span>
      {badge ? (
        <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-950 text-blue-400 border border-blue-900/30">
          {badge}
        </span>
      ) : null}
      {activeTab === tab && (
        <motion.div 
          layoutId="activeTab"
          className="absolute left-0 w-1 h-6 bg-white rounded-r-full"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      )}
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

  if (!user && !isPublicView) {
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
              {n.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
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
      {!isPublicView && (
        <aside className={`fixed lg:sticky top-0 left-0 h-screen w-72 bg-slate-900/80 backdrop-blur-xl border-r border-slate-800 shadow-2xl z-50 transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} flex-shrink-0 flex flex-col`}>
          <div className="p-8 border-b border-slate-800/60 flex justify-between items-center">
            <Logo />
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-500 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="p-4 py-6 space-y-1 flex-1 overflow-y-auto">
            <NavItem tab="dashboard" icon={LayoutDashboard} label="Dashboard" />
            <NavItem tab="movement" icon={ArrowLeftRight} label="Movimentação" />
            <NavItem tab="inventory" icon={Package} label="Estoque Geral" />
            <NavItem tab="map" icon={Warehouse} label="Mapa de vagas" />
            <NavItem tab="import" icon={FileUp} label="Importar CSV" />
            <NavItem tab="analysis" icon={ClipboardCheck} label="Análise" badge={data.filter(r => r.status === StockStatus.PENDING).length} />
            <NavItem tab="history" icon={History} label="Histórico" />
          </nav>

          <div className="p-4 space-y-3">
            <div className="p-5 bg-slate-900/40 border border-slate-800 rounded-2xl">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-600/10 flex items-center justify-center text-[10px] font-black text-blue-500 border border-blue-500/20 shadow-lg shadow-blue-900/20">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-[11px] font-black text-white uppercase tracking-tight">{user?.name}</p>
                    <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">{user?.role === 'admin' ? 'Administrador' : 'Operador'}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsLogoutConfirmOpen(true)}
                  className="w-7 h-7 rounded-lg bg-red-500/10 text-red-500 border border-red-500/20 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-lg"
                  title="Sair do Sistema"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-[8px] font-black text-slate-500 uppercase tracking-widest">
                  <span>Ocupação G0</span>
                  <span>{stats.occupancyRate}%</span>
                </div>
                <div className="h-1.5 bg-slate-950 rounded-full border border-slate-800 overflow-hidden">
                   <div className="h-full bg-blue-600 rounded-full shadow-[0_0_8px_rgba(37,99,235,0.4)] transition-all duration-1000" style={{ width: `${stats.occupancyRate}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-screen lg:h-screen overflow-hidden">
        <header className="bg-slate-950/50 backdrop-blur-xl border-b border-slate-900/50 h-16 px-6 md:px-10 flex justify-between items-center sticky top-0 z-30">
          <div className="flex items-center gap-4">
            {!isPublicView && (
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden w-9 h-9 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-all active:scale-95"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
            {isPublicView && <Logo isSm={true} />}
            <h2 className="text-lg md:text-xl font-black text-white tracking-tight uppercase italic line-clamp-1">
              {isPublicView ? 'Dashboard Público' : (
                <>
                  {activeTab === 'dashboard' && 'Painel de Controle'}
                  {activeTab === 'movement' && 'Movimentação'}
                  {activeTab === 'inventory' && 'Inventário G0'}
                  {activeTab === 'map' && 'Mapa de vagas'}
                  {activeTab === 'import' && 'Importar CSV'}
                  {activeTab === 'analysis' && 'Análise de Recebimento'}
                  {activeTab === 'history' && 'Histórico'}
                </>
              )}
            </h2>
          </div>
          
          <div className="flex items-center gap-3 shrink-0">
             {isPublicView && (
               <button 
                 onClick={() => window.location.href = window.location.origin + window.location.pathname}
                 className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-[9px] uppercase tracking-widest transition-all shadow-lg shadow-blue-900/20"
               >
                 Acessar App
               </button>
             )}
             <div className="flex items-center gap-2 bg-slate-900/50 px-3 py-1.5 rounded-full border border-slate-800/50">
               <span className={`w-1.5 h-1.5 rounded-full ${isSearching ? 'bg-amber-500 animate-pulse' : 'bg-green-500'}`}></span>
               <span className="hidden sm:inline text-[9px] font-bold text-slate-500 uppercase tracking-widest">{isSearching ? 'Sincronizando' : 'Online'}</span>
             </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-8 lg:p-14">
          {activeTab === 'movement' && (
            <div className="max-w-4xl mx-auto text-center space-y-8 py-20 animate-in fade-in slide-in-from-bottom-10 duration-700">
              <div className="w-24 h-24 bg-blue-600/10 text-blue-500 rounded-[32px] flex items-center justify-center mx-auto border border-blue-500/20 shadow-2xl shadow-blue-900/20 mb-8">
                <Truck className="w-10 h-10" />
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
                  Abrir Painel de Movimentação <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {(activeTab === 'dashboard' || isPublicView) && (
            <div className="max-w-7xl mx-auto space-y-6 md:space-y-8 animate-in fade-in duration-700">
                {/* Dashboard Actions */}
                <div className="flex flex-wrap justify-end gap-3">
                    {!isPublicView && (
                      <button 
                          onClick={handleShareDashboard}
                          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all border border-slate-800 hover:border-amber-500/30 group"
                      >
                          <Share2 className="w-3.5 h-3.5 text-amber-500 group-hover:scale-110 transition-transform" /> Compartilhar
                      </button>
                    )}
                    <button 
                        onClick={handleExportInventory}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all border border-slate-800 hover:border-blue-500/30 group"
                    >
                        <Download className="w-3.5 h-3.5 text-blue-500 group-hover:scale-110 transition-transform" /> Exportar CSV
                    </button>
                </div>

                {/* Occupancy Progress Bar */}
                <div className="bg-slate-900/40 p-6 rounded-[2rem] border border-slate-800/50 shadow-xl space-y-3">
                  <div className="flex justify-between items-end">
                    <div>
                      <h4 className="text-xs font-black text-white uppercase tracking-widest italic">Utilização do Armazém G0</h4>
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Capacidade em tempo real</p>
                    </div>
                    <div className="text-right flex items-center gap-4">
                      <button 
                        onClick={handleResyncSlots}
                        className="p-2 bg-slate-950 hover:bg-slate-900 text-slate-500 hover:text-blue-500 rounded-lg border border-slate-800 transition-all group"
                        title="Sincronizar Vagas"
                      >
                        <RefreshCw className="w-3.5 h-3.5 group-active:rotate-180 transition-transform duration-500" />
                      </button>
                      <span className="text-2xl font-black text-blue-500 italic">{stats.occupancyRate}%</span>
                    </div>
                  </div>
                  <div className="h-3 bg-slate-950 rounded-full border border-slate-800 overflow-hidden relative">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${stats.occupancyRate}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className={`h-full rounded-full shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all ${
                        stats.occupancyRate > 90 ? 'bg-red-500 shadow-red-900/40' : 
                        stats.occupancyRate > 75 ? 'bg-amber-500 shadow-amber-900/40' : 
                        'bg-blue-600'
                      }`}
                    />
                  </div>
                  <div className="flex justify-between text-[8px] font-black text-slate-600 uppercase tracking-widest">
                    <span>0%</span>
                    <span>{stats.occupiedSlots} / {stats.totalSlots} Vagas</span>
                    <span>100%</span>
                  </div>
                </div>

                {/* Top Stats Row: Flasks, Free, Occupied */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                    {/* Flasks - Smaller as requested */}
                    <div className="bg-slate-900/40 p-5 rounded-3xl border border-slate-800/50 shadow-xl flex items-center gap-4 group hover:border-blue-500/30 transition-all">
                       <div className="w-10 h-10 bg-blue-600/10 text-blue-500 rounded-xl flex items-center justify-center border border-blue-500/20 group-hover:scale-110 transition-transform">
                         <FlaskConical className="w-5 h-5" />
                       </div>
                       <div>
                         <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-0.5">Total de Frascos</p>
                         <p className="text-2xl font-black text-white tracking-tight">{stats.totalBottles.toLocaleString()}</p>
                       </div>
                    </div>

                    {/* Free Slots */}
                    <div className="bg-slate-900/40 p-5 rounded-3xl border border-slate-800/50 shadow-xl flex items-center gap-4 group hover:border-green-500/30 transition-all">
                       <div className="w-10 h-10 bg-green-600/10 text-green-500 rounded-xl flex items-center justify-center border border-green-500/20 group-hover:scale-110 transition-transform">
                         <CheckCircle2 className="w-5 h-5" />
                       </div>
                       <div>
                         <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-0.5">Vagas Livres</p>
                         <p className="text-2xl font-black text-white tracking-tight">{stats.freeSlots}</p>
                       </div>
                       <div className="ml-auto text-right">
                         <p className="text-[8px] text-slate-600 font-bold uppercase tracking-widest">Total: {stats.totalSlots}</p>
                       </div>
                    </div>

                    {/* Occupied Slots */}
                    <div className="bg-slate-900/40 p-5 rounded-3xl border border-slate-800/50 shadow-xl flex items-center gap-4 group hover:border-amber-500/30 transition-all">
                       <div className="w-10 h-10 bg-amber-600/10 text-amber-500 rounded-xl flex items-center justify-center border border-amber-500/20 group-hover:scale-110 transition-transform">
                         <Boxes className="w-5 h-5" />
                       </div>
                       <div>
                         <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-0.5">Vagas Ocupadas</p>
                         <p className="text-2xl font-black text-white tracking-tight">{stats.occupiedSlots}</p>
                       </div>
                       <div className="ml-auto text-right">
                         <p className="text-[8px] text-slate-600 font-bold uppercase tracking-widest">{stats.occupancyRate}% Ocupação</p>
                       </div>
                    </div>
                </div>

                {/* Bottom Stats Row: Movements, Pending */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    {/* Movements */}
                    <div className="bg-slate-900/60 p-6 md:p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl hover:border-indigo-500/30 transition-all relative overflow-hidden group">
                       <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                         <History className="w-32 h-32" />
                       </div>
                       <div className="flex justify-between items-start mb-6">
                         <div className="w-12 h-12 bg-indigo-600/10 text-indigo-500 rounded-2xl flex items-center justify-center border border-indigo-500/20 shadow-lg shadow-indigo-900/20">
                           <History className="w-6 h-6" />
                         </div>
                         <div className="text-right">
                           <h4 className="text-sm font-black text-white uppercase italic tracking-tight">Movimentações</h4>
                           <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Últimas 24 Horas</p>
                         </div>
                       </div>
                       <div className="flex items-baseline gap-3">
                         <p className="text-5xl md:text-7xl font-black text-white tracking-tighter">{stats.dailyMovements}</p>
                         <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Registros</p>
                       </div>
                       <div className="mt-6 pt-6 border-t border-slate-800/50 flex items-center justify-between">
                         <div className="flex gap-2">
                           <div className="px-2 py-1 rounded-lg bg-green-500/10 text-green-500 text-[8px] font-bold uppercase border border-green-500/20">Entradas: {history.filter(h => h.type === HistoryType.ENTRY).length}</div>
                           <div className="px-2 py-1 rounded-lg bg-blue-500/10 text-blue-500 text-[8px] font-bold uppercase border border-blue-500/20">Saídas: {history.filter(h => h.type === HistoryType.EXIT).length}</div>
                         </div>
                         <button onClick={() => setActiveTab('history')} className="text-[9px] font-bold text-indigo-400 hover:text-indigo-300 uppercase tracking-widest flex items-center gap-1.5 transition-colors">
                           Ver tudo <ArrowRight className="w-3 h-3" />
                         </button>
                       </div>
                    </div>

                    {/* Pending Entries */}
                    <div className="bg-slate-900/60 p-6 md:p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl hover:border-red-500/30 transition-all relative overflow-hidden group">
                       <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                         <Truck className="w-32 h-32" />
                       </div>
                       <div className="flex justify-between items-start mb-6">
                         <div className="w-12 h-12 bg-red-600/10 text-red-500 rounded-2xl flex items-center justify-center border border-red-500/20 shadow-lg shadow-red-900/20">
                           <Truck className="w-6 h-6" />
                         </div>
                         <div className="text-right">
                           <h4 className="text-sm font-black text-white uppercase italic tracking-tight">Entradas Pendentes</h4>
                           <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Aguardando Análise</p>
                         </div>
                       </div>
                       <div className="flex items-baseline gap-3">
                         <p className="text-5xl md:text-7xl font-black text-white tracking-tighter">{stats.pendingEntries}</p>
                         <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Cargas</p>
                       </div>
                       <div className="mt-6 pt-6 border-t border-slate-800/50 flex items-center justify-between">
                         <div className="flex items-center gap-2">
                           <div className={`w-2 h-2 rounded-full ${stats.pendingEntries > 0 ? 'bg-red-500 animate-pulse' : 'bg-slate-700'}`}></div>
                           <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                             {stats.pendingEntries > 0 ? 'Ação Necessária' : 'Tudo em dia'}
                           </p>
                         </div>
                         <button onClick={() => setActiveTab('analysis')} className="text-[9px] font-bold text-red-400 hover:text-red-300 uppercase tracking-widest flex items-center gap-1.5 transition-colors">
                           Ir para Análise <ArrowRight className="w-3 h-3" />
                         </button>
                       </div>
                    </div>
                </div>

                {/* Charts Area - Keeping some but making them more modern */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-8">
                  {/* Rack Distribution Chart */}
                  <div className="bg-slate-900/40 p-8 md:p-10 rounded-[2.5rem] border border-slate-800/50 shadow-2xl">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                      <div>
                        <h4 className="text-lg font-black text-white uppercase italic tracking-tighter">Distribuição por Rack</h4>
                        <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest">Ocupação Setorial G0</p>
                      </div>
                      <div className="flex gap-3">
                        <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div><span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Ocupação</span></div>
                      </div>
                    </div>
                    <div className="space-y-6">
                      {['A', 'B', 'C', 'D'].map(rack => {
                        const rackSlots = slots.filter(s => s.rack === rack);
                        const occupied = rackSlots.filter(s => s.status !== SlotContent.EMPTY).length;
                        const total = rackSlots.length;
                        const rate = Math.round((occupied / total) * 100);
                        const color = rack === 'A' ? 'bg-blue-600' : rack === 'B' ? 'bg-amber-600' : rack === 'C' ? 'bg-indigo-600' : 'bg-green-600';
                        
                        return (
                          <div key={rack} className="space-y-2">
                            <div className="flex justify-between items-end">
                              <span className="text-[10px] font-black text-white uppercase tracking-widest italic">Porta Pallet {rack}</span>
                              <span className="text-[10px] font-black text-slate-400">{rate}% ({occupied}/{total})</span>
                            </div>
                            <div className="h-2 bg-slate-950 rounded-full border border-slate-800 overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${rate}%` }}
                                className={`h-full ${color} rounded-full`}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Product Distribution Card */}
                  <div className="bg-slate-900/40 p-8 md:p-10 rounded-[2.5rem] border border-slate-800/50 shadow-2xl">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                      <div>
                        <h4 className="text-lg font-black text-white uppercase italic tracking-tighter">Distribuição por Produto</h4>
                        <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest">Ocupação por Categoria G0</p>
                      </div>
                      <div className="flex gap-3">
                        <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-purple-600"></div><span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Categoria</span></div>
                      </div>
                    </div>
                    <div className="space-y-6">
                      {[
                        { type: SlotContent.BOTTLES, label: 'Frascos', color: 'bg-blue-600' },
                        { type: SlotContent.SUPPLIES, label: 'Insumos', color: 'bg-amber-600' },
                        { type: SlotContent.FINISHED_PRODUCT, label: 'Produtos Acabados', color: 'bg-green-600' },
                        { type: SlotContent.RETURN, label: 'Retorno', color: 'bg-red-600' },
                        { type: 'OTHER', label: 'Outros', color: 'bg-slate-600' }
                      ].map(item => {
                        const count = item.type === 'OTHER' 
                          ? slots.filter(s => s.status !== SlotContent.EMPTY && ![SlotContent.BOTTLES, SlotContent.SUPPLIES, SlotContent.FINISHED_PRODUCT, SlotContent.RETURN].includes(s.status)).length
                          : slots.filter(s => s.status === item.type).length;
                        
                        const totalOccupied = stats.occupiedSlots || 1;
                        const rate = Math.round((count / totalOccupied) * 100);
                        
                        return (
                          <div key={item.label} className="space-y-2">
                            <div className="flex justify-between items-end">
                              <span className="text-[10px] font-black text-white uppercase tracking-widest italic">{item.label}</span>
                              <span className="text-[10px] font-black text-slate-400">{rate}% ({count})</span>
                            </div>
                            <div className="h-2 bg-slate-950 rounded-full border border-slate-800 overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${rate}%` }}
                                className={`h-full ${item.color} rounded-full`}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
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
            <div className="max-w-5xl mx-auto space-y-3 animate-in fade-in duration-500">
                {history.length === 0 ? (
                    <div className="py-32 text-center border-2 border-dashed border-slate-900 rounded-[2.5rem]">
                        <History className="w-12 h-12 text-slate-800 mx-auto mb-4" />
                        <p className="text-slate-700 font-bold uppercase text-[10px] tracking-[0.3em]">Sem movimentações registradas</p>
                    </div>
                ) : (
                    history.map(entry => (
                        <div key={entry.id} className="bg-slate-900/40 border border-slate-800/50 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center gap-4 hover:border-slate-700 transition-all group">
                            <div className="flex flex-col items-start min-w-[120px]">
                                <span className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border mb-2 ${
                                    entry.type === HistoryType.ENTRY ? 'bg-green-500/10 text-green-500 border-green-500/20' : 
                                    entry.type === HistoryType.EXIT ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 
                                    entry.type === HistoryType.TRANSFER ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                    'bg-red-500/10 text-red-500 border-red-500/20'
                                }`}>
                                  {entry.type === HistoryType.ENTRY && 'Entrada'}
                                  {entry.type === HistoryType.EXIT && 'Saída'}
                                  {entry.type === HistoryType.TRANSFER && 'Transf.'}
                                  {entry.type === HistoryType.REMOVAL && 'Removido'}
                                </span>
                                <p className="text-[9px] text-slate-600 font-bold font-mono">{entry.timestamp}</p>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tight">ID: {entry.loadingId}</p>
                                  <div className="h-px flex-1 bg-slate-800/50"></div>
                                  <span className="text-[9px] font-black text-slate-400 uppercase italic">Vaga {entry.slot}</span>
                                </div>
                                <h4 className="text-white font-bold uppercase text-xs truncate">{entry.description}</h4>
                                <div className="flex flex-wrap gap-3 mt-1">
                                  <span className="text-[9px] font-bold text-blue-500/80">OP {entry.op}</span>
                                  <span className="text-[9px] font-bold text-amber-500/80">Lote {entry.lot}</span>
                                  <span className="text-[9px] font-bold text-slate-500">P{entry.palletNumber}/{entry.totalPallets}</span>
                                </div>
                            </div>
                            <div className="bg-slate-950/50 px-4 py-2.5 rounded-xl border border-slate-800/50 min-w-[140px] text-center">
                              <p className="text-[10px] font-bold text-slate-300 uppercase tracking-tight">{entry.details}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>
          )}

          {activeTab === 'inventory' && (
            <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
                {/* Search and Filter Area */}
                <div className="flex flex-col md:flex-row gap-3 items-center">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-700 w-4 h-4" />
                        <input 
                            type="text" 
                            value={inventorySearch}
                            onChange={(e) => setInventorySearch(e.target.value)}
                            placeholder="Buscar por OP, Produto ou Lote..." 
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-11 py-3 text-white font-semibold text-sm focus:border-blue-600 outline-none transition-all placeholder:text-slate-700"
                        />
                    </div>
                    {selectedPallets.length > 0 && (
                        <button 
                            onClick={() => setIsBulkConfirmOpen(true)}
                            className="w-full md:w-auto px-5 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-purple-900/20 animate-in zoom-in duration-200"
                        >
                            <Send className="w-3.5 h-3.5" /> Enviar Selecionados ({selectedPallets.length})
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                    {filteredInventory.length === 0 ? (
                        <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-900 rounded-[32px]">
                            <p className="text-slate-700 font-black uppercase text-[10px] tracking-[0.3em]">Nenhum item encontrado no estoque</p>
                        </div>
                    ) : (
                        filteredInventory.map(({ row: item, inspection: insp, idx }) => {
                            const isSelected = selectedPallets.includes(`${item.id}::${idx}`);
                            const isUseConsumption = insp.contentType === SlotContent.USE_CONSUMPTION;
                            const ContentIcon = insp.contentType === SlotContent.BOTTLES ? FlaskConical : insp.contentType === SlotContent.FINISHED_PRODUCT ? Truck : Package;
                            
                            return (
                                <motion.div 
                                    layout
                                    key={`${item.id}::${idx}`} 
                                    onClick={() => togglePalletSelection(item.id, idx)}
                                    className={`bg-slate-900/40 backdrop-blur-xl p-6 rounded-[2rem] border border-slate-800 shadow-xl group hover:border-slate-700 transition-all duration-300 cursor-pointer relative overflow-hidden flex flex-col justify-between h-full min-h-[280px] ${isSelected ? 'ring-2 ring-purple-500/50 bg-purple-900/10 border-purple-500/50' : ''}`}
                                >
                                  {/* Selection Indicator */}
                                  <div className={`absolute top-4 left-4 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-purple-600 border-purple-400 text-white' : 'bg-slate-950/50 border-slate-800 text-transparent'}`}>
                                    <CheckCircle2 className="w-3 h-3" />
                                  </div>

                                  <div className="mt-4">
                                    <div className="flex justify-between items-start mb-4">
                                      <div className={`w-10 h-10 bg-slate-950 rounded-xl flex items-center justify-center border border-slate-800 shadow-inner ${insp.contentType === SlotContent.BOTTLES ? 'text-blue-400' : insp.contentType === SlotContent.SUPPLIES ? 'text-amber-400' : 'text-green-500'}`}>
                                        <ContentIcon className="w-5 h-5" />
                                      </div>
                                      <div className="flex flex-col items-end gap-1">
                                        <span className={`bg-slate-950/90 text-[9px] font-black px-2.5 py-1 rounded-lg border border-slate-800 uppercase tracking-widest ${insp.assignedSlot?.startsWith('D') ? 'text-green-400 border-green-500/20' : 'text-slate-300'}`}>VAGA {insp.assignedSlot}</span>
                                        <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Pallet {idx + 1}/{item.pallets}</span>
                                      </div>
                                    </div>

                                    <h4 className="font-bold text-white text-[13px] mb-4 uppercase tracking-tight leading-snug min-h-[3rem] line-clamp-3 group-hover:line-clamp-none transition-all">{item.description}</h4>

                                    <div className="grid grid-cols-2 gap-2 mb-4">
                                       {item.originOP && (
                                         <div className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/50 text-center">
                                            <p className="text-[7px] text-slate-600 font-bold uppercase mb-0.5 tracking-widest">OP</p>
                                            <p className="text-xs font-black text-blue-400 font-mono italic">{item.originOP}</p>
                                         </div>
                                       )}
                                       {item.lot && (
                                         <div className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/50 text-center">
                                            <p className="text-[7px] text-slate-600 font-bold uppercase mb-0.5 tracking-widest">Lote</p>
                                            <p className="text-xs font-black text-amber-400 font-mono italic">{item.lot}</p>
                                         </div>
                                       )}
                                       {isUseConsumption && (
                                         <div className="col-span-2 bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/50 text-center">
                                            <p className="text-[7px] text-slate-600 font-bold uppercase mb-0.5 tracking-widest">Tipo</p>
                                            <p className="text-xs font-black text-purple-400 uppercase italic">Uso e Consumo</p>
                                         </div>
                                       )}
                                    </div>
                                  </div>
                                  
                                  <div className="flex gap-2">
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); setDetailContext({ row: item, inspection: insp, idx }); }} 
                                      className="flex-1 py-2 bg-slate-950 hover:bg-slate-800 text-slate-400 border border-slate-800 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-1.5"
                                    >
                                      <Info className="w-3 h-3" /> Detalhes
                                    </button>

                                    <button 
                                      onClick={(e) => { e.stopPropagation(); setEditPalletContext({ row: item, inspection: insp, idx }); }} 
                                      className="flex-1 py-2 bg-slate-950 hover:bg-blue-600/10 text-blue-400 border border-slate-800 hover:border-blue-500/50 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-1.5"
                                    >
                                      <Pencil className="w-3 h-3" /> Editar
                                    </button>
                                    
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); setDeleteContext({ type: 'pallet', rowId: item.id, palletIdx: idx }); }} 
                                      className="w-9 h-9 bg-slate-950 hover:bg-red-500/10 text-slate-600 hover:text-red-500 border border-slate-800 hover:border-red-600/50 rounded-xl transition-all flex items-center justify-center shrink-0"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </motion.div>
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
            <div className="w-14 h-14 md:w-16 md:h-16 bg-red-600/10 text-red-500 rounded-full flex items-center justify-center mx-auto border border-red-500/20"><AlertCircle className="w-8 h-8" /></div>
            <h3 className="text-white font-black uppercase text-lg md:text-xl italic tracking-tight">Confirmar Exclusão</h3>
            <p className="text-slate-500 text-[10px] md:text-xs font-bold uppercase tracking-widest leading-relaxed">{deleteContext.type === 'row' ? 'Deseja remover este carregamento da fila?' : 'Deseja remover este pallet do inventário?'}</p>
            <div className="flex gap-4 pt-4"><button onClick={() => setDeleteContext(null)} className="flex-1 py-3 md:py-3.5 bg-slate-800 text-slate-400 font-black text-[9px] md:text-[10px] uppercase rounded-2xl transition-all">Cancelar</button><button onClick={confirmDelete} className="flex-1 py-3 md:py-3.5 bg-red-600 text-white font-black text-[9px] md:text-[10px] uppercase rounded-2xl shadow-lg transition-all active:scale-95">Remover</button></div>
          </div>
        </div>
      )}

      {matrixConfirmContext && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-3xl text-center space-y-6 animate-in zoom-in duration-200">
            <div className="w-14 h-14 md:w-16 md:h-16 bg-blue-600/10 text-blue-500 rounded-full flex items-center justify-center mx-auto border border-red-500/20 shadow-xl shadow-blue-900/20"><Truck className="w-8 h-8" /></div>
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
              <LogOut className="w-8 h-8" />
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
      
      {editPalletContext && (
        <EditPalletModal 
          isOpen={!!editPalletContext}
          onClose={() => setEditPalletContext(null)}
          onSave={handleUpdatePallet}
          pallet={editPalletContext}
        />
      )}
      
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
