import React, { useState, useEffect, useMemo } from 'react';
import { SlotContent, WarehouseSlot, HistoryType, SheetRow } from '../types';
import { Truck, ArrowLeftRight, LogOut, Plus, X, Box, FlaskConical, Package, Info, Check, ClipboardCheck, Warehouse, Search, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatOP } from '../lib/formatters';
import { supabaseService } from '../services/supabaseService';

interface MovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEntry: (data: any) => void;
  onTransfer: (data: any) => void;
  onExit: (data: any) => void;
  availableSlots: WarehouseSlot[];
  occupiedSlots: WarehouseSlot[];
  inventoryData: SheetRow[];
  history: any[];
  initialType?: 'entry' | 'transfer' | 'exit';
  initialId?: string;
  initialPallet?: SheetRow | null;
}

export const MovementModal: React.FC<MovementModalProps> = ({ 
  isOpen, 
  onClose, 
  onEntry, 
  onTransfer, 
  onExit,
  availableSlots,
  occupiedSlots,
  inventoryData,
  history,
  initialType,
  initialId,
  initialPallet
}) => {
  const [type, setType] = useState<'entry' | 'transfer' | 'exit'>('entry');

  useEffect(() => {
    if (isOpen) {
      // Initialize with props if provided, otherwise reset to defaults
      if (initialType) {
        setType(initialType);
      } else {
        setType('entry');
      }

      if (initialId) {
        if (initialType === 'transfer') setTransferId(initialId);
        if (initialType === 'exit') setExitId(initialId);
      } else {
        setTransferId('');
        setExitId('');
      }

      if (initialPallet) {
        setFoundPallet(initialPallet);
        if (initialType === 'transfer' && initialPallet.inspections?.[0]?.assignedSlot) {
          setFromSlot(initialPallet.inspections[0].assignedSlot);
        }
      } else {
        setFoundPallet(null);
        setFromSlot('');
      }

      // Reset other entry fields
      setOp('');
      setName('');
      setLot('');
      setQuantity(1);
      setContentType(SlotContent.BOTTLES);
      setSlotId('');
      setToSlot('');
      setExitReason('');
      setOthers([]);
      setBottlesCount(0);
      setCapsCount(0);
      setBoxesCount(0);
      setCradlesCount(0);
      setIsSearching(false);
    }
  }, [isOpen, initialType, initialId, initialPallet]);

  // Remove the old reset useEffect (previously at line 286-308)


  const sortedAvailableSlots = useMemo(() => {
    return [...availableSlots].sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
  }, [availableSlots]);

  const sortedOccupiedSlots = useMemo(() => {
    return [...occupiedSlots].sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
  }, [occupiedSlots]);
  
  // Entry Fields
  const [op, setOp] = useState('');
  const [name, setName] = useState('');
  const [lot, setLot] = useState('');
  const [quantity, setQuantity] = useState<number>(1);
  const [contentType, setContentType] = useState<SlotContent>(SlotContent.BOTTLES);
  const [slotId, setSlotId] = useState('');

  // Supply Specific Fields
  const [others, setOthers] = useState<{ id: string, name: string, quantity: number }[]>([]);
  const [bottlesCount, setBottlesCount] = useState<number>(0);
  const [capsCount, setCapsCount] = useState<number>(0);
  const [boxesCount, setBoxesCount] = useState<number>(0);
  const [cradlesCount, setCradlesCount] = useState<number>(0);

  const addOther = () => {
    setOthers(prev => [...prev, { id: Math.random().toString(36).substring(2, 9), name: '', quantity: 0 }]);
  };

  const updateOther = (id: string, field: 'name' | 'quantity', value: any) => {
    setOthers(prev => prev.map(o => o.id === id ? { ...o, [field]: value } : o));
  };

  const removeOther = (id: string) => {
    setOthers(prev => prev.filter(o => o.id !== id));
  };

  // Transfer Fields
  const [transferId, setTransferId] = useState('');
  const [fromSlot, setFromSlot] = useState('');
  const [toSlot, setToSlot] = useState('');

  // Exit Fields
  const [exitId, setExitId] = useState('');
  const [exitReason, setExitReason] = useState('');
  const [isAutoFilled, setIsAutoFilled] = useState(false);
  const [foundPallet, setFoundPallet] = useState<SheetRow | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Auto-select origin slot when transferId is entered
  useEffect(() => {
    const searchPallet = async () => {
      // If we already have the pallet from initialPallet and the IDs match, skip searching
      if (initialPallet && (initialPallet.loadingId === transferId || initialPallet.id === transferId) && type === 'transfer') {
        return;
      }

      if (type === 'transfer' && transferId.length >= 1) {
        setIsSearching(true);
        try {
          const upperId = transferId.trim().toUpperCase();
          const isSlotPattern = /^[A-F](\.\d+){0,2}$/.test(upperId);
          
          let item = null;
          if (isSlotPattern) {
            item = await supabaseService.findPalletBySlot(upperId);
          }
          
          // If not found by slot or wasn't a slot pattern, try by ID
          if (!item && transferId.length >= 3) {
            item = await supabaseService.findPalletByLoadingId(transferId);
          }

          if (item) {
            setFoundPallet(item);
            if (item.inspections && item.inspections[0]?.assignedSlot) {
              setFromSlot(item.inspections[0].assignedSlot);
            }
          } else {
            setFoundPallet(null);
            setFromSlot('');
          }
        } catch (error) {
          console.error("Error searching pallet:", error);
          setFoundPallet(null);
        } finally {
          setIsSearching(false);
        }
      } else if (type === 'transfer') {
        // Only clear if not initialized
        if (!initialPallet) {
          setFoundPallet(null);
          setFromSlot('');
        }
      }
    };

    const timer = setTimeout(() => {
      searchPallet();
    }, 500);

    return () => clearTimeout(timer);
  }, [transferId, type]);

  // Auto-select origin slot when exitId is entered
  useEffect(() => {
    const searchPallet = async () => {
      // If we already have the pallet from initialPallet and the IDs match, skip searching
      if (initialPallet && (initialPallet.loadingId === exitId || initialPallet.id === exitId) && type === 'exit') {
        return;
      }

      if (type === 'exit' && exitId.length >= 1) {
        setIsSearching(true);
        try {
          const upperId = exitId.trim().toUpperCase();
          const isSlotPattern = /^[A-F](\.\d+){0,2}$/.test(upperId);
          
          let item = null;
          if (isSlotPattern) {
            item = await supabaseService.findPalletBySlot(upperId);
          }
          
          if (!item && exitId.length >= 3) {
            item = await supabaseService.findPalletByLoadingId(exitId);
          }

          if (item) {
            setFoundPallet(item);
          } else {
            setFoundPallet(null);
          }
        } catch (error) {
          console.error("Error searching pallet:", error);
          setFoundPallet(null);
        } finally {
          setIsSearching(false);
        }
      } else if (type === 'exit') {
        // Only clear if not initialized
        if (!initialPallet) {
          setFoundPallet(null);
        }
      }
    };

    const timer = setTimeout(() => {
      searchPallet();
    }, 500);

    return () => clearTimeout(timer);
  }, [exitId, type]);

  // Auto-fill based on OP
  useEffect(() => {
    if (type === 'entry' && op.trim().length >= 3) {
      // 1. Try to find in current inventory first (most relevant)
      const existingInInventory = inventoryData.find(item => item.originOP === formatOP(op));
      
      if (existingInInventory) {
        setName(existingInInventory.description);
        setLot(existingInInventory.lot);
        setIsAutoFilled(true);
        // If it's a known product, suggest content type if possible
        if (existingInInventory.inspections?.[0]?.contentType) {
          setContentType(existingInInventory.inspections[0].contentType);
        }
        return;
      }

      // 2. Try to find in history (recent entries)
      const formattedOP = formatOP(op);
      const existingInHistory = history.find(entry => formatOP(entry.op) === formattedOP);

      if (existingInHistory) {
        setName(existingInHistory.description);
        setLot(existingInHistory.lot);
        setIsAutoFilled(true);
        
        // Try to infer content type from details or translation
        if (existingInHistory.details?.toUpperCase().includes('PRODUTO ACABADO')) {
          setContentType(SlotContent.FINISHED_PRODUCT);
        } else if (existingInHistory.details?.toUpperCase().includes('INSUMO')) {
          setContentType(SlotContent.SUPPLIES);
        } else if (existingInHistory.details?.toUpperCase().includes('FRASCO')) {
          setContentType(SlotContent.BOTTLES);
        } else if (existingInHistory.details?.toUpperCase().includes('CONTAINER SJ')) {
          setContentType(SlotContent.CONTAINER_SJ);
        } else if (existingInHistory.details?.toUpperCase().includes('CONTAINER LP')) {
          setContentType(SlotContent.CONTAINER_LP);
        } else if (existingInHistory.details?.toUpperCase().includes('CONTAINER CP')) {
          setContentType(SlotContent.CONTAINER_CP);
        }
      } else {
        setIsAutoFilled(false);
      }
    } else {
      setIsAutoFilled(false);
    }
  }, [op, type, inventoryData, history]);

  // Suggest next free slot based on content type
  useEffect(() => {
    if (type === 'entry' && isOpen) {
      let suggestedSlot: WarehouseSlot | undefined;

      if (contentType === SlotContent.BOTTLES) {
        suggestedSlot = availableSlots.find(s => s.rack === 'A' && s.position <= 16);
      } else if (contentType === SlotContent.SUPPLIES || contentType === SlotContent.USE_CONSUMPTION) {
        // Prioritize Rack D for Supplies and Use & Consumption
        suggestedSlot = availableSlots.find(s => s.rack === 'D');
        // Fallback to B or C if D is full
        if (!suggestedSlot && contentType === SlotContent.SUPPLIES) {
          suggestedSlot = availableSlots.find(s => (s.rack === 'B' || s.rack === 'C') && s.level >= 2 && s.position <= 16);
        }
      } else if (contentType === SlotContent.FINISHED_PRODUCT) {
        suggestedSlot = availableSlots.find(s => (s.rack === 'B' || s.rack === 'C') && s.level === 1 && s.position <= 14);
      } else if (contentType === SlotContent.CONTAINER_SJ || contentType === SlotContent.CONTAINER_LP || contentType === SlotContent.CONTAINER_CP) {
        // Disabled by user request: "remover função de substituição de vaga automática dos containers"
        suggestedSlot = undefined;
      } else {
        suggestedSlot = availableSlots.find(s => {
          const isBottleRange = s.rack === 'A' && s.position <= 16;
          const isSupplyRange = (s.rack === 'B' || s.rack === 'C') && s.level >= 2 && s.position <= 16;
          const isFinishedRange = (s.rack === 'B' || s.rack === 'C') && s.level === 1 && s.position <= 14;
          const isContainerRange = s.rack === 'E' || s.rack === 'F';
          return !isBottleRange && !isSupplyRange && !isFinishedRange && !isContainerRange;
        });
      }

      if (suggestedSlot) {
        setSlotId(suggestedSlot.id);
      } else {
        if (availableSlots.length > 0) {
          setSlotId(availableSlots[0].id);
        }
      }
    }
  }, [contentType, type, isOpen, availableSlots]);

  const handleEntrySubmit = () => {
    const isSupplies = contentType === SlotContent.SUPPLIES;
    if (!name || !slotId) return;
    
    const finalQuantity = isSupplies ? 1 : quantity;

    if (isNaN(finalQuantity) || finalQuantity < 0) return;
    
    const randomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    onEntry({
      id: randomId,
      op: formatOP(op),
      name: name.toUpperCase(),
      lot: lot.toUpperCase(),
      quantity: finalQuantity,
      contentType,
      slotId,
      supplyDetails: isSupplies ? {
        bottles: bottlesCount,
        caps: capsCount,
        boxes: boxesCount,
        cradles: cradlesCount,
        others: others
          .filter(o => o.name && o.quantity > 0)
          .map(o => ({ ...o, name: o.name.toUpperCase() }))
      } : null
    });
  };

  const handleTransferSubmit = () => {
    if (!foundPallet) return;
    onTransfer({
      id: foundPallet.loadingId || foundPallet.id,
      fromSlot: foundPallet.inspections?.[0]?.assignedSlot || fromSlot,
      toSlot,
      pallet: foundPallet
    });
  };

  const handleExitSubmit = () => {
    if (!foundPallet) return;
    onExit({
      id: foundPallet.loadingId || foundPallet.id,
      reason: exitReason.toUpperCase(),
      pallet: foundPallet
    });
  };

  const contentTypes = useMemo(() => [
    { value: SlotContent.BOTTLES, label: 'Frasco' },
    { value: SlotContent.SUPPLIES, label: 'Insumo' },
    { value: SlotContent.FINISHED_PRODUCT, label: 'Produto Acabado' },
    { value: SlotContent.USE_CONSUMPTION, label: 'Uso e Consumo' },
    { value: SlotContent.RETURN, label: 'Retorno' },
    { value: SlotContent.CONTAINER_SJ, label: 'Container Sujo' },
    { value: SlotContent.CONTAINER_LP, label: 'Container Limpo' },
    { value: SlotContent.CONTAINER_CP, label: 'Container Com Produto' },
    { value: SlotContent.REWORK, label: 'Retrabalho' },
    { value: SlotContent.REPROCESS, label: 'Reprocesso' },
    { value: SlotContent.MISCELLANEOUS, label: 'Diversos' },
    { value: SlotContent.DISCARD, label: 'Descarte' },
    { value: SlotContent.OTHER, label: 'Outro' },
  ].sort((a, b) => a.label.localeCompare(b.label)), []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-xl p-4 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-3xl w-full max-w-2xl overflow-hidden my-auto"
      >
        
        <div className="bg-slate-950/40 p-6 md:p-8 flex justify-between items-center border-b border-slate-800/50 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-blue-600"></div>
          <div className="flex items-center gap-5">
             <div className="w-12 h-12 bg-blue-600/10 border border-blue-500/20 rounded-2xl flex items-center justify-center shadow-inner">
                <Truck className="text-blue-500 w-6 h-6" />
             </div>
             <div>
                <h3 className="font-black text-2xl italic uppercase tracking-tighter text-white leading-none">Movimentação</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Fluxo Operacional G0</p>
                </div>
             </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-10 h-10 flex items-center justify-center bg-slate-950/50 rounded-xl text-slate-500 hover:text-white hover:bg-slate-800 border border-slate-800 transition-all group"
          >
            <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </div>

        <div className="p-6 md:p-8 space-y-8">
          {/* Type Selector */}
          <div className="flex p-1.5 bg-slate-950 rounded-2xl border border-slate-800/50 shadow-inner">
            <button 
              onClick={() => setType('entry')}
              className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all duration-300 flex items-center justify-center gap-2 ${
                type === 'entry' 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40 translate-y-[-1px]' 
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900'
              }`}
            >
              <Plus className={`w-3.5 h-3.5 ${type === 'entry' ? 'opacity-100' : 'opacity-40'}`} />
              Entrada
            </button>
            <button 
              onClick={() => setType('transfer')}
              className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all duration-300 flex items-center justify-center gap-2 ${
                type === 'transfer' 
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/40 translate-y-[-1px]' 
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900'
              }`}
            >
              <ArrowLeftRight className={`w-3.5 h-3.5 ${type === 'transfer' ? 'opacity-100' : 'opacity-40'}`} />
              Transferência
            </button>
            <button 
              onClick={() => setType('exit')}
              className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all duration-300 flex items-center justify-center gap-2 ${
                type === 'exit' 
                ? 'bg-red-600 text-white shadow-lg shadow-red-900/40 translate-y-[-1px]' 
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900'
              }`}
            >
              <LogOut className={`w-3.5 h-3.5 ${type === 'exit' ? 'opacity-100' : 'opacity-40'}`} />
              Saída
            </button>
          </div>

          <div className="min-h-[300px]">
            {type === 'entry' && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-5"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                      <Box className="w-3 h-3 text-blue-500" />
                      Tipo
                    </label>
                    <p className="text-[9px] text-slate-600 font-bold ml-1 -mt-1 italic">O que é o pallet?</p>
                    <div className="relative group">
                      <select 
                        value={contentType}
                        onChange={e => setContentType(e.target.value as SlotContent)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white font-black text-sm focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all appearance-none cursor-pointer group-hover:border-slate-700"
                      >
                        {contentTypes.map(ct => (
                          <option key={ct.value} value={ct.value}>{ct.label}</option>
                        ))}
                      </select>
                      <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-600">
                        <Plus className="w-4 h-4 rotate-45" />
                      </div>
                    </div>
                  </div>
                  {contentType !== SlotContent.USE_CONSUMPTION && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                        <ClipboardCheck className="w-3 h-3 text-blue-500" />
                        OP (Opcional)
                      </label>
                      <p className="text-[9px] text-slate-600 font-bold ml-1 -mt-1 italic">Ordem de Produção</p>
                      <div className="relative group">
                        <input 
                          type="text" 
                          value={op}
                          onChange={e => setOp(e.target.value)}
                          placeholder="Ex: 410-152"
                          className={`w-full bg-slate-950 border ${isAutoFilled ? 'border-green-500/50' : 'border-slate-800'} rounded-2xl px-5 py-4 text-white font-mono font-black text-sm focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all group-hover:border-slate-700`}
                        />
                        {isAutoFilled && (
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500 flex items-center gap-1.5 bg-green-500/10 px-2 py-1 rounded-lg border border-green-500/20">
                            <Check className="w-3 h-3" />
                            <span className="text-[8px] font-black uppercase tracking-tighter">Auto</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                      <Info className="w-3 h-3 text-blue-500" />
                      Nome (Obrigatório)
                    </label>
                    <p className="text-[9px] text-slate-600 font-bold ml-1 -mt-1 italic">informar o nome do produto</p>
                    <input 
                      type="text" 
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder={contentType === SlotContent.USE_CONSUMPTION ? "Ex: PAPEL TOALHA" : "Ex: SELANTE 500G"}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white font-black text-sm focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all hover:border-slate-700"
                    />
                  </div>
                  {contentType !== SlotContent.USE_CONSUMPTION && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                        <Package className="w-3 h-3 text-blue-500" />
                        Lote (Opcional)
                      </label>
                      <p className="text-[9px] text-slate-600 font-bold ml-1 -mt-1 italic">Informar conforme etiqueta</p>
                      <input 
                        type="text" 
                        inputMode="numeric"
                        value={lot}
                        onChange={e => setLot(e.target.value.replace(/\D/g, ''))}
                        placeholder="Ex: 01260307143"
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white font-mono font-black text-sm focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all hover:border-slate-700"
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {contentType !== SlotContent.SUPPLIES && 
                   contentType !== SlotContent.CONTAINER_SJ && 
                   contentType !== SlotContent.CONTAINER_LP && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                        <FlaskConical className="w-3 h-3 text-blue-500" />
                        Quantidade
                      </label>
                      <p className="text-[9px] text-slate-600 font-bold ml-1 -mt-1 italic">informar quantidade total (unidades ou kg)</p>
                      <input 
                        type="text" 
                        inputMode="numeric"
                        value={quantity === 0 ? '' : quantity}
                        onChange={e => {
                          const val = e.target.value.replace(/\D/g, '');
                          setQuantity(val === '' ? 0 : Number(val));
                        }}
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white font-mono font-black text-sm focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all hover:border-slate-700"
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                      <Warehouse className="w-3 h-3 text-blue-500" />
                      Vaga
                    </label>
                    <p className="text-[9px] text-slate-600 font-bold ml-1 -mt-1 italic">Local de armazenamento sugerido</p>
                    <div className="relative group">
                      <select 
                        value={slotId}
                        onChange={e => setSlotId(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white font-mono font-black text-sm focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all appearance-none cursor-pointer group-hover:border-slate-700"
                      >
                        <option value="">Selecione uma vaga</option>
                        <option value="AGUARDANDO">⚠️ AGUARDANDO VAGA (Virtual)</option>
                        {sortedAvailableSlots.map(slot => (
                          <option key={slot.id} value={slot.id}>{slot.id}</option>
                        ))}
                      </select>
                      <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-600">
                        <Plus className="w-4 h-4 rotate-45" />
                      </div>
                    </div>
                  </div>
                </div>

                {contentType === SlotContent.SUPPLIES && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="p-5 bg-slate-950/50 border border-slate-800 rounded-2xl space-y-6"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-7 h-7 bg-indigo-600/10 text-indigo-500 rounded-lg flex items-center justify-center border border-indigo-500/20">
                        <Package className="w-4 h-4" />
                      </div>
                      <h4 className="text-[10px] font-bold text-white uppercase tracking-widest">Detalhamento de Insumos</h4>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[8px] font-bold text-slate-600 uppercase tracking-widest text-center block">Caixas</label>
                        <input 
                          type="text" 
                          inputMode="numeric"
                          value={boxesCount === 0 ? '' : boxesCount} 
                          onChange={e => setBoxesCount(Number(e.target.value.replace(/\D/g, '')) || 0)} 
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-2 text-white font-bold text-xs text-center focus:border-indigo-600 outline-none" 
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[8px] font-bold text-slate-600 uppercase tracking-widest text-center block">Frascos</label>
                        <input 
                          type="text" 
                          inputMode="numeric"
                          value={bottlesCount === 0 ? '' : bottlesCount} 
                          onChange={e => setBottlesCount(Number(e.target.value.replace(/\D/g, '')) || 0)} 
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-2 text-white font-bold text-xs text-center focus:border-indigo-600 outline-none" 
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[8px] font-bold text-slate-600 uppercase tracking-widest text-center block">Berços</label>
                        <input 
                          type="text" 
                          inputMode="numeric"
                          value={cradlesCount === 0 ? '' : cradlesCount} 
                          onChange={e => setCradlesCount(Number(e.target.value.replace(/\D/g, '')) || 0)} 
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-2 text-white font-bold text-xs text-center focus:border-indigo-600 outline-none" 
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[8px] font-bold text-slate-600 uppercase tracking-widest text-center block">Tampas</label>
                        <input 
                          type="text" 
                          inputMode="numeric"
                          value={capsCount === 0 ? '' : capsCount} 
                          onChange={e => setCapsCount(Number(e.target.value.replace(/\D/g, '')) || 0)} 
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-2 text-white font-bold text-xs text-center focus:border-indigo-600 outline-none" 
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">Outros Itens</label>
                        <button 
                          onClick={addOther}
                          className="text-[8px] font-bold text-blue-500 uppercase tracking-widest bg-blue-500/10 px-2 py-1 rounded-lg border border-blue-500/20 hover:bg-blue-500/20 transition-all"
                        >
                          + Adicionar Outro
                        </button>
                      </div>

                      <div className="space-y-3">
                        {others.map((other) => (
                          <div key={other.id} className="flex gap-3 items-end">
                            <div className="flex-1 space-y-1.5">
                              <label className="text-[7px] font-bold text-slate-700 uppercase tracking-widest">Item</label>
                              <input 
                                type="text" 
                                value={other.name}
                                onChange={e => updateOther(other.id, 'name', e.target.value)}
                                placeholder="Nome do item..."
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-bold text-[10px] focus:border-indigo-600 outline-none"
                              />
                            </div>
                            <div className="w-24 space-y-1.5">
                              <label className="text-[7px] font-bold text-slate-700 uppercase tracking-widest">Qtd</label>
                              <input 
                                type="text" 
                                inputMode="numeric"
                                value={other.quantity === 0 ? '' : other.quantity}
                                onChange={e => updateOther(other.id, 'quantity', Number(e.target.value.replace(/\D/g, '')) || 0)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-bold text-[10px] text-center focus:border-indigo-600 outline-none"
                              />
                            </div>
                            <button 
                              onClick={() => removeOther(other.id)}
                              className="p-2.5 bg-red-600/10 text-red-500 border border-red-500/20 rounded-lg hover:bg-red-600/20 transition-all"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                <button 
                  onClick={handleEntrySubmit}
                  disabled={!name || !slotId}
                  className="w-full py-5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-[0.25em] transition-all duration-300 flex items-center justify-center gap-3 shadow-2xl shadow-blue-900/40 active:scale-[0.98] group"
                >
                  Confirmar Entrada 
                  <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                </button>
              </motion.div>
            )}

            {type === 'transfer' && (
              <motion.div 
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                    <Search className="w-3 h-3 text-amber-500" />
                    Vaga de Origem ou ID
                  </label>
                  <p className="text-[9px] text-slate-600 font-bold ml-1 -mt-1 italic">Digite a vaga (ex: E.1.1) ou ID do pallet</p>
                  <div className="relative group">
                    <input 
                      type="text" 
                      value={transferId}
                      onChange={e => setTransferId(e.target.value.toUpperCase())}
                      placeholder="Ex: E.1.1 ou ABC123"
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white font-mono font-black text-sm focus:border-amber-600 focus:ring-4 focus:ring-amber-600/10 outline-none transition-all hover:border-slate-700"
                    />
                    {isSearching && (
                      <div className="absolute right-5 top-1/2 -translate-y-1/2 text-amber-500">
                        <Loader2 className="w-4 h-4 animate-spin" />
                      </div>
                    )}
                  </div>
                </div>

                <AnimatePresence>
                  {foundPallet && type === 'transfer' && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-5 bg-amber-600/10 border border-amber-500/20 rounded-[2rem] space-y-3 mb-2 shadow-inner">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest leading-none">Pallet Identificado</p>
                            <h4 className="text-white font-black text-base uppercase leading-tight italic tracking-tight">{foundPallet.description}</h4>
                          </div>
                          <div className="text-right">
                             <div className="px-2 py-1 bg-slate-950 rounded-lg border border-slate-800 text-[8px] font-black text-slate-400 uppercase tracking-tighter shadow-sm mb-1">
                               ID: {foundPallet.loadingId || foundPallet.id}
                             </div>
                             <span className="inline-block text-[8px] font-black text-white bg-amber-600/30 px-2.5 py-1 rounded-full border border-amber-500/30 uppercase tracking-wider">
                               {foundPallet.status}
                             </span>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-amber-500/10">
                          <div className="space-y-1">
                            <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">OP</p>
                            <p className="text-[11px] font-mono text-white font-black">{foundPallet.originOP}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Lote</p>
                            <p className="text-[11px] font-mono text-white font-black">{foundPallet.lot}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Vaga Atual</p>
                            <p className="text-[11px] font-mono text-amber-500 font-black italic">{fromSlot || 'NÃO ALOCADO'}</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {!isSearching && transferId.length >= 3 && !foundPallet && type === 'transfer' && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-5 bg-red-600/5 border border-red-500/10 rounded-2xl flex items-start gap-3"
                  >
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">Atenção: Nenhum Item Encontrado</p>
                      <p className="text-[11px] text-slate-500 font-bold uppercase tracking-tight leading-relaxed italic">
                        Não localizamos pallets ativos na vaga ou com o ID <span className="text-white not-italic">{transferId}</span>. Verifique o código e tente novamente.
                      </p>
                    </div>
                  </motion.div>
                )}

                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                      <ArrowLeftRight className="w-3 h-3 text-amber-500 rotate-90" />
                      Destino (Nova Vaga)
                    </label>
                    <p className="text-[9px] text-slate-600 font-bold ml-1 -mt-1 italic">Para onde o pallet será movido?</p>
                    <div className="relative group">
                      <select 
                        value={toSlot}
                        onChange={e => setToSlot(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white font-mono font-black text-sm focus:border-amber-600 focus:ring-4 focus:ring-amber-600/10 outline-none transition-all appearance-none cursor-pointer group-hover:border-slate-700"
                      >
                        <option value="">Selecione a vaga de destino</option>
                        <option value="AGUARDANDO">⚠️ AGUARDANDO VAGA (Virtual)</option>
                        {sortedAvailableSlots.map(slot => (
                          <option key={slot.id} value={slot.id}>{slot.id}</option>
                        ))}
                      </select>
                      <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-600">
                        <Plus className="w-4 h-4 rotate-45" />
                      </div>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleTransferSubmit}
                  disabled={!foundPallet || !toSlot}
                  className="w-full py-5 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-[0.25em] transition-all duration-300 flex items-center justify-center gap-3 shadow-2xl shadow-amber-900/40 active:scale-[0.98] group"
                >
                  Confirmar Transferência 
                  <ArrowLeftRight className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                </button>
              </motion.div>
            )}

            {type === 'exit' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                    <Search className="w-3 h-3 text-red-500" />
                    Vaga de Origem ou ID
                  </label>
                  <p className="text-[9px] text-slate-600 font-bold ml-1 -mt-1 italic">Digite a vaga (ex: E.1.1) ou ID do pallet</p>
                  <div className="relative group">
                    <input 
                      type="text" 
                      value={exitId}
                      onChange={e => setExitId(e.target.value.toUpperCase())}
                      placeholder="Ex: E.1.1 ou ABC123"
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white font-mono font-black text-sm focus:border-red-600 focus:ring-4 focus:ring-red-600/10 outline-none transition-all hover:border-slate-700"
                    />
                    {isSearching && (
                      <div className="absolute right-5 top-1/2 -translate-y-1/2 text-red-500">
                        <Loader2 className="w-4 h-4 animate-spin" />
                      </div>
                    )}
                  </div>
                </div>

                <AnimatePresence>
                  {foundPallet && type === 'exit' && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-5 bg-red-600/10 border border-red-500/20 rounded-[2rem] space-y-3 mb-2 shadow-inner">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <p className="text-[9px] font-black text-red-500 uppercase tracking-widest leading-none">Confirmação de Saída</p>
                            <h4 className="text-white font-black text-base uppercase leading-tight italic tracking-tight">{foundPallet.description}</h4>
                          </div>
                          <div className="text-right">
                             <div className="px-2 py-1 bg-slate-950 rounded-lg border border-slate-800 text-[8px] font-black text-slate-400 uppercase tracking-tighter shadow-sm mb-1">
                               {foundPallet.loadingId || foundPallet.id}
                             </div>
                             <span className="inline-block text-[8px] font-black text-white bg-red-600/30 px-2.5 py-1 rounded-full border border-red-500/30 uppercase tracking-wider">
                               VAGA: {foundPallet.inspections?.[0]?.assignedSlot || '---'}
                             </span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-red-500/10">
                          <div className="space-y-1">
                            <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">OP</p>
                            <p className="text-[11px] font-mono text-white font-black">{foundPallet.originOP}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Lote</p>
                            <p className="text-[11px] font-mono text-white font-black">{foundPallet.lot}</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {!isSearching && exitId.length >= 3 && !foundPallet && type === 'exit' && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-5 bg-red-600/5 border border-red-500/10 rounded-2xl flex items-start gap-3"
                  >
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">Atenção: Nenhum Item Encontrado</p>
                      <p className="text-[11px] text-slate-500 font-bold uppercase tracking-tight leading-relaxed italic">
                        Não localizamos pallets ativos na vaga ou com o ID <span className="text-white not-italic">{exitId}</span>. Verifique o código e tente novamente.
                      </p>
                    </div>
                  </motion.div>
                )}

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                    <Info className="w-3 h-3 text-red-500" />
                    Motivo da Saída
                  </label>
                  <p className="text-[9px] text-slate-600 font-bold ml-1 -mt-1 italic">Por que este pallet está saindo?</p>
                  <div className="relative group">
                    <select 
                      value={exitReason}
                      onChange={e => setExitReason(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white font-black text-sm focus:border-red-600 focus:ring-4 focus:ring-red-600/10 outline-none transition-all appearance-none cursor-pointer group-hover:border-slate-700"
                    >
                      <option value="">Selecione o motivo</option>
                      <option value="EXPEDICAO">EXPEDIÇÃO / CARREGAMENTO</option>
                      <option value="RETRABALHO">RETORNO PARA RETRABALHO</option>
                      <option value="DESCARTE">DESCARTE / AVARIA</option>
                      <option value="AMOSTRA">AMOSTRA QUALIDADE</option>
                      <option value="OUTRO">OUTRO MOTIVO</option>
                    </select>
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-600">
                      <Plus className="w-4 h-4 rotate-45" />
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleExitSubmit}
                  disabled={!foundPallet || !exitReason}
                  className="w-full py-5 bg-red-600 hover:bg-red-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-[0.25em] transition-all duration-300 flex items-center justify-center gap-3 shadow-2xl shadow-red-900/40 active:scale-[0.98] group"
                >
                  Confirmar Saída Operacional 
                  <LogOut className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
