
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Package, 
  ArrowRight, 
  History, 
  User, 
  MapPin, 
  AlertCircle,
  Truck,
  Plus,
  ArrowUpRight,
  Info
} from 'lucide-react';
import { supabaseService } from '../services/supabaseService';
import { SheetRow, SlotContent, translateSlotContent } from '../types';

interface QuickSearchProps {
  onShowDetail: (row: SheetRow) => void;
  onTransfer: (row: SheetRow) => void;
  onExit: (row: SheetRow) => void;
  onAddToShipment: (row: SheetRow) => void;
}

const QuickSearch: React.FC<QuickSearchProps> = ({ 
  onShowDetail, 
  onTransfer, 
  onExit, 
  onAddToShipment 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [pallet, setPallet] = useState<SheetRow | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchTerm.trim()) return;

    setIsSearching(true);
    setError(null);
    setPallet(null);

    try {
      const term = searchTerm.trim().toUpperCase();
      const isSlotPattern = /^[A-F](\.\d+){0,2}$/.test(term);
      
      let result = null;
      if (isSlotPattern) {
        const results = await supabaseService.findPalletsBySlot(term);
        if (results.length > 1) {
          setError(`FALHA CRÍTICA: Encontrados ${results.length} pallets nesta vaga. Solicite correção ao gestor.`);
          setIsSearching(false);
          return;
        }
        result = results[0] || null;
      }
      
      if (!result) {
        result = await supabaseService.findPalletByLoadingId(term);
      }

      if (result) {
        setPallet(result);
      } else {
        setError('Nenhum pallet encontrado nesta vaga ou ID.');
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Erro ao buscar pallet. Verifique sua conexão.');
    } finally {
      setIsSearching(false);
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'PENDENTE': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      case 'APROVADO': return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'AGUARDANDO': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      default: return 'text-slate-500 bg-slate-500/10 border-slate-500/20';
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter flex items-center justify-center gap-3">
          <Search className="w-8 h-8 text-blue-500" /> Consulta Rápida
        </h2>
        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">
          Digite a vaga exata para localizar o pallet.
        </p>
      </div>

      {/* Search Input */}
      <form onSubmit={handleSearch} className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className={`w-5 h-5 transition-colors ${isSearching ? 'text-blue-500 animate-pulse' : 'text-slate-600 group-focus-within:text-blue-500'}`} />
        </div>
        <input 
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="DIGITE A VAGA. EX: E.1.3"
          className="w-full bg-slate-900 border-2 border-slate-800 rounded-3xl py-5 pl-12 pr-32 text-white font-black text-lg placeholder:text-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all shadow-2xl"
          autoFocus
        />
        <button 
          type="submit"
          disabled={isSearching}
          className="absolute inset-y-2 right-2 px-6 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95 disabled:opacity-50"
        >
          {isSearching ? 'Buscando...' : 'Buscar'}
        </button>
      </form>

      <div className="text-center">
        <p className="text-[9px] font-bold text-slate-700 uppercase tracking-[0.2em] italic">
          ID técnico pode ser usado apenas em casos especiais.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="p-6 bg-red-500/10 border border-red-500/20 rounded-[2rem] flex items-center gap-4 text-red-500"
          >
            <AlertCircle className="w-8 h-8 shrink-0" />
            <p className="font-black uppercase text-xs tracking-widest">{error}</p>
          </motion.div>
        )}

        {pallet && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-6"
          >
            {/* Pallet Card */}
            <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
              <div className="p-8 space-y-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter leading-tight">
                      {pallet.description}
                    </h3>
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-[9px] font-black text-blue-500 uppercase tracking-widest italic">
                        ID TÉCNICO: {pallet.loadingId || pallet.id}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusColor(pallet.status)}`}>
                        {pallet.status || 'STATUS DESCONHECIDO'}
                      </span>
                    </div>
                  </div>
                  <div className="w-16 h-16 bg-slate-950/50 rounded-2xl flex flex-col items-center justify-center border border-slate-800 shadow-inner">
                    <span className="text-xl font-black text-white leading-none">{pallet.pallets}</span>
                    <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Plts</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 bg-slate-950/40 p-6 rounded-[2rem] border border-slate-800/50">
                  <div className="space-y-1">
                    <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-1.5">
                      <History className="w-2.5 h-2.5" /> OP Origem
                    </p>
                    <p className="text-sm font-black text-slate-200 font-mono">{pallet.originOP}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-1.5">
                      <Plus className="w-2.5 h-2.5" /> Lote
                    </p>
                    <p className="text-sm font-black text-slate-200 font-mono">{pallet.lot}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-1.5">
                      <MapPin className="w-2.5 h-2.5" /> Vaga Atual
                    </p>
                    <p className="text-sm font-black text-blue-500 italic">
                      {pallet.inspections?.[0]?.assignedSlot || 'NÃO ALOCADO'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-1.5">
                      <User className="w-2.5 h-2.5" /> Responsável
                    </p>
                    <p className="text-sm font-black text-slate-400 italic">
                      {pallet.operatorName || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions Grid */}
              <div className="grid grid-cols-2 gap-[1px] bg-slate-800/50 border-t border-slate-800">
                <button 
                  onClick={() => onShowDetail(pallet)}
                  className="bg-slate-900 hover:bg-slate-800 p-6 flex flex-col items-center gap-2 transition-all group active:bg-slate-950"
                >
                  <Info className="w-6 h-6 text-blue-500 group-hover:scale-110 transition-transform" />
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Ver Detalhes</span>
                </button>
                <button 
                  onClick={() => onTransfer(pallet)}
                  className="bg-slate-900 hover:bg-slate-800 p-6 flex flex-col items-center gap-2 transition-all group active:bg-slate-950"
                >
                  <ArrowRight className="w-6 h-6 text-amber-500 group-hover:scale-110 transition-transform" />
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Transferir</span>
                </button>
                <button 
                  onClick={() => onExit(pallet)}
                  className="bg-slate-900 hover:bg-slate-800 p-6 flex flex-col items-center gap-2 transition-all group active:bg-slate-950"
                >
                  <ArrowUpRight className="w-6 h-6 text-red-500 group-hover:scale-110 transition-transform" />
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Dar Saída</span>
                </button>
                <button 
                  onClick={() => onAddToShipment(pallet)}
                  className="bg-slate-900 hover:bg-slate-800 p-6 flex flex-col items-center gap-2 transition-all group active:bg-slate-950"
                >
                  <Truck className="w-6 h-6 text-green-500 group-hover:scale-110 transition-transform" />
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Carregamento</span>
                </button>
              </div>
            </div>

            <div className="p-6 bg-blue-500/5 border border-blue-500/10 rounded-3xl flex items-start gap-4">
              <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-[10px] text-blue-300 font-bold leading-relaxed uppercase tracking-wide italic">
                ESTA CONSULTA BUSCA DIRETAMENTE NO BANCO DE DADOS, INCLUINDO ITENS QUE PODEM NÃO ESTAR VISÍVEIS NA LISTAGEM GERAL ATUAL.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default QuickSearch;
