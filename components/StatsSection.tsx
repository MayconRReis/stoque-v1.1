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
        <div className="bg-slate-900/60 p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl hover:border-blue-500/30 transition-all relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:opacity-10 transition-opacity">
            <FlaskConical className="w-40 h-40" />
          </div>
          <div className="flex justify-between items-start mb-6">
            <div className="w-16 h-16 bg-blue-600/10 text-blue-500 rounded-3xl flex items-center justify-center border border-blue-500/20 shadow-lg shadow-blue-900/40">
              <FlaskConical className="w-8 h-8" />
            </div>
            <div className="text-right">
              <h4 className="text-base font-black text-white uppercase italic tracking-tight">Total de Frascos</h4>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Estoque Consolidado</p>
            </div>
          </div>
          <div className="flex items-baseline gap-4">
            <p className="text-6xl md:text-8xl font-black text-white tracking-tighter leading-none">{stats.totalBottles.toLocaleString()}</p>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest italic">Unidades</p>
          </div>
        </div>

        <div className="bg-slate-900/60 p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl hover:border-green-500/30 transition-all relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:opacity-10 transition-opacity">
            <CheckCircle2 className="w-40 h-40" />
          </div>
          <div className="flex justify-between items-start mb-6">
            <div className="w-16 h-16 bg-green-600/10 text-green-500 rounded-3xl flex items-center justify-center border border-green-500/20 shadow-lg shadow-green-900/40">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="text-right">
              <h4 className="text-base font-black text-white uppercase italic tracking-tight">Vagas Livres (A-D)</h4>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Estoque Geral</p>
            </div>
          </div>
          <div className="flex items-baseline gap-4">
            <p className="text-6xl md:text-8xl font-black text-white tracking-tighter leading-none">{stats.freeSlots}</p>
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
          className="bg-slate-900/40 p-5 rounded-3xl border border-slate-800/50 shadow-xl flex items-center gap-4 group hover:border-indigo-500/30 transition-all cursor-pointer" 
          onClick={() => !isPublicView && onNavigate('history')}
        >
          <div className="w-10 h-10 bg-indigo-600/10 text-indigo-500 rounded-xl flex items-center justify-center border border-indigo-500/20 group-hover:scale-105 transition-transform">
            <History className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-0.5">Movi. (24h)</p>
            <p className="text-xl font-black text-white tracking-tight leading-none">{stats.dailyMovements}</p>
          </div>
        </div>

        {/* Aguardando Análise */}
        <div 
          className="bg-slate-900/40 p-5 rounded-3xl border border-slate-800/50 shadow-xl flex items-center gap-4 group hover:border-red-500/30 transition-all cursor-pointer" 
          onClick={() => !isPublicView && onNavigate('analysis')}
        >
          <div className="w-10 h-10 bg-red-600/10 text-red-500 rounded-xl flex items-center justify-center border border-red-500/20 group-hover:scale-105 transition-transform">
            <ClipboardCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-0.5">Análise Pendente</p>
            <p className="text-xl font-black text-rose-500 tracking-tight leading-none">{stats.pendingEntries}</p>
          </div>
        </div>

        {/* Alocados */}
        <div className="bg-slate-900/40 p-5 rounded-3xl border border-slate-800/50 shadow-xl flex items-center gap-4 hover:border-emerald-500/30 transition-all">
          <div className="w-10 h-10 bg-emerald-600/10 text-emerald-500 rounded-xl flex items-center justify-center border border-emerald-500/20">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-0.5">Vagas Ocupadas</p>
            <p className="text-xl font-black text-emerald-500 tracking-tight leading-none">{stats.occupiedSlots}</p>
          </div>
        </div>

        {/* Carregamentos Finalizados */}
        <div 
          className="bg-slate-900/40 p-5 rounded-3xl border border-slate-800/50 shadow-xl flex items-center gap-4 group hover:border-blue-500/30 transition-all cursor-pointer"
          onClick={() => !isPublicView && onNavigate('shipments')}
        >
          <div className="w-10 h-10 bg-blue-600/10 text-blue-500 rounded-xl flex items-center justify-center border border-blue-500/20 group-hover:scale-105 transition-transform">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-0.5">Expedições (24h)</p>
            <p className="text-xl font-black text-blue-400 tracking-tight leading-none">{stats.finishedShipments24h}</p>
          </div>
        </div>

        {/* Carregamentos Abertos */}
        <div 
          className="bg-slate-900/40 p-5 rounded-3xl border border-slate-800/50 shadow-xl flex items-center gap-4 group hover:border-amber-500/30 transition-all cursor-pointer"
          onClick={() => !isPublicView && onNavigate('shipments')}
        >
          <div className="w-10 h-10 bg-amber-600/10 text-amber-500 rounded-xl flex items-center justify-center border border-amber-500/20 group-hover:scale-105 transition-transform">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-0.5">Carreg. Abertos</p>
            <p className="text-xl font-black text-amber-500 tracking-tight leading-none">{stats.openShipmentsCount}</p>
          </div>
        </div>
      </div>

      {/* Container Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-slate-900/40 p-5 rounded-3xl border border-slate-800/50 shadow-xl flex items-center gap-4 hover:border-indigo-500/30 transition-all">
          <div className="w-10 h-10 bg-indigo-600/10 text-indigo-500 rounded-xl flex items-center justify-center border border-indigo-500/20">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-0.5">Capacidade Containers</p>
            <p className="text-xl font-black text-white tracking-tight leading-none">{stats.containerTotalSlots}</p>
          </div>
        </div>

        <div className="bg-slate-900/40 p-5 rounded-3xl border border-slate-800/50 shadow-xl flex items-center gap-4 hover:border-fuchsia-500/30 transition-all">
          <div className="w-10 h-10 bg-fuchsia-600/10 text-fuchsia-500 rounded-xl flex items-center justify-center border border-fuchsia-500/20">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-0.5">Containers Ocupados</p>
            <p className="text-xl font-black text-fuchsia-500 tracking-tight leading-none">{stats.containerOccupiedSlots}</p>
          </div>
        </div>

        <div className="bg-slate-900/40 p-5 rounded-3xl border border-slate-800/50 shadow-xl flex items-center gap-4 hover:border-emerald-500/30 transition-all">
          <div className="w-10 h-10 bg-emerald-600/10 text-emerald-500 rounded-xl flex items-center justify-center border border-emerald-500/20">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-0.5">Posições Livres (E-F)</p>
            <p className="text-xl font-black text-emerald-500 tracking-tight leading-none">{stats.containerFreeSlots}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(StatsSection);
