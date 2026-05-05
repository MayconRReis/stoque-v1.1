import React, { memo, useMemo } from 'react';
import { motion } from 'motion/react';
import { WarehouseSlot, SlotContent } from '../types';

interface RackDistributionChartProps {
  slots: WarehouseSlot[];
  waitingPallets: number;
}

const RackDistributionChart: React.FC<RackDistributionChartProps> = ({ slots, waitingPallets }) => {
  const rackData = useMemo(() => {
    return (['A', 'B', 'C', 'D', 'E', 'F'] as const).map(rack => {
      const rackSlots = slots.filter(s => s.rack === rack);
      const occupied = rackSlots.filter(s => s.status !== SlotContent.EMPTY).length;
      const totalCapacities: Record<string, number> = {
        A: 48, B: 48, C: 48,
        D: 54,
        E: 45, F: 45
      };
      const total = totalCapacities[rack] || 32;
      const rate = Math.round((occupied / total) * 100);
      const color = 
        rack === 'A' ? 'bg-blue-600' : 
        rack === 'B' ? 'bg-amber-600' : 
        rack === 'C' ? 'bg-indigo-600' : 
        rack === 'D' ? 'bg-green-600' :
        'bg-purple-600';
      
      return { rack, occupied, total, rate, color };
    });
  }, [slots]);

  return (
    <div className="bg-slate-900/40 p-8 md:p-10 rounded-[2.5rem] border border-slate-800/50 shadow-2xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h4 className="text-lg font-black text-white uppercase italic tracking-tighter leading-none">Distribuição por Rack</h4>
          <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest mt-1">Ocupação Setorial Armazém G0</p>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Ocupação</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-purple-600"></div>
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Aguardando</span>
          </div>
        </div>
      </div>
      <div className="space-y-6">
        {rackData.map(item => (
          <div key={item.rack} className="space-y-2">
            <div className="flex justify-between items-end">
              <span className="text-[10px] font-black text-white uppercase tracking-widest italic leading-none">Porta Pallet {item.rack}</span>
              <span className="text-[10px] font-black text-slate-400 leading-none">{item.rate}% ({item.occupied}/{item.total})</span>
            </div>
            <div className="h-1.5 bg-slate-950 rounded-full border border-slate-800 overflow-hidden relative">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(item.rate, 100)}%` }}
                className={`h-full ${item.color} rounded-full`}
              />
              {item.rate > 100 && (
                <div className="absolute top-0 right-0 bottom-0 w-8 bg-gradient-to-l from-red-600/40 to-transparent animate-pulse" />
              )}
            </div>
          </div>
        ))}
        
        {waitingPallets > 0 && (
          <div className="pt-4 mt-4 border-t border-slate-800/50 space-y-2">
            <div className="flex justify-between items-end">
              <span className="text-[10px] font-black text-purple-500 uppercase tracking-widest italic leading-none">Aguardando Vaga Geral</span>
              <span className="text-[10px] font-black text-slate-400 leading-none">{waitingPallets} Pallets</span>
            </div>
            <div className="h-1.5 bg-slate-950 rounded-full border border-slate-800 overflow-hidden">
               <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((waitingPallets / 45) * 100, 100)}%` }}
                  className="h-full bg-purple-600 rounded-full animate-pulse"
               />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(RackDistributionChart);
