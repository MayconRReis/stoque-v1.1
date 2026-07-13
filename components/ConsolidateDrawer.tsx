import React, { useMemo, useState } from 'react';
import { X, Layers, AlertTriangle } from 'lucide-react';
import { SheetRow } from '../types';
import { supabaseService } from '../services/supabaseService';


interface ConsolidateDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPalletsData: { row: SheetRow; palletIdx: number }[];
  user: any;
  onSuccess: () => void;
}

export function ConsolidateDrawer({ isOpen, onClose, selectedPalletsData, onSuccess, user }: ConsolidateDrawerProps) {
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uniqueRows = useMemo(() => {
    const rowMap = new Map<string, SheetRow>();
    selectedPalletsData.forEach(({ row }) => {
      if (!rowMap.has(row.id)) {
        rowMap.set(row.id, row);
      }
    });
    return Array.from(rowMap.values());
  }, [selectedPalletsData]);

  const handleConsolidate = async () => {
    if (uniqueRows.length < 2) {
      setError('A consolidação requer pelo menos 2 pallets (linhas) distintos.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const childIds = uniqueRows.map(r => r.id);
      const parentId = crypto.randomUUID();
      const historyId = crypto.randomUUID();
      
      await supabaseService.consolidatePallets(
        childIds,
        parentId,
        historyId,
        user?.id || null,
        user?.name || 'Operador'
      );
      
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Erro ao consolidar pallets.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-sm animate-in fade-in"
        onClick={onClose}
      />
      
      <div className="fixed inset-y-0 right-0 z-[110] w-full md:w-[500px] bg-slate-900 border-l border-slate-800 shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800/60 bg-slate-900/50">
          <div className="flex items-center gap-3 text-emerald-400">
            <Layers className="w-5 h-5" />
            <h2 className="text-lg font-semibold tracking-tight text-slate-100">Consolidar Pallets</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-300 hover:bg-slate-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
            <h3 className="text-emerald-400 font-medium mb-2 text-sm uppercase tracking-wider">Novo Grupo de Pallets</h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              Você está prestes a agrupar {uniqueRows.length} {uniqueRows.length === 1 ? 'registro' : 'registros'} em um único pallet consolidado. 
              Esta operação é executada em uma única transação e pode ser desfeita futuramente.
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div>
            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-4">Pallets Selecionados</h3>
            <div className="space-y-3">
              {uniqueRows.map((row) => (
                <div key={row.id} className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3 flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-emerald-400 text-sm">{row.loadingId}</span>
                    <span className="text-slate-400 text-xs">{row.originOP}</span>
                  </div>
                  <span className="text-slate-300 text-sm truncate">{row.description}</span>
                  <div className="flex gap-4 mt-2">
                    <span className="text-xs text-slate-500">Lote: <span className="text-slate-400">{row.lot || 'N/A'}</span></span>
                    <span className="text-xs text-slate-500">Pallets: <span className="text-slate-400">{row.pallets || 1}</span></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-800/60 bg-slate-900/50">
          <button
            onClick={handleConsolidate}
            disabled={isLoading || uniqueRows.length < 2}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold text-sm tracking-wide transition-all shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2"
          >
            {isLoading ? 'Processando...' : 'Confirmar Consolidação'}
          </button>
        </div>
      </div>
    </>
  );
}
