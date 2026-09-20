import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DatabaseBackup, X, AlertCircle, Loader2, ShieldCheck } from 'lucide-react';

interface BackupReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownload: () => void;
  isLoading: boolean;
}

export const BackupReminderModal: React.FC<BackupReminderModalProps> = ({ isOpen, onClose, onDownload, isLoading }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-sm"
          onClick={!isLoading ? onClose : undefined}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] w-full max-w-md overflow-hidden relative z-10 shadow-3xl"
        >
          <div className="p-6 border-b border-slate-200/50 dark:border-slate-800/50 flex justify-between items-center bg-slate-200/20 dark:bg-slate-800/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center border border-blue-500/30">
                <DatabaseBackup className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white leading-none mb-1">Backup Diário</h3>
                <p className="text-[9px] uppercase font-bold tracking-widest text-blue-400">Lembrete das 08:00</p>
              </div>
            </div>
            {!isLoading && (
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-950 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-all border border-slate-200 dark:border-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="p-6 space-y-5">
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-500 shrink-0" />
              <p className="text-xs font-medium text-blue-900/80 dark:text-blue-200/80 leading-relaxed">
                Ainda não foi feito o backup de hoje. Baixe um arquivo JSON com todos os dados do sistema (estoque, histórico, carregamentos, vagas e usuários) para manter uma cópia de segurança.
              </p>
            </div>

            <div className="flex items-start gap-2 text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed px-1">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-500" />
              <span>Se fechar sem baixar, este lembrete volta a aparecer no próximo acesso.</span>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-950 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all border border-slate-200 dark:border-slate-800 disabled:opacity-50"
              >
                Agora não
              </button>
              <button
                onClick={onDownload}
                disabled={isLoading}
                className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 transition-all disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Gerando...
                  </>
                ) : (
                  <>
                    <DatabaseBackup className="w-3.5 h-3.5" /> Baixar Backup (JSON)
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
