import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RotateCcw, X, AlertCircle } from 'lucide-react';

interface RecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  isLoading: boolean;
}

export const RecoveryModal: React.FC<RecoveryModalProps> = ({ isOpen, onClose, onConfirm, isLoading }) => {
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
          onClick={!isLoading ? onClose : undefined}
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-slate-900 border border-slate-800 rounded-[2.5rem] w-full max-w-md overflow-hidden relative z-10 shadow-3xl"
        >
          <div className="p-6 border-b border-slate-800/50 flex justify-between items-center bg-slate-800/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center border border-indigo-500/30">
                <RotateCcw className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h3 className="font-bold text-white leading-none mb-1">Recuperação</h3>
                <p className="text-[9px] uppercase font-bold tracking-widest text-indigo-400">Restaurar Pallet</p>
              </div>
            </div>
            {!isLoading && (
              <button 
                onClick={onClose}
                className="w-8 h-8 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-500 hover:text-white flex items-center justify-center transition-all border border-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="p-6 space-y-5">
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
              <p className="text-xs font-medium text-amber-200/80 leading-relaxed">
                A recuperação será enviada como uma solicitação para a aprovação de um administrador.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                Motivo da Recuperação <span className="text-red-400">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Exemplo: Saída registrada acidentalmente por erro de digitação..."
                className="w-full h-28 bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm text-white resize-none outline-none focus:border-indigo-500/50 transition-colors placeholder:text-slate-700"
              />
            </div>
          </div>

          <div className="p-5 border-t border-slate-800/50 bg-slate-900/50 flex gap-3">
            <button 
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 py-3.5 px-4 rounded-xl font-bold text-[10px] uppercase tracking-widest text-slate-400 hover:text-white bg-slate-950 border border-slate-800 hover:bg-slate-800 transition-all disabled:opacity-50"
            >
              Cancelar
            </button>
            <button 
              onClick={() => onConfirm(reason)}
              disabled={!reason.trim() || isLoading}
              className="flex-[2] py-3.5 px-4 rounded-xl font-bold text-[10px] uppercase tracking-widest text-white bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Enviando...
                </>
              ) : (
                'Solicitar Recuperação'
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
