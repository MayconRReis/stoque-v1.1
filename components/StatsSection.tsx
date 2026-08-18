import React, { memo } from 'react';
import { 
  FlaskConical, 
  CheckCircle2, 
  History, 
  ClipboardCheck, 
  Boxes, 
  Truck,
  Package
} from 'lucide-react';
import { DashboardStats } from '../types';

interface StatsSectionProps {
  stats: DashboardStats;
  isPublicView: boolean;
  onNavigate: (tab: any) => void;
}

const StatsSection: React.FC<StatsSectionProps> = ({ stats, isPublicView, onNavigate }) => {
  return (
    <div className="space-y-6">
      {/* Large Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-100/60 dark:bg-slate-900/60 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl hover:border-blue-500/30 transition-all relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:opacity-10 transition-opacity">
            <FlaskConical className="w-40 h-40" />
          </div>
          <div className="flex justify-between items-start mb-6">
            <div className="w-16 h-16 bg-blue-600/10 text-blue-500 rounded-3xl flex items-center justify-center border border-blue-500/20 shadow-lg shadow-blue-900/40">
              <FlaskConical className="w-8 h-8" />
            </div>
            <div className="text-right">
              <h4 className="text-base font-black text-slate-900 dark:text-white uppercase italic tracking-tight">Total de Frascos</h4>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Estoque Consolidado</p>
            </div>
          </div>
          <div className="flex items-baseline gap-4">
            <p className="text-6xl md:text-8xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">{(stats?.totalBottles || 0).toLocaleString()}</p>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest italic">Unidades</p>
          </div>
        </div>

        <div className="bg-slate-100/60 dark:bg-slate-900/60 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl hover:border-green-500/30 transition-all relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:opacity-10 transition-opacity">
            <CheckCircle2 className="w-40 h-40" />
          </div>
          <div className="flex justify-between items-start mb-6">
            <div className="w-16 h-16 bg-green-600/10 text-green-500 rounded-3xl flex items-center justify-center border border-green-500/20 shadow-lg shadow-green-900/40">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="text-right">
              <h4 className="text-base font-black text-slate-900 dark:text-white uppercase italic tracking-tight">Vagas Livres (A-D)</h4>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Estoque Geral</p>
            </div>
          </div>
          <div className="flex items-baseline gap-4">
            <p className="text-6xl md:text-8xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">{stats.freeSlots}</p>
            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest italic">Espaços</p>
              <p className="text-[10px] text-slate-600 font-bold uppercase">De {stats.totalSlots} Total</p>
            </div>
          </div>
        </div>
      </div>

      {/* Small Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Registros */}
        <div 
          className="bg-indigo-600/80 p-5 rounded-3xl shadow-xl flex items-center gap-4 group hover:bg-indigo-600 transition-all cursor-pointer" 
          onClick={() => !isPublicView && onNavigate('history')}
        >
          <div className="w-10 h-10 bg-white/20 text-white rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
            <History className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[9px] text-white/80 font-bold uppercase tracking-widest mb-0.5">Movi. (24h)</p>
            <p className="text-xl font-black text-white tracking-tight leading-none">{stats.dailyMovements}</p>
          </div>
        </div>

        {/* Aguardando Análise */}
        <div 
          className="bg-rose-600/80 p-5 rounded-3xl shadow-xl flex items-center gap-4 group hover:bg-rose-600 transition-all cursor-pointer" 
          onClick={() => !isPublicView && onNavigate('analysis')}
        >
          <div className="w-10 h-10 bg-white/20 text-white rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
            <ClipboardCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[9px] text-white/80 font-bold uppercase tracking-widest mb-0.5">Análise Pendente</p>
            <p className="text-xl font-black text-white tracking-tight leading-none">{stats.pendingEntries}</p>
          </div>
        </div>

        {/* Alocados */}
        <div className="bg-emerald-600/80 p-5 rounded-3xl shadow-xl flex items-center gap-4 hover:bg-emerald-600 transition-all">
          <div className="w-10 h-10 bg-white/20 text-white rounded-xl flex items-center justify-center">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[9px] text-white/80 font-bold uppercase tracking-widest mb-0.5">Vagas Ocupadas</p>
            <p className="text-xl font-black text-white tracking-tight leading-none">{stats.occupiedSlots}</p>
          </div>
        </div>

        {/* Carregamentos Finalizados */}
        <div 
          className="bg-blue-600/80 p-5 rounded-3xl shadow-xl flex items-center gap-4 group hover:bg-blue-600 transition-all cursor-pointer"
          onClick={() => !isPublicView && onNavigate('shipments')}
        >
          <div className="w-10 h-10 bg-white/20 text-white rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[9px] text-white/80 font-bold uppercase tracking-widest mb-0.5">Expedições (24h)</p>
            <p className="text-xl font-black text-white tracking-tight leading-none">{stats.finishedShipments24h}</p>
          </div>
        </div>

        {/* SKUs Disponíveis */}
        <div 
          className="bg-amber-600/80 p-5 rounded-3xl shadow-xl flex items-center gap-4 group hover:bg-amber-600 transition-all cursor-pointer"
          onClick={() => !isPublicView && onNavigate('inventory')}
        >
          <div className="w-10 h-10 bg-white/20 text-white rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[9px] text-white/80 font-bold uppercase tracking-widest mb-0.5">OPs Disponíveis</p>
            <p className="text-xl font-black text-white tracking-tight leading-none">{stats.uniqueSkuCount}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
export default memo(StatsSection);
