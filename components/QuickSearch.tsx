
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
  Info,
  ShieldAlert
} from 'lucide-react';
import { supabaseService } from '../services/supabaseService';
import { SheetRow, SlotContent, translateSlotContent } from '../types';

interface QuickSearchProps {
  onShowDetail: (row: SheetRow) => void;
  onTransfer: (row: SheetRow) => void;
  onExit: (row: SheetRow) => void;
  onAddToShipment: (row: SheetRow) => void;
}

interface GroupedPallet {
  id: string; // originOP_lot
  description: string;
  originOP: string;
  lot: string;
  status: string;
  totalPallets: number;
  pallets: SheetRow[];
  hasWithoutSeal: boolean;
}

const QuickSearch: React.FC<QuickSearchProps> = ({ 
  onShowDetail, 
  onTransfer, 
  onExit, 
  onAddToShipment 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<GroupedPallet[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchTerm.trim()) return;

    setIsSearching(true);
    setError(null);
    setResults([]);

    try {
      const term = searchTerm.trim().toUpperCase();
      
      const response = await supabaseService.getInventoryPaginated(0, 100, { searchTerm: term });
      const pallets = response.data;

      if (pallets.length > 0) {
        // Group by OP + Lote
        const groupedMap = new Map<string, GroupedPallet>();
        
        pallets.forEach(p => {
          const key = `${p.originOP}_${p.lot}_${p.description}`;
          const isWithoutSeal = p.inspections?.some(i => i.withoutSeal);
          
          if (!groupedMap.has(key)) {
            groupedMap.set(key, {
              id: key,
              description: p.description,
              originOP: p.originOP,
              lot: p.lot,
              status: p.status,
              totalPallets: p.pallets,
              pallets: [p],
              hasWithoutSeal: !!isWithoutSeal
            });
          } else {
            const group = groupedMap.get(key)!;
            group.totalPallets += p.pallets;
            group.pallets.push(p);
            if (isWithoutSeal) group.hasWithoutSeal = true;
          }
        });

        setResults(Array.from(groupedMap.values()));
      } else {
        setError('Nenhum pallet encontrado para esta pesquisa.');
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
        <h2 className="text-3xl font-black text-slate-900 dark:text-white italic uppercase tracking-tighter flex items-center justify-center gap-3">
          <Search className="w-8 h-8 text-blue-500" /> Consulta Rápida
        </h2>
        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">
          BUSQUE POR OP, LOTE, NOME OU VAGA.
        </p>
      </div>

      {/* Search Input */}
      <form onSubmit={handleSearch} className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className={`w-5 h-5 transition-colors ${isSearching ? 'text-blue-500 animate-pulse' : 'text-slate-600 dark:text-slate-400 group-focus-within:text-blue-500'}`} />
        </div>
        <input 
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="DIGITE OP, LOTE, NOME, VAGA OU SEM SELO..."
          className="w-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl py-5 pl-12 pr-32 text-slate-900 dark:text-white font-black text-lg placeholder:text-slate-600 dark:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all shadow-2xl"
          autoFocus
        />
        <button 
          type="submit"
          disabled={isSearching}
          className="absolute inset-y-2 right-2 px-6 bg-blue-600 hover:bg-blue-500 text-slate-900 dark:text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95 disabled:opacity-50"
        >
          {isSearching ? 'Buscando...' : 'Buscar'}
        </button>
      </form>

      <div className="text-center">
        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] italic">
          Os resultados serão agrupados por OP e Lote.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="p-6 bg-red-500/10 border border-red-500/20 rounded-[2rem] flex items-center gap-4 text-red-600 dark:text-red-500"
          >
            <AlertCircle className="w-8 h-8 shrink-0" />
            <p className="font-black uppercase text-xs tracking-widest">{error}</p>
          </motion.div>
        )}

        {results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-6"
          >
            {results.map(group => (
              <div key={group.id} className="bg-white dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl relative">
                
                {group.hasWithoutSeal && (
                  <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-red-500 to-orange-500" />
                )}

                <div className="p-8 space-y-6">
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white italic uppercase tracking-tighter leading-tight line-clamp-2">
                          {group.description}
                        </h3>
                        {group.hasWithoutSeal && (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 text-slate-900 dark:text-white rounded-lg shadow-lg border border-red-600/50 shrink-0 animate-pulse">
                            <ShieldAlert className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Sem Selo</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusColor(group.status)}`}>
                          {group.status || 'STATUS DESCONHECIDO'}
                        </span>
                        <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full text-[9px] font-black uppercase tracking-widest">
                          {group.totalPallets} UN
                        </span>
                      </div>
                    </div>
                    <div className="w-16 h-16 bg-slate-50 dark:bg-slate-950/50 rounded-2xl flex flex-col items-center justify-center border border-slate-200 dark:border-slate-800 shadow-inner shrink-0">
                      <span className="text-xl font-black text-slate-900 dark:text-white leading-none">{group.pallets.length}</span>
                      <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Plts Totais</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-950/40 p-5 rounded-[2rem] border border-slate-200 dark:border-slate-800/50">
                    <div className="space-y-1">
                      <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                        <History className="w-2.5 h-2.5" /> OP Origem
                      </p>
                      <p className="text-sm font-black text-slate-900 dark:text-slate-200 font-mono">{group.originOP}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                        <Plus className="w-2.5 h-2.5" /> Lote
                      </p>
                      <p className="text-sm font-black text-slate-900 dark:text-slate-200 font-mono">{group.lot}</p>
                    </div>
                  </div>
                  
                  {group.pallets.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest border-b border-slate-200 dark:border-slate-800 pb-2">Pallets Encontrados</h4>
                      <div className="max-h-48 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                        {group.pallets.map((p, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-500 font-black text-xs">
                                {p.pallets}
                              </div>
                              <div className="space-y-0.5">
                                <p className="text-xs font-black text-slate-900 dark:text-slate-200 uppercase flex items-center gap-2">
                                  {p.inspections?.[0]?.assignedSlot || 'NÃO ALOCADO'}
                                  {p.inspections?.some(i => i.withoutSeal) && (
                                    <span className="flex items-center gap-1 text-[8px] bg-red-500 text-slate-900 dark:text-white px-1.5 py-0.5 rounded shadow-sm animate-pulse">
                                      <ShieldAlert className="w-2.5 h-2.5" />
                                      SEM SELO
                                    </span>
                                  )}
                                </p>
                                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">{p.loadingId || p.id}</p>
                              </div>
                            </div>
                            <button 
                              onClick={() => onShowDetail(p)}
                              className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-blue-500 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors text-[9px] font-black uppercase tracking-widest"
                            >
                              Ver
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              </div>
            ))}

            <div className="p-6 bg-blue-500/5 border border-blue-500/10 rounded-3xl flex items-start gap-4">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-500 shrink-0 mt-0.5" />
              <p className="text-[10px] text-blue-800 dark:text-blue-300 font-bold leading-relaxed uppercase tracking-wide italic">
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
