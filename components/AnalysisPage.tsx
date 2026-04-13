
import React, { useState } from 'react';
import { SheetRow, StockStatus, WarehouseSlot, SlotContent, HistoryType, translateSlotContent } from '../types';

interface AnalysisPageProps {
  pendingItems: SheetRow[];
  availableSlots: WarehouseSlot[];
  onConfirm: (rowId: string, slotId: string, finalId: string) => Promise<void>;
  onReject: (rowId: string) => Promise<void>;
}

export const AnalysisPage: React.FC<AnalysisPageProps> = ({ pendingItems, availableSlots, onConfirm, onReject }) => {
  const [selectedItem, setSelectedItem] = useState<SheetRow | null>(null);
  const [slotId, setSlotId] = useState('');
  const [finalId, setFinalId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleStartAnalysis = (item: SheetRow) => {
    setSelectedItem(item);
    // Generate a final ID based on the same format as Movement page (6 chars uppercase)
    const generated = Math.random().toString(36).substring(2, 8).toUpperCase();
    setFinalId(generated);
    
    // Suggest slot based on type
    const contentType = item.inspections?.[0]?.contentType || SlotContent.SUPPLIES;
    let suggestedSlot: string | undefined;
    if (contentType === SlotContent.BOTTLES) {
      suggestedSlot = availableSlots.find(s => s.rack === 'A' && s.position <= 16)?.id;
    } else if (contentType === SlotContent.SUPPLIES) {
      suggestedSlot = availableSlots.find(s => (s.rack === 'B' || s.rack === 'C') && s.level >= 2 && s.position <= 16)?.id;
    } else if (contentType === SlotContent.FINISHED_PRODUCT) {
      suggestedSlot = availableSlots.find(s => (s.rack === 'B' || s.rack === 'C') && s.level === 1 && s.position <= 14)?.id;
    }
    setSlotId(suggestedSlot || (availableSlots.length > 0 ? availableSlots[0].id : ''));
  };

  const handleConfirm = async () => {
    if (!selectedItem || !slotId || !finalId) return;
    setIsProcessing(true);
    try {
      await onConfirm(selectedItem.id, slotId, finalId);
      setSelectedItem(null);
      setSlotId('');
      setFinalId('');
    } catch (error) {
      console.error('Analysis confirmation error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      {pendingItems.length === 0 ? (
        <div className="py-40 text-center border-2 border-dashed border-slate-900 rounded-[48px]">
          <div className="w-20 h-20 bg-slate-900 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-slate-800">
            <i className="fa-solid fa-clipboard-check text-3xl text-slate-700"></i>
          </div>
          <p className="text-slate-500 font-black uppercase text-xs tracking-[0.4em]">Nenhum pallet pendente de análise</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pendingItems.map(item => (
            <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-[32px] p-6 space-y-6 hover:border-blue-600/50 transition-all group">
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 bg-blue-600/10 text-blue-500 rounded-2xl flex items-center justify-center border border-blue-500/20">
                  <i className="fa-solid fa-box-open text-xl"></i>
                </div>
                <span className="bg-amber-600/10 text-amber-500 text-[8px] font-black px-3 py-1 rounded-full border border-amber-500/20 uppercase tracking-widest">Aguardando Análise</span>
              </div>
              
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">OP {item.originOP}</p>
                <h4 className="text-white font-black uppercase text-sm leading-tight line-clamp-3 min-h-[3rem]">{item.description}</h4>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/50">
                  <p className="text-[7px] text-slate-600 font-black uppercase mb-1">Lote</p>
                  <p className="text-xs font-black text-white font-mono">{item.lot}</p>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/50">
                  <p className="text-[7px] text-slate-600 font-black uppercase mb-1">Quantidade</p>
                  <p className="text-xs font-black text-white">{item.inspections?.[0]?.bottles || 0} un</p>
                </div>
              </div>

              <button 
                onClick={() => handleStartAnalysis(item)}
                className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-blue-900/20"
              >
                Analisar e Alocar
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Analysis Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/90 backdrop-blur-2xl p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-[48px] shadow-3xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-800/20">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl">
                  <i className="fa-solid fa-clipboard-check text-xl"></i>
                </div>
                <div>
                  <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Confirmar Entrada</h3>
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">Validação técnica e alocação</p>
                </div>
              </div>
              <button onClick={() => setSelectedItem(null)} className="text-slate-500 hover:text-white"><i className="fa-solid fa-times"></i></button>
            </div>

            <div className="p-8 space-y-8">
              <div className="space-y-4">
                <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800/50 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Produto</span>
                    <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">OP {selectedItem.originOP}</span>
                  </div>
                  <h4 className="text-lg text-white font-black uppercase leading-tight">{selectedItem.description}</h4>
                  <div className="flex gap-6 pt-2 border-t border-slate-800/50">
                    <div>
                      <p className="text-[8px] text-slate-600 font-black uppercase mb-1">Lote</p>
                      <p className="text-xs font-black text-white font-mono">{selectedItem.lot}</p>
                    </div>
                    <div>
                      <p className="text-[8px] text-slate-600 font-black uppercase mb-1">Tipo</p>
                      <p className="text-xs font-black text-white uppercase">{selectedItem.inspections?.[0] ? translateSlotContent(selectedItem.inspections[0].contentType) : '-'}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">ID Final do Produto</label>
                    <input 
                      type="text" 
                      value={finalId}
                      onChange={e => setFinalId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white font-bold focus:border-blue-600 outline-none transition-all font-mono uppercase"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Vaga de Alocação</label>
                    <select 
                      value={slotId}
                      onChange={e => setSlotId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white font-bold focus:border-blue-600 outline-none transition-all uppercase"
                    >
                      <option value="">Selecionar Vaga</option>
                      {availableSlots.map(s => (
                        <option key={s.id} value={s.id}>{s.id} ({s.rack})</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => onReject(selectedItem.id)}
                  className="flex-1 py-5 bg-slate-950 hover:bg-red-500/10 text-slate-500 hover:text-red-500 border border-slate-800 hover:border-red-500/30 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all"
                >
                  Rejeitar
                </button>
                <button 
                  onClick={handleConfirm}
                  disabled={isProcessing || !slotId || !finalId}
                  className="flex-[2] py-5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-blue-900/40 transition-all flex items-center justify-center gap-3"
                >
                  {isProcessing ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Processando...</>
                  ) : (
                    <><i className="fa-solid fa-check"></i> Confirmar Entrada</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
