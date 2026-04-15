import React, { useState, useEffect, useMemo } from 'react';
import { SlotContent, WarehouseSlot, HistoryType, SheetRow } from '../types';
import { Truck, ArrowLeftRight, LogOut, Plus, X, Box, FlaskConical, Package, Info, Check, ClipboardCheck, Warehouse, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEntry: (data: any) => void;
  onTransfer: (data: any) => void;
  onExit: (data: any) => void;
  availableSlots: WarehouseSlot[];
  occupiedSlots: WarehouseSlot[];
  inventoryData: SheetRow[];
}

export const MovementModal: React.FC<MovementModalProps> = ({ 
  isOpen, 
  onClose, 
  onEntry, 
  onTransfer, 
  onExit,
  availableSlots,
  occupiedSlots,
  inventoryData
}) => {
  const [type, setType] = useState<'entry' | 'transfer' | 'exit'>('entry');

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
  const [supplyDescription, setSupplyDescription] = useState('');
  const [bottlesCount, setBottlesCount] = useState<number>(0);
  const [capsCount, setCapsCount] = useState<number>(0);
  const [boxesCount, setBoxesCount] = useState<number>(0);
  const [cradlesCount, setCradlesCount] = useState<number>(0);

  // Transfer Fields
  const [transferId, setTransferId] = useState('');
  const [fromSlot, setFromSlot] = useState('');
  const [toSlot, setToSlot] = useState('');

  // Exit Fields
  const [exitId, setExitId] = useState('');
  const [exitReason, setExitReason] = useState('');
  const [isAutoFilled, setIsAutoFilled] = useState(false);

  // Auto-select origin slot when transferId is entered
  useEffect(() => {
    if (type === 'transfer' && transferId.length >= 3) {
      const item = inventoryData.find(i => i.id === transferId);
      if (item && item.inspections && item.inspections[0]?.assignedSlot) {
        setFromSlot(item.inspections[0].assignedSlot);
      }
    }
  }, [transferId, type, inventoryData]);

  // Auto-fill for Finished Product based on OP
  useEffect(() => {
    if (type === 'entry' && contentType === SlotContent.FINISHED_PRODUCT && op.trim().length >= 3) {
      const existingItem = inventoryData.find(item => item.originOP === op);
      if (existingItem) {
        setName(existingItem.description);
        setLot(existingItem.lot);
        setIsAutoFilled(true);
      } else {
        setIsAutoFilled(false);
      }
    } else {
      setIsAutoFilled(false);
    }
  }, [op, contentType, type, inventoryData]);

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
      } else {
        suggestedSlot = availableSlots.find(s => {
          const isBottleRange = s.rack === 'A' && s.position <= 16;
          const isSupplyRange = (s.rack === 'B' || s.rack === 'C') && s.level >= 2 && s.position <= 16;
          const isFinishedRange = (s.rack === 'B' || s.rack === 'C') && s.level === 1 && s.position <= 14;
          return !isBottleRange && !isSupplyRange && !isFinishedRange;
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

  useEffect(() => {
    if (isOpen) {
      setType('entry');
      setOp('');
      setName('');
      setLot('');
      setQuantity(1);
      setContentType(SlotContent.BOTTLES);
      setSlotId('');
      setTransferId('');
      setFromSlot('');
      setToSlot('');
      setExitId('');
      setExitReason('');
      setSupplyDescription('');
      setBottlesCount(0);
      setCapsCount(0);
      setBoxesCount(0);
      setCradlesCount(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleEntrySubmit = () => {
    if (!name || !quantity || !slotId) return;
    if (isNaN(quantity) || quantity <= 0) return;
    
    const randomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    onEntry({
      id: randomId,
      op,
      name,
      lot,
      quantity,
      contentType,
      slotId,
      supplyDetails: contentType === SlotContent.SUPPLIES ? {
        description: supplyDescription,
        bottles: bottlesCount,
        caps: capsCount,
        boxes: boxesCount,
        cradles: cradlesCount
      } : null
    });
  };

  const handleTransferSubmit = () => {
    onTransfer({
      id: transferId,
      fromSlot,
      toSlot
    });
  };

  const handleExitSubmit = () => {
    onExit({
      id: exitId,
      reason: exitReason
    });
  };

  const contentTypes = [
    { value: SlotContent.BOTTLES, label: 'Frasco' },
    { value: SlotContent.SUPPLIES, label: 'Insumo' },
    { value: SlotContent.FINISHED_PRODUCT, label: 'Produto Acabado' },
    { value: SlotContent.USE_CONSUMPTION, label: 'Uso e Consumo' },
    { value: SlotContent.RETURN, label: 'Retorno' },
    { value: SlotContent.CONTAINER_SJ, label: 'Container SJ' },
    { value: SlotContent.CONTAINER_LP, label: 'Container LP' },
    { value: SlotContent.CONTAINER_CP, label: 'Container CP' },
    { value: SlotContent.REWORK, label: 'Retrabalho' },
    { value: SlotContent.REPROCESS, label: 'Reprocesso' },
  ];

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
                        value={lot}
                        onChange={e => setLot(e.target.value)}
                        placeholder="Ex: 01260307143"
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white font-mono font-black text-sm focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all hover:border-slate-700"
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                      <FlaskConical className="w-3 h-3 text-blue-500" />
                      Quantidade
                    </label>
                    <p className="text-[9px] text-slate-600 font-bold ml-1 -mt-1 italic">informar quantidade total de unidades</p>
                    <input 
                      type="number" 
                      value={quantity}
                      onChange={e => setQuantity(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white font-mono font-black text-sm focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all hover:border-slate-700"
                    />
                  </div>
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
                    className="p-5 bg-slate-950/50 border border-slate-800 rounded-2xl space-y-4"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-7 h-7 bg-indigo-600/10 text-indigo-500 rounded-lg flex items-center justify-center border border-indigo-500/20">
                        <Package className="w-4 h-4" />
                      </div>
                      <h4 className="text-[10px] font-bold text-white uppercase tracking-widest">Detalhes do Insumo</h4>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[8px] font-bold text-slate-600 uppercase tracking-widest ml-1">Descrição</label>
                      <input 
                        type="text" 
                        value={supplyDescription}
                        onChange={e => setSupplyDescription(e.target.value)}
                        placeholder="Ex: Caixas de papelão..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white font-bold text-xs focus:border-indigo-600 outline-none transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-4 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[8px] font-bold text-slate-600 uppercase tracking-widest text-center block">Caixas</label>
                        <input type="number" value={boxesCount} onChange={e => setBoxesCount(Number(e.target.value))} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-2 text-white font-bold text-xs text-center" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[8px] font-bold text-slate-600 uppercase tracking-widest text-center block">Frascos</label>
                        <input type="number" value={bottlesCount} onChange={e => setBottlesCount(Number(e.target.value))} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-2 text-white font-bold text-xs text-center" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[8px] font-bold text-slate-600 uppercase tracking-widest text-center block">Berços</label>
                        <input type="number" value={cradlesCount} onChange={e => setCradlesCount(Number(e.target.value))} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-2 text-white font-bold text-xs text-center" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[8px] font-bold text-slate-600 uppercase tracking-widest text-center block">Tampas</label>
                        <input type="number" value={capsCount} onChange={e => setCapsCount(Number(e.target.value))} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-2 text-white font-bold text-xs text-center" />
                      </div>
                    </div>
                  </motion.div>
                )}

                <button 
                  onClick={handleEntrySubmit}
                  disabled={!name || !quantity || !slotId}
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
                    ID do Produto
                  </label>
                  <p className="text-[9px] text-slate-600 font-bold ml-1 -mt-1 italic">Digite o ID para localizar automaticamente</p>
                  <input 
                    type="text" 
                    value={transferId}
                    onChange={e => setTransferId(e.target.value.toUpperCase())}
                    placeholder="Ex: ABC123"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white font-mono font-black text-sm focus:border-amber-600 focus:ring-4 focus:ring-amber-600/10 outline-none transition-all hover:border-slate-700"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                      <ArrowLeftRight className="w-3 h-3 text-amber-500 rotate-90" />
                      Origem
                    </label>
                    <p className="text-[9px] text-slate-600 font-bold ml-1 -mt-1 italic">Vaga atual do item</p>
                    <div className="relative group">
                      <select 
                        value={fromSlot}
                        onChange={e => setFromSlot(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white font-mono font-black text-sm focus:border-amber-600 focus:ring-4 focus:ring-amber-600/10 outline-none transition-all appearance-none cursor-pointer group-hover:border-slate-700"
                      >
                        <option value="">Selecione a origem</option>
                        {sortedOccupiedSlots
                          .filter(slot => {
                            if (!transferId) return true;
                            const item = inventoryData.find(i => i.id === transferId);
                            return item ? item.inspections?.[0]?.assignedSlot === slot.id : true;
                          })
                          .map(slot => (
                            <option key={slot.id} value={slot.id}>{slot.id} ({slot.occupiedBy})</option>
                          ))}
                      </select>
                      <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-600">
                        <Plus className="w-4 h-4 rotate-45" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                      <ArrowLeftRight className="w-3 h-3 text-amber-500 -rotate-90" />
                      Destino
                    </label>
                    <p className="text-[9px] text-slate-600 font-bold ml-1 -mt-1 italic">Nova vaga de destino</p>
                    <div className="relative group">
                      <select 
                        value={toSlot}
                        onChange={e => setToSlot(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white font-mono font-black text-sm focus:border-amber-600 focus:ring-4 focus:ring-amber-600/10 outline-none transition-all appearance-none cursor-pointer group-hover:border-slate-700"
                      >
                        <option value="">Selecione o destino</option>
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
                  disabled={!transferId || !fromSlot || !toSlot}
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
                    ID do Produto
                  </label>
                  <p className="text-[9px] text-slate-600 font-bold ml-1 -mt-1 italic">Digite o ID do item que está saindo</p>
                  <input 
                    type="text" 
                    value={exitId}
                    onChange={e => setExitId(e.target.value.toUpperCase())}
                    placeholder="Ex: ABC123"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white font-mono font-black text-sm focus:border-red-600 focus:ring-4 focus:ring-red-600/10 outline-none transition-all hover:border-slate-700"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                    <Info className="w-3 h-3 text-red-500" />
                    Motivo da Saída
                  </label>
                  <p className="text-[9px] text-slate-600 font-bold ml-1 -mt-1 italic">Descreva brevemente o destino ou motivo</p>
                  <textarea 
                    value={exitReason}
                    onChange={e => setExitReason(e.target.value)}
                    placeholder="Ex: Envio para Matriz, Descarte, etc."
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white font-black text-sm focus:border-red-600 focus:ring-4 focus:ring-red-600/10 outline-none transition-all h-32 resize-none hover:border-slate-700"
                  />
                </div>

                <button 
                  onClick={handleExitSubmit}
                  disabled={!exitId || !exitReason}
                  className="w-full py-5 bg-red-600 hover:bg-red-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-[0.25em] transition-all duration-300 flex items-center justify-center gap-3 shadow-2xl shadow-red-900/40 active:scale-[0.98] group"
                >
                  Confirmar Saída 
                  <LogOut className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
