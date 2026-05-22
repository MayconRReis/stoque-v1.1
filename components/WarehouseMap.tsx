import React, { memo, useMemo } from 'react';
import { motion } from 'motion/react';
import { WarehouseSlot, SlotContent } from '../types';
import SlotCell from './SlotCell';

interface WarehouseMapProps {
  slots: WarehouseSlot[];
  onSlotClick: (slot: WarehouseSlot) => void;
}

const RackView: React.FC<{ 
  rack: 'A' | 'B' | 'C' | 'D' | 'E' | 'F'; 
  slots: WarehouseSlot[]; 
  onSlotClick: (slot: WarehouseSlot) => void;
}> = memo(({ rack, slots, onSlotClick }) => {
  const rackSlots = useMemo(() => slots.filter(s => s.rack === rack), [slots, rack]);
  const freeCount = useMemo(() => rackSlots.filter(s => s.status === SlotContent.EMPTY).length, [rackSlots]);
  const totalCount = rackSlots.length;
  
  const rackTitles = {
    'A': 'Frascos (G0)',
    'B': 'Insumos / Acabados',
    'C': 'Insumos / Acabados',
    'D': 'Outros / Acabados',
    'E': 'Containers',
    'F': 'Containers'
  };

  const getContainerColor = (status: SlotContent) => {
    switch(status) {
      case SlotContent.CONTAINER_SJ: return 'text-rose-500';
      case SlotContent.CONTAINER_LP: return 'text-blue-500';
      case SlotContent.CONTAINER_CP: return 'text-indigo-500';
      default: return 'text-slate-400';
    }
  };

  return (
    <div className="bg-slate-900/40 p-5 md:p-8 rounded-[2.5rem] border border-slate-800/50 shadow-xl overflow-hidden mb-6">
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <div className="flex items-center gap-3">
           <div className={`w-1.5 h-8 rounded-full ${
             rack === 'D' ? 'bg-green-600' : 
             rack === 'A' ? 'bg-blue-600' : 
             (rack === 'E' || rack === 'F') ? 'bg-purple-600' :
             'bg-amber-600'
           }`}></div>
           <div className="flex flex-col">
              <h4 className="text-lg font-black text-white uppercase tracking-tighter flex items-center gap-2 italic">
                Porta Pallet {rack} <span className="text-slate-500 font-medium text-sm">/ {rackTitles[rack]}</span>
              </h4>
              <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">Layout de Armazenagem G0</p>
           </div>
        </div>
        
        <div className="bg-slate-950/50 px-4 py-2 rounded-xl border border-slate-800/50 flex items-center gap-6">
          <div className="flex flex-col items-center">
            <span className="text-[8px] text-slate-600 font-bold uppercase mb-0.5">Disponíveis</span>
            <span className="text-sm font-black text-blue-500">{freeCount}</span>
          </div>
          <div className="w-px h-6 bg-slate-800/50"></div>
          <div className="flex flex-col items-center">
            <span className="text-[8px] text-slate-600 font-bold uppercase mb-0.5">Capacidade</span>
            <span className="text-sm font-black text-white">{totalCount}</span>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-2">
        {rackSlots.map(slot => (
          <SlotCell 
            key={slot.id} 
            slot={slot} 
            onClick={onSlotClick} 
            getContainerColor={getContainerColor} 
          />
        ))}
      </div>
    </div>
  );
});

const WarehouseMap: React.FC<WarehouseMapProps> = ({ slots, onSlotClick }) => {
  return (
    <div className="animate-in fade-in duration-500 max-w-7xl mx-auto space-y-8">
      {(['A', 'B', 'C', 'D', 'E', 'F'] as const).map(rack => (
        <RackView 
          key={rack} 
          rack={rack} 
          slots={slots} 
          onSlotClick={onSlotClick} 
        />
      ))}
    </div>
  );
};

export default memo(WarehouseMap);
