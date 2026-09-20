import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UploadCloud, X, AlertTriangle, Loader2, FileJson, CheckCircle2, ShieldAlert } from 'lucide-react';

interface RestoreBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestore: (backupJson: any) => Promise<{ success: boolean; summary: Record<string, number>; skipped?: string[]; failed?: Record<string, string> }>;
}

const CONFIRM_WORD = 'RESTAURAR';

const LABELS: Record<string, string> = {
  vagas: 'Vagas',
  inventario: 'Estoque',
  historico: 'Histórico',
  carregamentos: 'Carregamentos',
  estoqueRotativo: 'Estoque Rotativo',
};

export const RestoreBackupModal: React.FC<RestoreBackupModalProps> = ({ isOpen, onClose, onRestore }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [confirmText, setConfirmText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<Record<string, number> | null>(null);
  const [skipped, setSkipped] = useState<string[]>([]);
  const [failed, setFailed] = useState<Record<string, string>>({});

  const reset = () => {
    setSelectedFile(null);
    setConfirmText('');
    setError(null);
    setSummary(null);
    setSkipped([]);
    setFailed({});
    setIsLoading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    if (isLoading) return;
    reset();
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setSummary(null);
    setSkipped([]);
    setFailed({});
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
  };

  const handleConfirmRestore = async () => {
    if (!selectedFile) return;
    setError(null);
    setIsLoading(true);
    try {
      const text = await selectedFile.text();
      let parsed: any;
      try {
        parsed = JSON.parse(text);
      } catch {
        throw new Error('O arquivo selecionado não é um JSON válido.');
      }

      const result = await onRestore(parsed);
      setSummary(result.summary);
      setSkipped(result.skipped || []);
      setFailed(result.failed || {});
      setConfirmText('');
    } catch (err: any) {
      setError(err?.message || 'Erro ao restaurar o backup.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const canConfirm = !!selectedFile && confirmText.trim().toUpperCase() === CONFIRM_WORD && !isLoading;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-sm"
          onClick={!isLoading ? handleClose : undefined}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] w-full max-w-lg overflow-hidden relative z-10 shadow-3xl"
        >
          <div className="p-6 border-b border-slate-200/50 dark:border-slate-800/50 flex justify-between items-center bg-slate-200/20 dark:bg-slate-800/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-rose-500/20 rounded-xl flex items-center justify-center border border-rose-500/30">
                <UploadCloud className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white leading-none mb-1">Restaurar Backup</h3>
                <p className="text-[9px] uppercase font-bold tracking-widest text-rose-400">Substitui os dados atuais</p>
              </div>
            </div>
            {!isLoading && (
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-950 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-all border border-slate-200 dark:border-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
            {summary ? (
              <>
                {Object.keys(summary).length > 0 && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    <div className="text-xs font-medium text-emerald-900/80 dark:text-emerald-200/80 leading-relaxed">
                      <p className="mb-2">Restaurado com sucesso. Registros substituídos:</p>
                      <ul className="space-y-0.5">
                        {Object.entries(summary).map(([key, count]) => (
                          <li key={key} className="flex justify-between gap-4">
                            <span>{LABELS[key] || key}</span>
                            <span className="font-bold">{count}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {Object.keys(failed).length > 0 && (
                  <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 flex gap-3">
                    <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
                    <div className="text-xs font-medium text-rose-900/80 dark:text-rose-200/80 leading-relaxed space-y-2">
                      <p className="font-bold">Falha ao restaurar as tabelas abaixo (as demais acima foram concluídas normalmente):</p>
                      {Object.entries(failed).map(([key, msg]) => (
                        <div key={key}>
                          <p className="font-bold">{LABELS[key] || key}</p>
                          <p className="opacity-90 break-words">{msg}</p>
                        </div>
                      ))}
                      <p className="opacity-90">Copie a mensagem acima e envie para o suporte — o restante dos dados não foi afetado.</p>
                    </div>
                  </div>
                )}

                {skipped.length > 0 && (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex gap-3">
                    <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0" />
                    <div className="text-xs font-medium text-amber-900/80 dark:text-amber-200/80 leading-relaxed">
                      <p className="mb-1">
                        Este arquivo não trazia dados (ou trazia uma lista vazia) para: <strong>{skipped.map(k => LABELS[k] || k).join(', ')}</strong>. Por segurança, esses dados <strong>não foram apagados</strong> — o que já estava no sistema para eles continua intacto.
                      </p>
                    </div>
                  </div>
                )}

                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed px-1">
                  Recomendado recarregar a página agora para que todas as telas reflitam os dados restaurados.
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all"
                >
                  Recarregar Página
                </button>
              </>
            ) : (
              <>
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
                  <p className="text-xs font-medium text-rose-900/80 dark:text-rose-200/80 leading-relaxed">
                    Esta ação <strong>apaga e substitui</strong> todos os dados atuais de estoque, histórico, vagas, carregamentos e estoque rotativo pelos dados do arquivo selecionado. Não pode ser desfeita.
                  </p>
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed px-1">
                  Usuários cadastrados e solicitações de edição pendentes não são alterados por esta restauração.
                </p>

                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-500 dark:text-slate-400 mb-2">
                    Arquivo de backup (.json)
                  </label>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 flex items-center gap-3 text-left transition-all disabled:opacity-50"
                  >
                    <FileJson className="w-4 h-4 text-blue-500 shrink-0" />
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-300 truncate">
                      {selectedFile ? selectedFile.name : 'Clique para selecionar o arquivo JSON...'}
                    </span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/json,.json"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>

                {selectedFile && (
                  <div>
                    <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-500 dark:text-slate-400 mb-2">
                      Digite <span className="text-rose-500">{CONFIRM_WORD}</span> para confirmar
                    </label>
                    <input
                      type="text"
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value)}
                      disabled={isLoading}
                      placeholder={CONFIRM_WORD}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-bold tracking-widest uppercase text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/40 disabled:opacity-50"
                    />
                  </div>
                )}

                {error && (
                  <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 text-xs font-medium text-rose-500">
                    {error}
                  </div>
                )}

                <div className="flex gap-3 pt-1">
                  <button
                    onClick={handleClose}
                    disabled={isLoading}
                    className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-950 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all border border-slate-200 dark:border-slate-800 disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleConfirmRestore}
                    disabled={!canConfirm}
                    className="flex-1 px-4 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-rose-900/20 transition-all disabled:opacity-40"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Restaurando...
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-3.5 h-3.5" /> Restaurar Agora
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
