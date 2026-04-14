
import React, { useState, useEffect } from 'react';
import { SheetRow, InspectionData, SlotContent } from '../types';
import { 
  Pencil, 
  X, 
  Save,
  Hash,
  Tag,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface EditPalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedData: { description: string; op: string; lot: string }) => void;
  pallet: { row: SheetRow; inspection: InspectionData; idx: number } | null;
}

export const EditPalletModal: React.FC<EditPalletModalProps> = ({ isOpen, onClose, onSave, pallet }) => {
  const [description, setDescription] = useState('');
  const [op, setOp] = useState('');
  const [lot, setLot] = useState('');

  useEffect(() => {
    if (pallet) {
      setDescription(pallet.row.description);
      setOp(pallet.row.originOP);
      setLot(pallet.row.lot);
    }
  }, [pallet]);

  if (!isOpen || !pallet) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/90 backdrop-blur-2xl p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-slate-900 border border-slate-800 rounded-[40px] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] w-full max-w-md overflow-hidden"
      >
        <div className="bg-slate-800/30 p-6 flex justify-between items-center border-b border-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/40 transform -rotate-3">
              <Pencil className="text-white w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-lg italic uppercase tracking-tighter text-white">Editar Pallet</h3>
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Vaga {pallet.inspection.assignedSlot}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center bg-slate-950/50 rounded-lg text-slate-500 hover:text-white transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="space-y-1.5">
            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-1.5">
              <FileText className="w-3 h-3" /> Descrição do Produto
            </label>
            <textarea 
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-bold text-sm focus:border-blue-600 outline-none transition-all resize-none"
              placeholder="Descrição completa do item..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                <Hash className="w-3 h-3" /> OP
              </label>
              <input 
                type="text" 
                value={op}
                onChange={e => setOp(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-bold text-sm focus:border-blue-600 outline-none transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                <Tag className="w-3 h-3" /> Lote
              </label>
              <input 
                type="text" 
                value={lot}
                onChange={e => setLot(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-bold text-sm focus:border-blue-600 outline-none transition-all"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button 
              onClick={onClose}
              className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all"
            >
              Cancelar
            </button>
            <button 
              onClick={() => onSave({ description, op, lot })}
              className="flex-[2] py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-900/40 transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              Salvar Alterações <Save className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
