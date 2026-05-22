import React, { memo } from 'react';
import { 
  FlaskConical, 
  Truck, 
  RefreshCw, 
  Container, 
  TrendingUp, 
  Package 
} from 'lucide-react';
import { WarehouseSlot, SlotContent } from '../types';

interface SlotCellProps {
  slot: WarehouseSlot;
  onClick: (slot: WarehouseSlot) => void;
  getContainerColor: (status: SlotContent) => string;
}

const SlotCell: React.FC<SlotCellProps> = ({ slot, onClick, getContainerColor }) => {
  const isContainer = slot.status === SlotContent.CONTAINER_SJ || 
                    slot.status === SlotContent.CONTAINER_LP || 
                    slot.status === SlotContent.CONTAINER_CP;
  
  const containerColor = getContainerColor(slot.status);
  const isRotative = slot.status === SlotContent.ROTATIVE;

  const ContentIcon = slot.status === SlotContent.EMPTY ? undefined : 
                     slot.status === SlotContent.BOTTLES ? FlaskConical : 
                     slot.status === SlotContent.FINISHED_PRODUCT ? Truck : 
                     (slot.status === SlotContent.REWORK || slot.status === SlotContent.REPROCESS) ? RefreshCw :
                     isContainer ? Container :
                     isRotative ? TrendingUp :
                     Package;

  return (
    <div 
      onClick={() => onClick(slot)}
      className={`aspect-square rounded-xl border flex flex-col items-center justify-center p-1 transition-all duration-200 group relative cursor-pointer ${
        slot.status === SlotContent.EMPTY ? 'bg-slate-950/30 border-slate-800/50 hover:border-slate-700' : 
        slot.status === SlotContent.BOTTLES ? 'bg-blue-600/10 border-blue-600/30' : 
        slot.status === SlotContent.SUPPLIES ? 'bg-amber-600/10 border-amber-600/30' :
        isContainer ? 'bg-slate-300/10 border-slate-100/30' :
        (slot.status === SlotContent.REWORK || slot.status === SlotContent.REPROCESS) ? 'bg-purple-600/10 border-purple-600/30' :
        isRotative ? 'bg-indigo-600/10 border-indigo-600/30' :
        'bg-green-600/10 border-green-600/30'
      }`}
    >
      <span className="text-[7px] font-bold text-slate-600 mb-1">{slot.id.split('.').slice(1).join('.')}</span>
      {ContentIcon && (
        <ContentIcon className={`w-3.5 h-3.5 ${
          slot.status === SlotContent.BOTTLES ? 'text-blue-500' : 
          slot.status === SlotContent.SUPPLIES ? 'text-amber-500' :
          isContainer ? containerColor :
          (slot.status === SlotContent.REWORK || slot.status === SlotContent.REPROCESS) ? 'text-purple-500' :
          isRotative ? 'text-indigo-500' :
          'text-green-500'
        }`} />
      )}
      
      {/* Simplify tooltips to only show on desktop if needed, or remove for perf */}
    </div>
  );
};

export default memo(SlotCell);
