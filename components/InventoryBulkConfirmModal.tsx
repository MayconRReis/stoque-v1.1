
import React from 'react';
import { SheetRow, InspectionData, SlotContent } from '../types';
import { 
  FlaskConical, 
  Truck, 
  Package, 
  X, 
  Trash2, 
  Layers, 
  Boxes,
  Send,
  Container,
  RefreshCw
} from 'lucide-react';

interface InventoryBulkConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onRemovePallet: (key: string) => void;
  selectedPallets: { row: SheetRow, inspection: InspectionData, idx: number, selectionKey: string }[];
}

export const InventoryBulkConfirmModal: React.FC<InventoryBulkConfirmModalProps> = ({ isOpen, onClose, onConfirm, onRemovePallet, selectedPallets }) => {
  if (!isOpen) return null;

  const totalItems = selectedPallets.length;
  const totalUnits = selectedPallets.reduce((acc, curr) => acc + curr.inspection.bottles, 0);

  const getTypeName = (type: SlotContent) => {
    switch (type) {
      case SlotContent.BOTTLES: return 'Frasco';
      case SlotContent.SUPPLIES: return 'Insumo';
      case SlotContent.FINISHED_PRODUCT: return 'Acabado';
      default: return 'Geral';
    }
  };

  const getTypeIcon = (type: SlotContent) => {
    const isContainer = type === SlotContent.CONTAINER_SJ || 
                      type === SlotContent.CONTAINER_LP || 
                      type === SlotContent.CONTAINER_CP;
    const isRework = type === SlotContent.REWORK || type === SlotContent.REPROCESS;
    
    switch (type) {
      case SlotContent.BOTTLES: return FlaskConical;
      case SlotContent.SUPPLIES: return Package;
      case SlotContent.FINISHED_PRODUCT: return Truck;
      default: 
        if (isContainer) return Container;
        if (isRework) return RefreshCw;
        return Package;
    }
  };

  const getTypeColor = (type: SlotContent) => {
    const isContainer = type === SlotContent.CONTAINER_SJ || 
                      type === SlotContent.CONTAINER_LP || 
                      type === SlotContent.CONTAINER_CP;
    const isRework = type === SlotContent.REWORK || type === SlotContent.REPROCESS;

    switch (type) {
      case SlotContent.BOTTLES: return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      case SlotContent.SUPPLIES: return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      case SlotContent.FINISHED_PRODUCT: return 'text-green-500 bg-green-500/10 border-green-500/20';
      default: 
        if (isContainer) return 'text-slate-100 bg-slate-300/10 border-slate-100/20';
        if (isRework) return 'text-purple-500 bg-purple-600/10 border-purple-500/20';
        return 'text-slate-500 bg-slate-500/10 border-slate-500/20';
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/90 backdrop-blur-2xl p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-[48px] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-500 my-auto">
        
        <div className="bg-slate-800/30 p-8 flex justify-between items-center border-b border-slate-800/50">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-900/40 transform -rotate-3 shrink-0">
                <Truck className="text-white w-6 h-6" />
             </div>
             <div>
                <h3 className="font-black text-2xl italic uppercase tracking-tighter text-white">Revisão de Saída</h3>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">{totalItems} Pallets na Fila</p>
             </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-slate-950/50 rounded-xl text-slate-500 hover:text-white transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 space-y-8">
          <div className="max-h-[45vh] overflow-y-auto space-y-3 pr-2 custom-scrollbar p-1">
            {selectedPallets.length === 0 ? (
               <div className="py-20 text-center border-2 border-dashed border-slate-800 rounded-[32px] bg-slate-900/40">
                 <Layers className="text-slate-800 w-12 h-12 mx-auto mb-4" />
                 <p className="text-slate-600 font-black uppercase text-[10px] tracking-widest">A lista de revisão está vazia</p>
               </div>
            ) : (
              selectedPallets.map(({ row, inspection, idx, selectionKey }) => {
                const Icon = getTypeIcon(inspection.contentType);
                return (
                  <div key={selectionKey} className="bg-slate-950/50 border border-slate-800/60 p-5 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:border-purple-500/40 transition-all duration-300">
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl border shrink-0 ${getTypeColor(inspection.contentType)} shadow-inner`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h5 className="text-[12px] font-black text-white uppercase truncate mb-1.5 pr-4">{row.description}</h5>
                        <div className="flex flex-wrap items-center gap-y-2 gap-x-4">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-black text-slate-600 uppercase">OP</span>
                            <span className="text-[11px] font-mono font-black text-purple-400">{row.originOP}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-black text-slate-600 uppercase">VAGA</span>
                            <span className="text-[11px] font-black text-white bg-slate-900 px-2 py-0.5 rounded border border-slate-800 italic">{inspection.assignedSlot}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-black text-slate-600 uppercase">TIPO</span>
                            <span className={`text-[9px] font-black uppercase tracking-tight px-2 py-0.5 rounded-md ${getTypeColor(inspection.contentType)}`}>{getTypeName(inspection.contentType)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between sm:justify-end gap-5 shrink-0 border-t sm:border-t-0 pt-4 sm:pt-0 border-slate-800/50">
                      <div className="text-right">
                         <p className="text-[9px] font-black text-slate-600 uppercase leading-none mb-1 text-center">Pallet</p>
                         <p className="text-xs font-black text-white px-3 py-1 rounded-lg bg-slate-900 border border-slate-800">P{idx + 1}</p>
                      </div>
                      <button 
                        onClick={() => onRemovePallet(selectionKey)}
                        className="w-12 h-12 bg-slate-900 hover:bg-red-500/10 text-slate-600 hover:text-red-500 border border-slate-800 hover:border-red-600/50 rounded-2xl transition-all flex items-center justify-center group/btn shadow-xl"
                        title="Remover este item da revisão"
                      >
                        <Trash2 className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="bg-slate-950 p-6 rounded-[32px] border border-slate-800/50 grid grid-cols-2 gap-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <Boxes className="w-16 h-16 text-white" />
            </div>
            <div className="space-y-1">
              <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest">Itens Pendentes</p>
              <p className="text-3xl font-black text-white italic">{totalItems}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest">Quantidade Total</p>
              <p className="text-3xl font-black text-purple-500 italic">{totalUnits.toLocaleString('pt-BR')}</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button 
              onClick={onClose}
              className="flex-1 py-5 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-[0.3em] transition-all"
            >
              Cancelar
            </button>
            <button 
              onClick={onConfirm}
              disabled={selectedPallets.length === 0}
              className="flex-[2] py-5 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-xl shadow-purple-900/40 transition-all flex items-center justify-center gap-3 active:scale-95"
            >
              Confirmar Envio <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
