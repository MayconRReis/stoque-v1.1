
import React, { useState } from 'react';
import { SheetRow, WarehouseSlot, SlotContent, translateSlotContent } from '../types';
import { ClipboardCheck, Box, Check, X, AlertCircle, Info, FlaskConical, Truck, RefreshCw, Container } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AnalysisPageProps {
  pendingItems: SheetRow[];
  availableSlots: WarehouseSlot[];
  allSlots: WarehouseSlot[];
  onConfirm: (rowId: string, slotId: string, finalId: string) => Promise<void>;
  onReject: (rowId: string) => Promise<void>;
  onEdit: (item: SheetRow) => void;
}

export const AnalysisPage: React.FC<AnalysisPageProps> = ({ pendingItems, availableSlots, allSlots, onConfirm, onReject, onEdit }) => {
  const [selectedItem, setSelectedItem] = useState<SheetRow | null>(null);
  const [slotId, setSlotId] = useState('');
  const [finalId, setFinalId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const shareableSlotTypes = [
    SlotContent.RETURN,
    SlotContent.REWORK,
    SlotContent.REPROCESS,
    SlotContent.USE_CONSUMPTION,
    SlotContent.MISCELLANEOUS
  ];

  const computedAvailableSlots = React.useMemo(() => {
    const currentContentType = selectedItem?.inspections?.[0]?.contentType || SlotContent.SUPPLIES;
    
    return allSlots.filter(s => {
      if (s.status === SlotContent.EMPTY) return true;
      
      // If the current slot is occupied by a shareable type AND the item we are entering is shareable
      if (shareableSlotTypes.includes(currentContentType) && shareableSlotTypes.includes(s.status)) {
        return true;
      }
      
      return false;
    });
  }, [allSlots, selectedItem]);

  const sortedAvailableSlots = React.useMemo(() => {
    return [...computedAvailableSlots].sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
  }, [computedAvailableSlots]);

  const handleStartAnalysis = (item: SheetRow) => {
    setSelectedItem(item);
    const generated = Math.random().toString(36).substring(2, 8).toUpperCase();
    setFinalId(generated);
    
    const itemContentType = item.inspections?.[0]?.contentType || SlotContent.SUPPLIES;
    let suggestedSlot: string | undefined;
    if (itemContentType === SlotContent.BOTTLES) {
      suggestedSlot = computedAvailableSlots.find(s => s.rack === 'A' && s.position <= 16)?.id;
    } else if (itemContentType === SlotContent.SUPPLIES) {
      suggestedSlot = computedAvailableSlots.find(s => (s.rack === 'B' || s.rack === 'C') && s.level >= 2 && s.position <= 16)?.id;
    } else if (itemContentType === SlotContent.FINISHED_PRODUCT) {
      suggestedSlot = computedAvailableSlots.find(s => (s.rack === 'B' || s.rack === 'C') && s.level === 1 && s.position <= 14)?.id;
    } else if (itemContentType === SlotContent.CONTAINER_SJ || itemContentType === SlotContent.CONTAINER_LP || itemContentType === SlotContent.CONTAINER_CP) {
      // Disabled by user request: "remover função de substituição de vaga automática dos containers"
      suggestedSlot = undefined;
    }
    setSlotId(suggestedSlot || (computedAvailableSlots.length > 0 ? computedAvailableSlots[0].id : ''));
  };

  const handleConfirm = async () => {
    if (!selectedItem || !slotId || !finalId) return;
    setIsProcessing(true);
    try {
      await onConfirm(selectedItem.id, slotId, finalId.toUpperCase());
      setSelectedItem(null);
      setSlotId('');
      setFinalId('');
    } catch (error) {
      console.error('Analysis confirmation error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedItem) return;
    setIsProcessing(true);
    try {
      await onReject(selectedItem.id);
      setSelectedItem(null);
      setSlotId('');
      setFinalId('');
    } catch (error) {
      console.error('Analysis rejection error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
      {pendingItems.length === 0 ? (
        <div className="py-32 text-center border-2 border-dashed border-slate-900 rounded-[2.5rem]">
          <div className="w-16 h-16 bg-slate-900/50 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-slate-800">
            <ClipboardCheck className="w-8 h-8 text-slate-700" />
          </div>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em]">Nenhum pallet pendente de análise</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {pendingItems.map(item => {
            const insp = item.inspections?.[0];
            const isRework = insp?.contentType === SlotContent.REWORK;
            const isReprocess = insp?.contentType === SlotContent.REPROCESS;
            const isContainer = insp?.contentType === SlotContent.CONTAINER_SJ || 
                              insp?.contentType === SlotContent.CONTAINER_LP || 
                              insp?.contentType === SlotContent.CONTAINER_CP;
            const ContentIcon = insp?.contentType === SlotContent.BOTTLES ? FlaskConical : 
                               insp?.contentType === SlotContent.FINISHED_PRODUCT ? Truck : 
                               (isRework || isReprocess) ? RefreshCw :
                               isContainer ? Container :
                               Box;
            
            const containerColor = 
              insp?.contentType === SlotContent.CONTAINER_LP ? 'text-slate-100' :
              insp?.contentType === SlotContent.CONTAINER_SJ ? 'text-orange-900' : // Brown
              insp?.contentType === SlotContent.CONTAINER_CP ? 'text-fuchsia-500' : 
              'text-slate-100';

            return (
              <motion.div 
                layout
                key={item.id} 
                className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-[2rem] p-6 space-y-5 hover:border-blue-600/30 transition-all group relative overflow-hidden"
              >
                <div className="flex justify-between items-start">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                    insp?.contentType === SlotContent.BOTTLES ? 'bg-blue-600/10 text-blue-500 border-blue-500/20' : 
                    insp?.contentType === SlotContent.FINISHED_PRODUCT ? 'bg-green-600/10 text-green-500 border-green-500/20' : 
                    isContainer ? 'bg-slate-300/10 border-slate-100/20' :
                    'bg-amber-600/10 text-amber-500 border-amber-500/20'
                  }`}>
                    <ContentIcon className={`w-5 h-5 ${isContainer ? containerColor : ''}`} />
                  </div>
                  <span className="bg-amber-500/10 text-amber-500 text-[8px] font-black px-2.5 py-1 rounded-lg border border-amber-500/20 uppercase tracking-widest">Pendente</span>
                </div>
              
              <div>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">OP {item.originOP}</p>
                <h4 className="text-white font-bold uppercase text-xs leading-tight line-clamp-2 min-h-[2.5rem]">{item.description}</h4>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/50">
                  <p className="text-[7px] text-slate-600 font-bold uppercase mb-0.5">Lote</p>
                  <p className="text-[10px] font-black text-white font-mono">{item.lot}</p>
                </div>
                {item.pallets > 0 && 
                 insp?.contentType !== SlotContent.CONTAINER_SJ && 
                 insp?.contentType !== SlotContent.CONTAINER_LP && (
                  <div className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/50">
                    <p className="text-[7px] text-slate-600 font-bold uppercase mb-0.5">Qtd</p>
                    <p className="text-[10px] font-black text-white">{item.pallets}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => onEdit(item)}
                  className="flex-1 py-3 bg-slate-950 hover:bg-slate-800 text-slate-400 font-bold text-[10px] uppercase tracking-widest border border-slate-800 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <Info className="w-3.5 h-3.5" /> Editar
                </button>
                <button 
                  onClick={() => handleStartAnalysis(item)}
                  className="flex-[2] py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2"
                >
                  <ClipboardCheck className="w-3.5 h-3.5" /> Analisar
                </button>
              </div>
            </motion.div>
          )})}
        </div>
      )}

      {/* Analysis Modal */}
      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/90 backdrop-blur-xl p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-3xl w-full max-w-lg overflow-hidden"
            >
              <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-xl">
                    <ClipboardCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white uppercase italic tracking-tight">Confirmar Entrada</h3>
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Validação técnica e alocação</p>
                  </div>
                </div>
                <button onClick={() => setSelectedItem(null)} className="w-8 h-8 rounded-lg bg-slate-950 text-slate-500 hover:text-white flex items-center justify-center border border-slate-800 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="bg-slate-950/50 p-5 rounded-2xl border border-slate-800/50 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Produto</span>
                    <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">OP {selectedItem.originOP}</span>
                  </div>
                  <h4 className="text-sm text-white font-bold uppercase leading-tight">{selectedItem.description}</h4>
                  <div className="flex gap-4 pt-3 border-t border-slate-800/50">
                    <div>
                      <p className="text-[7px] text-slate-600 font-bold uppercase mb-0.5">Lote</p>
                      <p className="text-[10px] font-black text-white font-mono">{selectedItem.lot}</p>
                    </div>
                    <div>
                      <p className="text-[7px] text-slate-600 font-bold uppercase mb-0.5">Tipo</p>
                      <p className="text-[10px] font-black text-white uppercase">{selectedItem.inspections?.[0] ? translateSlotContent(selectedItem.inspections[0].contentType) : '-'}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest ml-1">ID Final</label>
                    <input 
                      type="text" 
                      value={finalId}
                      onChange={e => setFinalId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-bold text-sm focus:border-blue-600 outline-none transition-all font-mono uppercase"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest ml-1">Vaga</label>
                    <select 
                      value={slotId}
                      onChange={e => setSlotId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-bold text-sm focus:border-blue-600 outline-none transition-all uppercase"
                    >
                      <option value="">Selecionar</option>
                      <option value="AGUARDANDO" className="text-amber-500 font-bold">Aguardando Vaga</option>
                      {sortedAvailableSlots.map(s => (
                        <option key={s.id} value={s.id}>{s.id} ({s.rack})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={handleReject}
                    disabled={isProcessing}
                    className="flex-1 py-3 bg-slate-950 hover:bg-red-500/10 text-slate-500 hover:text-red-500 border border-slate-800 hover:border-red-500/30 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <div className="w-3 h-3 border-2 border-slate-500 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <X className="w-3.5 h-3.5" />
                    )} 
                    Rejeitar
                  </button>
                  <button 
                    onClick={handleConfirm}
                    disabled={isProcessing || !slotId || !finalId}
                    className="flex-[2] py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Processando</>
                    ) : (
                      <><Check className="w-3.5 h-3.5" /> Confirmar</>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
