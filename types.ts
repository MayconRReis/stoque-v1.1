
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
  USE_CONSUMPTION = 'USE_CONSUMPTION'
}

export enum HistoryType {
  ENTRY = 'ENTRY',
  EXIT = 'EXIT',
  REMOVAL = 'REMOVAL',
  TRANSFER = 'TRANSFER'
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
    [SlotContent.USE_CONSUMPTION]: 'Uso e Consumo'
  };
  return translations[content] || content;
};
