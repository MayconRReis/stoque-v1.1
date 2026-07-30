import { useState, useEffect } from 'react';
import { supabaseService } from '../services/supabaseService';
import { SheetRow, InspectionData } from '../types';

export function usePalletSelection(
  showNotification: (msg: string, type?: 'success'|'error'|'info') => void
) {
  const [selectedPallets, setSelectedPallets] = useState<string[]>([]); // Format: "rowId::palletIdx"
  const [isConsolidateDrawerOpen, setIsConsolidateDrawerOpen] = useState(false);
  const [isBulkConfirmOpen, setIsBulkConfirmOpen] = useState(false);
  const [selectedPalletsData, setSelectedPalletsData] = useState<{ row: SheetRow, inspection: InspectionData, idx: number, selectionKey: string }[]>([]);

  useEffect(() => {
    if ((isBulkConfirmOpen || isConsolidateDrawerOpen) && selectedPallets.length > 0) {
      const fetchSelectedData = async () => {
        const rowIds = Array.from(new Set(selectedPallets.map(key => key.split('::').slice(0, -1).join('::'))));
        try {
          const items = await supabaseService.getInventoryItemsByIds(rowIds as string[]);
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
          showNotification('Erro ao carregar dados dos pallets selecionados', 'error');
        }
      };
      fetchSelectedData();
    } else if (!isBulkConfirmOpen && !isConsolidateDrawerOpen) {
      setSelectedPalletsData([]);
    }
  }, [isBulkConfirmOpen, isConsolidateDrawerOpen, selectedPallets, showNotification]);

  return {
    selectedPallets, setSelectedPallets,
    isConsolidateDrawerOpen, setIsConsolidateDrawerOpen,
    isBulkConfirmOpen, setIsBulkConfirmOpen,
    selectedPalletsData, setSelectedPalletsData
  };
}
