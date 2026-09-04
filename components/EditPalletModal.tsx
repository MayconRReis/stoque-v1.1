
import React, { useState, useEffect } from 'react';
import { SheetRow, InspectionData, SlotContent, WarehouseSlot, SHAREABLE_SLOT_TYPES } from '../types';
import { 
  Pencil, 
  X, 
  Save,
  Hash,
  Tag,
  FileText,
  FlaskConical,
  Package,
  Truck,
  Box,
  Container,
  Warehouse,
  Check,
  LayoutGrid,
  Trash2,
  MoreHorizontal,
  RefreshCw,
  MapPin,
  ChevronDown,
  ShieldAlert,
  Sparkles,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatOP } from '../lib/formatters';
import { supabaseService } from '../services/supabaseService';

interface EditPalletModalProps {
  isOpen: boolean;
  onClose: () => void;
    onSave: (updatedData: { 
      description: string; 
      op: string; 
      lot: string; 
      quantity: number;
      contentType: SlotContent;
      assignedSlot?: string;
      reason?: string;
      withoutSeal?: boolean;
      supplyDetails?: {
        bottles: number;
        caps: number;
        boxes: number;
        cradles: number;
        others: { name: string; quantity: number }[];
      }
    }) => void;
  pallet: { row: SheetRow; inspection: InspectionData; idx: number } | null;
  history: any[];
  availableSlots: WarehouseSlot[];
  allSlots: WarehouseSlot[];
  mode?: 'edit' | 'assign';
  userRole?: 'admin' | 'operator';
}

