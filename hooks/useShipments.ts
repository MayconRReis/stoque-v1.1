import { useState } from 'react';
import { supabaseService } from '../services/supabaseService';
import { isFetchOrNetworkError } from '../lib/supabase';
import { Shipment, ShipmentStatus, HistoryEntry, SheetRow, StockStatus, SlotContent } from '../types';

export function useShipments(
  history: HistoryEntry[],
  showNotification: (msg: string, type?: 'success'|'error'|'info') => void
) {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [isShipmentModalOpen, setIsShipmentModalOpen] = useState(false);
  const [shipmentCounts, setShipmentCounts] = useState<Record<string, number>>({});
  const [shipmentDetailContext, setShipmentDetailContext] = useState<Shipment | null>(null);
  const [shipmentDetailPallets, setShipmentDetailPallets] = useState<SheetRow[]>([]);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  const fetchShipmentDetailPallets = async (shipmentId: string) => {
    setIsDetailLoading(true);
    try {
      const shipment = shipments.find(s => s.id === shipmentId);
      
      if (shipment?.status === ShipmentStatus.CLOSED) {
        // Use local history state to quickly show the pallets
        const localHistoryMatches = history.filter(h => h.details?.includes(`Finalização de Carregamento ${shipmentId}`));
        
        let histToUse = localHistoryMatches;
        
        // If not in local history (might be an old shipment), fetch from server
        if (localHistoryMatches.length === 0) {
          const remoteHist = await supabaseService.getHistory();
          histToUse = remoteHist.filter(h => h.details?.includes(`Finalização de Carregamento ${shipmentId}`));
        }
        
        const linked = histToUse.map((h, idx) => ({
          id: `history-${h.id}-${idx}`,
          loadingId: h.loadingId,
          originOP: h.op,
          description: h.description,
          lot: h.lot,
          pallets: h.totalPallets,
          date: h.timestamp,
          status: StockStatus.INSPECTED as StockStatus,
          operatorName: h.operatorName,
          inspections: [{ 
            bottles: 0, caps: 0, boxes: 0, cradles: 0, contentType: SlotContent.FINISHED_PRODUCT as SlotContent, 
            assignedSlot: h.slot, palletNumber: h.palletNumber, shipmentId: shipmentId
          }]
        } as SheetRow));
        setShipmentDetailPallets(linked);
      } else {
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
      }
    } catch (error) {
      if (isFetchOrNetworkError(error)) {
        console.warn('Network issue fetching detail pallets:', error);
      } else {
        console.warn('Error fetching detail pallets:', error);
      }
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleOpenShipmentDetail = async (shipment: Shipment) => {
    setShipmentDetailContext(shipment);
    await fetchShipmentDetailPallets(shipment.id);
  };

  return {
    shipments, setShipments,
    isShipmentModalOpen, setIsShipmentModalOpen,
    shipmentCounts, setShipmentCounts,
    shipmentDetailContext, setShipmentDetailContext,
    shipmentDetailPallets, setShipmentDetailPallets,
    isDetailLoading, setIsDetailLoading,
    fetchShipmentDetailPallets,
    handleOpenShipmentDetail
  };
}
