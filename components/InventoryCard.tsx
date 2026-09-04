import React, { memo } from 'react';
import { motion } from 'motion/react';
import { 
  FlaskConical, 
  Truck, 
  RefreshCw, 
  Container, 
  Package, 
  Calendar, 
  Tag, 
  Layers, 
  Hash, 
  AlertCircle, 
  Info, Link, 
  Pencil, 
  Trash2,
  Warehouse,
  ShieldAlert
} from 'lucide-react';
import { SheetRow, InspectionData, SlotContent, translateSlotContent, getContentTypeColor } from '../types';

interface InventoryCardProps {
  item: SheetRow;
  insp: InspectionData;
  idx: number;
  isSelected: boolean;
  onToggleSelection: (rowId: string, idx: number) => void;
  onShowDetail: (row: SheetRow, insp: InspectionData, idx: number) => void;
  onEdit: (row: SheetRow, insp: InspectionData, idx: number) => void;
  onDelete: (rowId: string, idx: number) => void;
  userRole?: 'admin' | 'operator';
}

const InventoryCard: React.FC<InventoryCardProps> = ({ 
  item, 
  insp, 
  idx, 
  isSelected, 
  onToggleSelection, 
  onShowDetail, 
  onEdit, 
  onDelete,
  userRole = 'admin'
}) => {
  const isRework = insp.contentType === SlotContent.REWORK;
  const isReprocess = insp.contentType === SlotContent.REPROCESS;
  const isContainer = insp.contentType === SlotContent.CONTAINER_SJ || 
                    insp.contentType === SlotContent.CONTAINER_LP || 
                    insp.contentType === SlotContent.CONTAINER_CP;
  
  const ContentIcon = insp.contentType === SlotContent.BOTTLES ? FlaskConical : 
                     insp.contentType === SlotContent.FINISHED_PRODUCT ? Truck : 
                     (isRework || isReprocess) ? RefreshCw :
                     isContainer ? Container :
                     Package;
  
  const getBaseColor = (content: SlotContent) => {
    const colors: Record<string, string> = {
      [SlotContent.BOTTLES]: 'sky',
      [SlotContent.SUPPLIES]: 'amber',
      [SlotContent.FINISHED_PRODUCT]: 'emerald',
      [SlotContent.USE_CONSUMPTION]: 'purple',
      [SlotContent.CONTAINER_SJ]: 'rose',
      [SlotContent.CONTAINER_LP]: 'blue',
      [SlotContent.CONTAINER_CP]: 'indigo',
      [SlotContent.RETURN]: 'orange',
      [SlotContent.REWORK]: 'yellow',
      [SlotContent.REPROCESS]: 'teal',
      [SlotContent.ROTATIVE]: 'pink',
      [SlotContent.DISCARD]: 'red',
    };
    return colors[content] || 'slate';
  };

  const isSupplies = insp.contentType === SlotContent.SUPPLIES;
  const baseColor = getBaseColor(insp.contentType);
  
  const totalUnits = (insp.bottles || 0) + 
                     (insp.boxes || 0) + 
                     (insp.caps || 0) + 
                     (insp.cradles || 0) + 
                     (insp.others?.reduce((acc, curr) => acc + (Number(curr.quantity) || 0), 0) || 0);

  const hasUnits = totalUnits > 0;
  const qtyValue = hasUnits ? totalUnits : (item.pallets || 1);
  const qtyLabel = hasUnits ? 'Qtd (UN)' : 'Qtd (PL)';

  return (
    <motion.div 
      onClick={() => onToggleSelection(item.id, idx)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`group bg-white dark:bg-slate-900/60 backdrop-blur-md p-6 rounded-[2rem] border transition-all duration-200 cursor-pointer relative overflow-hidden flex flex-col h-full shadow-lg ${
        isSelected 
          ? 'ring-2 ring-purple-500/50 bg-purple-50 dark:bg-purple-900/10 border-purple-500/50' 
          : insp.withoutSeal && insp.datedBottles
          ? 'border-red-500/40 dark:border-red-500/30 hover:border-red-500/60 hover:shadow-xl'
          : insp.withoutSeal
          ? 'border-red-500/30 dark:border-red-500/20 hover:border-red-500/50 hover:shadow-xl'
          : insp.datedBottles
          ? 'border-amber-500/30 dark:border-amber-500/20 hover:border-amber-500/50 hover:shadow-xl'
          : `border-slate-200 dark:border-slate-800 hover:border-${baseColor}-500/30 hover:shadow-xl`
      }`}
    >
      {/* Top Warning Strips */}
      {insp.withoutSeal && !insp.datedBottles && (
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-red-500 to-orange-500 z-20" />
      )}
      {insp.datedBottles && !insp.withoutSeal && (
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-500 to-yellow-400 z-20" />
      )}
      {insp.withoutSeal && insp.datedBottles && (
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-red-500 via-amber-500 to-yellow-400 z-20" />
      )}

      {/* Background Icon Accent - Reduced size for better perf */}
      <div className={`absolute -top-6 -right-6 opacity-[0.03] group-hover:opacity-[0.1] transition-all duration-300 text-${baseColor}-500`}>
        <ContentIcon className="w-40 h-40" />
      </div>

      <div className="relative z-10 flex flex-col h-full">
        {/* Header Info */}
        <div className="flex justify-between items-start mb-5 relative">
          <div className="flex flex-col gap-2">
            <div className={`w-12 h-12 bg-${baseColor}-500/10 text-${baseColor}-500 rounded-xl flex items-center justify-center border border-${baseColor}-500/20 shadow-lg shadow-${baseColor}-900/10 group-hover:scale-105 transition-transform`}>
              <ContentIcon className="w-6 h-6" />
            </div>
            
            {insp.withoutSeal && (
              <div className="bg-red-500 text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg shadow-lg flex items-center gap-1.5 border border-red-600/50 animate-pulse mt-1">
                <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                <span>SEM SELO</span>
              </div>
            )}

            {insp.datedBottles && (
              <div className="bg-amber-500 text-slate-950 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg shadow-lg flex items-center gap-1.5 border border-amber-600/50 mt-1">
                <Calendar className="w-3.5 h-3.5 shrink-0" />
                <span>FRASCO DATADO</span>
              </div>
            )}

            {item.is_group && (
              <div className="bg-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg shadow-lg flex items-center gap-1.5 border border-emerald-500/30 mt-1">
                <Layers className="w-3 h-3" />
                CONSOLIDADO
              </div>
            )}

          </div>

          <div className="text-right">
            <div className="flex items-center gap-2 justify-end mb-1">
              <span className={`w-2 h-2 rounded-full bg-${baseColor}-500`} />
              <span className={`text-[14px] font-black uppercase tracking-widest italic ${
                insp.assignedSlot === 'AGUARDANDO' ? 'text-amber-500' :
                insp.assignedSlot?.startsWith('D') ? 'text-green-500' : 
                `text-${baseColor}-500 dark:text-${baseColor}-400`
              }`}>
                {insp.assignedSlot === 'AGUARDANDO' ? 'AG. VAGA' : `Vaga ${insp.assignedSlot}`}
              </span>
            </div>
            <div className="flex items-center gap-1.5 justify-end text-slate-500">
              <Calendar className="w-3 h-3" />
              <p className="text-[8px] font-bold uppercase tracking-widest">{item.date}</p>
            </div>
          </div>
        </div>

        {/* Product Info */}
        <div className="flex-1 space-y-4 mb-6">
          <div>
            <h4 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tighter italic leading-tight line-clamp-2 min-h-[2.5rem]">
              {item.description}
            </h4>
            {item.operatorName && (
              <p className="text-[7px] text-slate-500 font-black uppercase tracking-[0.2em] mt-1.5">Operador: {item.operatorName}</p>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-slate-50 dark:bg-slate-950/40 p-3 rounded-xl border border-slate-200 dark:border-slate-800/30">
              <p className="text-[7px] text-slate-600 font-bold uppercase mb-1 tracking-widest flex items-center gap-1.5">
                <Tag className="w-2.5 h-2.5" /> OP Origem
              </p>
              <p className={`text-[10px] font-black text-${baseColor}-600 dark:text-${baseColor}-400 font-mono italic`}>{item.originOP || 'N/A'}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-950/40 p-3 rounded-xl border border-slate-200 dark:border-slate-800/30">
              <p className="text-[7px] text-slate-600 font-bold uppercase mb-1 tracking-widest flex items-center gap-1.5">
                <Layers className="w-2.5 h-2.5" /> Lote
              </p>
              <p className="text-[10px] font-black text-slate-900 dark:text-white font-mono italic">{item.lot || 'N/A'}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-950/40 p-3 rounded-xl border border-slate-200 dark:border-slate-800/30">
              <p className="text-[7px] text-slate-600 font-bold uppercase mb-1 tracking-widest flex items-center gap-1.5">
                <Hash className="w-2.5 h-2.5" /> {qtyLabel}
              </p>
              <p className="text-[10px] font-black text-green-600 dark:text-green-400 font-mono italic">{qtyValue}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-950/40 p-3 rounded-xl border border-slate-200 dark:border-slate-800/30">
              <p className="text-[7px] text-slate-600 font-bold uppercase mb-1 tracking-widest flex items-center gap-1.5">
                <Warehouse className="w-2.5 h-2.5" /> Vaga
              </p>
              <p className={`text-[10px] font-black text-blue-600 dark:text-blue-400 font-mono italic`}>{insp.assignedSlot || 'N/A'}</p>
            </div>
            <div className="col-span-2 bg-slate-50 dark:bg-slate-950/40 p-3 rounded-xl border border-slate-200 dark:border-slate-800/30">
              <p className="text-[7px] text-slate-600 font-bold uppercase mb-1 tracking-widest flex items-center gap-1.5">
                <Package className="w-2.5 h-2.5" /> Tipo
              </p>
              <p className={`text-[10px] font-black uppercase italic ${getContentTypeColor(insp.contentType)} text-center`}>
                {translateSlotContent(insp.contentType)}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button 
            onClick={(e) => { e.stopPropagation(); onShowDetail(item, insp, idx); }} 
            className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-950/50 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
          >
            <Info className="w-3.5 h-3.5" /> Detalhes
          </button>

          <button 
            onClick={(e) => { 
              e.stopPropagation(); 
              onEdit(item, insp, idx); 
            }} 
            className={`flex-1 py-2.5 bg-slate-100 dark:bg-slate-950/50 hover:bg-${baseColor}-500/10 text-${baseColor}-600 dark:text-${baseColor}-400 border border-slate-200 dark:border-slate-800 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2`}
          >
            <Pencil className="w-3.5 h-3.5" /> {userRole === 'admin' ? 'Editar' : 'Solicitar'}
          </button>
          
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(item.id, idx); }}
            className="p-2.5 bg-slate-100 dark:bg-slate-950/50 hover:bg-red-600/10 text-red-600 dark:text-red-500 border border-slate-200 dark:border-slate-800 rounded-xl transition-all flex items-center justify-center"
            title="Remover do estoque"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default memo(InventoryCard);
