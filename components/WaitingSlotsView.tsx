import React from 'react';
import { motion } from 'motion/react';
import { 
  Plus, 
  MapPin, 
  Package, 
  Tag, 
  Calendar,
  Warehouse,
  AlertCircle,
  Truck,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { SheetRow, SlotContent, translateSlotContent, getContentTypeColor, StockStatus } from '../types';

interface WaitingSlotsViewProps {
  items: SheetRow[];
  onAssignSlot: (item: SheetRow, inspectionIdx: number) => void;
}

export const WaitingSlotsView: React.FC<WaitingSlotsViewProps> = ({ items, onAssignSlot }) => {
  // Extract all pallets that are waiting for a slot
  const waitingPallets = items.flatMap(row => {
    return (row.inspections || [])
      .map((insp, idx) => ({ row, insp, idx }))
      .filter(p => p.insp.assignedSlot === 'AGUARDANDO');
  });

  if (waitingPallets.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-32 text-center animate-in fade-in duration-700">
        <div className="w-24 h-24 bg-slate-900/40 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 border border-slate-800">
          <Warehouse className="w-10 h-10 text-slate-700" />
        </div>
        <h3 className="text-xl font-black text-white uppercase italic tracking-tighter mb-2">Tudo em ordem!</h3>
        <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em]">Não há pallets aguardando vaga no momento.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 pb-20 animate-in fade-in slide-in-from-bottom-5 duration-700">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {waitingPallets.map(({ row, insp, idx }) => (
          <motion.div 
            key={`${row.id}-${idx}`}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -5 }}
            className="group bg-slate-900/60 backdrop-blur-xl rounded-[2.5rem] border border-slate-800 hover:border-amber-500/50 transition-all p-7 relative overflow-hidden flex flex-col h-full shadow-lg hover:shadow-amber-500/10"
          >
            {/* Background Icon Accent */}
            <div className="absolute -top-10 -right-10 opacity-[0.05] group-hover:opacity-[0.5] transition-all duration-500">
              <MapPin className="w-56 h-56 text-amber-500" />
            </div>

            {/* Gradient Glow */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-amber-500/10 blur-[80px] rounded-full group-hover:bg-amber-500/20 transition-all" />

            <div className="relative z-10 flex flex-col h-full">
              {/* Header Info */}
              <div className="flex justify-between items-start mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-amber-500/20 to-amber-600/5 text-amber-400 rounded-2xl flex items-center justify-center border border-amber-500/20 shadow-xl shadow-amber-950/20 group-hover:scale-110 transition-transform">
                  <MapPin className="w-7 h-7" />
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 justify-end mb-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                    <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest italic">Aguardando Vaga</span>
                  </div>
                  <div className="flex items-center gap-1.5 justify-end text-slate-500">
                    <Calendar className="w-3 h-3" />
                    <p className="text-[9px] font-bold uppercase tracking-widest">{row.date}</p>
                  </div>
                </div>
              </div>

              {/* Product Info */}
              <div className="flex-1 space-y-5 mb-8">
                <div>
                  <h4 className="text-lg font-black text-white uppercase tracking-tighter italic leading-[1.1] line-clamp-2 min-h-[2.5rem] group-hover:text-amber-300 transition-colors">
                    {row.description}
                  </h4>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-950/50 p-3.5 rounded-2xl border border-slate-800/30 group-hover:border-slate-800 transition-colors">
                    <p className="text-[7px] text-slate-600 font-bold uppercase mb-1.5 tracking-widest flex items-center gap-1.5">
                      <Tag className="w-2.5 h-2.5" /> OP Origem
                    </p>
                    <p className="text-xs font-black text-blue-400 font-mono italic">{row.originOP || 'N/A'}</p>
                  </div>
                  <div className="bg-slate-950/50 p-3.5 rounded-2xl border border-slate-800/30 group-hover:border-slate-800 transition-colors">
                    <p className="text-[7px] text-slate-600 font-bold uppercase mb-1.5 tracking-widest flex items-center gap-1.5">
                      <Layers className="w-2.5 h-2.5" /> Lote
                    </p>
                    <p className="text-xs font-black text-amber-400 font-mono italic">{row.lot || 'N/A'}</p>
                  </div>
                  <div className="bg-slate-950/50 p-3.5 rounded-2xl border border-slate-800/30 group-hover:border-slate-800 transition-colors">
                    <p className="text-[7px] text-slate-600 font-bold uppercase mb-1.5 tracking-widest flex items-center gap-1.5">
                      <AlertCircle className="w-2.5 h-2.5" /> ID Final
                    </p>
                    <p className="text-xs font-black text-[#955251] font-mono italic">{row.loadingId || 'AGUARDANDO'}</p>
                  </div>
                  <div className="bg-slate-950/50 p-3.5 rounded-2xl border border-slate-800/30 group-hover:border-slate-800 transition-colors">
                    <p className="text-[7px] text-slate-600 font-bold uppercase mb-1.5 tracking-widest flex items-center gap-1.5">
                      <Package className="w-2.5 h-2.5" /> Tipo
                    </p>
                    <p className={`text-xs font-black uppercase italic ${getContentTypeColor(insp.contentType)}`}>
                      {translateSlotContent(insp.contentType)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button 
                onClick={() => onAssignSlot(row, idx)}
                className="w-full py-4 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.25em] transition-all shadow-xl shadow-amber-900/40 active:scale-95 flex items-center justify-center relative overflow-hidden"
              >
                ESCOLHER VAGA
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
