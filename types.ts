
export interface User {
  id: string;
  name: string;
  role: 'admin' | 'operator';
}

export enum StockStatus {
  PENDING = 'PENDING',
  INSPECTED = 'INSPECTED'
}

export enum SlotContent {
  EMPTY = 'EMPTY',
  BOTTLES = 'BOTTLES',
  SUPPLIES = 'SUPPLIES',
  FINISHED_PRODUCT = 'FINISHED_PRODUCT',
  RETURN = 'RETURN',
  CONTAINER_SJ = 'CONTAINER_SJ',
  CONTAINER_LP = 'CONTAINER_LP',
  CONTAINER_CP = 'CONTAINER_CP',
  USE_CONSUMPTION = 'USE_CONSUMPTION',
  REWORK = 'REWORK',
  REPROCESS = 'REPROCESS',
  ROTATIVE = 'ROTATIVE',
  MISCELLANEOUS = 'MISCELLANEOUS',
  DISCARD = 'DISCARD',
  OTHER = 'OTHER'
}

export enum HistoryType {
  ENTRY = 'ENTRY',
  EXIT = 'EXIT',
  REMOVAL = 'REMOVAL',
  TRANSFER = 'TRANSFER',
  ALLOCATION = 'ALLOCATION',
  EDIT = 'EDIT'
}

export enum ShipmentType {
  THIRD_PARTY = 'THIRD_PARTY',
  OWN = 'OWN'
}

export enum ShipmentStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED'
}

export interface Shipment {
  id: string;
  type: ShipmentType;
  status: ShipmentStatus;
  createdAt: string;
  scheduledDate: string;
  operatorName?: string;
  closedAt?: string;
}

export interface HistoryEntry {
  id: string;
  type: HistoryType;
  timestamp: string;
  loadingId: string;
  description: string;
  op: string;
  lot: string;
  palletNumber: number;
  totalPallets: number;
  slot: string;
  details: string;
  operatorName?: string;
}

export interface WarehouseSlot {
  id: string; // e.g., A.1.1
  rack: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
  level: number;
  position: number;
  status: SlotContent;
  occupiedBy?: string; // OP or Lot number
}

export interface RotativeStockItem {
  id: string;
  productName: string;
  quantity: number;
  slotId: string;
  type: string; // 'Frasco' | 'Caixa' | 'Tampa' | 'Sleev'
  updatedAt: string;
}

export interface InspectionData {
  bottles: number;
  caps: number;
  boxes: number;
  cradles: number; // Berço
  assignedSlot?: string;
  contentType: SlotContent;
  palletNumber?: number;
  supplyDescription?: string; // Descrição do insumo
  others?: { name: string; quantity: number }[];
  shipmentId?: string;
}

export interface SheetRow {
  id: string;
  originOP: string;
  description: string;
  lot: string;
  pallets: number;
  date: string;
  status: StockStatus;
  inspections?: InspectionData[];
  loadingId: string; // ID extraído da célula B1
  operatorName?: string;
}

export interface DashboardStats {
  freeSlots: number;
  pendingEntries: number;
  occupancyRate: number;
  dailyMovements: number;
  totalSlots: number;
  occupiedSlots: number;
  totalBottles: number;
  waitingPallets: number;
  finishedShipments24h: number;
  openShipmentsCount: number;
  productDistribution: Record<string, number>;
  // Container specific stats
  containerTotalSlots: number;
  containerOccupiedSlots: number;
  containerFreeSlots: number;
  containerOccupancyRate: number;
}

export interface WarehouseDiagnostic {
  noDefinitiveSlot: number; // Pallets without assignedSlot or with placeholder values
  slotConflicts: number;   // Multiple pallets pointing to the same slot
  orphanedSlots: number;   // Slot occupied in warehouse_slots but no pallet in inventory
  freeSlotsWithPallets: number; // Slot EMPTY in warehouse_slots but has pallet in inventory
  details: {
    noDefinitiveSlotItems: string[]; // List of pallet IDs mapping to no slot
    conflictSlots: string[];       // List of slot IDs with multiple pallets
    orphanedSlotIds: string[];     // List of slot IDs marked occupied but empty
    freeSlotWithPalletIds: string[]; // List of slot IDs marked free but occupied
  };
}

export const SHAREABLE_SLOT_TYPES = [
  SlotContent.RETURN,
  SlotContent.REWORK,
  SlotContent.REPROCESS,
  SlotContent.USE_CONSUMPTION,
  SlotContent.MISCELLANEOUS
];

export const translateSlotContent = (content: SlotContent): string => {
  const translations: Record<SlotContent, string> = {
    [SlotContent.EMPTY]: 'Vazio',
    [SlotContent.BOTTLES]: 'Frasco',
    [SlotContent.SUPPLIES]: 'Insumo',
    [SlotContent.FINISHED_PRODUCT]: 'Produto Acabado',
    [SlotContent.RETURN]: 'Retorno',
    [SlotContent.CONTAINER_SJ]: 'Container Sujo',
    [SlotContent.CONTAINER_LP]: 'Container Limpo',
    [SlotContent.CONTAINER_CP]: 'Container Com Produto',
    [SlotContent.USE_CONSUMPTION]: 'Uso e Consumo',
    [SlotContent.REWORK]: 'Retrabalho',
    [SlotContent.REPROCESS]: 'Reprocesso',
    [SlotContent.ROTATIVE]: 'Estoque Rotativo',
    [SlotContent.MISCELLANEOUS]: 'Diversos',
    [SlotContent.DISCARD]: 'Descarte',
    [SlotContent.OTHER]: 'Outro'
  };
  return translations[content] || content;
};

export const getContentTypeColor = (content: SlotContent): string => {
  const colors: Record<SlotContent, string> = {
    [SlotContent.EMPTY]: 'text-slate-400',
    [SlotContent.BOTTLES]: 'text-sky-400',
    [SlotContent.SUPPLIES]: 'text-amber-400',
    [SlotContent.FINISHED_PRODUCT]: 'text-emerald-400',
    [SlotContent.USE_CONSUMPTION]: 'text-purple-400',
    [SlotContent.CONTAINER_SJ]: 'text-rose-400',
    [SlotContent.CONTAINER_LP]: 'text-blue-400',
    [SlotContent.CONTAINER_CP]: 'text-indigo-400',
    [SlotContent.RETURN]: 'text-orange-400',
    [SlotContent.REWORK]: 'text-yellow-400',
    [SlotContent.REPROCESS]: 'text-teal-400',
    [SlotContent.ROTATIVE]: 'text-pink-400',
    [SlotContent.MISCELLANEOUS]: 'text-slate-400',
    [SlotContent.DISCARD]: 'text-red-500',
    [SlotContent.OTHER]: 'text-gray-400'
  };
  return colors[content] || 'text-slate-400';
};

export interface InventoryEditRequest {
  id: string;
  inventory_id: string;
  requested_by: string;
  requested_at: string;
  before_data: Partial<SheetRow>;
  after_data: Partial<SheetRow>;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by?: string;
  reviewed_at?: string;
  admin_comment?: string;
  // Join data
  requester_name?: string;
  reviewer_name?: string;
  product_description?: string;
}
