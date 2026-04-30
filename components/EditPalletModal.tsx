
import React, { useState, useEffect } from 'react';
import { SheetRow, InspectionData, SlotContent, WarehouseSlot } from '../types';
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
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatOP } from '../lib/formatters';

interface EditPalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedData: { 
    description: string; 
    op: string; 
    lot: string; 
    quantity: number;
    contentType: SlotContent;
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
}

export const EditPalletModal: React.FC<EditPalletModalProps> = ({ isOpen, onClose, onSave, pallet, history }) => {
  const [description, setDescription] = useState('');
  const [op, setOp] = useState('');
  const [lot, setLot] = useState('');
  const [quantity, setQuantity] = useState(0);
  const [contentType, setContentType] = useState<SlotContent>(SlotContent.BOTTLES);
  const [isAutoFilled, setIsAutoFilled] = useState(false);
  
  // Supply Details State
  const [bottles, setBottles] = useState(0);
  const [caps, setCaps] = useState(0);
  const [boxes, setBoxes] = useState(0);
  const [cradles, setCradles] = useState(0);
  const [others, setOthers] = useState<{ id: string; name: string; quantity: number }[]>([]);

  useEffect(() => {
    if (pallet) {
      setDescription(pallet.row.description);
      setOp(pallet.row.originOP);
      setLot(pallet.row.lot);
      setQuantity(pallet.row.pallets);
      setContentType(pallet.inspection.contentType || SlotContent.BOTTLES);
      
      setBottles(pallet.inspection.bottles || 0);
      setCaps(pallet.inspection.caps || 0);
      setBoxes(pallet.inspection.boxes || 0);
      setCradles(pallet.inspection.cradles || 0);
      setOthers(pallet.inspection.others?.map(o => ({ ...o, id: Math.random().toString(36).substring(2, 9) })) || []);
      setIsAutoFilled(false);
    }
  }, [pallet]);

  // Auto-fill based on OP
  useEffect(() => {
    if (op.trim().length >= 3 && history) {
      const formattedOP = formatOP(op);
      const existingInHistory = history.find(entry => formatOP(entry.op) === formattedOP);

      if (existingInHistory) {
        // Only auto-fill if the current description is empty or much smaller
        if (!description || description.length < 5) {
          setDescription(existingInHistory.description);
          setLot(existingInHistory.lot || lot);
          setIsAutoFilled(true);
        }
      }
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
    onSave({
      description: description.toUpperCase(),
      op: formatOP(op),
      lot: lot.toUpperCase(),
      quantity,
      contentType,
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
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/90 backdrop-blur-2xl p-4 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-slate-900 border border-slate-800 rounded-[40px] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] w-full max-w-md overflow-hidden my-8"
      >
        <div className="bg-slate-800/30 p-6 flex justify-between items-center border-b border-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/40 transform -rotate-3">
              <Pencil className="text-white w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-lg italic uppercase tracking-tighter text-white">Editar Pallet</h3>
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                {pallet.inspection.assignedSlot === 'AGUARDANDO' ? 'Aguardando Vaga' : (pallet.inspection.assignedSlot ? `Vaga ${pallet.inspection.assignedSlot}` : 'Pendente de Análise')}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center bg-slate-950/50 rounded-lg text-slate-500 hover:text-white transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* TIPO */}
          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Tipo de Conteúdo</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: SlotContent.BOTTLES, label: 'Frasco', icon: FlaskConical },
                { id: SlotContent.SUPPLIES, label: 'Insumo', icon: Package },
                { id: SlotContent.FINISHED_PRODUCT, label: 'Prod. Acabado', icon: Truck },
                { id: SlotContent.USE_CONSUMPTION, label: 'Uso e Consumo', icon: Box },
                { id: SlotContent.CONTAINER_SJ, label: 'Cont. SJ', icon: Container },
                { id: SlotContent.CONTAINER_LP, label: 'Cont. LP', icon: Container },
                { id: SlotContent.CONTAINER_CP, label: 'Cont. CP', icon: Container }
              ].map((type) => (
                <button
                  key={type.id}
                  onClick={() => setContentType(type.id)}
                  className={`flex items-center gap-2 px-3 py-3 rounded-xl border text-[10px] font-bold uppercase transition-all ${
                    contentType === type.id 
                      ? 'bg-blue-600/10 border-blue-600 text-blue-500 shadow-lg shadow-blue-600/10' 
                      : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'
                  }`}
                >
                  <type.icon className="w-4 h-4" />
                  {type.label}
                </button>
              ))}
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
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-bold text-sm focus:border-blue-600 outline-none transition-all resize-none"
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
                  className={`w-full bg-slate-950 border ${isAutoFilled ? 'border-green-500/50' : 'border-slate-800'} rounded-xl px-4 py-3 text-white font-bold text-sm focus:border-blue-600 outline-none transition-all`}
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
                value={lot}
                onChange={e => setLot(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-bold text-sm focus:border-blue-600 outline-none transition-all"
              />
            </div>
          </div>

          {contentType !== SlotContent.CONTAINER_SJ && contentType !== SlotContent.CONTAINER_LP && (
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                <Hash className="w-3 h-3" /> Quantidade Total (Unidades ou Kg)
              </label>
              <input 
                type="number" 
                value={quantity}
                onChange={e => setQuantity(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-bold text-sm focus:border-blue-600 outline-none transition-all"
              />
            </div>
          )}

          {contentType === SlotContent.SUPPLIES && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-5"
            >
              <div className="flex items-center gap-2 mb-1">
                <Package className="w-4 h-4 text-indigo-500" />
                <h4 className="text-[9px] font-bold text-white uppercase tracking-widest">Detalhamento de Insumos</h4>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[7px] font-bold text-slate-600 uppercase tracking-widest text-center block">Caixas</label>
                  <input type="number" value={boxes} onChange={e => setBoxes(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-2 text-white font-bold text-xs text-center focus:border-indigo-600 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[7px] font-bold text-slate-600 uppercase tracking-widest text-center block">Frascos</label>
                  <input type="number" value={bottles} onChange={e => setBottles(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-2 text-white font-bold text-xs text-center focus:border-indigo-600 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[7px] font-bold text-slate-600 uppercase tracking-widest text-center block">Berços</label>
                  <input type="number" value={cradles} onChange={e => setCradles(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-2 text-white font-bold text-xs text-center focus:border-indigo-600 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[7px] font-bold text-slate-600 uppercase tracking-widest text-center block">Tampas</label>
                  <input type="number" value={caps} onChange={e => setCaps(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-2 text-white font-bold text-xs text-center focus:border-indigo-600 outline-none" />
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
                        className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-white font-bold text-[10px] focus:border-indigo-600 outline-none"
                      />
                      <input 
                        type="number" 
                        value={other.quantity}
                        onChange={e => updateOther(other.id, 'quantity', Number(e.target.value))}
                        className="w-16 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-white font-bold text-[10px] text-center focus:border-indigo-600 outline-none"
                      />
                      <button onClick={() => removeOther(other.id)} className="p-1.5 bg-red-600/10 text-red-500 border border-red-500/20 rounded-lg hover:bg-red-600/20 transition-all"><X className="w-3 h-3" /></button>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          <div className="flex gap-3 pt-4">
            <button 
              onClick={onClose}
              className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all"
            >
              Cancelar
            </button>
            <button 
              onClick={handleSave}
              className="flex-[2] py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-900/40 transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              Salvar Alterações <Save className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
