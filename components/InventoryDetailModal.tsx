
import React from 'react';
import { SheetRow, InspectionData, SlotContent } from '../types';
import { 
  FlaskConical, 
  Truck, 
  Package, 
  X, 
  Info, 
  Box,
  RefreshCw,
  Container
} from 'lucide-react';

interface InventoryDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  row: SheetRow;
  inspection: InspectionData;
  palletIdx: number;
}

export const InventoryDetailModal: React.FC<InventoryDetailModalProps> = ({ isOpen, onClose, row, inspection, palletIdx }) => {
  if (!isOpen) return null;

  const isBottles = inspection.contentType === SlotContent.BOTTLES;
  const isFinished = inspection.contentType === SlotContent.FINISHED_PRODUCT;
  const isSupplies = inspection.contentType === SlotContent.SUPPLIES;
  const isUseConsumption = inspection.contentType === SlotContent.USE_CONSUMPTION;
  const isRework = inspection.contentType === SlotContent.REWORK;
  const isReprocess = inspection.contentType === SlotContent.REPROCESS;
  const isContainer = inspection.contentType === SlotContent.CONTAINER_SJ || 
                    inspection.contentType === SlotContent.CONTAINER_LP || 
                    inspection.contentType === SlotContent.CONTAINER_CP;

  const Icon = isBottles ? FlaskConical : isFinished ? Truck : (isRework || isReprocess) ? RefreshCw : isContainer ? Container : Package;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/90 backdrop-blur-2xl p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-[48px] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-500 my-auto">
        
        <div className="bg-slate-800/30 p-8 flex justify-between items-center border-b border-slate-800/50">
          <div className="flex items-center gap-4">
             <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transform -rotate-3 ${
                isBottles ? 'bg-blue-600 shadow-blue-900/40' : 
                isFinished ? 'bg-green-600 shadow-green-900/40' :
                inspection.contentType === SlotContent.CONTAINER_LP ? 'bg-slate-300 shadow-slate-900/40' :
                inspection.contentType === SlotContent.CONTAINER_SJ ? 'bg-orange-900 shadow-orange-900/40' :
                inspection.contentType === SlotContent.CONTAINER_CP ? 'bg-fuchsia-600 shadow-fuchsia-900/40' :
                isSupplies ? 'bg-indigo-600 shadow-indigo-900/40' :
                isUseConsumption ? 'bg-purple-600 shadow-purple-900/40' :
                (isRework || isReprocess) ? 'bg-purple-600 shadow-purple-900/40' :
                'bg-amber-600 shadow-amber-900/40'
             }`}>
                <Icon className="text-white w-6 h-6" />
             </div>
             <div>
                <h3 className="font-black text-xl italic uppercase tracking-tighter text-white">Detalhes do Item</h3>
             </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-slate-950/50 rounded-xl text-slate-500 hover:text-white transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 space-y-8">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800/50">
               <p className="text-[9px] text-slate-600 font-black uppercase mb-1">ID Técnico</p>
               <p className="text-sm font-black text-white font-mono">{row.loadingId}</p>
            </div>
            <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800/50">
               <p className="text-[9px] text-slate-600 font-black uppercase mb-1">Data de Entrada</p>
               <p className="text-sm font-black text-white font-mono">{row.date}</p>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest italic">Descrição do Produto</p>
            <h4 className="text-lg text-white font-black uppercase leading-tight tracking-tight">{row.description}</h4>
            {isSupplies && inspection.supplyDescription && (
              <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider bg-indigo-500/5 p-3 rounded-xl border border-indigo-500/10 flex items-center gap-2">
                <Info className="w-4 h-4" /> {inspection.supplyDescription}
              </p>
            )}
            <div className="flex gap-4">
               {row.originOP && (
                 <span className="bg-blue-600/10 text-blue-500 text-[10px] font-black px-3 py-1 rounded-lg border border-blue-500/20 uppercase tracking-widest">OP {row.originOP}</span>
               )}
               {row.lot && (
                 <span className="bg-amber-600/10 text-amber-500 text-[10px] font-black px-3 py-1 rounded-lg border border-amber-500/20 uppercase tracking-widest">Lote {row.lot}</span>
               )}
            </div>
          </div>

          {isSupplies && (
            <div className="bg-slate-800/20 p-6 rounded-[32px] border border-slate-800/40 space-y-6">
              <div className="flex justify-between items-center mb-0">
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Conferência Técnica</p>
                  <span className={`bg-slate-950 px-4 py-1.5 rounded-full text-[10px] font-black border border-slate-800 uppercase italic ${inspection.assignedSlot === 'AGUARDANDO' ? 'text-amber-500' : 'text-blue-400'}`}>
                    {inspection.assignedSlot === 'AGUARDANDO' ? 'Aguardando Vaga' : `Vaga ${inspection.assignedSlot}`}
                  </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div><p className="text-[8px] font-black text-slate-600 uppercase mb-2">Caixas</p><p className={`text-lg font-black ${inspection.boxes > 0 ? 'text-white' : 'text-slate-800'}`}>{inspection.boxes}</p></div>
                <div><p className="text-[8px] font-black text-slate-600 uppercase mb-2">Frascos</p><p className={`text-lg font-black ${inspection.bottles > 0 ? 'text-white' : 'text-slate-800'}`}>{inspection.bottles}</p></div>
                <div><p className="text-[8px] font-black text-slate-600 uppercase mb-2">Berços</p><p className={`text-lg font-black ${inspection.cradles > 0 ? 'text-white' : 'text-slate-800'}`}>{inspection.cradles}</p></div>
                <div><p className="text-[8px] font-black text-slate-600 uppercase mb-2">Tampas</p><p className={`text-lg font-black ${inspection.caps > 0 ? 'text-white' : 'text-slate-800'}`}>{inspection.caps}</p></div>
              </div>

              {inspection.others && inspection.others.length > 0 && (
                <div className="pt-6 border-t border-slate-800/50 space-y-3">
                  <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest text-center">Outros Itens</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {inspection.others.map((other, idx) => (
                      <div key={idx} className="bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 flex items-center gap-2">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-tight">{other.name}</span>
                        <div className="w-px h-3 bg-slate-800"></div>
                        <span className="text-[10px] font-black text-indigo-400 italic">{other.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {!isSupplies && (
            <div className="bg-slate-800/20 p-6 rounded-[32px] border border-slate-800/40 space-y-4">
               <div className="flex justify-between items-center">
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Localização</p>
                  <span className={`bg-slate-950 px-6 py-2.5 rounded-full text-xs font-black border border-slate-800 uppercase italic tracking-widest ${inspection.assignedSlot === 'AGUARDANDO' ? 'text-amber-500' : 'text-blue-400'}`}>
                    {inspection.assignedSlot === 'AGUARDANDO' ? 'Aguardando Vaga' : `Vaga ${inspection.assignedSlot}`}
                  </span>
               </div>
               {inspection.contentType !== SlotContent.CONTAINER_SJ && inspection.contentType !== SlotContent.CONTAINER_LP && (
                 <div className="flex justify-between items-center pt-4 border-t border-slate-800/50">
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Quantidade Total</p>
                    <span className="text-lg font-black text-green-400 font-mono">{row.pallets}</span>
                 </div>
               )}
            </div>
          )}

          <button onClick={onClose} className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-xl shadow-blue-900/40 transition-all active:scale-95">Fechar Detalhes</button>
        </div>
      </div>
    </div>
  );
};