export const EditPalletModal: React.FC<EditPalletModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  pallet, 
  history, 
  availableSlots,
  allSlots,
  mode = 'edit',
  userRole = 'admin'
}) => {
  const [description, setDescription] = useState('');
  const [op, setOp] = useState('');
  const [lot, setLot] = useState('');
  const [quantity, setQuantity] = useState(0);
  const [contentType, setContentType] = useState<SlotContent>(SlotContent.BOTTLES);
  const [assignedSlot, setAssignedSlot] = useState<string>('');
  const [isAutoFilled, setIsAutoFilled] = useState(false);
  const [reason, setReason] = useState('');

  // Logic to determine available slots
  const computedAvailableSlots = React.useMemo(() => {
    return allSlots.filter(s => {
      // If it's already assigned specifically to this pallet index in the DB, it's available for this modal's "edit"
      if (s.id === pallet?.inspection.assignedSlot) return true;
      
      if (s.status === SlotContent.EMPTY) return true;
      
      // If the current slot is occupied by a shareable type AND the item we are entering is shareable
      if (SHAREABLE_SLOT_TYPES.includes(contentType) && SHAREABLE_SLOT_TYPES.includes(s.status)) {
        return true;
      }
      
      return false;
    });
  }, [allSlots, contentType, pallet]);
  
  // Supply Details State
  const [bottles, setBottles] = useState(0);
  const [caps, setCaps] = useState(0);
  const [boxes, setBoxes] = useState(0);
  const [cradles, setCradles] = useState(0);
  const [withoutSeal, setWithoutSeal] = useState(false);
  const [datedBottles, setDatedBottles] = useState(false);
  const [others, setOthers] = useState<{ id: string; name: string; quantity: number }[]>([]);

  useEffect(() => {
    if (pallet) {
      setDescription(pallet.row.description);
      setOp(pallet.row.originOP);
      setLot(pallet.row.lot);
      const totalUnits = (pallet.inspection.bottles || 0) + 
                         (pallet.inspection.boxes || 0) + 
                         (pallet.inspection.caps || 0) + 
                         (pallet.inspection.cradles || 0) + 
                         (pallet.inspection.others?.reduce((acc, curr) => acc + (Number(curr.quantity) || 0), 0) || 0);

      setQuantity(totalUnits > 0 ? totalUnits : pallet.row.pallets);
      setContentType(pallet.inspection.contentType || SlotContent.BOTTLES);
      setAssignedSlot(pallet.inspection.assignedSlot || '');
      
      setBottles(pallet.inspection.bottles || 0);
      setCaps(pallet.inspection.caps || 0);
      setBoxes(pallet.inspection.boxes || 0);
      setCradles(pallet.inspection.cradles || 0);
      setWithoutSeal(pallet.inspection.withoutSeal || false);
      setDatedBottles(pallet.inspection.datedBottles || false);
      setOthers(pallet.inspection.others?.map(o => ({ ...o, id: Math.random().toString(36).substring(2, 9) })) || []);
      setIsAutoFilled(false);
    }
  }, [pallet]);

  // Auto-fill based on OP
  useEffect(() => {
    if (op.trim().length >= 3) {
      const rawOP = op.trim();
      const formattedOP = formatOP(rawOP);

      // Check local history first
      const existingInHistory = history?.find(entry => formatOP(entry.op) === formattedOP);
      if (existingInHistory && (!description || description.length < 3)) {
        setDescription(existingInHistory.description || '');
        setLot(existingInHistory.lot || lot);
        setIsAutoFilled(true);
        return;
      }

      // Also search database via supabaseService
      const timeout = setTimeout(async () => {
        try {
          const results = await supabaseService.searchOpOrProduct(rawOP);
          const match = results.find(r => formatOP(r.originOP) === formattedOP || r.originOP.toUpperCase() === rawOP.toUpperCase());
          if (match && (!description || description.length < 3)) {
            setDescription(match.description || '');
            setLot(match.lot || lot);
            if (match.contentType) {
              setContentType(match.contentType);
            }
            setIsAutoFilled(true);
          }
        } catch (e) {
          console.warn('Erro ao buscar OP no EditPalletModal:', e);
        }
      }, 300);

      return () => clearTimeout(timeout);
    }
  }, [op, history]);

  const addOther = () => {
    setOthers([...others, { id: Math.random().toString(36).substring(2, 9), name: '', quantity: 0 }]);
  };

  const updateOther = (id: string, field: 'name' | 'quantity', value: string | number) => {
    setOthers(prev => prev.map(item => item.id === id ? { ...item, [field]: field === 'name' ? (value as string).toUpperCase() : value } : item));
  };

  const removeOther = (id: string) => {
    setOthers(prev => prev.filter(item => item.id !== id));
  };

  if (!isOpen || !pallet) return null;

  const handleSave = () => {
    if (userRole === 'operator' && mode === 'edit' && !reason.trim()) {
      alert('Por favor, informe o motivo da alteração.');
      return;
    }

    onSave({
      description: description.toUpperCase(),
      op: formatOP(op),
      lot: lot.toUpperCase(),
      quantity,
      contentType,
      reason: userRole === 'operator' ? reason : undefined,
      assignedSlot: assignedSlot || pallet?.inspection.assignedSlot,
      withoutSeal,
      datedBottles,
      supplyDetails: contentType === SlotContent.SUPPLIES ? {
        bottles,
        caps,
        boxes,
        cradles,
        others: others
          .filter(o => o.name && o.quantity > 0)
          .map(({ id, name, ...rest }) => ({ ...rest, name: name.toUpperCase() }))
      } : undefined
    });

    if (userRole === 'operator') {
      setReason('');
    }
  };

  const isOperatorEdit = userRole === 'operator' && mode === 'edit';

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-2xl p-4 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[40px] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] w-full max-w-md overflow-hidden my-8"
      >
        <div className="bg-slate-200/30 dark:bg-slate-800/30 p-6 flex justify-between items-center border-b border-slate-200/50 dark:border-slate-800/50">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 ${isOperatorEdit ? 'bg-amber-600' : 'bg-blue-600'} rounded-xl flex items-center justify-center shadow-lg ${isOperatorEdit ? 'shadow-amber-900/40' : 'shadow-blue-900/40'} transform -rotate-3`}>
              <Pencil className="text-slate-900 dark:text-white w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-lg italic uppercase tracking-tighter text-slate-900 dark:text-white">
                {mode === 'assign' ? 'Alocar Pallet' : (isOperatorEdit ? 'Solicitar Alteração' : 'Editar Pallet')}
              </h3>
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                {pallet.inspection.assignedSlot === 'AGUARDANDO' ? 'Status: Em Espera' : (pallet.inspection.assignedSlot ? `Vaga ${pallet.inspection.assignedSlot}` : 'Pendente de Análise')}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center bg-slate-50/50 dark:bg-slate-950/50 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* PALLET SUMMARY - Always show basic info in assign mode */}
          {mode === 'assign' && (
            <div className="p-5 bg-slate-100/40 dark:bg-slate-900/40 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 mb-2">
              <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase italic tracking-tighter mb-4 leading-tight">
                {pallet.row.description}
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[7px] text-slate-500 font-bold uppercase tracking-widest mb-0.5">Lote</p>
                  <p className="text-xs font-black text-amber-500 font-mono italic">{pallet.row.lot}</p>
                </div>
                <div>
                  <p className="text-[7px] text-slate-500 font-bold uppercase tracking-widest mb-0.5">
                    {((pallet.inspection.bottles || 0) + (pallet.inspection.boxes || 0) + (pallet.inspection.caps || 0) + (pallet.inspection.cradles || 0)) > 0 ? 'Qtd Unidades' : 'Qtd Pallets'}
                  </p>
                  <p className="text-xs font-black text-emerald-500 font-mono italic">
                    {((pallet.inspection.bottles || 0) + (pallet.inspection.boxes || 0) + (pallet.inspection.caps || 0) + (pallet.inspection.cradles || 0)) || pallet.row.pallets}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* DESTINATION SLOT */}
          {(pallet.inspection.assignedSlot === 'AGUARDANDO' || !pallet.inspection.assignedSlot || mode === 'edit' || mode === 'assign') && (
            <div className="space-y-3 p-5 bg-purple-600/10 rounded-3xl border border-purple-500/30 shadow-lg shadow-purple-900/10">
              <div className="flex items-center gap-2 mb-1">
                <Warehouse className="w-4 h-4 text-purple-500" />
                <h4 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest italic">Escolher Vaga / Transferir</h4>
              </div>
              <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mb-2 leading-relaxed">
                Selecione uma vaga disponível para alocar ou transferir este pallet.
              </p>
              
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-500 w-3.5 h-3.5" />
                <select
                  value={assignedSlot}
                  onChange={(e) => setAssignedSlot(e.target.value)}
                  className="w-full bg-[#0B1120] border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-white font-bold text-lg uppercase focus:border-purple-600 outline-none appearance-none transition-all"
                >
                  <option value="" className="bg-blue-300 text-slate-900 font-bold uppercase tracking-widest text-lg">SELECIONAR</option>
                  <option value="AGUARDANDO" className="text-amber-500 font-bold bg-[#0B1120] text-lg">AGUARDANDO VAGA</option>
                  {computedAvailableSlots
                    .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }))
                    .map(slot => (
                      <option key={slot.id} value={slot.id} className="text-slate-200 bg-[#0B1120] text-lg">
                        {slot.id}
                      </option>
                    ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 w-3.5 h-3.5 pointer-events-none" />
              </div>

              {assignedSlot !== 'AGUARDANDO' && (
                <div className="flex items-center gap-2 px-3 py-2 bg-green-500/10 rounded-xl border border-green-500/20 animate-in zoom-in duration-200">
                  <Check className="w-3 h-3 text-green-500" />
                  <span className="text-[8px] font-black text-green-500 uppercase tracking-widest">
                    Pronto para alocar na vaga {assignedSlot}
                  </span>
                </div>
              )}
            </div>
          )}

          {mode === 'edit' && (
            <>
              {/* TIPO */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                  <Package className="w-3 h-3" /> Tipo de Conteúdo
                </label>
                <div className="relative">
                  <select
                    value={contentType}
                    onChange={(e) => setContentType(e.target.value as SlotContent)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white font-bold text-lg uppercase focus:border-blue-600 outline-none appearance-none transition-all"
                  >
                    {[
                      { id: SlotContent.CONTAINER_LP, label: 'Cont. Limpo' },
                      { id: SlotContent.CONTAINER_CP, label: 'Cont. Produto' },
                      { id: SlotContent.CONTAINER_SJ, label: 'Cont. Sujo' },
                      { id: SlotContent.DISCARD, label: 'Descarte' },
                      { id: SlotContent.MISCELLANEOUS, label: 'Diversos' },
                      { id: SlotContent.ROTATIVE, label: 'Estoque Rotativo' },
                      { id: SlotContent.BOTTLES, label: 'Frasco' },
                      { id: SlotContent.SUPPLIES, label: 'Insumo' },
                      { id: SlotContent.OTHER, label: 'Outro' },
                      { id: SlotContent.FINISHED_PRODUCT, label: 'Prod. Acabado' },
                      { id: SlotContent.REPROCESS, label: 'Reprocesso' },
                      { id: SlotContent.RETURN, label: 'Retorno' },
                      { id: SlotContent.REWORK, label: 'Retrabalho' },
                      { id: SlotContent.USE_CONSUMPTION, label: 'Uso e Consumo' }
                    ].sort((a, b) => a.label.localeCompare(b.label)).map((type) => (
                      <option key={type.id} value={type.id}>{type.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4 pointer-events-none" />
                </div>
              </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-1.5">
              <FileText className="w-3 h-3" /> Nome / Descrição
            </label>
            <textarea 
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white font-bold text-sm focus:border-blue-600 outline-none transition-all resize-none"
              placeholder="Descrição completa do item..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                <Hash className="w-3 h-3" /> OP
              </label>
              <div className="relative group">
                <input 
                  type="text" 
                  value={op}
                  onChange={e => setOp(e.target.value)}
                  className={`w-full bg-slate-50 dark:bg-slate-950 border ${isAutoFilled ? 'border-green-500/50' : 'border-slate-200 dark:border-slate-800'} rounded-xl px-4 py-3 text-slate-900 dark:text-white font-bold text-sm focus:border-blue-600 outline-none transition-all`}
                />
                {isAutoFilled && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 flex items-center gap-1 bg-green-500/10 px-1.5 py-0.5 rounded border border-green-500/20">
                    <Check className="w-2.5 h-2.5" />
                    <span className="text-[7px] font-black uppercase tracking-tighter">Auto</span>
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                <Tag className="w-3 h-3" /> Lote
              </label>
              <input 
                type="text" 
                inputMode="numeric"
                value={lot}
                onChange={e => setLot(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white font-bold text-sm focus:border-blue-600 outline-none transition-all"
              />
            </div>
          </div>

          {contentType !== SlotContent.CONTAINER_SJ && contentType !== SlotContent.CONTAINER_LP && (
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                <Hash className="w-3 h-3" /> Quantidade Total (Unidades ou Kg)
              </label>
              <input 
                type="text" 
                inputMode="numeric"
                value={quantity === 0 ? '' : quantity}
                onChange={e => {
                  const val = e.target.value.replace(/\D/g, '');
                  setQuantity(val === '' ? 0 : Number(val));
                }}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white font-bold text-sm focus:border-blue-600 outline-none transition-all"
              />
            </div>
          )}

          {contentType === SlotContent.SUPPLIES && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="p-5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-5"
            >
              <div className="flex items-center gap-2 mb-1">
                <Package className="w-4 h-4 text-indigo-500" />
                <h4 className="text-[9px] font-bold text-slate-900 dark:text-white uppercase tracking-widest">Detalhamento de Insumos</h4>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[7px] font-bold text-slate-600 uppercase tracking-widest text-center block">Caixas</label>
                  <input 
                    type="text" 
                    inputMode="numeric"
                    value={boxes === 0 ? '' : boxes} 
                    onChange={e => setBoxes(Number(e.target.value.replace(/\D/g, '')) || 0)} 
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-2 text-slate-900 dark:text-white font-bold text-xs text-center focus:border-indigo-600 outline-none" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[7px] font-bold text-slate-600 uppercase tracking-widest text-center block">Frascos</label>
                  <input 
                    type="text" 
                    inputMode="numeric"
                    value={bottles === 0 ? '' : bottles} 
                    onChange={e => setBottles(Number(e.target.value.replace(/\D/g, '')) || 0)} 
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-2 text-slate-900 dark:text-white font-bold text-xs text-center focus:border-indigo-600 outline-none" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[7px] font-bold text-slate-600 uppercase tracking-widest text-center block">Berços</label>
                  <input 
                    type="text" 
                    inputMode="numeric"
                    value={cradles === 0 ? '' : cradles} 
                    onChange={e => setCradles(Number(e.target.value.replace(/\D/g, '')) || 0)} 
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-2 text-slate-900 dark:text-white font-bold text-xs text-center focus:border-indigo-600 outline-none" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[7px] font-bold text-slate-600 uppercase tracking-widest text-center block">Tampas</label>
                  <input 
                    type="text" 
                    inputMode="numeric"
                    value={caps === 0 ? '' : caps} 
                    onChange={e => setCaps(Number(e.target.value.replace(/\D/g, '')) || 0)} 
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-2 text-slate-900 dark:text-white font-bold text-xs text-center focus:border-indigo-600 outline-none" 
                  />
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-[7px] font-bold text-slate-600 uppercase tracking-widest">Outros Itens</label>
                  <button onClick={addOther} className="text-[7px] font-bold text-blue-500 uppercase tracking-widest bg-blue-500/10 px-2 py-1 rounded-lg border border-blue-500/20 hover:bg-blue-500/20 transition-all">+ Adicionar</button>
                </div>
                <div className="space-y-2">
                  {others.map((other) => (
                    <div key={other.id} className="flex gap-2 items-center">
                      <input 
                        type="text" 
                        value={other.name}
                        onChange={e => updateOther(other.id, 'name', e.target.value)}
                        placeholder="Item..."
                        className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1.5 text-slate-900 dark:text-white font-bold text-[10px] focus:border-indigo-600 outline-none"
                      />
                      <input 
                        type="number" 
                        value={other.quantity}
                        onChange={e => updateOther(other.id, 'quantity', Number(e.target.value))}
                        className="w-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1.5 text-slate-900 dark:text-white font-bold text-[10px] text-center focus:border-indigo-600 outline-none"
                      />
                      <button onClick={() => removeOther(other.id)} className="p-1.5 bg-red-600/10 text-red-500 border border-red-500/20 rounded-lg hover:bg-red-600/20 transition-all"><X className="w-3 h-3" /></button>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {mode === 'edit' && (contentType === SlotContent.SUPPLIES || contentType === SlotContent.BOTTLES) && (
            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">
                Identificação Especial
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setWithoutSeal(!withoutSeal)}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border font-bold text-xs uppercase tracking-widest transition-all ${
                    withoutSeal 
                      ? 'bg-red-50 dark:bg-red-500/10 border-red-500 text-red-600 dark:text-red-500 shadow-sm' 
                      : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-red-300 dark:hover:border-red-900'
                  }`}
                >
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>Sem Selo</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDatedBottles(!datedBottles)}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border font-bold text-xs uppercase tracking-widest transition-all ${
                    datedBottles 
                      ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-500 text-amber-600 dark:text-amber-400 shadow-sm' 
                      : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-amber-300 dark:hover:border-amber-900'
                  }`}
                >
                  <Calendar className="w-4 h-4 shrink-0" />
                  <span>Datado</span>
                </button>
              </div>
            </div>
          )}

          {isOperatorEdit && (
            <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-300">
              <label className="text-[9px] font-black text-amber-500 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                <FileText className="w-3 h-3" /> Motivo da Alteração (Obrigatório)
              </label>
              <textarea 
                value={reason}
                onChange={e => setReason(e.target.value)}
                rows={3}
                className="w-full bg-amber-500/5 border border-amber-500/20 rounded-xl px-4 py-3 text-slate-900 dark:text-white font-bold text-lg focus:border-amber-500 outline-none transition-all resize-none placeholder:text-amber-500/20 shadow-inner"
                placeholder="Explique por que esta alteração é necessária..."
                required
              />
            </div>
          )}

          </>
          )}

          <div className="flex gap-3 pt-4">
            <button 
              onClick={onClose}
              className="flex-1 py-4 bg-slate-200 dark:bg-slate-800 hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all"
            >
              Cancelar
            </button>
            <button 
              onClick={handleSave}
              className={`flex-[2] py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 active:scale-95 text-center ${
                mode === 'assign' || (pallet.inspection.assignedSlot === 'AGUARDANDO' && assignedSlot !== 'AGUARDANDO')
                  ? 'bg-amber-500 hover:bg-amber-600 active:bg-amber-700 shadow-xl shadow-amber-900/40 text-slate-900 dark:text-white' 
                  : (isOperatorEdit ? 'bg-amber-600 hover:bg-amber-500 shadow-xl shadow-amber-900/20 text-slate-900 dark:text-white' : 'bg-blue-600 hover:bg-blue-500 active:bg-blue-700 shadow-xl shadow-blue-900/40 text-slate-900 dark:text-white')
              }`}
            >
              {pallet.inspection.assignedSlot === 'AGUARDANDO' && assignedSlot !== 'AGUARDANDO' ? 'Confirmar Alocação' : (isOperatorEdit ? 'Enviar Solicitação' : 'Salvar Alterações')} 
              <Save className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
