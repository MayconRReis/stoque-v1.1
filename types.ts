
export interface User {
  id: string;
  name: string;
  role: 'admin' | 'operator';
}

export enum StockStatus {
  PENDING = 'PENDING',
  INSPECTED = 'INSPECTED',
  IN_PRODUCTION = 'IN_PRODUCTION',
  FINISHED = 'FINISHED',
  REJECTED = 'REJECTED'
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
  CLEAN_BUCKET = 'CLEAN_BUCKET',
  DIRTY_BUCKET = 'DIRTY_BUCKET',
  CRADLE = 'CRADLE'
}

export enum HistoryType {
  ENTRY = 'ENTRY',
  EXIT = 'EXIT',
  REMOVAL = 'REMOVAL',
  TRANSFER = 'TRANSFER'
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
}

export interface WarehouseSlot {
  id: string; // e.g., A.1.1
  rack: 'A' | 'B' | 'C' | 'D';
  level: number;
  position: number;
  status: SlotContent;
  occupiedBy?: string; // OP or Lot number
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
}

export interface DashboardStats {
  freeSlots: number;
  pendingEntries: number;
  occupancyRate: number;
  dailyMovements: number;
  totalSlots: number;
  occupiedSlots: number;
  totalBottles: number;
}

export const translateSlotContent = (content: SlotContent): string => {
  const translations: Record<SlotContent, string> = {
    [SlotContent.EMPTY]: 'Vazio',
    [SlotContent.BOTTLES]: 'Frasco',
    [SlotContent.SUPPLIES]: 'Insumo',
    [SlotContent.FINISHED_PRODUCT]: 'Produto Acabado',
    [SlotContent.RETURN]: 'Retorno',
    [SlotContent.CONTAINER_SJ]: 'Container SJ',
    [SlotContent.CONTAINER_LP]: 'Container LP',
    [SlotContent.CONTAINER_CP]: 'Container CP',
    [SlotContent.CLEAN_BUCKET]: 'Balde Limpo',
    [SlotContent.DIRTY_BUCKET]: 'Balde Sujo',
    [SlotContent.CRADLE]: 'Berço'
  };
  return translations[content] || content;
};
