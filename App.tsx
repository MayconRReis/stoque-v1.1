
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Papa from 'papaparse';
import { motion, AnimatePresence } from 'motion/react';
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
  Loader2,
  Pencil,
  RefreshCw,
  Container,
  Filter,
  ChevronDown,
  Clock,
  TrendingUp,
  Tag,
  Calendar,
  Layers,
  MapPin,
  Hash
} from 'lucide-react';
import { 
  SheetRow, 
  StockStatus, 
  InspectionData, 
  DashboardStats, 
  WarehouseSlot, 
  SlotContent, 
  HistoryEntry, 
  HistoryType, 
  translateSlotContent,
  getContentTypeColor,
  Shipment,
  ShipmentType,
  ShipmentStatus
} from './types';
import { InventoryDetailModal } from './components/InventoryDetailModal';
import { InventoryBulkConfirmModal } from './components/InventoryBulkConfirmModal';
import { EditPalletModal } from './components/EditPalletModal';
import { ShipmentPage } from './components/ShipmentPage';
import { ShipmentModal } from './components/ShipmentModal';
import { ShipmentDetailModal } from './components/ShipmentDetailModal';
import { supabaseService } from './services/supabaseService';
import { Login } from './components/Login';
import { MovementModal } from './components/MovementModal';
import { ImportPage } from './components/ImportPage';
import { AnalysisPage } from './components/AnalysisPage';
import { RotativeStockManager } from './components/RotativeStockManager';
import { WaitingSlotsView } from './components/WaitingSlotsView';
import HistoryItem from './components/HistoryItem';
import StatsSection from './components/StatsSection';
import WarehouseMap from './components/WarehouseMap';
import RackDistributionChart from './components/RackDistributionChart';
import ProductDistributionChart from './components/ProductDistributionChart';
import InventoryCard from './components/InventoryCard';
import { User as AppUser } from './types';

