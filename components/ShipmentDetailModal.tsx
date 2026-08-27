import React, { useState, useEffect, useMemo } from 'react';
import { Shipment, ShipmentType, SheetRow, translateSlotContent, WarehouseSlot, SlotContent, compareWarehouseSlots } from '../types';
import { 
  X, 
  Truck, 
  Package, 
  CheckCircle2, 
  Trash2, 
  AlertCircle, 
  Loader2, 
  Plus, 
  Warehouse, 
  FileText, 
  MessageSquare,
  Save
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabaseService } from '../services/supabaseService';
import { ManualPalletModal } from './ManualPalletModal';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ShipmentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  shipment: Shipment | null;
  linkedPallets: SheetRow[];
  onFinalize: (shipmentId: string) => Promise<void>;
  onRemovePallet: (palletId: string) => Promise<void>;
  onAddPallet: (pallet: SheetRow) => Promise<void>;
  onAddUncatalogedPallet?: (palletData: any) => Promise<void>;
  onUpdateObs?: (shipmentId: string, obs: string) => Promise<void>;
  availableSlots?: WarehouseSlot[];
  inventoryData?: SheetRow[];
  historyData?: any[];
  onDelete?: (shipmentId: string) => Promise<void>;
}

export const ShipmentDetailModal: React.FC<ShipmentDetailModalProps> = ({ 
  isOpen, 
  onClose, 
  shipment, 
  linkedPallets,
  onFinalize,
  onRemovePallet,
  onAddPallet,
  onAddUncatalogedPallet,
  onUpdateObs,
  availableSlots = [],
  inventoryData = [],
  historyData = [],
  onDelete
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [searchSlots, setSearchSlots] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isUncatalogedModalOpen, setIsUncatalogedModalOpen] = useState(false);
  const [isObsModalOpen, setIsObsModalOpen] = useState(false);
  const [obsValue, setObsValue] = useState('');
  const [isSavingObs, setIsSavingObs] = useState(false);

  // Ordenar pallets em ordem crescente das vagas (da vaga mais próxima para a mais longe)
  const sortedPallets = useMemo(() => {
    return [...linkedPallets].sort((a, b) => {
      const slotA = a.inspections?.[0]?.assignedSlot;
      const slotB = b.inspections?.[0]?.assignedSlot;
      const slotDiff = compareWarehouseSlots(slotA, slotB);
      if (slotDiff !== 0) return slotDiff;
      
      // Critério secundário: OP e depois Lote
      const opA = a.originOP || '';
      const opB = b.originOP || '';
      const opDiff = opA.localeCompare(opB, undefined, { numeric: true });
      if (opDiff !== 0) return opDiff;
      return (a.lot || '').localeCompare(b.lot || '', undefined, { numeric: true });
    });
  }, [linkedPallets]);

  useEffect(() => {
    if (shipment) {
      setObsValue(shipment.obs || '');
    }
  }, [shipment]);

  if (!isOpen || !shipment) return null;

  const handleSlotSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const term = searchSlots.trim().toUpperCase();
    if (!term) return;

    setIsSearching(true);
    setSearchError(null);

    try {
      const terms = term.split(/[\s,]+/).filter(t => t.length > 0);
      let foundAny = false;

      for (const t of terms) {
        const results = await supabaseService.findPalletsBySlot(t);
        if (results.length > 1) {
          setSearchError(`Conflito na vaga ${t}: Encontrados ${results.length} pallets.`);
          continue;
        }
        const pallet = results[0];
        if (pallet) {
          if (linkedPallets.some(p => p.id === pallet.id)) {
            continue;
          }
          await onAddPallet(pallet);
          foundAny = true;
        }
      }

      if (foundAny) {
        setSearchSlots('');
      } else {
        setSearchError('Nenhum pallet disponível encontrado nestas vagas.');
      }
    } catch (error) {
      console.error('Error adding by slot:', error);
      setSearchError('Erro ao buscar pallets.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSaveObs = async () => {
    if (!shipment) return;
    setIsSavingObs(true);
    try {
      if (onUpdateObs) {
        await onUpdateObs(shipment.id, obsValue);
      } else {
        await supabaseService.saveShipment({ ...shipment, obs: obsValue });
      }
      setIsObsModalOpen(false);
    } catch (error) {
      console.error('Error saving shipment obs:', error);
    } finally {
      setIsSavingObs(false);
    }
  };

  const handleGeneratePDF = () => {
    if (!shipment) return;
    
    // Landscape orientation A4
    const doc = new jsPDF('l', 'mm', 'a4');
    
    // Main Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text('Lista de Separação - Carregamento', 14, 18);
    
    // Metadata Header - Left Column
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('ID do Carregamento: ', 14, 26);
    doc.setFont('helvetica', 'normal');
    doc.text(shipment.id, 50, 26);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Tipo: ', 14, 32);
    doc.setFont('helvetica', 'normal');
    doc.text(shipment.type === 'THIRD_PARTY' ? 'Terceirista' : 'Próprio', 24, 32);
    
    // Metadata Header - Right Column
    const dateStr = shipment.scheduledDate 
      ? new Date(shipment.scheduledDate.includes('T') ? shipment.scheduledDate : shipment.scheduledDate + 'T12:00:00').toLocaleDateString('pt-BR') 
      : (shipment.createdAt ? new Date(shipment.createdAt).toLocaleDateString('pt-BR') : 'N/A');
    
    doc.setFont('helvetica', 'bold');
    doc.text('Total de Pallets: ', 215, 26);
    doc.setFont('helvetica', 'normal');
    doc.text(String(linkedPallets.length), 244, 26);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Data Agendada: ', 215, 32);
    doc.setFont('helvetica', 'normal');
    doc.text(dateStr, 243, 32);

    const getPdfContentType = (pallet: SheetRow, insp: any): string => {
      if (pallet.is_group) return 'Consolidado';
      const type = insp?.contentType;
      if (!type) return '-';

      switch (type) {
        case SlotContent.CONTAINER_CP:
          return 'Cont Acabado';
        case SlotContent.CONTAINER_SJ:
          return 'Cont Sujo';
        case SlotContent.CONTAINER_LP:
          return 'Cont Limpo';
        case SlotContent.FINISHED_PRODUCT:
          return 'Prod Acabado';
        case SlotContent.USE_CONSUMPTION:
          return 'Uso/Consumo';
        case SlotContent.ROTATIVE:
          return 'Est Rotativo';
        case SlotContent.BOTTLES:
          return 'Frasco';
        case SlotContent.SUPPLIES:
          return 'Insumo';
        case SlotContent.RETURN:
          return 'Retorno';
        case SlotContent.REWORK:
          return 'Retrabalho';
        case SlotContent.REPROCESS:
          return 'Reprocesso';
        case SlotContent.DISCARD:
          return 'Descarte';
        case SlotContent.MISCELLANEOUS:
          return 'Diversos';
        case SlotContent.EMPTY:
          return 'Vazio';
        default: {
          const translated = translateSlotContent(type);
          return translated
            .replace(/container com produto acabado/gi, 'Cont Acabado')
            .replace(/container com produto/gi, 'Cont Acabado')
            .replace(/container sujo/gi, 'Cont Sujo')
            .replace(/container limpo/gi, 'Cont Limpo')
            .replace(/produto acabado/gi, 'Prod Acabado')
            .replace(/estoque rotativo/gi, 'Est Rotativo')
            .replace(/uso e consumo/gi, 'Uso/Consumo');
        }
      }
    };

    const getPdfSlot = (slot?: string | null): string => {
      if (!slot) return 'Ag Vaga';
      const trimmed = slot.trim();
      const upper = trimmed.toUpperCase();
      if (
        upper === 'SEM VAGA' || 
        upper === 'AGUARDANDO' || 
        upper === 'AGUARDANDO VAGA' || 
        upper === 'AG. VAGA' || 
        upper === 'AG VAGA' ||
        upper === 'N/A' ||
        upper === '-'
      ) {
        return 'Ag Vaga';
      }
      if (upper.includes('AGUARDANDO')) {
        return 'Ag Vaga';
      }
      return trimmed;
    };

    const tableData = sortedPallets.map(p => {
      const insp = p.inspections?.[0] || {};
      
      let cleanDesc = (p.description || '-')
        .replace(/[ÿý]/gi, '')
        .replace(/[^a-zA-Z0-9À-ÖØ-öø-ÿ \-.,()/]/g, '')
        .trim();
      
      const tipo = getPdfContentType(p, insp);
      const vaga = getPdfSlot(insp.assignedSlot);

      return [
        p.originOP || '-',
        p.lot || '-',
        cleanDesc || '-',
        tipo,
        vaga
      ];
    });

    autoTable(doc, {
      startY: 38,
      head: [['OP', 'Lote', 'Produto', 'Tipo', 'Vaga']],
      body: tableData,
      theme: 'grid',
      headStyles: { 
        fillColor: [37, 99, 235], // Strong Blue #2563eb
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 9.5,
        halign: 'left',
        lineWidth: 0.15,
        lineColor: [40, 40, 40]
      },
      styles: { 
        fontSize: 9,
        cellPadding: 2.5,
        minCellHeight: 6.5,
        valign: 'middle',
        textColor: [15, 23, 42],
        lineWidth: 0.15,
        lineColor: [40, 40, 40]
      },
      columnStyles: {
        0: { cellWidth: 26, halign: 'left' },
        1: { cellWidth: 32, halign: 'left' },
        2: { cellWidth: 'auto', halign: 'left' }, 
        3: { cellWidth: 32, halign: 'left' },
        4: { cellWidth: 24, halign: 'left' }
      },
      margin: { left: 14, right: 14 }
    });

    // Observations at bottom
    const finalY = (doc as any).lastAutoTable?.finalY || 100;
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    
    const obsContent = shipment.obs && shipment.obs.trim() ? shipment.obs.trim() : 'aqui vão ficar as obs dos carregamentos quando ouver';
    const splitObs = doc.splitTextToSize(`OBS: ${obsContent}`, 268);
    
    const pageHeight = doc.internal.pageSize.getHeight();
    if (finalY + 20 + (splitObs.length * 5) > pageHeight - 10) {
      doc.addPage();
      doc.text(splitObs, 14, 20);
    } else {
      doc.text(splitObs, 14, Math.max(finalY + 18, 140));
    }

    doc.save(`Separacao_${shipment.id || 'Carregamento'}.pdf`);
  };

  const handleFinalize = async () => {
    if (linkedPallets.length === 0) return;
    setIsProcessing(true);
    try {
      await onFinalize(shipment.id);
      onClose();
    } catch (error) {
      console.error('Error finalizing shipment:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    setIsProcessing(true);
    try {
      await onDelete(shipment.id);
      onClose();
    } catch (error) {
      console.error('Error deleting shipment:', error);
    } finally {
      setIsProcessing(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-xl p-4 overflow-y-auto">
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-[210] flex items-center justify-center bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-md p-4"
          >
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 max-w-sm w-full shadow-3xl text-center space-y-6">
              <div className="w-16 h-16 bg-red-600/10 text-red-500 rounded-2xl flex items-center justify-center mx-auto border border-red-500/20 shadow-xl shadow-red-900/20">
                <AlertCircle className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic mb-2">Excluir Carregamento?</h3>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider leading-relaxed">
                  Esta ação irá desvincular todos os pallets e remover o carregamento permanentemente.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isProcessing}
                  className="flex-1 py-4 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-red-900/20 transition-all flex items-center justify-center gap-2"
                >
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[3rem] p-8 max-w-4xl w-full shadow-3xl overflow-hidden relative"
      >
        <div className="flex justify-between items-start mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-fuchsia-600/20 text-fuchsia-400 border border-fuchsia-500/30 flex items-center justify-center shadow-xl shadow-fuchsia-900/20">
              <Truck className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black text-fuchsia-500 uppercase tracking-widest">Carregamento</span>
                <span className="text-xs font-mono font-black text-slate-600 dark:text-slate-400">#{shipment.id}</span>
                {shipment.obs && (
                  <span className="flex items-center gap-1 text-[9px] font-black bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded-md uppercase tracking-wider">
                    <MessageSquare className="w-3 h-3" />
                    Obs Ativa
                  </span>
                )}
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tight">
                {shipment.type === ShipmentType.THIRD_PARTY ? 'Terceirista' : 'Próprio'}
              </h3>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="p-3 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-50/50 dark:bg-slate-950/50 p-5 rounded-[2rem] border border-slate-200/50 dark:border-slate-800/50">
              <p className="text-[9px] text-slate-600 font-black uppercase mb-1">Status</p>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-sm font-black text-emerald-500 uppercase italic">Aberto</p>
              </div>
            </div>
            <div className="bg-slate-50/50 dark:bg-slate-950/50 p-5 rounded-[2rem] border border-slate-200/50 dark:border-slate-800/50">
              <p className="text-[9px] text-slate-600 font-black uppercase mb-1">Criado em</p>
              <p className="text-sm font-black text-slate-900 dark:text-white italic">{new Date(shipment.createdAt).toLocaleDateString('pt-BR')}</p>
            </div>
            <div className="bg-slate-50/50 dark:bg-slate-950/50 p-5 rounded-[2rem] border border-slate-200/50 dark:border-slate-800/50">
              <p className="text-[9px] text-slate-600 font-black uppercase mb-1">Data de Envio</p>
              <p className="text-sm font-black text-slate-900 dark:text-white italic">{new Date(shipment.scheduledDate.includes('T') ? shipment.scheduledDate : shipment.scheduledDate + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
            </div>
            <div className="bg-slate-50/50 dark:bg-slate-950/50 p-5 rounded-[2rem] border border-slate-200/50 dark:border-slate-800/50">
              <p className="text-[9px] text-slate-600 font-black uppercase mb-1">Total Pallets</p>
              <p className="text-sm font-black text-slate-900 dark:text-white italic">{linkedPallets.length} Unidades</p>
            </div>
          </div>

          {/* Quick Add Section & Unified Action Buttons */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-2">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] italic">Adicionar Itens & Ações</h4>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2.5 items-stretch">
              {/* Option 1: Adicionar por Vaga Existente */}
              <form onSubmit={handleSlotSearch} className="flex-1 flex gap-2">
                <div className="relative flex-1">
                  <Warehouse className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input 
                    type="text"
                    value={searchSlots}
                    onChange={e => setSearchSlots(e.target.value)}
                    placeholder="Adicionar por vaga: E.1.1..."
                    className="w-full h-11 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-3 text-slate-900 dark:text-white font-mono font-bold text-xs focus:border-fuchsia-500 outline-none transition-all placeholder:text-slate-500"
                  />
                  {isSearching && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 className="w-4 h-4 text-fuchsia-500 animate-spin" />
                    </div>
                  )}
                </div>
                <button 
                  type="submit"
                  disabled={isSearching || !searchSlots.trim()}
                  className="h-11 px-4 bg-slate-200 dark:bg-slate-800 hover:bg-fuchsia-600 hover:text-white disabled:opacity-40 text-slate-700 dark:text-slate-200 rounded-xl font-black text-[11px] uppercase tracking-wider transition-all shrink-0 flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar</span>
                </button>
              </form>

              {/* Option 2 & 3: Botões Pallet Extra & OBS (Same size as Adicionar) */}
              <div className="flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsUncatalogedModalOpen(true)}
                  className="h-11 px-4 bg-fuchsia-600 hover:bg-fuchsia-500 text-white rounded-xl font-black text-[11px] uppercase tracking-wider shadow-md shadow-fuchsia-900/20 active:scale-95 transition-all flex items-center justify-center gap-1.5 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Pallet Extra</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsObsModalOpen(true)}
                  className={`h-11 px-4 ${shipment.obs ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-md shadow-amber-900/20' : 'bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'} rounded-xl font-black text-[11px] uppercase tracking-wider active:scale-95 transition-all flex items-center justify-center gap-1.5 shrink-0 relative`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>OBS</span>
                  {shipment.obs && (
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse ml-0.5"></span>
                  )}
                </button>
              </div>
            </div>

            {searchError && (
              <p className="text-[9px] font-bold text-red-500 uppercase tracking-widest ml-2 italic">
                {searchError}
              </p>
            )}
          </div>

          {/* Pallet List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] italic">Pallets Vinculados</h4>
              <span className="text-[10px] font-bold text-slate-600 uppercase">{linkedPallets.length} itens</span>
            </div>
            
            <div className="max-h-[35vh] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {sortedPallets.length === 0 ? (
                <div className="py-12 text-center border-2 border-dashed border-slate-200/50 dark:border-slate-800/50 rounded-[2rem] bg-slate-50/20 dark:bg-slate-950/20">
                  <Package className="w-10 h-10 text-slate-800 mx-auto mb-3" />
                  <p className="text-slate-600 font-bold uppercase text-[9px] tracking-widest">Nenhum pallet vinculado</p>
                </div>
              ) : (
                sortedPallets.map(pallet => (
                  <div key={pallet.id} className="bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200/60 dark:border-slate-800/60 p-4 rounded-2xl flex items-center justify-between group hover:border-slate-700 transition-all">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-10 h-10 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center text-slate-500 border border-slate-200 dark:border-slate-800 shrink-0">
                        <Package className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-black text-fuchsia-500 font-mono uppercase mb-0.5 pr-4 truncate">{pallet.originOP}</p>
                        <h5 className="text-[11px] font-bold text-slate-900 dark:text-white uppercase truncate pr-4">{pallet.description}</h5>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[8px] font-black text-slate-600 uppercase">Lote: {pallet.lot}</span>
                          <span className="text-[8px] font-black text-slate-600 uppercase">Vaga: {pallet.inspections?.[0]?.assignedSlot || 'N/A'}</span>
                          <span className="text-[8px] font-black text-slate-600 uppercase">Tipo: {pallet.is_group ? 'CONSOLIDADO' : (pallet.inspections?.[0]?.contentType ? translateSlotContent(pallet.inspections[0].contentType) : '-')}</span>
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => onRemovePallet(pallet.id)}
                      className="w-10 h-10 bg-white dark:bg-slate-900 hover:bg-red-500/10 text-slate-700 hover:text-red-500 border border-slate-200 dark:border-slate-800 hover:border-red-500/30 rounded-xl transition-all flex items-center justify-center shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            {onDelete && (
              <button 
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isProcessing}
                className="px-6 py-5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-slate-900 dark:hover:text-white border border-red-500/20 rounded-2xl transition-all shadow-xl shadow-red-900/10 flex items-center justify-center"
                title="Excluir Carregamento"
              >
                <Trash2 className="w-5 h-5 mx-auto" />
              </button>
            )}
            
            <button 
              onClick={handleGeneratePDF}
              className="flex-1 py-5 bg-blue-600 hover:bg-blue-500 text-slate-900 dark:text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-xl shadow-blue-900/40 transition-all flex items-center justify-center gap-3 active:scale-95"
            >
              <FileText className="w-5 h-5" /> PDF
            </button>
            <button 
              onClick={onClose}
              className="flex-1 py-5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-2xl font-black text-xs uppercase tracking-[0.3em] transition-all"
            >
              Fechar
            </button>
            <button 
              onClick={handleFinalize}
              disabled={isProcessing || linkedPallets.length === 0}
              className="flex-[2] py-5 bg-green-600 hover:bg-green-500 disabled:bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-xl shadow-green-900/40 transition-all flex items-center justify-center gap-3 active:scale-95"
            >
              {isProcessing ? (
                <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Processando</>
              ) : (
                <><CheckCircle2 className="w-5 h-5" /> Finalizar Carregamento</>
              )}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Modal para adicionar Pallet Extra diretamente a esta carga */}
      {isUncatalogedModalOpen && (
        <ManualPalletModal 
          isOpen={isUncatalogedModalOpen}
          onClose={() => setIsUncatalogedModalOpen(false)}
          shipmentContext={shipment}
          availableSlots={availableSlots}
          inventoryData={inventoryData}
          historyData={historyData}
          onSave={async (palletData) => {
            if (onAddUncatalogedPallet) {
              await onAddUncatalogedPallet(palletData);
            }
          }}
        />
      )}

      {/* Modal de Observações (OBS) */}
      <AnimatePresence>
        {isObsModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[260] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md"
            onClick={() => setIsObsModalOpen(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-[#0f1522] border border-slate-800 rounded-[2rem] p-7 max-w-lg w-full shadow-2xl space-y-5"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white italic">OBSERVAÇÕES DO CARREGAMENTO</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Carregamento #{shipment.id}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsObsModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-300 uppercase tracking-wider">
                  Texto da Observação (Impressa no PDF)
                </label>
                <textarea
                  rows={4}
                  value={obsValue}
                  onChange={e => setObsValue(e.target.value)}
                  placeholder="Ex: aqui vão ficar as obs dos carregamentos quando ouver..."
                  className="w-full bg-[#0B1120] border border-slate-800 rounded-xl p-4 text-white text-sm focus:border-amber-500 outline-none placeholder:text-slate-600 transition-colors custom-scrollbar"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsObsModalOpen(false)}
                  className="flex-1 py-3.5 rounded-xl font-black text-xs uppercase tracking-wider text-slate-400 hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveObs}
                  disabled={isSavingObs}
                  className="flex-1 py-3.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-900/30 transition-all flex items-center justify-center gap-2"
                >
                  {isSavingObs ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Salvar Observação
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
