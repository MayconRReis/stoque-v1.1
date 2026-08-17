
import React, { useState } from 'react';
import { SheetRow, WarehouseSlot, SlotContent, translateSlotContent } from '../types';
import { ClipboardCheck, Box, Check, X, AlertCircle, Info, FlaskConical, Truck, RefreshCw, Container, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatOP } from '../lib/formatters';
import { ImportPage } from './ImportPage';

interface AnalysisPageProps {
  pendingItems: SheetRow[];
  availableSlots: WarehouseSlot[];
  allSlots: WarehouseSlot[];
  onConfirm: (rowId: string, slotId: string, finalId: string, updatedFields?: any, updatedInspection?: any) => Promise<void>;
  onReject: (rowId: string) => Promise<void>;
  onImport?: (entries: { row: SheetRow, slotId: string }[]) => Promise<void>;
}

export const AnalysisPage: React.FC<AnalysisPageProps> = ({ pendingItems, availableSlots, allSlots, onConfirm, onReject, onImport }) => {
  const [selectedItem, setSelectedItem] = useState<SheetRow | null>(null);
  const [slotId, setSlotId] = useState('');
  const [finalId, setFinalId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const [description, setDescription] = useState('');
  const [op, setOp] = useState('');
  const [lot, setLot] = useState('');
  const [contentType, setContentType] = useState<SlotContent>(SlotContent.SUPPLIES);
  const [bottles, setBottles] = useState(0);
  const [caps, setCaps] = useState(0);
  const [boxes, setBoxes] = useState(0);
  const [cradles, setCradles] = useState(0);
  const [withoutSeal, setWithoutSeal] = useState(false);
  const [others, setOthers] = useState<{ id: string; name: string; quantity: number }[]>([]);

  const addOther = () => {
    setOthers([...others, { id: Math.random().toString(), name: '', quantity: 0 }]);
  };

  const removeOther = (id: string) => {
    setOthers(others.filter(o => o.id !== id));
  };

  const updateOther = (id: string, field: 'name' | 'quantity', value: any) => {
    setOthers(others.map(o => o.id === id ? { ...o, [field]: value } : o));
  };

  const shareableSlotTypes = [
    SlotContent.RETURN,
    SlotContent.REWORK,
    SlotContent.REPROCESS,
    SlotContent.USE_CONSUMPTION,
    SlotContent.MISCELLANEOUS
  ];

  const computedAvailableSlots = React.useMemo(() => {
    return availableSlots;
  }, [availableSlots]);

  const sortedAvailableSlots = React.useMemo(() => {
    return [...computedAvailableSlots].sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
  }, [computedAvailableSlots]);

  const handleStartAnalysis = (item: SheetRow) => {
    setSelectedItem(item);
    const generated = Math.random().toString(36).substring(2, 8).toUpperCase();
    setFinalId(generated);

    setDescription(item.description || '');
    setOp(item.originOP || '');
    setLot(item.lot || '');
    
    const itemContentType = item.inspections?.[0]?.contentType || SlotContent.SUPPLIES;
    setContentType(itemContentType);
    setBottles(item.inspections?.[0]?.bottles || 0);
    setCaps(item.inspections?.[0]?.caps || 0);
    setBoxes(item.inspections?.[0]?.boxes || 0);
    setCradles(item.inspections?.[0]?.cradles || 0);
    setWithoutSeal(item.inspections?.[0]?.withoutSeal || false);
    if (item.inspections?.[0]?.others) {
      setOthers(item.inspections[0].others.map(o => ({ ...o, id: Math.random().toString() })));
    } else {
      setOthers([]);
    }
    
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
      await onConfirm(
        selectedItem.id, 
        slotId, 
        finalId.toUpperCase(),
        {
          description: description.toUpperCase(),
          originOP: formatOP(op),
          lot: lot.toUpperCase()
        },
        {
          contentType,
          bottles,
          caps,
          boxes,
          cradles,
          withoutSeal,
          others: others.map(o => ({ name: o.name.toUpperCase(), quantity: o.quantity }))
        }
      );
      setSelectedItem(null);
      setSlotId('');
      setFinalId('');
      setDescription('');
      setOp('');
      setLot('');
      setContentType(SlotContent.SUPPLIES);
      setBottles(0);
      setCaps(0);
      setBoxes(0);
      setCradles(0);
      setWithoutSeal(false);
      setOthers([]);
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
      {onImport && (
        <div className="mb-12">
          <ImportPage availableSlots={availableSlots} onProcess={onImport} />
        </div>
      )}

      {pendingItems.length === 0 ? (
        <div className="py-32 text-center border-2 border-dashed border-slate-300 dark:border-slate-900 rounded-[2.5rem]">
          <div className="w-16 h-16 bg-slate-100/50 dark:bg-slate-900/50 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-slate-200 dark:border-slate-800">
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
                className="bg-slate-100/40 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 space-y-5 hover:border-blue-600/30 transition-all group relative overflow-hidden"
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
                <h4 className="text-slate-900 dark:text-white font-bold uppercase text-xs leading-tight line-clamp-2 min-h-[2.5rem]">{item.description}</h4>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-50/50 dark:bg-slate-950/50 p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-800/50">
                  <p className="text-[7px] text-slate-600 font-bold uppercase mb-0.5">Lote</p>
                  <p className="text-[10px] font-black text-slate-900 dark:text-white font-mono">{item.lot}</p>
                </div>
                {item.pallets > 0 && 
                 insp?.contentType !== SlotContent.CONTAINER_SJ && 
                 insp?.contentType !== SlotContent.CONTAINER_LP && (
                  <div className="bg-slate-50/50 dark:bg-slate-950/50 p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-800/50">
                    <p className="text-[7px] text-slate-600 font-bold uppercase mb-0.5">Qtd</p>
                    <p className="text-[10px] font-black text-slate-900 dark:text-white">{item.pallets}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => handleStartAnalysis(item)}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-slate-900 dark:text-white rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2"
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
          <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-xl p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-3xl w-full max-w-lg overflow-hidden"
            >
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-200/20 dark:bg-slate-800/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-slate-900 dark:text-white shadow-xl">
                    <ClipboardCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase italic tracking-tight">Confirmar Entrada</h3>
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Validação técnica e alocação</p>
                  </div>
                </div>
                <button onClick={() => setSelectedItem(null)} className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-950 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center border border-slate-200 dark:border-slate-800 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest ml-1">OP Origem</label>
                    <input 
                      type="text" 
                      value={op}
                      onChange={e => setOp(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white font-bold text-lg focus:border-blue-600 outline-none transition-all uppercase"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest ml-1">Lote</label>
                    <input 
                      type="text" 
                      value={lot}
                      onChange={e => setLot(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white font-bold text-lg focus:border-blue-600 outline-none transition-all uppercase"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest ml-1">Produto / Descrição</label>
                  <input 
                    type="text" 
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white font-bold text-lg focus:border-blue-600 outline-none transition-all uppercase"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest ml-1">Tipo</label>
                    <select 
                      value={contentType}
                      onChange={e => setContentType(e.target.value as SlotContent)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white font-bold text-sm focus:border-blue-600 outline-none transition-all"
                    >
                      {Object.values(SlotContent).map(type => (
                        <option key={type} value={type}>{translateSlotContent(type)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest ml-1">Vaga</label>
                    <select 
                      value={slotId}
                      onChange={e => setSlotId(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white font-bold text-lg focus:border-blue-600 outline-none transition-all uppercase"
                    >
                      <option value="">Selecionar</option>
                      <option value="AGUARDANDO" className="text-amber-500 font-bold">Aguardando Vaga</option>
                      {sortedAvailableSlots.map(s => (
                        <option key={s.id} value={s.id}>{s.id}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setWithoutSeal(!withoutSeal)}
                      className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border font-bold text-xs uppercase tracking-widest transition-all ${
                        withoutSeal 
                          ? 'bg-red-50 dark:bg-red-500/10 border-red-500 text-red-600 dark:text-red-500' 
                          : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-red-300 dark:hover:border-red-900'
                      }`}
                    >
                      <ShieldAlert className="w-4 h-4" />
                      Marcar Sem Selo
                    </button>
                  </div>
                </div>

                {(contentType === SlotContent.SUPPLIES || contentType === SlotContent.BOTTLES) && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/50 dark:bg-slate-950/50 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/50">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest ml-1">Frascos</label>
                        <input 
                          type="number" min="0" value={bottles} onChange={e => setBottles(parseInt(e.target.value) || 0)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-bold text-sm focus:border-blue-600 outline-none"
                        />
                      </div>
                      {contentType === SlotContent.SUPPLIES && (
                        <>
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest ml-1">Tampas</label>
                            <input 
                              type="number" min="0" value={caps} onChange={e => setCaps(parseInt(e.target.value) || 0)}
                              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-bold text-sm focus:border-blue-600 outline-none"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest ml-1">Caixas</label>
                            <input 
                              type="number" min="0" value={boxes} onChange={e => setBoxes(parseInt(e.target.value) || 0)}
                              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-bold text-sm focus:border-blue-600 outline-none"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest ml-1">Berços</label>
                            <input 
                              type="number" min="0" value={cradles} onChange={e => setCradles(parseInt(e.target.value) || 0)}
                              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-bold text-sm focus:border-blue-600 outline-none"
                            />
                          </div>
                        </>
                      )}
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-[9px] font-bold text-slate-600 uppercase tracking-widest ml-1">Outros Itens</label>
                        <button 
                          onClick={addOther}
                          className="text-[8px] font-bold text-blue-500 uppercase tracking-widest bg-blue-500/10 px-2 py-1 rounded-lg border border-blue-500/20 hover:bg-blue-500/20 transition-all"
                        >
                          + Adicionar Outro
                        </button>
                      </div>

                      {others.map((other) => (
                        <div key={other.id} className="flex gap-3 items-end">
                          <div className="flex-1 space-y-1.5">
                            <label className="text-[7px] font-bold text-slate-700 uppercase tracking-widest ml-1">Item</label>
                            <input 
                              type="text" 
                              value={other.name}
                              onChange={e => updateOther(other.id, 'name', e.target.value)}
                              placeholder="Nome do item..."
                              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-bold text-[10px] focus:border-blue-600 outline-none uppercase"
                            />
                          </div>
                          <div className="w-24 space-y-1.5">
                            <label className="text-[7px] font-bold text-slate-700 uppercase tracking-widest ml-1">Qtd</label>
                            <input 
                              type="number" min="0"
                              value={other.quantity || ''}
                              onChange={e => updateOther(other.id, 'quantity', parseInt(e.target.value) || 0)}
                              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-bold text-[10px] focus:border-blue-600 outline-none text-center"
                            />
                          </div>
                          <button 
                            onClick={() => removeOther(other.id)}
                            className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-500 hover:text-red-400 border border-slate-200 dark:border-slate-800 hover:border-red-900/50 hover:bg-red-950/30 transition-all mb-[1px]"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-1 gap-4 pt-4 border-t border-slate-200/50 dark:border-slate-800/50">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest ml-1">ID Final</label>
                    <input 
                      type="text" 
                      value={finalId}
                      onChange={e => setFinalId(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white font-bold text-sm focus:border-blue-600 outline-none transition-all font-mono uppercase"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={handleReject}
                    disabled={isProcessing}
                    className="flex-1 py-3 bg-slate-50 dark:bg-slate-950 hover:bg-red-500/10 text-slate-500 hover:text-red-500 border border-slate-200 dark:border-slate-800 hover:border-red-500/30 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2"
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
                    className="flex-[2] py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-2"
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