const generateSlots = (): WarehouseSlot[] => {
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
  const [pendingRows, setPendingRows] = useState<SheetRow[]>([]);
  const [waitingRows, setWaitingRows] = useState<SheetRow[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    freeSlots: 0,
    pendingEntries: 0,
    occupancyRate: 0,
    dailyMovements: 0,
    totalSlots: 264,
    occupiedSlots: 0,
    totalBottles: 0,
    waitingPallets: 0,
    finishedShipments24h: 0,
    openShipmentsCount: 0
  });
  const [slots, setSlots] = useState<WarehouseSlot[]>(generateSlots());
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inventory' | 'movement' | 'map' | 'history' | 'import' | 'analysis' | 'shipments' | 'rotative' | 'waiting'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  
  // Selection and Search State
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryTypeFilter, setInventoryTypeFilter] = useState<SlotContent | 'ALL' | 'CONTAINER'>('ALL');
  const [isInventoryFilterOpen, setIsInventoryFilterOpen] = useState(false);
  const [selectedPallets, setSelectedPallets] = useState<string[]>([]); // Format: "rowId::palletIdx"
  const [isBulkConfirmOpen, setIsBulkConfirmOpen] = useState(false);
  const [selectedPalletsData, setSelectedPalletsData] = useState<{ row: SheetRow, inspection: InspectionData, idx: number, selectionKey: string }[]>([]);

  useEffect(() => {
    if (isBulkConfirmOpen && selectedPallets.length > 0) {
      const fetchSelectedData = async () => {
        const rowIds = Array.from(new Set(selectedPallets.map(key => key.split('::').slice(0, -1).join('::'))));
        try {
          const items = await supabaseService.getInventoryItemsByIds(rowIds);
          const mapped = selectedPallets.map(key => {
            const parts = key.split('::');
            const rowId = parts.slice(0, parts.length - 1).join('::');
            const palletIdx = parseInt(parts[parts.length - 1]);
            const row = items.find(r => r.id === rowId);
            if (!row || !row.inspections || !row.inspections[palletIdx]) return null;
            return { row, inspection: row.inspections[palletIdx], idx: palletIdx, selectionKey: key };
          }).filter((p): p is { row: SheetRow, inspection: InspectionData, idx: number, selectionKey: string } => p !== null);
          setSelectedPalletsData(mapped);
        } catch (error) {
          console.error('Error fetching selected pallets data:', error);
        }
      };
      fetchSelectedData();
    } else if (!isBulkConfirmOpen) {
      setSelectedPalletsData([]);
    }
  }, [isBulkConfirmOpen, selectedPallets]);

  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historySearch, setHistorySearch] = useState('');

  const [deleteContext, setDeleteContext] = useState<{ type: 'row' | 'pallet', rowId: string, palletIdx?: number } | null>(null);
  const [matrixConfirmContext, setMatrixConfirmContext] = useState<{ rowId: string, palletIdx: number, slotId?: string } | null>(null);
  const [notifications, setNotifications] = useState<{ id: string, message: string, type?: 'info' | 'error' | 'success' }[]>([]);
  
  const [detailContext, setDetailContext] = useState<{ row: SheetRow, inspection: InspectionData, idx: number } | null>(null);
  const [editPalletContext, setEditPalletContext] = useState<{ row: SheetRow, inspection: InspectionData, idx: number } | null>(null);
  const [editPalletMode, setEditPalletMode] = useState<'edit' | 'assign'>('edit');
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [isShipmentModalOpen, setIsShipmentModalOpen] = useState(false);
  const [shipmentCounts, setShipmentCounts] = useState<Record<string, number>>({});
  const [shipmentDetailContext, setShipmentDetailContext] = useState<Shipment | null>(null);
  const [shipmentDetailPallets, setShipmentDetailPallets] = useState<SheetRow[]>([]);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  const fetchShipmentDetailPallets = async (shipmentId: string) => {
    setIsDetailLoading(true);
    try {
      const items = await supabaseService.getInventoryItemsByShipmentId(shipmentId);
      const linked = items.flatMap(row => 
        (row.inspections || [])
          .map((insp, idx) => {
            const sId = insp.shipmentId || (insp as any).shipment_id;
            if (sId === shipmentId) {
              return { ...row, inspections: [insp], id: `${row.id}::${idx}` } as SheetRow;
            }
            return null;
          })
          .filter((p): p is SheetRow => p !== null)
      );
      setShipmentDetailPallets(linked);
    } catch (error) {
      console.error('Error fetching detail pallets:', error);
      showNotification('Erro ao carregar pallets do carregamento', 'error');
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleOpenShipmentDetail = async (shipment: Shipment) => {
    setShipmentDetailContext(shipment);
    await fetchShipmentDetailPallets(shipment.id);
  };

  // Pagination State for Inventory
  const [inventoryPage, setInventoryPage] = useState(0);
  const [hasMoreInventory, setHasMoreInventory] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const PAGE_SIZE = 50;

  // Helper to map Supabase data to SheetRow
  const mapInventoryItem = useCallback((item: any): SheetRow => ({
    id: item.id,
    loadingId: item.loading_id,
    originOP: item.origin_op,
    description: item.description,
    lot: item.lot,
    pallets: item.pallets,
    date: item.date,
    status: item.status as StockStatus,
    inspections: item.inspections || [],
    operatorName: item.operatorName
  }), []);

  // Helper to close all modals and sidebar
  const closeAllModals = () => {
    setIsMovementModalOpen(false);
    setDeleteContext(null);
    setMatrixConfirmContext(null);
    setDetailContext(null);
    setEditPalletContext(null);
    setIsBulkConfirmOpen(false);
    setIsLogoutConfirmOpen(false);
    setIsShipmentModalOpen(false);
    setShipmentDetailContext(null);
    setIsSidebarOpen(false);
  };

  // Handle Browser/Smartphone Back Button
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      // If there's a modal open, the back button should close it first
      const anyModalOpen = 
        isMovementModalOpen || 
        !!deleteContext || 
        !!matrixConfirmContext || 
        !!detailContext || 
        !!editPalletContext || 
        isBulkConfirmOpen || 
        isLogoutConfirmOpen || 
        isSidebarOpen;

      if (anyModalOpen) {
        closeAllModals();
        return;
      }

      if (event.state && event.state.tab) {
        setActiveTab(event.state.tab);
      } else {
        setActiveTab('dashboard');
      }
    };

    window.addEventListener('popstate', handlePopState);
    
    if (!window.history.state) {
      window.history.replaceState({ tab: activeTab }, '');
    }

    return () => window.removeEventListener('popstate', handlePopState);
  }, [
    isMovementModalOpen, 
    deleteContext, 
    matrixConfirmContext, 
    detailContext, 
    editPalletContext, 
    isBulkConfirmOpen, 
    isLogoutConfirmOpen, 
    isSidebarOpen,
    activeTab
  ]);

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  };

  const addToHistory = useCallback(async (entry: HistoryEntry, silent: boolean = false) => {
    try {
      await supabaseService.addHistoryEntry(entry);
      setHistory(prev => [entry, ...prev]);
      
      // Broadcast to all users
      if (user && !silent) {
        supabaseService.broadcastNotification({
          user: user.id,
          message: entry.details,
          type: 'info'
        });
      }
    } catch (error) {
      console.error('Error adding history entry:', error);
      showNotification('Erro ao salvar histórico no servidor.', 'error');
    }
  }, [user]);

  const createHistoryEntry = useCallback((type: HistoryType, row: SheetRow, details: string, palletNum: number = 1): HistoryEntry => ({
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
    details,
    operatorName: user?.name
  }), [user]);

  const navigateToTab = useCallback((tab: typeof activeTab) => {
    if (isPublicView) return;
    if (tab !== activeTab) {
      window.history.pushState({ tab }, '');
      setActiveTab(tab);
    }
  }, [activeTab, isPublicView]);

  const loadStats = useCallback(async () => {
    try {
      const globalStats = await supabaseService.getGlobalStats();
      setStats(globalStats);
    } catch (error) {
      console.error('Error loading global stats:', error);
    }
  }, []);

  const refreshCombinedData = useCallback(async () => {
    // Refresh current page of inventory, global stats, pending and waiting rows
    try {
      const [invResult, globalStats, pendingRes, waitingRes, countsData] = await Promise.all([
        supabaseService.getInventoryPaginated(0, (inventoryPage + 1) * PAGE_SIZE, { 
          searchTerm: inventorySearch, 
          typeFilter: inventoryTypeFilter 
        }),
        supabaseService.getGlobalStats(),
        supabaseService.getPendingInventory(),
        supabaseService.getWaitingInventory(),
        supabaseService.getShipmentPalletCounts()
      ]);
      setData(invResult.data);
      setStats(globalStats);
      setPendingRows(pendingRes);
      setWaitingRows(waitingRes);
      setShipmentCounts(countsData);
      setHasMoreInventory(invResult.data.length < invResult.count);
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  }, [inventoryPage, inventorySearch, inventoryTypeFilter]);

  const loadMoreInventory = async () => {
    if (isLoadingMore || !hasMoreInventory) return;
    
    setIsLoadingMore(true);
    try {
      const nextPage = inventoryPage + 1;
      const result = await supabaseService.getInventoryPaginated(nextPage, PAGE_SIZE, {
        searchTerm: inventorySearch,
        typeFilter: inventoryTypeFilter
      });
      
      setData(prev => {
        const existingIds = new Set(prev.map(i => i.id));
        const newItems = result.data.filter(i => !existingIds.has(i.id));
        const combined = [...prev, ...newItems];
        setHasMoreInventory(combined.length < result.count);
        return combined;
      });
      setInventoryPage(nextPage);
    } catch (error) {
      console.error('Error loading more inventory:', error);
      showNotification('Erro ao carregar mais itens.', 'error');
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Debounced search for server-side filtering
  useEffect(() => {
    const timer = setTimeout(() => {
      const fetchFilteredData = async () => {
        setIsLoadingMore(true);
        try {
          const result = await supabaseService.getInventoryPaginated(0, PAGE_SIZE, {
            searchTerm: inventorySearch,
            typeFilter: inventoryTypeFilter
          });
          setData(result.data);
          setHasMoreInventory(result.data.length < result.count);
          setInventoryPage(0);
        } catch (error) {
          console.error('Error searching inventory:', error);
        } finally {
          setIsLoadingMore(false);
        }
      };
      
      if (user || isPublicView) {
        fetchFilteredData();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [inventorySearch, inventoryTypeFilter, user, isPublicView]);

  useEffect(() => {
    const anyModalOpen = 
      isMovementModalOpen || 
      !!deleteContext || 
      !!matrixConfirmContext || 
      !!detailContext || 
      !!editPalletContext || 
      isBulkConfirmOpen || 
      isLogoutConfirmOpen || 
      isSidebarOpen;

    if (anyModalOpen) {
      if (!window.history.state?.isModal) {
        window.history.pushState({ isModal: true, tab: activeTab }, '');
      }
    } else {
      if (window.history.state?.isModal) {
        window.history.back();
      }
    }
  }, [
    isMovementModalOpen, 
    !!deleteContext, 
    !!matrixConfirmContext, 
    !!detailContext, 
    !!editPalletContext, 
    isBulkConfirmOpen, 
    isLogoutConfirmOpen, 
    isSidebarOpen,
    activeTab
  ]);

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
        const [invPaginatied, slotData, historyData, shipData, globalStats, pendingRes, waitingRes] = await Promise.all([
          supabaseService.getInventoryPaginated(0, PAGE_SIZE, { 
            searchTerm: inventorySearch, 
            typeFilter: inventoryTypeFilter 
          }),
          supabaseService.getSlots(),
          supabaseService.getHistory(),
          supabaseService.getShipments(),
          supabaseService.getGlobalStats(),
          supabaseService.getPendingInventory(),
          supabaseService.getWaitingInventory()
        ]);

        setData(invPaginatied.data);
        setHasMoreInventory(invPaginatied.data.length < invPaginatied.count);
        setInventoryPage(0);
        setStats(globalStats);
        setPendingRows(pendingRes);
        setWaitingRows(waitingRes);
        
        setHistory(historyData);
        setShipments(shipData);
        
        // If no slots in DB, initialize them. If fewer slots than expected, add missing ones.
        const expectedSlots = generateSlots();
        if (slotData.length === 0) {
          await supabaseService.bulkUpdateSlots(expectedSlots);
          setSlots(expectedSlots);
        } else if (slotData.length < expectedSlots.length) {
          // Sync missing slots to Supabase
          const existingIds = new Set(slotData.map(s => s.id));
          const missingSlots = expectedSlots.filter(s => !existingIds.has(s.id));
          await supabaseService.bulkUpdateSlots(missingSlots);
          setSlots([...slotData, ...missingSlots]);
        } else {
          setSlots(slotData);
        }
      } catch (error) {
        console.error('Error loading data from Supabase:', error);
        showNotification('Erro ao carregar dados do servidor Supabase.', 'error');
      }
    };

    loadData();

    // Set up real-time subscriptions
    const inventoryChannel = supabaseService.subscribeToInventory((payload) => {
      if (payload.eventType === 'INSERT') {
        const newItem = mapInventoryItem(payload.new);
        setData(prev => {
          if (prev.find(r => r.id === newItem.id)) return prev;
          return [newItem, ...prev];
        });
      } else if (payload.eventType === 'UPDATE') {
        const updatedItem = mapInventoryItem(payload.new);
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

    const shipmentsChannel = supabaseService.subscribeToShipments(() => {
      supabaseService.getShipments().then(setShipments);
    });

    return () => {
      inventoryChannel.unsubscribe();
      slotsChannel.unsubscribe();
      notificationsChannel.unsubscribe();
      shipmentsChannel.unsubscribe();
    };
  }, [user, isPublicView]);

  const handleExportInventory = async () => {
    try {
      showNotification('Preparando exportação completa...', 'info');
      // Fetch ALL inventory matching current filters for export
      const allFilteredData = await supabaseService.getAllInventoryForExport({
        searchTerm: inventorySearch,
        typeFilter: inventoryTypeFilter
      });

      // Prepare data for export
      const exportData = allFilteredData.flatMap(row => {
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
    navigator.clipboard.writeText(publicUrl).then(() => {
      showNotification('Link do Dashboard Público copiado!', 'info');
    }).catch(err => {
      console.error('Erro ao copiar link:', err);
      showNotification('Erro ao copiar link.', 'error');
    });
  };

  const getContainerColor = (contentType?: SlotContent) => {
    switch (contentType) {
      case SlotContent.CONTAINER_LP: return 'text-slate-100';
      case SlotContent.CONTAINER_SJ: return 'text-orange-900';
      case SlotContent.CONTAINER_CP: return 'text-fuchsia-500';
      default: return 'text-slate-100';
    }
  };

  const performStackReorganization = async (currentData: SheetRow[], currentSlots: WarehouseSlot[]) => {
    // Re-enabled but will be carefully applied
    const racksToProcess: ('E' | 'F')[] = ['E', 'F'];
    let newData = [...currentData];
    let newSlots = [...currentSlots];
    
    let hasChanges = false;
    const itemsToUpdateMap = new Map<string, SheetRow>();
    const slotsToUpdateMap = new Map<string, WarehouseSlot>();

    racksToProcess.forEach(rack => {
      // Find all positions (columns) for this rack
      const rackSlots = currentSlots.filter(s => s.rack === rack);
      const positions = Array.from(new Set(rackSlots.map(s => s.position))).sort((a,b) => a-b);
      
      positions.forEach(pos => {
        const stackPallets: { rowId: string, idx: number, level: number, insp: InspectionData }[] = [];
        
        newData.forEach(row => {
          row.inspections?.forEach((insp, idx) => {
            if (insp.assignedSlot?.startsWith(`${rack}.`)) {
              const parts = insp.assignedSlot.split('.');
              // Parts: Rack (0), Level (1), Position (2)
              if (parseInt(parts[2]) === pos && parts[0] === rack) {
                stackPallets.push({ rowId: row.id, idx, level: parseInt(parts[1]), insp: { ...insp } });
              }
            }
          });
        });

        if (stackPallets.length === 0) return;

        // Skip reorganization for container stacks as per user request
        const hasContainer = stackPallets.some(p => 
          p.insp.contentType === SlotContent.CONTAINER_SJ || 
          p.insp.contentType === SlotContent.CONTAINER_LP || 
          p.insp.contentType === SlotContent.CONTAINER_CP
        );
        if (hasContainer) return;

        // Sort by CURRENT level (bottom to top)
        stackPallets.sort((a, b) => a.level - b.level);

        // Check if there is a gap or shift needed
        let stackNeedsShift = false;
        stackPallets.forEach((p, i) => {
          if (p.level !== i + 1) stackNeedsShift = true;
        });

        if (stackNeedsShift) {
          hasChanges = true;
          
          // Re-assign in data
          stackPallets.forEach((p, i) => {
            const targetLevel = i + 1;
            const targetSlotId = `${rack}.${targetLevel}.${pos}`;
            
            const rIdx = newData.findIndex(r => r.id === p.rowId);
            const insps = [...newData[rIdx].inspections!];
            insps[p.idx] = { ...insps[p.idx], assignedSlot: targetSlotId };
            newData[rIdx] = { ...newData[rIdx], inspections: insps };
            itemsToUpdateMap.set(p.rowId, newData[rIdx]);
          });

          // Re-assign in slots
          // 1. Clear ONLY THIS stack
          const stackSlots = newSlots.filter(s => s.rack === rack && s.position === pos);
          stackSlots.forEach(s => {
            const sIdx = newSlots.findIndex(sc => sc.id === s.id);
            newSlots[sIdx] = { ...newSlots[sIdx], status: SlotContent.EMPTY, occupiedBy: undefined };
            slotsToUpdateMap.set(s.id, newSlots[sIdx]);
          });

          // 2. Fill stack from bottom up
          stackPallets.forEach((p, i) => {
            const targetLevel = i + 1;
            const targetSlotId = `${rack}.${targetLevel}.${pos}`;
            const sIdx = newSlots.findIndex(s => s.id === targetSlotId);
            
            if (sIdx !== -1) {
              const row = newData.find(r => r.id === p.rowId);
              newSlots[sIdx] = { 
                ...newSlots[sIdx], 
                status: p.insp.contentType, 
                occupiedBy: row?.originOP || row?.description 
              };
              slotsToUpdateMap.set(targetSlotId, newSlots[sIdx]);
            }
          });
        }
      });
    });

    if (hasChanges) {
      const invUpdates = Array.from(itemsToUpdateMap.values());
      const slotUpdates = Array.from(slotsToUpdateMap.values());
      
      try {
        await Promise.all([
          ...invUpdates.map(item => supabaseService.saveInventoryItem(item)),
          supabaseService.bulkUpdateSlots(slotUpdates)
        ]);
        
        setData(newData);
        setSlots(newSlots);
        console.log(`Ponte: Reorganização de pilhas E/F concluída. ${invUpdates.length} itens movidos.`);
      } catch (error) {
        console.error('Stack reorganization failed:', error);
      }
    }
  };

  const [selectedMappingSlot, setSelectedMappingSlot] = useState<WarehouseSlot | null>(null);

  const handleDedicateSlot = async (slot: WarehouseSlot) => {
    try {
      await supabaseService.updateSlot({
        ...slot,
        status: SlotContent.ROTATIVE,
        occupiedBy: 'ESTOQUE ROTATIVO'
      });
      setSlots(prev => prev.map(s => s.id === slot.id ? { ...s, status: SlotContent.ROTATIVE, occupiedBy: 'ESTOQUE ROTATIVO' } : s));
      showNotification(`Vaga ${slot.id} dedicada ao Estoque Rotativo`);
      setSelectedMappingSlot(null);
      
      // Notify all users
      if (user) {
        supabaseService.broadcastNotification({
          user: user.id,
          message: `${user.name} dedicou a vaga ${slot.id} ao Estoque Rotativo`,
          type: 'info'
        });
      }
    } catch (error) {
      console.error('Error dedicating slot:', error);
      showNotification('Erro ao dedicar vaga', 'error');
    }
  };

  const handleReleaseSlot = async (slot: WarehouseSlot) => {
    // Check if there are items in this slot first
    try {
      const rotativeItems = await supabaseService.getRotativeStock();
      const itemsInSlot = rotativeItems.filter(i => i.slotId === slot.id);
      
      if (itemsInSlot.length > 0) {
        showNotification('Não é possível liberar uma vaga que contém itens no estoque rotativo', 'error');
        return;
      }

      await supabaseService.updateSlot({
        ...slot,
        status: SlotContent.EMPTY,
        occupiedBy: undefined
      });
      setSlots(prev => prev.map(s => s.id === slot.id ? { ...s, status: SlotContent.EMPTY, occupiedBy: undefined } : s));
      showNotification(`Vaga ${slot.id} liberada do Estoque Rotativo`);
      setSelectedMappingSlot(null);

      // Notify all users
      if (user) {
        supabaseService.broadcastNotification({
          user: user.id,
          message: `${user.name} liberou a vaga ${slot.id} do Estoque Rotativo`,
          type: 'info'
        });
      }
    } catch (error) {
      console.error('Error releasing slot:', error);
      showNotification('Erro ao liberar vaga', 'error');
    }
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
        operatorName: user?.name,
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
      const isWaiting = entryData.slotId === 'AGUARDANDO';
      if (!isWaiting) {
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
      }

      // Save Inventory
      await supabaseService.saveInventoryItem(newEntry);
      setData(prev => [newEntry, ...prev]);

      supabaseService.broadcastNotification({
        user: user?.id || '',
        message: `Nova entrada registrada: ${entryData.name}`,
        type: 'info'
      });

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
        details: `Entrada manual por ${user?.name || 'Operador'}. ID Gerado: ${entryData.id}${isWaiting ? ' (Aguardando Vaga)' : ''}`,
        operatorName: user?.name
      });

      showNotification(`Entrada realizada com sucesso! ID: ${entryData.id}`);
      setIsMovementModalOpen(false);
      
      // Auto-reorganize E/F stacks
      performStackReorganization([newEntry, ...data], slots.map(s => s.id === entryData.slotId ? { ...s, status: entryData.contentType, occupiedBy: entryData.op || entryData.name } : s));
      
      refreshCombinedData();
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
              status: row.inspections?.[0]?.contentType || SlotContent.SUPPLIES,
              occupiedBy: row.originOP || row.description
            };
          }
        }

        newRows.push({
          ...row,
          operatorName: user?.name
        });
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
            details: `Importação via CSV por ${user?.name || 'Sistema'}. ID: ${row.loadingId}`,
            operatorName: user?.name
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
        navigateToTab('analysis');
      } else {
        navigateToTab('inventory');
      }
      refreshCombinedData();
    } catch (error: any) {
      console.error('Import processing error:', error);
      showNotification(`Erro ao processar importação: ${error.message}`, 'error');
    }
  };

  const handleConfirmAnalysis = useCallback(async (rowId: string, slotId: string, finalId: string) => {
    try {
      const row = data.find(r => r.id === rowId);
      if (!row) return;

      const updatedRow: SheetRow = {
        ...row,
        loadingId: finalId,
        status: StockStatus.INSPECTED,
        operatorName: user?.name,
        inspections: row.inspections?.map(insp => ({ ...insp, assignedSlot: slotId }))
      };

      const isWaiting = slotId === 'AGUARDANDO';
      let updatedSlot: WarehouseSlot | null = null;

      if (!isWaiting) {
        const targetSlot = slots.find(s => s.id === slotId);
        if (!targetSlot) throw new Error('Vaga não encontrada');

        updatedSlot = {
          ...targetSlot,
          status: row.inspections?.[0]?.contentType || SlotContent.SUPPLIES,
          occupiedBy: row.originOP || row.description
        };
      }

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
        slot: isWaiting ? 'AGUARDANDO' : slotId,
        details: `Entrada confirmada por ${user?.name || 'Operador'}. ID Final: ${finalId}${isWaiting ? ' (Aguardando Vaga)' : ''}`,
        operatorName: user?.name
      };

      const promises: Promise<any>[] = [
        supabaseService.saveInventoryItem(updatedRow),
        addToHistory(historyEntry)
      ];

      if (updatedSlot) {
        promises.push(supabaseService.updateSlot(updatedSlot));
      }

      await Promise.all(promises);

      setData(prev => prev.map(r => r.id === rowId ? updatedRow : r));
      if (updatedSlot) {
        const newSlot = updatedSlot;
        setSlots(prev => prev.map(s => s.id === slotId ? newSlot : s));
      }

      showNotification(`Entrada confirmada! ID: ${finalId}`);
      refreshCombinedData();
      
      // Auto-reorganize E/F stacks
      performStackReorganization(
        data.map(r => r.id === rowId ? updatedRow : r),
        updatedSlot ? slots.map(s => s.id === slotId ? updatedSlot : s) : slots
      );
    } catch (error: any) {
      console.error('Analysis confirmation error:', error);
      showNotification(`Erro ao confirmar análise: ${error.message}`, 'error');
    }
  }, [data, slots, user, addToHistory]);

  const handleRejectAnalysis = async (rowId: string) => {
    try {
      await supabaseService.deleteInventoryItem(rowId);
      setData(prev => prev.filter(r => r.id !== rowId));
      showNotification('Pallet rejeitado e removido da fila.');
      refreshCombinedData();
    } catch (error: any) {
      console.error('Analysis rejection error:', error);
      showNotification(`Erro ao rejeitar pallet: ${error.message}`, 'error');
    }
  };

  const handleMovementTransfer = async (transferData: any) => {
    try {
      // Direct fetch from server to bypass pagination limits
      const item = await supabaseService.getInventoryItemByLoadingId(transferData.id);
      if (!item) {
        showNotification('Produto não encontrado com este ID no sistema.', 'error');
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
      const isWaitingDestination = transferData.toSlot === 'AGUARDANDO';
      if (!isWaitingDestination) {
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
        details: `Transferência por ${user?.name || 'Operador'} de ${transferData.fromSlot} para ${transferData.toSlot}${isWaitingDestination ? ' (Aguardando Vaga)' : ''}`,
        operatorName: user?.name
      });

      showNotification('Transferência concluída com sucesso.');
      setIsMovementModalOpen(false);
      refreshCombinedData();
      
      // Auto-reorganize E/F stacks after transfer
      const finalData = data.map(d => d.id === item.id ? updatedItem : d);
      const finalSlots = slots.map(s => {
        if (s.id === transferData.fromSlot) return { ...s, status: SlotContent.EMPTY, occupiedBy: undefined };
        if (s.id === transferData.toSlot && !isWaitingDestination) {
           return { ...s, status: item.inspections?.[0]?.contentType || SlotContent.BOTTLES, occupiedBy: item.originOP || item.description };
        }
        return s;
      });
      performStackReorganization(finalData, finalSlots);
    } catch (error) {
      console.error('Transfer error:', error);
      showNotification('Erro ao realizar transferência.', 'error');
    }
  };

  const handleMovementExit = async (exitData: any) => {
    try {
      // Direct fetch from server to bypass pagination limits
      const item = await supabaseService.getInventoryItemByLoadingId(exitData.id);
      if (!item) {
        showNotification('Produto não encontrado com este ID no sistema.', 'error');
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
        details: `Saída por ${user?.name || 'Operador'}: ${exitData.reason}`,
        operatorName: user?.name
      });

      showNotification('Saída registrada com sucesso.');
      setIsMovementModalOpen(false);
      refreshCombinedData();

      // Auto-reorganize E/F stacks
      const finalData = data.filter(d => d.id !== item.id);
      const finalSlots = occupiedSlot ? slots.map(s => s.id === occupiedSlot.id ? { ...s, status: SlotContent.EMPTY, occupiedBy: undefined } : s) : slots;
      performStackReorganization(finalData, finalSlots);
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

  const handleCreateShipment = async (shipmentData: { type: ShipmentType, scheduledDate: string }) => {
    try {
      const newShipment: Shipment = {
        id: `SHIP-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
        type: shipmentData.type,
        status: ShipmentStatus.OPEN,
        createdAt: new Date().toISOString(),
        scheduledDate: shipmentData.scheduledDate,
        operatorName: user?.name
      };

      const selections = selectedPallets.map(id => {
        const [rowId, palletIdx] = id.split('::');
        return { rowId, palletIdx: parseInt(palletIdx) };
      });

      await supabaseService.saveShipment(newShipment);
      await supabaseService.updateInventoryShipment(selections, newShipment.id);
      
      // Update local state immediately
      setShipments(prev => {
        const exists = prev.find(s => s.id === newShipment.id);
        if (exists) return prev;
        return [newShipment, ...prev];
      });
      
      // Force refresh of the state to ensure consistency across tabs
      const [invDataResult, shipmentsData] = await Promise.all([
        supabaseService.getInventoryPaginated(0, data.length || PAGE_SIZE),
        supabaseService.getShipments()
      ]);
      
      setData(invDataResult.data);
      setShipments(shipmentsData);
      
      supabaseService.broadcastNotification({
        user: user?.id || '',
        message: `Novo carregamento criado: ${newShipment.id}`,
        type: 'info'
      });

      showNotification(`Carregamento ${newShipment.id} criado com sucesso!`);
      setSelectedPallets([]);
    } catch (error: any) {
      console.error('Error creating shipment:', error);
      showNotification(`Erro ao criar carregamento: ${error.message}`, 'error');
    }
  };

  const handleAddToShipment = async (shipmentId: string) => {
    try {
      const selections = selectedPallets.map(id => {
        const [rowId, palletIdx] = id.split('::');
        return { rowId, palletIdx: parseInt(palletIdx) };
      });

      await supabaseService.updateInventoryShipment(selections, shipmentId);
      
      // Update local inventory state
      const result = await supabaseService.getInventoryPaginated(0, data.length || PAGE_SIZE);
      setData(result.data);
      
      showNotification(`Pallets adicionados ao carregamento ${shipmentId}!`);

      // Broadcast to others
      if (user) {
        supabaseService.broadcastNotification({
          user: user.id,
          message: `${user.name} adicionou ${selections.length} pallets ao carregamento ${shipmentId}`,
          type: 'info'
        });
      }

      setSelectedPallets([]);
    } catch (error: any) {
      console.error('Error adding to shipment:', error);
      showNotification(`Erro ao adicionar ao carregamento: ${error.message}`, 'error');
    }
  };

  const handleRemoveFromShipment = async (palletId: string) => {
    try {
      const [rowId, palletIdx] = palletId.split('::');
      await supabaseService.updateInventoryShipment([{ rowId, palletIdx: parseInt(palletIdx) }], null);
      showNotification('Pallet removido do carregamento.');

      // Broadcast to others
      if (user) {
        supabaseService.broadcastNotification({
          user: user.id,
          message: `${user.name} removeu um pallet do carregamento`,
          type: 'info'
        });
      }
    } catch (error: any) {
      console.error('Error removing from shipment:', error);
      showNotification(`Erro ao remover pallet: ${error.message}`, 'error');
    }
  };

  const handleFinalizeShipment = async (shipmentId: string) => {
    try {
      const shipment = shipments.find(s => s.id === shipmentId);
      if (!shipment) return;

      // 1. Find all pallets linked to this shipment directly from server
      const linkedPallets = await supabaseService.getInventoryItemsByShipmentId(shipmentId);
      
      const itemsToProcess: { row: SheetRow, palletIndices: number[] }[] = [];
      linkedPallets.forEach(row => {
        const indices = (row.inspections || [])
          .map((insp, idx) => {
            const sId = insp.shipmentId || (insp as any).shipment_id;
            return sId === shipmentId ? idx : -1;
          })
          .filter(idx => idx !== -1);
        
        if (indices.length > 0) {
          itemsToProcess.push({ row, palletIndices: indices });
        }
      });

      if (itemsToProcess.length === 0) {
        showNotification('Nenhum pallet encontrado para este carregamento.', 'error');
        return;
      }

      // 2. Update shipment status
      const updatedShipment = { 
        ...shipment, 
        status: ShipmentStatus.CLOSED,
        closedAt: new Date().toISOString()
      };
      await supabaseService.saveShipment(updatedShipment);

      // 3. Process exit for each pallet
      for (const { row, palletIndices } of itemsToProcess) {
        // Sort indices descending to remove from array without affecting previous indices
        const sortedIndices = [...palletIndices].sort((a, b) => b - a);
        
        for (const idx of sortedIndices) {
          const inspection = row.inspections![idx];
          
          // Update Slot
          if (inspection.assignedSlot) {
            const occupiedSlot = slots.find(s => s.id === inspection.assignedSlot);
            if (occupiedSlot) {
              const updatedSlot: WarehouseSlot = { ...occupiedSlot, status: SlotContent.EMPTY, occupiedBy: undefined };
              await supabaseService.updateSlot(updatedSlot);
            }
          }

          // Add History
          await addToHistory({
            id: Math.random().toString(36).substring(2, 9),
            type: HistoryType.EXIT,
            timestamp: new Date().toLocaleString(),
            loadingId: row.loadingId,
            description: row.description,
            op: row.originOP,
            lot: row.lot,
            palletNumber: idx + 1,
            totalPallets: row.pallets,
            slot: inspection.assignedSlot || 'N/A',
            details: `Saída automática via Finalização de Carregamento ${shipmentId}`,
            operatorName: user?.name
          }, true);
        }

        // Update or Delete Inventory Item
        const remainingInspections = row.inspections!.filter((_, i) => !palletIndices.includes(i));
        if (remainingInspections.length === 0) {
          await supabaseService.deleteInventoryItem(row.id);
        } else {
          const updatedRow = { 
            ...row, 
            inspections: remainingInspections, 
            pallets: remainingInspections.length 
          };
          await supabaseService.saveInventoryItem(updatedRow);
        }
      }

      showNotification(`Carregamento ${shipmentId} finalizado com sucesso!`);
      refreshCombinedData();

      // Broadcast summary
      if (user) {
        supabaseService.broadcastNotification({
          user: user.id,
          message: `${user.name} finalizou o carregamento ${shipmentId}`,
          type: 'info'
        });
      }
      
      // Auto-reorganize E/F stacks as many pallets might have left
      // We need to fetch latest state or at least calculate what happened.
      // Since individual updateSlot calls happened in the loop, let's use a fresh get logic or just trust state after dispatch.
      supabaseService.getInventoryPaginated(0, data.length || PAGE_SIZE).then(result => {
        supabaseService.getSlots().then(slt => {
           performStackReorganization(result.data, slt);
        });
      });
    } catch (error: any) {
      console.error('Error finalizing shipment:', error);
      showNotification(`Erro ao finalizar carregamento: ${error.message}`, 'error');
    }
  };

  const handleDeleteShipment = async (shipmentId: string) => {
    try {
      await supabaseService.deleteShipment(shipmentId);
      setShipments(prev => prev.filter(s => s.id !== shipmentId));
      
      // We also need to refresh inventory data to reflect unlinked shipmentIds
      const result = await supabaseService.getInventoryPaginated(0, data.length || PAGE_SIZE);
      setData(result.data);
      
      showNotification('Carregamento excluído com sucesso.');

      // Broadcast to others
      if (user) {
        supabaseService.broadcastNotification({
          user: user.id,
          message: `${user.name} excluiu o carregamento ${shipmentId}`,
          type: 'info'
        });
      }
    } catch (error: any) {
      console.error('Error deleting shipment:', error);
      showNotification(`Erro ao excluir carregamento: ${error.message}`, 'error');
    }
  };

  const togglePalletSelection = useCallback((rowId: string, palletIdx: number) => {
    const id = `${rowId}::${palletIdx}`;
    setSelectedPallets(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  }, []);

  /* Removed local stats memo in favor of server-side stats state */



  const handleUpdatePallet = async (updatedData: { 
    description: string; 
    op: string; 
    lot: string; 
    quantity: number;
    contentType: SlotContent;
    assignedSlot?: string;
    supplyDetails?: {
      bottles: number;
      caps: number;
      boxes: number;
      cradles: number;
      others: { name: string; quantity: number }[];
    }
  }) => {
    if (!editPalletContext) return;

    try {
      const { row, idx } = editPalletContext;
      
      const updatedInspections = [...(row.inspections || [])];
      if (updatedInspections[idx]) {
        updatedInspections[idx] = {
          ...updatedInspections[idx],
          contentType: updatedData.contentType,
          assignedSlot: updatedData.assignedSlot || updatedInspections[idx].assignedSlot,
          ...(updatedData.supplyDetails || {})
        };
      }

      const updatedRow: SheetRow = { 
        ...row,
        description: updatedData.description,
        originOP: updatedData.op,
        lot: updatedData.lot,
        pallets: updatedData.quantity,
        inspections: updatedInspections,
        operatorName: user?.name
      };

      // If a slot was assigned (moved from AGUARDANDO to a real slot)
      if (updatedData.assignedSlot && updatedData.assignedSlot !== 'AGUARDANDO' && row.inspections?.[idx].assignedSlot === 'AGUARDANDO') {
        const targetSlot = slots.find(s => s.id === updatedData.assignedSlot);
        if (targetSlot) {
          const updatedSlot: WarehouseSlot = {
            ...targetSlot,
            status: updatedData.contentType,
            occupiedBy: updatedData.op || updatedRow.description
          };
          await supabaseService.updateSlot(updatedSlot);
          setSlots(prev => prev.map(s => s.id === updatedData.assignedSlot ? updatedSlot : s));
          
          // Add to history
          await addToHistory({
            ...createHistoryEntry(HistoryType.ALLOCATION, updatedRow, `Alocação via Aguardando Vaga para ${updatedData.assignedSlot}`, idx + 1),
            slot: updatedData.assignedSlot
          });
        }
      } else {
        // Regular Edit
        await addToHistory(createHistoryEntry(HistoryType.EDIT, updatedRow, `Edição de dados do pallet por ${user?.name || 'Operador'}`, idx + 1));
      }

      await supabaseService.saveInventoryItem(updatedRow);
      setData(prev => prev.map(r => r.id === updatedRow.id ? updatedRow : r));
      
      showNotification('Dados do pallet atualizados com sucesso!');
      setEditPalletContext(null);
      refreshCombinedData();

      // Auto-reorganize E/F stacks in case OP/Description changed
      performStackReorganization(data.map(r => r.id === updatedRow.id ? updatedRow : r), slots);
    } catch (error: any) {
      console.error('Update error:', error);
      showNotification('Erro ao atualizar pallet', 'error');
    }
  };

  const confirmDelete = async () => {
    if (!deleteContext) return;
    try {
      if (deleteContext.type === 'row') {
        const row = data.find(r => r.id === deleteContext.rowId);
        if (row) {
          await addToHistory(createHistoryEntry(HistoryType.REMOVAL, row, `Remoção total da OP ${row.originOP} por ${user?.name || 'Operador'}`));
        }
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
          if (updatedInsps?.length === 0) {
            await supabaseService.deleteInventoryItem(row.id);
            setData(prev => prev.filter(r => r.id !== row.id));
          } else {
            const updatedRow = { 
              ...row, 
              inspections: updatedInsps, 
              pallets: updatedInsps?.length || 0,
              status: row.status 
            };
            await supabaseService.saveInventoryItem(updatedRow);
            setData(prev => prev.map(r => r.id === deleteContext.rowId ? updatedRow : r));
          }
          
          // Auto-reorganize E/F stacks
          const finalData = (updatedInsps?.length === 0) 
            ? data.filter(r => r.id !== row.id)
            : data.map(r => r.id === deleteContext.rowId ? { ...row, inspections: updatedInsps, pallets: updatedInsps?.length || 0 } : r);
          const finalSlots = inspection.assignedSlot ? slots.map(s => s.id === inspection.assignedSlot ? { ...s, status: SlotContent.EMPTY, occupiedBy: undefined } : s) : slots;
          performStackReorganization(finalData, finalSlots);
        }
      }
      setDeleteContext(null);
      refreshCombinedData();
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
      if (newInsps?.length === 0) {
        await supabaseService.deleteInventoryItem(rowId);
        setData(prev => prev.filter(r => r.id !== rowId));
      } else {
        const updatedRow = { 
          ...row, 
          inspections: newInsps, 
          pallets: newInsps?.length || 0,
          status: row.status 
        };
        await supabaseService.saveInventoryItem(updatedRow);
        setData(prev => prev.map(r => r.id === rowId ? updatedRow : r));
      }

      showNotification(`A OP ${row.originOP} foi enviada para matriz com sucesso`);
      setMatrixConfirmContext(null);
      refreshCombinedData();

      // Auto-reorganize E/F stacks
      const finalData = (newInsps?.length === 0) 
        ? data.filter(r => r.id !== rowId)
        : data.map(r => r.id === rowId ? { ...row, inspections: newInsps, pallets: newInsps?.length || 0 } : r);
      const finalSlots = slotId ? slots.map(s => s.id === slotId ? { ...s, status: SlotContent.EMPTY, occupiedBy: undefined } : s) : slots;
      performStackReorganization(finalData, finalSlots);
    } catch (error) {
      console.error('Error sending to matrix:', error);
      showNotification('Erro ao processar envio no servidor.', 'error');
    }
  };

  const handleBulkSend = async () => {
    try {
      const updatedSlots: WarehouseSlot[] = [...slots];
      
      const rowIds = Array.from(new Set(selectedPallets.map(key => key.split('::').slice(0, -1).join('::'))));
      const itemsToProcess = await supabaseService.getInventoryItemsByIds(rowIds);
      const rowsToUpdate: Map<string, SheetRow> = new Map();

      for (const key of selectedPallets) {
        const parts = key.split('::');
        const rowId = parts.slice(0, parts.length - 1).join('::');
        const palletIdx = parseInt(parts[parts.length - 1]);
        
        const row = itemsToProcess.find(r => r.id === rowId);
        if (row && row.inspections) {
          const inspection = row.inspections[palletIdx];
          if (!inspection) continue;

          await addToHistory(createHistoryEntry(HistoryType.EXIT, row, 'Saída em massa', palletIdx + 1), true);
          
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
            .map(k => {
              const p = k.split('::');
              return parseInt(p[p.length - 1]);
            });
          
          const newInsps = row.inspections?.filter((_, i) => !rowSelectedIndices.includes(i));
          currentRow.inspections = newInsps;
          currentRow.pallets = newInsps?.length || 0;
          rowsToUpdate.set(rowId, currentRow);
        }
      }

      // Bulk update slots and rows in Supabase
      const slotUpdatePromise = supabaseService.bulkUpdateSlots(updatedSlots);
      
      const inventoryUpdatePromises = Array.from(rowsToUpdate.values()).map(row => {
        if (row.inspections && row.inspections.length === 0) {
          return supabaseService.deleteInventoryItem(row.id);
        } else {
          return supabaseService.saveInventoryItem(row);
        }
      });

      await Promise.all([slotUpdatePromise, ...inventoryUpdatePromises]);

      setSlots(updatedSlots);
      
      // Update local state: remove rows with 0 inspections
      setData(prev => {
        const nextData = prev
          .map(row => rowsToUpdate.has(row.id) ? rowsToUpdate.get(row.id)! : row)
          .filter(row => (row.inspections?.length || 0) > 0);
        return nextData;
      });

      showNotification(`${selectedPallets.length} pallets enviados com sucesso`);
      
      // Broadcast summary to others
      if (user) {
        supabaseService.broadcastNotification({
          user: user.id,
          message: `${user.name} realizou saída em massa de ${selectedPallets.length} pallets`,
          type: 'info'
        });
      }

      setSelectedPallets([]);
      setIsBulkConfirmOpen(false);
      refreshCombinedData();
      
      // Auto-reorganize E/F stacks
      const finalData = data
        .map(row => rowsToUpdate.has(row.id) ? rowsToUpdate.get(row.id)! : row)
        .filter(row => (row.inspections?.length || 0) > 0);
      performStackReorganization(finalData, updatedSlots);
    } catch (error) {
      console.error('Error in bulk send:', error);
      showNotification('Erro ao processar envio em massa no servidor.', 'error');
    }
  };

  const handleSendToMatrix = useCallback((rowId: string, palletIdx: number, slotId?: string) => {
    setMatrixConfirmContext({ rowId, palletIdx, slotId });
  }, []);

  const handleShowDetail = useCallback((row: SheetRow, inspection: InspectionData, idx: number) => {
    setDetailContext({ row, inspection, idx });
  }, []);

  const handleEditPallet = useCallback((row: SheetRow, inspection: InspectionData, idx: number) => {
    setEditPalletMode('edit');
    setEditPalletContext({ row, inspection, idx });
  }, []);

  const handleDeletePallet = useCallback((rowId: string, idx: number) => {
    setDeleteContext({ type: 'pallet', rowId, palletIdx: idx });
  }, []);

  const RackView = ({ rack }: { rack: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' }) => {
    const rackSlots = slots.filter(s => s.rack === rack);
    const freeCount = rackSlots.filter(s => s.status === SlotContent.EMPTY).length;
    const totalCount = rackSlots.length;
    
    const rackTitles = {
      'A': 'Frascos (G0)',
      'B': 'Insumos / Acabados',
      'C': 'Insumos / Acabados',
      'D': 'Outros / Acabados',
      'E': 'Containers',
      'F': 'Containers'
    };

    return (
      <div className="bg-slate-900/40 p-5 md:p-8 rounded-[2.5rem] border border-slate-800/50 shadow-2xl overflow-hidden mb-6">
        <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
          <div className="flex items-center gap-3">
             <div className={`w-1.5 h-8 rounded-full ${
               rack === 'D' ? 'bg-green-600' : 
               rack === 'A' ? 'bg-blue-600' : 
               (rack === 'E' || rack === 'F') ? 'bg-purple-600' :
               'bg-amber-600'
             }`}></div>
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
            const isContainer = slot.status === SlotContent.CONTAINER_SJ || 
                              slot.status === SlotContent.CONTAINER_LP || 
                              slot.status === SlotContent.CONTAINER_CP;
            
            const containerColor = getContainerColor(slot.status);

            const isRotative = slot.status === SlotContent.ROTATIVE;
            const ContentIcon = slot.status === SlotContent.EMPTY ? undefined : 
                               slot.status === SlotContent.BOTTLES ? FlaskConical : 
                               slot.status === SlotContent.FINISHED_PRODUCT ? Truck : 
                               (slot.status === SlotContent.REWORK || slot.status === SlotContent.REPROCESS) ? RefreshCw :
                               isContainer ? Container :
                               isRotative ? TrendingUp :
                               Package;
            
            return (
              <div 
                key={slot.id} 
                onClick={() => {
                  setSelectedMappingSlot(slot);
                }}
                className={`aspect-square rounded-xl border flex flex-col items-center justify-center p-1 transition-all group relative cursor-pointer ${
                slot.status === SlotContent.EMPTY ? 'bg-slate-950/30 border-slate-800/50 hover:border-slate-700' : 
                slot.status === SlotContent.BOTTLES ? 'bg-blue-600/10 border-blue-600/30' : 
                slot.status === SlotContent.SUPPLIES ? 'bg-amber-600/10 border-amber-600/30' :
                isContainer ? 'bg-slate-300/10 border-slate-100/30' :
                (slot.status === SlotContent.REWORK || slot.status === SlotContent.REPROCESS) ? 'bg-purple-600/10 border-purple-600/30' :
                isRotative ? 'bg-indigo-600/10 border-indigo-600/30 shadow-[inset_0_0_10px_rgba(79,70,229,0.1)]' :
                'bg-green-600/10 border-green-600/30'
              }`}>
                <span className="text-[7px] font-bold text-slate-600 mb-1">{slot.id.split('.').slice(1).join('.')}</span>
                {ContentIcon ? (
                  <ContentIcon className={`w-3.5 h-3.5 ${
                    slot.status === SlotContent.BOTTLES ? 'text-blue-500' : 
                    slot.status === SlotContent.SUPPLIES ? 'text-amber-500' :
                    isContainer ? containerColor :
                    (slot.status === SlotContent.REWORK || slot.status === SlotContent.REPROCESS) ? 'text-purple-500' :
                    isRotative ? 'text-indigo-500' :
                    'text-green-500'
                  }`} />
                ) : (
                  <div className="w-1 h-1 rounded-full bg-slate-800 group-hover:bg-slate-700 transition-colors"></div>
                )}
                
                {isRotative && (
                   <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-indigo-600 rounded-full border border-slate-950 z-20 shadow-lg"></div>
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



  const filteredHistory = useMemo(() => {
    const term = historySearch.toLowerCase().trim();
    if (!term) return history;
    return history.filter(entry => 
      entry.op.toLowerCase().includes(term) ||
      entry.description.toLowerCase().includes(term) ||
      entry.lot.toLowerCase().includes(term) ||
      entry.details.toLowerCase().includes(term) ||
      entry.loadingId.toLowerCase().includes(term) ||
      entry.slot.toLowerCase().includes(term) ||
      (entry.operatorName && entry.operatorName.toLowerCase().includes(term))
    );
  }, [history, historySearch]);

  const filteredInventory = useMemo(() => {
    const term = inventorySearch.toLowerCase().trim();
    const inspectedItems = data.filter(item => item.status === StockStatus.INSPECTED);
    const allPallets: { row: SheetRow, inspection: InspectionData, idx: number }[] = [];
    
    inspectedItems.forEach(item => {
      item.inspections?.forEach((insp, idx) => {
        // Search term check
        const matchesSearch = !term || 
          item.description.toLowerCase().includes(term) || 
          item.originOP.includes(term) || 
          item.lot.toLowerCase().includes(term) ||
          item.loadingId.toLowerCase().includes(term) ||
          (insp.assignedSlot && insp.assignedSlot.toLowerCase().includes(term)) ||
          item.id.toLowerCase().includes(term);
        
        // Type filter check
        const matchesType = inventoryTypeFilter === 'ALL' || 
          insp.contentType === inventoryTypeFilter ||
          (inventoryTypeFilter === 'CONTAINER' && [SlotContent.CONTAINER_SJ, SlotContent.CONTAINER_LP, SlotContent.CONTAINER_CP].includes(insp.contentType));

        if (matchesSearch && matchesType) {
          allPallets.push({ row: item, inspection: insp, idx });
        }
      });
    });
    return allPallets.sort((a, b) => {
      // Sort by date descending (most recent first)
      const dateA = new Date(a.row.date).getTime();
      const dateB = new Date(b.row.date).getTime();
      
      if (dateB !== dateA) {
        return dateB - dateA;
      }
      
      // Secondary sort by slot
      const slotA = a.inspection.assignedSlot || '';
      const slotB = b.inspection.assignedSlot || '';
      return slotA.localeCompare(slotB, undefined, { numeric: true });
    });
  }, [data, inventorySearch, inventoryTypeFilter]);

  const NavItem = ({ tab, icon: Icon, label, badge }: { tab: typeof activeTab, icon: React.ElementType, label: string, badge?: number }) => (
    <button 
      onClick={() => { 
        setIsSidebarOpen(false);
        navigateToTab(tab); 
      }} 
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
      
      {/* Slot Actions Modal */}
      <AnimatePresence>
        {selectedMappingSlot && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedMappingSlot(null)}
              className="absolute inset-0 bg-slate-950/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl relative z-10 space-y-6"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-black text-white uppercase italic tracking-tight">Ações da Vaga</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Vaga {selectedMappingSlot.id}</p>
                </div>
                <button onClick={() => setSelectedMappingSlot(null)} className="p-2 hover:bg-slate-800 rounded-xl transition-colors">
                  <X className="w-5 h-5 text-slate-600" />
                </button>
              </div>

              <div className="space-y-3">
                {selectedMappingSlot.status === SlotContent.EMPTY && (
                  <button 
                    onClick={() => handleDedicateSlot(selectedMappingSlot)}
                    className="w-full px-6 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all"
                  >
                    <TrendingUp className="w-4 h-4" /> Dedicar ao Rotativo
                  </button>
                )}

                {selectedMappingSlot.status === SlotContent.ROTATIVE && (
                  <>
                    <button 
                      onClick={() => {
                        navigateToTab('rotative');
                        setSelectedMappingSlot(null);
                      }}
                      className="w-full px-6 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all"
                    >
                      <Search className="w-4 h-4" /> Ver Estoque Rotativo
                    </button>
                    <button 
                      onClick={() => handleReleaseSlot(selectedMappingSlot)}
                      className="w-full px-6 py-4 bg-slate-800 hover:bg-red-600/20 text-slate-400 hover:text-red-500 border border-slate-800 hover:border-red-500/30 rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all"
                    >
                      <Trash2 className="w-4 h-4" /> Remover Dedicação
                    </button>
                  </>
                )}

                {![SlotContent.EMPTY, SlotContent.ROTATIVE].includes(selectedMappingSlot.status as any) && (
                  <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800">
                    <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest mb-2 text-center">Ocupado por</p>
                    <p className="text-white font-black uppercase text-center text-sm">{selectedMappingSlot.occupiedBy || 'N/A'}</p>
                  </div>
                )}
              </div>

              <button 
                onClick={() => setSelectedMappingSlot(null)}
                className="w-full px-6 py-4 bg-slate-800 hover:bg-slate-750 text-slate-500 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all"
              >
                Voltar ao Mapa
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
            <NavItem tab="waiting" icon={Clock} label="Aguardando Vaga" badge={stats.waitingPallets} />
            <NavItem tab="movement" icon={ArrowLeftRight} label="Movimentação" />
            <NavItem tab="inventory" icon={Package} label="Estoque Geral" />
            <NavItem tab="rotative" icon={TrendingUp} label="Estoque Rotativo" />
            <NavItem tab="shipments" icon={Truck} label="Carregamento" badge={shipments.filter(s => s.status === ShipmentStatus.OPEN).length} />
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
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className="bg-slate-950/80 backdrop-blur-xl border-b border-slate-900/50 h-16 px-4 md:px-10 flex justify-between items-center sticky top-0 z-40 shrink-0">
          <div className="flex items-center gap-3 md:gap-4">
            {!isPublicView && (
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden w-10 h-10 bg-slate-900/80 border border-slate-800/50 rounded-2xl flex items-center justify-center text-slate-400 hover:text-white transition-all active:scale-95 shadow-lg"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
            {isPublicView && <Logo size="sm" />}
            <h2 className="text-base md:text-xl font-black text-white tracking-tight uppercase italic line-clamp-1">
              {isPublicView ? 'Dashboard Público' : (
                <>
                  {activeTab === 'dashboard' && 'Painel de Controle'}
                  {activeTab === 'waiting' && 'Aguardando Vaga'}
                  {activeTab === 'movement' && 'Movimentação'}
                  {activeTab === 'inventory' && 'Estoque Geral'}
                  {activeTab === 'map' && 'Mapa de vagas'}
                  {activeTab === 'import' && 'Importar CSV'}
                  {activeTab === 'analysis' && 'Análise de Recebimento'}
                  {activeTab === 'history' && 'Histórico'}
                  {activeTab === 'shipments' && 'Gestão de Carregamentos'}
                  {activeTab === 'rotative' && 'Estoque Rotativo'}
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
             <div className="flex items-center justify-center w-10 h-6 bg-slate-900/50 rounded-full border border-slate-800/50">
               <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
             </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 lg:p-14 scroll-smooth">
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
                <div className="flex flex-wrap gap-3">
                    {!isPublicView && selectedPallets.length > 0 && (
                        <button 
                            onClick={() => setIsShipmentModalOpen(true)}
                            className="w-full md:w-auto px-5 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-purple-900/20 animate-in zoom-in duration-200"
                        >
                            <Truck className="w-3.5 h-3.5" /> Enviar para Carregamento ({selectedPallets.length})
                        </button>
                    )}
                    {!isPublicView && (
                      <>
                        <button 
                            onClick={handleExportInventory}
                            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all border border-slate-800 hover:border-blue-500/30 group"
                        >
                            <Download className="w-3.5 h-3.5 text-blue-500 group-hover:scale-110 transition-transform" /> Exportar CSV
                        </button>
                        <button 
                            onClick={handleShareDashboard}
                            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all border border-slate-800 hover:border-purple-500/30 group"
                        >
                            <Share2 className="w-3.5 h-3.5 text-purple-500 group-hover:scale-110 transition-transform" /> Compartilhar Dashboard
                        </button>
                      </>
                    )}
                </div>

                {/* Occupancy Progress Bar */}
                <div className="bg-slate-900/40 p-6 rounded-[2rem] border border-slate-800/50 shadow-xl space-y-3 relative overflow-hidden">
                  <div className="flex justify-between items-end">
                    <div>
                      <h4 className="text-xs font-black text-white uppercase tracking-widest italic">Utilização do Armazém G0</h4>
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Capacidade em tempo real</p>
                    </div>
                    <div className="text-right flex items-center gap-4">
                      {!isPublicView && (
                        <button 
                          onClick={handleResyncSlots}
                          className="p-2 bg-slate-950 hover:bg-slate-900 text-slate-500 hover:text-blue-500 rounded-lg border border-slate-800 transition-all group"
                          title="Sincronizar Vagas"
                        >
                          <RefreshCw className="w-3.5 h-3.5 group-active:rotate-180 transition-transform duration-500" />
                        </button>
                      )}
                      <span className="text-2xl font-black text-blue-500 italic">{stats.occupancyRate}%</span>
                    </div>
                  </div>
                  <div className="h-3 bg-slate-950 rounded-full border border-slate-800 overflow-hidden relative">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(stats.occupancyRate, 100)}%` }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className={`h-full rounded-full transition-all duration-700 shadow-[0_0_10px_rgba(37,99,235,0.2)] ${
                        stats.occupancyRate > 95 ? 'bg-red-600 shadow-red-500/20' : 
                        stats.occupancyRate > 80 ? 'bg-amber-500' : 
                        'bg-blue-600'
                      }`}
                    />
                    {stats.occupancyRate > 100 && (
                      <div className="absolute inset-0 bg-red-600/10 pointer-events-none animate-pulse" />
                    )}
                  </div>
                  <div className="flex justify-between text-[8px] font-black text-slate-600 uppercase tracking-widest">
                    <span>Vazio</span>
                    <span className={stats.occupancyRate > 90 ? 'text-red-500' : 'text-slate-500'}>
                      {stats.occupiedSlots} / {stats.totalSlots} Vagas
                    </span>
                    <span>100%</span>
                  </div>
                </div>

                {/* Stats Section */}
                <StatsSection stats={stats} isPublicView={isPublicView} onNavigate={navigateToTab} />

                {/* Charts Area - Keeping some but making them more modern */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-8">
                  {/* Rack Distribution Chart */}
                  <RackDistributionChart slots={slots} waitingPallets={stats.waitingPallets} />

                  {/* Product Distribution Card */}
                  <ProductDistributionChart slots={slots} occupiedSlots={stats.occupiedSlots} />
                </div>
            </div>
          )}

          {activeTab === 'map' && (
            <WarehouseMap 
              slots={slots} 
              onSlotClick={setSelectedMappingSlot} 
            />
          )}

          {activeTab === 'import' && (
            <ImportPage 
              onProcess={handleImportProcess} 
              availableSlots={slots.filter(s => s.status === SlotContent.EMPTY)}
            />
          )}

          {activeTab === 'waiting' && (
            <WaitingSlotsView 
              items={waitingRows}
              onAssignSlot={(row, idx) => {
                setEditPalletMode('assign');
                setEditPalletContext({ row, inspection: row.inspections![idx], idx });
              }}
            />
          )}

          {activeTab === 'analysis' && (
            <AnalysisPage 
              pendingItems={pendingRows}
              availableSlots={slots.filter(s => s.status === SlotContent.EMPTY)}
              onConfirm={handleConfirmAnalysis}
              onReject={handleRejectAnalysis}
              onEdit={(item) => {
                setEditPalletMode('edit');
                setEditPalletContext({ row: item, inspection: item.inspections?.[0] || { contentType: SlotContent.SUPPLIES, bottles: 0, caps: 0, boxes: 0, cradles: 0 }, idx: 0 });
              }}
            />
          )}

          {activeTab === 'shipments' && (
            <ShipmentPage 
              shipments={shipments}
              inventory={data}
              shipmentCounts={shipmentCounts}
              onOpenDetail={handleOpenShipmentDetail}
              onDelete={handleDeleteShipment}
            />
          )}

          {activeTab === 'history' && (
            <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
                <div className="relative w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-700 w-4 h-4" />
                    <input 
                        type="text" 
                        value={historySearch}
                        onChange={(e) => setHistorySearch(e.target.value)}
                        placeholder="Pesquisar no histórico (OP, Produto, Lote, ID)..." 
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-11 py-3 text-white font-semibold text-sm focus:border-blue-600 outline-none transition-all placeholder:text-slate-700"
                    />
                </div>

                <div className="space-y-3">
                    {filteredHistory.length === 0 ? (
                        <div className="py-32 text-center border-2 border-dashed border-slate-900 rounded-[2.5rem]">
                            <History className="w-12 h-12 text-slate-800 mx-auto mb-4" />
                            <p className="text-slate-700 font-bold uppercase text-[10px] tracking-[0.3em]">
                                {historySearch ? 'Nenhum registro encontrado para esta pesquisa' : 'Sem movimentações registradas'}
                            </p>
                        </div>
                    ) : (
                        filteredHistory.map(entry => (
                          <HistoryItem key={entry.id} entry={entry} />
                        )))}
                </div>
            </div>
          )}

          {activeTab === 'rotative' && (
            <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
              <RotativeStockManager 
                slots={slots}
                onUpdateSlot={async (slot) => {
                  try {
                    await supabaseService.updateSlot(slot);
                    setSlots(prev => prev.map(s => s.id === slot.id ? slot : s));
                  } catch (error) {
                    showNotification('Erro ao atualizar vaga', 'error');
                  }
                }}
                onShowNotification={showNotification}
                onAddHistory={addToHistory}
              />
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
                            placeholder="Buscar por ID, OP, Produto ou Lote..." 
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-11 py-3 text-white font-semibold text-sm focus:border-blue-600 outline-none transition-all placeholder:text-slate-700"
                        />
                    </div>
                    
                    {/* Type Filter Dropdown */}
                    <div className="relative w-full md:w-64">
                      <button
                        onClick={() => setIsInventoryFilterOpen(!isInventoryFilterOpen)}
                        className={`w-full flex items-center justify-between px-5 py-3 bg-slate-900 border ${isInventoryFilterOpen ? 'border-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.2)]' : 'border-slate-800'} rounded-xl transition-all group`}
                      >
                        <div className="flex items-center gap-3">
                          <Filter className={`w-4 h-4 ${inventoryTypeFilter !== 'ALL' ? 'text-blue-500' : 'text-slate-500'}`} />
                          <span className={`text-[10px] font-black uppercase tracking-widest ${inventoryTypeFilter !== 'ALL' ? 'text-white' : 'text-slate-500'}`}>
                            {inventoryTypeFilter === 'ALL' ? 'Todos os Tipos' : 
                             inventoryTypeFilter === 'CONTAINER' ? 'Container (SJ/LP/CP)' : 
                             translateSlotContent(inventoryTypeFilter as SlotContent)}
                          </span>
                        </div>
                        <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-300 ${isInventoryFilterOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {isInventoryFilterOpen && (
                        <>
                          <div className="fixed inset-0 z-[60]" onClick={() => setIsInventoryFilterOpen(false)} />
                          <div className="absolute top-full left-0 right-0 mt-2 p-2 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-[70] animate-in fade-in zoom-in-95 duration-200">
                            <div className="grid grid-cols-1 gap-1 max-h-64 overflow-y-auto pr-1">
                              {[
                                { value: 'ALL', label: 'Todos os Tipos' },
                                { value: SlotContent.BOTTLES, label: 'Frasco' },
                                { value: SlotContent.SUPPLIES, label: 'Insumo' },
                                { value: SlotContent.FINISHED_PRODUCT, label: 'Produto Acabado' },
                                { value: 'CONTAINER', label: 'Todos os Containers' },
                                { value: SlotContent.CONTAINER_SJ, label: '• Container Sujo', isSub: true },
                                { value: SlotContent.CONTAINER_LP, label: '• Container Limpo', isSub: true },
                                { value: SlotContent.CONTAINER_CP, label: '• Container com Produto', isSub: true },
                                { value: SlotContent.REWORK, label: 'Retrabalho' },
                                { value: SlotContent.REPROCESS, label: 'Reprocesso' },
                                { value: SlotContent.USE_CONSUMPTION, label: 'Uso e Consumo' },
                                { value: SlotContent.RETURN, label: 'Retorno' },
                                { value: SlotContent.MISCELLANEOUS, label: 'Diversos' },
                                { value: SlotContent.DISCARD, label: 'Descarte' },
                                { value: SlotContent.OTHER, label: 'Outro' }
                              ].map((type) => (
                                <button
                                  key={type.value}
                                  onClick={() => {
                                    setInventoryTypeFilter(type.value as any);
                                    setIsInventoryFilterOpen(false);
                                  }}
                                  className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                                    (type as any).isSub ? 'ml-4 bg-slate-950/30' : ''
                                  } ${
                                    inventoryTypeFilter === type.value 
                                      ? 'bg-blue-600 text-white' 
                                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                  }`}
                                >
                                  {type.label}
                                  {inventoryTypeFilter === type.value && <CheckCircle2 className="w-3 h-3" />}
                                </button>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    {selectedPallets.length > 0 && (
                        <div className="flex gap-3 w-full md:w-auto">
                            <button 
                                onClick={() => setIsShipmentModalOpen(true)}
                                className="flex-1 md:flex-none px-5 py-3 bg-fuchsia-600 hover:bg-fuchsia-500 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-fuchsia-900/20 animate-in zoom-in duration-200"
                            >
                                <Truck className="w-3.5 h-3.5" /> Carregamento ({selectedPallets.length})
                            </button>
                            <button 
                                onClick={() => setIsBulkConfirmOpen(true)}
                                className="flex-1 md:flex-none px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 animate-in zoom-in duration-200"
                            >
                                <Send className="w-3.5 h-3.5" /> Enviar ({selectedPallets.length})
                            </button>
                        </div>
                    )}
                </div>

                {filteredInventory.length === 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                        <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-900 rounded-[32px]">
                            <p className="text-slate-700 font-black uppercase text-[10px] tracking-[0.3em]">Nenhum item encontrado no estoque</p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredInventory.map(({ row, inspection, idx }) => (
                            <InventoryCard
                                key={`${row.id}::${idx}`}
                                item={row}
                                insp={inspection}
                                idx={idx}
                                isSelected={selectedPallets.includes(`${row.id}::${idx}`)}
                                onToggleSelection={togglePalletSelection}
                                onShowDetail={handleShowDetail}
                                onEdit={handleEditPallet}
                                onDelete={handleDeletePallet}
                            />
                        ))}
                    </div>
                )}

                {activeTab === 'inventory' && hasMoreInventory && (
                  <div className="flex justify-center pt-8 pb-12">
                    <button
                      onClick={loadMoreInventory}
                      disabled={isLoadingMore}
                      className="px-8 py-4 bg-slate-900 text-white rounded-[20px] font-black uppercase text-xs tracking-widest hover:bg-slate-800 transition-all disabled:opacity-50 flex items-center gap-3 border border-slate-800 shadow-xl"
                    >
                      {isLoadingMore ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Carregando...</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-5 h-5" />
                          <span>Carregar Mais Pallets</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
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
          selectedPallets={selectedPalletsData}
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
          pallet={editPalletContext}
          onSave={handleUpdatePallet}
          history={history}
          availableSlots={slots.filter(s => s.status === SlotContent.EMPTY)}
          mode={editPalletMode}
        />
      )}

      <ShipmentModal 
        isOpen={isShipmentModalOpen}
        onClose={() => setIsShipmentModalOpen(false)}
        openShipments={shipments.filter(s => s.status === ShipmentStatus.OPEN)}
        onCreateNew={handleCreateShipment}
        onAddToExisting={handleAddToShipment}
        selectedCount={selectedPallets.length}
      />

      <ShipmentDetailModal 
        isOpen={!!shipmentDetailContext}
        onClose={() => {
          setShipmentDetailContext(null);
          setShipmentDetailPallets([]);
        }}
        shipment={shipmentDetailContext}
        linkedPallets={shipmentDetailPallets}
        onFinalize={handleFinalizeShipment}
        onRemovePallet={async (palletId) => {
          await handleRemoveFromShipment(palletId);
          if (shipmentDetailContext) {
            fetchShipmentDetailPallets(shipmentDetailContext.id);
          }
        }}
        onDelete={handleDeleteShipment}
      />
      
      <MovementModal 
        isOpen={isMovementModalOpen} 
        onClose={() => setIsMovementModalOpen(false)}
        onEntry={handleMovementEntry}
        onTransfer={handleMovementTransfer}
        onExit={handleMovementExit}
        availableSlots={slots.filter(s => s.status === SlotContent.EMPTY)}
        occupiedSlots={slots.filter(s => s.status !== SlotContent.EMPTY)}
        inventoryData={data}
        history={history}
      />
    </div>
  );
};

export default App;
