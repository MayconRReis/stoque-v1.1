import React, { memo } from 'react';
import { motion } from 'motion/react';
import { 
  FlaskConical, 
  Truck, 
  RefreshCw, 
  Container, 
  Package, 
  CheckCircle2, 
  Calendar, 
  Tag, 
  Layers, 
  Hash, 
  AlertCircle, 
  Info, 
  Pencil, 
  Trash2,
  Warehouse 
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
  const isBottles = insp.contentType === SlotContent.BOTTLES;
  const baseColor = getBaseColor(insp.contentType);
  
  const qtyValue = isSupplies 
    ? (insp.bottles || insp.boxes || insp.caps || insp.cradles || 0)
    : (isBottles ? (insp.bottles || item.pallets) : item.pallets);
  
  const qtyLabel = (isSupplies || isBottles) ? 'Qtd (UN)' : 'Qtd (PL)';

  return (
    <motion.div 
      onClick={() => onToggleSelection(item.id, idx)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`group bg-slate-900/60 backdrop-blur-md p-6 rounded-[2rem] border border-slate-800 transition-all duration-200 cursor-pointer relative overflow-hidden flex flex-col h-full ${
        isSelected 
          ? 'ring-2 ring-purple-500/50 bg-purple-900/10 border-purple-500/50' 
          : `hover:border-${baseColor}-500/30`
      }`}
    >
      {/* Background Icon Accent - Reduced size for better perf */}
      <div className={`absolute -top-6 -right-6 opacity-[0.03] group-hover:opacity-[0.1] transition-all duration-300 text-${baseColor}-500`}>
        <ContentIcon className="w-40 h-40" />
      </div>

      <div className="relative z-10 flex flex-col h-full">
        {/* Selection Indicator */}
        <div className={`absolute -top-1 -left-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-purple-600 border-purple-400 text-white shadow-lg shadow-purple-500/20' : 'bg-slate-950/50 border-slate-800 text-transparent'}`}>
          <CheckCircle2 className="w-3.5 h-3.5" />
        </div>

        {/* Header Info */}
        <div className="flex justify-between items-start mb-5 pl-5">
          <div className={`w-12 h-12 bg-${baseColor}-500/10 text-${baseColor}-400 rounded-xl flex items-center justify-center border border-${baseColor}-500/20 shadow-lg shadow-${baseColor}-950/10 group-hover:scale-105 transition-transform`}>
            <ContentIcon className="w-6 h-6" />
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 justify-end mb-1">
              <span className={`w-2 h-2 rounded-full bg-${baseColor}-500`} />
              <span className={`text-[14px] font-black uppercase tracking-widest italic ${
                insp.assignedSlot === 'AGUARDANDO' ? 'text-amber-500' :
                insp.assignedSlot?.startsWith('D') ? 'text-green-500' : 
                `text-${baseColor}-400`
              }`}>
                {insp.assignedSlot === 'AGUARDANDO' ? 'Aguardando Vaga' : `Vaga ${insp.assignedSlot}`}
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
            <h4 className="text-base font-black text-white uppercase tracking-tighter italic leading-tight line-clamp-2 min-h-[2.5rem]">
              {item.description}
            </h4>
            {item.operatorName && (
              <p className="text-[7px] text-slate-500 font-black uppercase tracking-[0.2em] mt-1.5">Operador: {item.operatorName}</p>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/30">
              <p className="text-[7px] text-slate-600 font-bold uppercase mb-1 tracking-widest flex items-center gap-1.5">
                <Tag className="w-2.5 h-2.5" /> OP Origem
              </p>
              <p className={`text-[10px] font-black text-${baseColor}-400 font-mono italic`}>{item.originOP || 'N/A'}</p>
            </div>
            <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/30">
              <p className="text-[7px] text-slate-600 font-bold uppercase mb-1 tracking-widest flex items-center gap-1.5">
                <Layers className="w-2.5 h-2.5" /> Lote
              </p>
              <p className="text-[10px] font-black text-white font-mono italic">{item.lot || 'N/A'}</p>
            </div>
            <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/30">
              <p className="text-[7px] text-slate-600 font-bold uppercase mb-1 tracking-widest flex items-center gap-1.5">
                <Hash className="w-2.5 h-2.5" /> {qtyLabel}
              </p>
              <p className="text-[10px] font-black text-green-400 font-mono italic">{qtyValue}</p>
            </div>
            <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/30">
              <p className="text-[7px] text-slate-600 font-bold uppercase mb-1 tracking-widest flex items-center gap-1.5">
                <Warehouse className="w-2.5 h-2.5" /> Vaga
              </p>
              <p className={`text-[10px] font-black text-blue-400 font-mono italic`}>{insp.assignedSlot || 'N/A'}</p>
            </div>
            <div className="col-span-2 bg-slate-950/40 p-3 rounded-xl border border-slate-800/30">
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
            className="flex-1 py-2.5 bg-slate-950/50 hover:bg-slate-800 text-slate-400 border border-slate-800 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
          >
            <Info className="w-3.5 h-3.5" /> Detalhes
          </button>

          <button 
            onClick={(e) => { 
              e.stopPropagation(); 
              onEdit(item, insp, idx); 
            }} 
            className={`flex-1 py-2.5 bg-slate-950/50 hover:bg-${baseColor}-500/10 text-${baseColor}-400 border border-slate-800 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2`}
          >
            <Pencil className="w-3.5 h-3.5" /> {userRole === 'admin' ? 'Editar' : 'Solicitar Alteração'}
          </button>
          
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(item.id, idx); }}
            className="p-2.5 bg-slate-950/50 hover:bg-red-600/10 text-red-500 border border-slate-800 rounded-xl transition-all flex items-center justify-center"
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
