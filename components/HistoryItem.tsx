import React, { memo } from 'react';
import { HistoryEntry, HistoryType } from '../types';

interface HistoryItemProps {
  entry: HistoryEntry;
}

const HistoryItem: React.FC<HistoryItemProps> = ({ entry }) => {
  return (
    <div className="bg-slate-900/40 border border-slate-800/50 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center gap-4 hover:border-slate-700 transition-all group">
      <div className="flex flex-col items-start min-w-[120px]">
          <span className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border mb-2 ${
              entry.type === HistoryType.ENTRY ? 'bg-green-500/10 text-green-500 border-green-500/20' : 
              entry.type === HistoryType.EXIT ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 
              entry.type === HistoryType.TRANSFER ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
              entry.type === HistoryType.ALLOCATION ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' :
              entry.type === HistoryType.EDIT ? 'bg-slate-500/10 text-slate-500 border-slate-500/20' :
              'bg-red-500/10 text-red-500 border-red-500/20'
          }`}>
            {entry.type === HistoryType.ENTRY && 'Entrada'}
            {entry.type === HistoryType.EXIT && 'Saída'}
            {entry.type === HistoryType.TRANSFER && 'Transf.'}
            {entry.type === HistoryType.ALLOCATION && 'Alocação'}
            {entry.type === HistoryType.EDIT && 'Edição'}
            {entry.type === HistoryType.REMOVAL && 'Removido'}
          </span>
          <p className="text-[9px] text-slate-600 font-bold font-mono">{entry.timestamp}</p>
      </div>
      <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tight">ID: {entry.loadingId}</p>
            <div className="h-px flex-1 bg-slate-800/50"></div>
            <span className="text-[12px] font-black text-slate-400 uppercase italic">Vaga {entry.slot}</span>
          </div>
          <h4 className="text-white font-bold uppercase text-xs truncate">{entry.description}</h4>
          <div className="flex flex-wrap gap-3 mt-1">
            <span className="text-[9px] font-bold text-blue-500/80">OP {entry.op}</span>
            <span className="text-[9px] font-bold text-amber-500/80">Lote {entry.lot}</span>
            {entry.operatorName && (
              <span className="text-[9px] font-bold text-purple-500/80">Op: {entry.operatorName}</span>
            )}
          </div>
      </div>
      <div className="bg-slate-950/50 px-4 py-2.5 rounded-xl border border-slate-800/50 min-w-[140px] text-center">
        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-tight">{entry.details}</p>
      </div>
    </div>
  );
};

export default memo(HistoryItem);
