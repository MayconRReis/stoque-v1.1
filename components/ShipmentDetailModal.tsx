
import React, { useState } from 'react';
import { Shipment, ShipmentType, ShipmentStatus, SheetRow, translateSlotContent } from '../types';
import { 
  X, 
  Truck, 
  Calendar, 
  Package, 
  CheckCircle2, 
  Trash2,
  AlertCircle,
  Hash,
  ArrowRight,
  Search,
  Loader2,
  Plus,
  Warehouse
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabaseService } from '../services/supabaseService';

interface ShipmentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  shipment: Shipment | null;
  linkedPallets: SheetRow[];
  onFinalize: (shipmentId: string) => Promise<void>;
  onRemovePallet: (palletId: string) => Promise<void>;
  onAddPallet: (pallet: SheetRow) => Promise<void>;
  onDelete?: (shipmentId: string) => Promise<void>;
}

export const ShipmentDetailModal: React.FC<ShipmentDetailModalProps> = ({ 
  isOpen, 
  onClose, 
  shipment, 
  linkedPallets,
  onFinalize,
  onRemovePallet,
  onAddPallet,
  onDelete
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [searchSlots, setSearchSlots] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  if (!isOpen || !shipment) return null;

  const handleSlotSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const term = searchSlots.trim().toUpperCase();
    if (!term) return;

    setIsSearching(true);
    setSearchError(null);

    try {
      // Split by comma in case they entered multiple slots
      const terms = term.split(/[\s,]+/).filter(t => t.length > 0);
      let foundAny = false;

      for (const t of terms) {
        const results = await supabaseService.findPalletsBySlot(t);
        if (results.length > 1) {
          setSearchError(`Conflito na vaga ${t}: Encontrados ${results.length} pallets.`);
          continue;
        }
        const pallet = results[0];
        if (pallet) {
          // Check if already in this shipment
          if (linkedPallets.some(p => p.id === pallet.id)) {
            continue;
          }
          await onAddPallet(pallet);
          foundAny = true;
        }
      }

      if (foundAny) {
        setSearchSlots('');
      } else {
        setSearchError('Nenhum pallet disponível encontrado nestas vagas.');
      }
    } catch (error) {
      console.error('Error adding by slot:', error);
      setSearchError('Erro ao buscar pallets.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleFinalize = async () => {
    if (linkedPallets.length === 0) return;
    setIsProcessing(true);
    try {
      await onFinalize(shipment.id);
      onClose();
    } catch (error) {
      console.error('Error finalizing shipment:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    setIsProcessing(true);
    try {
      await onDelete(shipment.id);
      onClose();
    } catch (error) {
      console.error('Error deleting shipment:', error);
    } finally {
      setIsProcessing(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/90 backdrop-blur-xl p-4 overflow-y-auto">
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-[210] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4"
          >
            <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 max-w-sm w-full shadow-3xl text-center space-y-6">
              <div className="w-16 h-16 bg-red-600/10 text-red-500 rounded-2xl flex items-center justify-center mx-auto border border-red-500/20 shadow-xl shadow-red-900/20">
                <Trash2 className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-white font-black uppercase text-xl italic tracking-tight">Excluir Carregamento?</h3>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest leading-relaxed">
                  Os pallets vinculados serão liberados e o registro será removido permanentemente.
                </p>
              </div>
              <div className="flex gap-4 pt-2">
                <button 
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-4 bg-slate-800 text-slate-400 font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleDelete}
                  disabled={isProcessing}
                  className="flex-2 py-4 bg-red-600 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-lg shadow-red-900/40 transition-all hover:bg-red-500 active:scale-95 disabled:opacity-50"
                >
                  {isProcessing ? 'Excluindo...' : 'Sim, Excluir'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-slate-900 border border-slate-800 rounded-[3rem] shadow-3xl w-full max-w-2xl overflow-hidden my-auto"
      >
        {/* Header */}
        <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-800/20">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-2xl transform -rotate-3 ${shipment.type === ShipmentType.THIRD_PARTY ? 'bg-fuchsia-600 shadow-fuchsia-900/40' : 'bg-pink-600 shadow-pink-900/40'}`}>
              <Truck className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Detalhes do Carregamento</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em]">{shipment.id}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-xl bg-slate-950 text-slate-500 hover:text-white flex items-center justify-center border border-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 space-y-8">
          {/* Info Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-950/50 p-5 rounded-[2rem] border border-slate-800/50">
              <p className="text-[9px] text-slate-600 font-black uppercase mb-1">Tipo</p>
              <p className={`text-sm font-black italic ${shipment.type === ShipmentType.THIRD_PARTY ? 'text-fuchsia-500' : 'text-pink-500'}`}>
                {shipment.type === ShipmentType.THIRD_PARTY ? 'Terceirista' : 'Próprio'}
              </p>
            </div>
            <div className="bg-slate-950/50 p-5 rounded-[2rem] border border-slate-800/50">
              <p className="text-[9px] text-slate-600 font-black uppercase mb-1">Data de Envio</p>
              <p className="text-sm font-black text-white italic">{new Date(shipment.scheduledDate).toLocaleDateString('pt-BR')}</p>
            </div>
            <div className="bg-slate-950/50 p-5 rounded-[2rem] border border-slate-800/50">
              <p className="text-[9px] text-slate-600 font-black uppercase mb-1">Total Pallets</p>
              <p className="text-sm font-black text-white italic">{linkedPallets.length} Unidades</p>
            </div>
          </div>

          {/* Quick Add by Slot */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-2">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] italic">Adicionar por Vaga</h4>
            </div>
            <form onSubmit={handleSlotSearch} className="flex gap-3">
              <div className="relative flex-1">
                <Warehouse className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                <input 
                  type="text"
                  value={searchSlots}
                  onChange={e => setSearchSlots(e.target.value)}
                  placeholder="EX: E.1.1, E.1.2..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-white font-mono font-black text-sm focus:border-fuchsia-600 outline-none transition-all placeholder:text-slate-700"
                />
                {isSearching && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <Loader2 className="w-4 h-4 text-fuchsia-500 animate-spin" />
                  </div>
                )}
              </div>
              <button 
                type="submit"
                disabled={isSearching || !searchSlots.trim()}
                className="px-6 bg-fuchsia-600 hover:bg-fuchsia-500 disabled:bg-slate-800 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-fuchsia-900/20 active:scale-95 transition-all"
              >
                Adicionar
              </button>
            </form>
            {searchError && (
              <p className="text-[9px] font-bold text-red-500 uppercase tracking-widest ml-2 italic">
                {searchError}
              </p>
            )}
          </div>

          {/* Pallet List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] italic">Pallets Vinculados</h4>
              <span className="text-[10px] font-bold text-slate-600 uppercase">{linkedPallets.length} itens</span>
            </div>
            
            <div className="max-h-[35vh] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {linkedPallets.length === 0 ? (
                <div className="py-12 text-center border-2 border-dashed border-slate-800/50 rounded-[2rem] bg-slate-950/20">
                  <Package className="w-10 h-10 text-slate-800 mx-auto mb-3" />
                  <p className="text-slate-600 font-bold uppercase text-[9px] tracking-widest">Nenhum pallet vinculado</p>
                </div>
              ) : (
                linkedPallets.map(pallet => (
                  <div key={pallet.id} className="bg-slate-950/50 border border-slate-800/60 p-4 rounded-2xl flex items-center justify-between group hover:border-slate-700 transition-all">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-slate-500 border border-slate-800 shrink-0">
                        <Package className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-black text-fuchsia-500 font-mono uppercase mb-0.5 pr-4 truncate">{pallet.originOP}</p>
                        <h5 className="text-[11px] font-bold text-white uppercase truncate pr-4">{pallet.description}</h5>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[8px] font-black text-slate-600 uppercase">Lote: {pallet.lot}</span>
                          <span className="text-[8px] font-black text-slate-600 uppercase">Vaga: {pallet.inspections?.[0]?.assignedSlot || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => onRemovePallet(pallet.id)}
                      className="w-10 h-10 bg-slate-900 hover:bg-red-500/10 text-slate-700 hover:text-red-500 border border-slate-800 hover:border-red-500/30 rounded-xl transition-all flex items-center justify-center shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button 
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isProcessing}
              className="px-6 py-5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 rounded-2xl transition-all shadow-xl shadow-red-900/10"
              title="Excluir Carregamento"
            >
              <Trash2 className="w-5 h-5 mx-auto" />
            </button>
            <button 
              onClick={onClose}
              className="flex-1 py-5 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-[0.3em] transition-all"
            >
              Fechar
            </button>
            <button 
              onClick={handleFinalize}
              disabled={isProcessing || linkedPallets.length === 0}
              className="flex-[2] py-5 bg-green-600 hover:bg-green-500 disabled:bg-slate-800 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-xl shadow-green-900/40 transition-all flex items-center justify-center gap-3 active:scale-95"
            >
              {isProcessing ? (
                <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Processando</>
              ) : (
                <><CheckCircle2 className="w-5 h-5" /> Finalizar Carregamento</>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
