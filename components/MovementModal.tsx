import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, LogIn, LogOut, ArrowRightLeft, 
  Package, Hash, MapPin, 
  Search, AlertCircle, Check, Info, FileText, Plus
} from 'lucide-react';
import { WarehouseSlot, SlotContent, SheetRow, HistoryEntry } from '../types';
import { formatOP } from '../lib/formatters';

interface MovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTransfer?: (data: any) => Promise<void>;
  onExit?: (data: any) => Promise<void>;
  availableSlots: WarehouseSlot[];
  inventoryData: SheetRow[];
  initialType?: 'transfer' | 'exit';
  initialId?: string;
  initialPallet?: SheetRow | null;
}

export const MovementModal: React.FC<MovementModalProps> = ({
  isOpen, onClose, onTransfer, onExit,
  availableSlots, inventoryData,
  initialType, initialId, initialPallet
}) => {
  const [type, setType] = useState<'transfer' | 'exit'>(initialType || 'transfer');
  const [isProcessing, setIsProcessing] = useState(false);

  // Search states for transfer/exit
  const [searchId, setSearchId] = useState('');
  const [foundPallet, setFoundPallet] = useState<SheetRow | null>(null);
  const [exitReason, setExitReason] = useState('');
  const [targetSlot, setTargetSlot] = useState('');

  useEffect(() => {
    if (isOpen) {
      setType(initialType || 'transfer');
      if (initialType === 'transfer' || initialType === 'exit') {
        if (initialId) setSearchId(initialId);
        if (initialPallet) {
          setFoundPallet(initialPallet);
          setSearchId(initialPallet.loadingId || initialPallet.id);
        }
      }
    }
  }, [isOpen, initialType, initialId, initialPallet]);

  useEffect(() => {
    if ((type === 'transfer' || type === 'exit') && searchId.length >= 3 && !initialPallet) {
      const term = searchId.toUpperCase();
      const found = inventoryData.find(p => 
        (p.loadingId && p.loadingId.includes(term)) || 
        (p.id && p.id.includes(term)) ||
        p.originOP?.includes(term)
      );
      setFoundPallet(found || null);
    } else if (searchId.length < 3 && !initialPallet) {
      setFoundPallet(null);
    }
  }, [searchId, type, inventoryData, initialPallet]);

  const handleSubmit = async () => {
    setIsProcessing(true);
    try {
      if (type === 'transfer' && onTransfer && foundPallet) {
        await onTransfer({
          pallet: foundPallet,
          id: foundPallet.loadingId || foundPallet.id,
          fromSlot: foundPallet.inspections?.[0]?.assignedSlot,
          toSlot: targetSlot || 'AGUARDANDO'
        });
      } else if (type === 'exit' && onExit && foundPallet) {
        await onExit({
          pallet: foundPallet,
          id: foundPallet.loadingId || foundPallet.id,
          reason: exitReason
        });
      }
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-2xl bg-white dark:bg-slate-950 rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800">
          <button onClick={() => setType('transfer')} className={`flex-1 p-5 flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest transition-all ${type === 'transfer' ? 'bg-amber-600/10 text-amber-600 border-b-2 border-amber-600' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900'}`}>
            <ArrowRightLeft className="w-4 h-4" /> Transferência
          </button>
          <button onClick={() => setType('exit')} className={`flex-1 p-5 flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest transition-all ${type === 'exit' ? 'bg-red-600/10 text-red-600 border-b-2 border-red-600' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900'}`}>
            <LogOut className="w-4 h-4" /> Saída
          </button>
          <button onClick={onClose} className="px-6 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors border-l border-slate-200 dark:border-slate-800">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto">
          <AnimatePresence mode="wait">
            
            {/* TRANSFER TAB */}
            {type === 'transfer' && (
              <motion.div key="transfer" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-amber-500 uppercase tracking-widest ml-1">Buscar Pallet</label>
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input type="text" value={searchId} onChange={e => setSearchId(e.target.value.toUpperCase())} placeholder="ID, OP ou Lote do pallet..." className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-11 py-4 text-slate-900 dark:text-white font-bold focus:border-amber-500 outline-none" />
                  </div>
                </div>

                {foundPallet && (
                  <div className="p-5 bg-amber-600/10 border border-amber-500/20 rounded-[2rem] space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest">Pallet Selecionado</p>
                        <h4 className="text-slate-900 dark:text-white font-black text-lg">{foundPallet.description}</h4>
                        <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">OP: {foundPallet.originOP} | LOTE: {foundPallet.lot}</p>
                      </div>
                      <div className="text-right">
                        <span className="inline-block px-3 py-1 bg-white dark:bg-slate-800 rounded-lg text-[9px] font-black text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-sm">
                          VAGA ATUAL: {foundPallet.inspections?.[0]?.assignedSlot || 'AGUARDANDO'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t border-amber-500/20">
                      <label className="text-[9px] font-black text-amber-500 uppercase tracking-widest ml-1 mb-2 block">Vaga de Destino</label>
                      <select value={targetSlot} onChange={e => setTargetSlot(e.target.value)} className="w-full bg-[#0B1120] border border-slate-800 rounded-xl px-4 py-3 text-white font-bold text-lg focus:border-amber-500 outline-none appearance-none">
                        <option value="" className="bg-blue-300 text-slate-900 font-bold uppercase tracking-widest text-lg">SELECIONAR</option>
                        <option value="AGUARDANDO" className="text-amber-500 font-bold bg-[#0B1120] text-lg">AGUARDANDO VAGA</option>
                        {availableSlots.map(s => (
                          <option key={s.id} value={s.id} className="text-slate-200 bg-[#0B1120] text-lg">{s.id}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
                
                <button 
                  onClick={handleSubmit} 
                  disabled={isProcessing || !foundPallet || !targetSlot} 
                  className="w-full py-5 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.25em] transition-all shadow-xl shadow-amber-900/20 disabled:opacity-50 disabled:bg-slate-200 flex items-center justify-center gap-2"
                >
                  <ArrowRightLeft className="w-4 h-4" /> {isProcessing ? 'Registrando...' : 'Confirmar Transferência'}
                </button>
              </motion.div>
            )}

            {/* EXIT TAB */}
            {type === 'exit' && (
              <motion.div key="exit" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-red-500 uppercase tracking-widest ml-1">Buscar Pallet</label>
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input type="text" value={searchId} onChange={e => setSearchId(e.target.value.toUpperCase())} placeholder="ID, OP ou Lote do pallet..." className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-11 py-4 text-slate-900 dark:text-white font-bold focus:border-red-500 outline-none" />
                  </div>
                </div>

                {foundPallet && (
                  <div className="p-5 bg-red-600/10 border border-red-500/20 rounded-[2rem] space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[9px] font-black text-red-500 uppercase tracking-widest">Confirmação de Saída</p>
                        <h4 className="text-slate-900 dark:text-white font-black text-lg">{foundPallet.description}</h4>
                        <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">OP: {foundPallet.originOP} | LOTE: {foundPallet.lot}</p>
                      </div>
                      <div className="text-right">
                        <span className="inline-block px-3 py-1 bg-white dark:bg-slate-800 rounded-lg text-[9px] font-black text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-sm">
                          VAGA: {foundPallet.inspections?.[0]?.assignedSlot || 'AGUARDANDO'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t border-red-500/20">
                      <label className="text-[9px] font-black text-red-500 uppercase tracking-widest ml-1 mb-2 block">Motivo da Saída</label>
                      <select value={exitReason} onChange={e => setExitReason(e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-slate-900 dark:text-white font-bold text-lg focus:border-red-500 outline-none">
                        <option value="">Selecione o motivo...</option>
                        <option value="EXPEDICAO">EXPEDIÇÃO / CARREGAMENTO</option>
                        <option value="RETRABALHO">RETORNO PARA RETRABALHO</option>
                        <option value="DESCARTE">DESCARTE / AVARIA</option>
                        <option value="OUTRO">OUTRO MOTIVO</option>
                      </select>
                    </div>
                  </div>
                )}
                
                <button 
                  onClick={handleSubmit} 
                  disabled={isProcessing || !foundPallet || !exitReason} 
                  className="w-full py-5 bg-red-600 hover:bg-red-500 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-[0.25em] transition-all shadow-xl shadow-red-900/20 disabled:opacity-50 disabled:bg-slate-200 flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" /> {isProcessing ? 'Registrando...' : 'Confirmar Saída Operacional'}
                </button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
