import React, { useState, useEffect } from 'react';
import { WarehouseSlot, SlotContent, SheetRow } from '../types';
import { X, Plus, Truck, Package, ClipboardList, Info, FlaskConical, Database, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ManualPalletModalProps {
  inventoryData: SheetRow[];
  historyData: any[];
  isOpen: boolean;
  onClose: () => void;
  availableSlots: WarehouseSlot[];
  onSave: (data: any) => Promise<void>;
}

export const ManualPalletModal: React.FC<ManualPalletModalProps> = ({ isOpen, onClose, availableSlots, onSave, inventoryData, historyData }) => {
  const [description, setDescription] = useState('');
  const [op, setOp] = useState('');
  const [lot, setLot] = useState('');
  const [contentType, setContentType] = useState<SlotContent>(SlotContent.FINISHED_PRODUCT);
  const [quantity, setQuantity] = useState(1);
  const [assignedSlot, setAssignedSlot] = useState('AGUARDANDO');
  const [isProcessing, setIsProcessing] = useState(false);

  // Autofill logic based on OP
  useEffect(() => {
    if (op && op.length >= 3) {
      const term = op.toUpperCase();
      
      // Look in current inventory first
      let match = inventoryData.find(p => p.originOP === term);
      
      // Look in history if not found in inventory
      if (!match && historyData) {
        match = historyData.find(h => h.op === term);
      }

      if (match && !description) {
        setDescription(match.description || '');
        setLot(match.lot || '');
        if (match.inspections?.[0]?.contentType) {
          setContentType(match.inspections[0].contentType);
        } else if (match.palletType) {
           // Mapping from string to enum is tricky, let's keep current contentType if missing
        }
      }
    }
  }, [op, inventoryData, historyData]);


  const handleSave = async () => {
    setIsProcessing(true);
    try {
      await onSave({
        description,
        op,
        lot,
        quantity,
        contentType,
        assignedSlot
      });
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
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-2xl bg-[#0f1522] rounded-[2rem] border border-slate-800 shadow-2xl overflow-hidden flex flex-col">
        
        {/* Left blue accent line */}
        <div className="absolute top-8 left-0 w-1 h-16 bg-blue-500 rounded-r-md"></div>

        {/* Header */}
        <div className="p-8 pb-6 flex justify-between items-start">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl border border-slate-700 flex items-center justify-center bg-[#0B1120]">
              <Truck className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white italic tracking-tight leading-none mb-1">ENTRADA</h2>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Fluxo Operacional GO</p>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-xl border border-slate-700 flex items-center justify-center hover:bg-slate-800 transition-colors bg-[#0B1120]">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Form Grid */}
        <div className="px-8 pb-8 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            
            {/* TIPO */}
            <div className="space-y-2">
              <div>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Package className="w-3.5 h-3.5 text-blue-400" />
                  <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Tipo</label>
                </div>
                <p className="text-[9px] text-slate-500 italic">O que é o pallet?</p>
              </div>
              <div className="relative">
                <select value={contentType} onChange={e => setContentType(e.target.value as SlotContent)} className="w-full bg-[#0B1120] border border-slate-800 rounded-xl px-4 py-3.5 text-white font-bold text-lg focus:border-blue-500 outline-none appearance-none">
                  <option value={SlotContent.FINISHED_PRODUCT}>Produto Acabado</option>
                  <option value={SlotContent.BOTTLES}>Frasco</option>
                  <option value={SlotContent.SUPPLIES}>Insumo</option>
                  <option value={SlotContent.RETURN}>Retorno</option>
                  <option value={SlotContent.CONTAINER_SJ}>Container Sujo</option>
                  <option value={SlotContent.CONTAINER_LP}>Container Limpo</option>
                  <option value={SlotContent.CONTAINER_CP}>Container Com Produto</option>
                  <option value={SlotContent.USE_CONSUMPTION}>Uso e Consumo</option>
                  <option value={SlotContent.REWORK}>Retrabalho</option>
                  <option value={SlotContent.REPROCESS}>Reprocesso</option>
                  <option value={SlotContent.ROTATIVE}>Estoque Rotativo</option>
                  <option value={SlotContent.MISCELLANEOUS}>Diversos</option>
                  <option value={SlotContent.DISCARD}>Descarte</option>
                  <option value={SlotContent.OTHER}>Outro</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* OP */}
            <div className="space-y-2">
              <div>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <ClipboardList className="w-3.5 h-3.5 text-blue-400" />
                  <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest">OP (Opcional)</label>
                </div>
                <p className="text-[9px] text-slate-500 italic">Ordem de Produção</p>
              </div>
              <input type="text" value={op} onChange={e => setOp(e.target.value.toUpperCase())} placeholder="Ex: 410-152" className="w-full bg-[#0B1120] border border-slate-800 rounded-xl px-4 py-3.5 text-white font-bold text-lg focus:border-blue-500 outline-none uppercase placeholder:text-slate-700" />
            </div>

            {/* NOME */}
            <div className="space-y-2">
              <div>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Info className="w-3.5 h-3.5 text-blue-400" />
                  <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Nome (Obrigatório)</label>
                </div>
                <p className="text-[9px] text-slate-500 italic">informar o nome do produto</p>
              </div>
              <input type="text" value={description} onChange={e => setDescription(e.target.value.toUpperCase())} placeholder="Ex: SELANTE 500G" className="w-full bg-[#0B1120] border border-slate-800 rounded-xl px-4 py-3.5 text-white font-bold text-lg focus:border-blue-500 outline-none uppercase placeholder:text-slate-700" />
            </div>

            {/* LOTE */}
            <div className="space-y-2">
              <div>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Package className="w-3.5 h-3.5 text-blue-400" />
                  <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Lote (Opcional)</label>
                </div>
                <p className="text-[9px] text-slate-500 italic">Informar conforme etiqueta</p>
              </div>
              <input type="text" value={lot} onChange={e => setLot(e.target.value.toUpperCase())} placeholder="Ex: 01260307143" className="w-full bg-[#0B1120] border border-slate-800 rounded-xl px-4 py-3.5 text-white font-bold text-lg focus:border-blue-500 outline-none uppercase placeholder:text-slate-700" />
            </div>

            {/* QUANTIDADE */}
            <div className="space-y-2">
              <div>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <FlaskConical className="w-3.5 h-3.5 text-blue-400" />
                  <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Qtd. Pallets</label>
                </div>
                <p className="text-[9px] text-slate-500 italic">informar a quantidade de pallets a cadastrar</p>
              </div>
              <input type="number" min="1" value={quantity} onChange={e => setQuantity(Number(e.target.value))} className="w-full bg-[#0B1120] border border-slate-800 rounded-xl px-4 py-3.5 text-white font-bold text-lg focus:border-blue-500 outline-none placeholder:text-slate-700" />
            </div>

            {/* VAGA */}
            <div className="space-y-2">
              <div>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Database className="w-3.5 h-3.5 text-blue-400" />
                  <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Vaga</label>
                </div>
                <p className="text-[9px] text-slate-500 italic">Local de armazenamento sugerido</p>
              </div>
              <div className="relative">
                <select value={assignedSlot} onChange={e => setAssignedSlot(e.target.value)} className="w-full bg-[#0B1120] border border-slate-800 rounded-xl px-4 py-3.5 text-white font-bold text-lg focus:border-blue-500 outline-none appearance-none">
                  <option value="" className="bg-blue-300 text-slate-900 font-bold uppercase tracking-widest text-lg">SELECIONAR</option>
                  <option value="AGUARDANDO" className="text-amber-500 font-bold bg-[#0B1120] text-lg">AGUARDANDO VAGA</option>
                  {availableSlots.map(s => (
                    <option key={s.id} value={s.id} className="text-slate-200 bg-[#0B1120] text-lg">{s.id}</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
            
          </div>

          <button 
            onClick={handleSave} 
            disabled={isProcessing || !description} 
            className="w-full py-4 mt-4 bg-slate-200 hover:bg-white text-slate-900 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-white/5"
          >
             {isProcessing ? 'Registrando...' : 'Confirmar Entrada'} <Plus className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </div>
  );
};
