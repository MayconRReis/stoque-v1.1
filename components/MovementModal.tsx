import React, { useState, useEffect, useMemo } from 'react';
import { SlotContent, WarehouseSlot, HistoryType, SheetRow } from '../types';
import { Truck, ArrowLeftRight, LogOut, Plus, X, Box, FlaskConical, Package, Info, Check } from 'lucide-react';
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
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-xl p-4 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-3xl w-full max-w-2xl overflow-hidden my-auto"
      >
        
        <div className="bg-slate-800/20 p-6 md:p-8 flex justify-between items-center border-b border-slate-800/50">
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/40">
                <Truck className="text-white w-5 h-5" />
             </div>
             <div>
                <h3 className="font-black text-xl italic uppercase tracking-tight text-white">Movimentação</h3>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Gestão de Fluxo G0</p>
             </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-slate-950/50 rounded-xl text-slate-500 hover:text-white border border-slate-800 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 md:p-8 space-y-6">
          {/* Type Selector */}
          <div className="flex p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button 
              onClick={() => setType('entry')}
              className={`flex-1 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${type === 'entry' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Entrada
            </button>
            <button 
              onClick={() => setType('transfer')}
              className={`flex-1 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${type === 'transfer' ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Transferência
            </button>
            <button 
              onClick={() => setType('exit')}
              className={`flex-1 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${type === 'exit' ? 'bg-red-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest ml-1">Tipo</label>
                    <select 
                      value={contentType}
                      onChange={e => setContentType(e.target.value as SlotContent)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-bold text-sm focus:border-blue-600 outline-none transition-all appearance-none"
                    >
                      {contentTypes.map(ct => (
                        <option key={ct.value} value={ct.value}>{ct.label}</option>
                      ))}
                    </select>
                  </div>
                  {contentType !== SlotContent.USE_CONSUMPTION && (
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest ml-1">OP (Opcional)</label>
                      <div className="relative">
                        <input 
                          type="text" 
                          value={op}
                          onChange={e => setOp(e.target.value)}
                          placeholder="Ex: 410-152"
                          className={`w-full bg-slate-950 border ${isAutoFilled ? 'border-green-500/50' : 'border-slate-800'} rounded-xl px-4 py-3 text-white font-bold text-sm focus:border-blue-600 outline-none transition-all`}
                        />
                        {isAutoFilled && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 flex items-center gap-1">
                            <Check className="w-4 h-4" />
                            <span className="text-[8px] font-black uppercase italic">Dados Encontrados</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest ml-1">Nome (Obrigatório)</label>
                    <input 
                      type="text" 
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder={contentType === SlotContent.USE_CONSUMPTION ? "Ex: PAPEL TOALHA" : "Ex: SELANTE 500G"}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-bold text-sm focus:border-blue-600 outline-none transition-all"
                    />
                  </div>
                  {contentType !== SlotContent.USE_CONSUMPTION && (
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest ml-1">Lote (Opcional)</label>
                      <input 
                        type="text" 
                        value={lot}
                        onChange={e => setLot(e.target.value)}
                        placeholder="Ex: 01260307143"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-bold text-sm focus:border-blue-600 outline-none transition-all"
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest ml-1">Quantidade</label>
                    <input 
                      type="number" 
                      value={quantity}
                      onChange={e => setQuantity(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-bold text-sm focus:border-blue-600 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest ml-1">Vaga</label>
                    <select 
                      value={slotId}
                      onChange={e => setSlotId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-bold text-sm focus:border-blue-600 outline-none transition-all appearance-none"
                    >
                      <option value="">Selecione uma vaga</option>
                      {sortedAvailableSlots.map(slot => (
                        <option key={slot.id} value={slot.id}>{slot.id}</option>
                      ))}
                    </select>
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
                  className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-2xl font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-xl"
                >
                  Confirmar Entrada <Plus className="w-4 h-4" />
                </button>
              </motion.div>
            )}

            {type === 'transfer' && (
              <motion.div 
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-5"
              >
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest ml-1">ID do Produto</label>
                  <input 
                    type="text" 
                    value={transferId}
                    onChange={e => setTransferId(e.target.value.toUpperCase())}
                    placeholder="Ex: ABC123"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-bold text-sm focus:border-amber-600 outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest ml-1">Origem</label>
                    <select 
                      value={fromSlot}
                      onChange={e => setFromSlot(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-bold text-sm focus:border-amber-600 outline-none transition-all appearance-none"
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
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest ml-1">Destino</label>
                    <select 
                      value={toSlot}
                      onChange={e => setToSlot(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-bold text-sm focus:border-amber-600 outline-none transition-all appearance-none"
                    >
                      <option value="">Selecione o destino</option>
                      {sortedAvailableSlots.map(slot => (
                        <option key={slot.id} value={slot.id}>{slot.id}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <button 
                  onClick={handleTransferSubmit}
                  disabled={!transferId || !fromSlot || !toSlot}
                  className="w-full py-4 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-2xl font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-xl"
                >
                  Confirmar Transferência <ArrowLeftRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}

            {type === 'exit' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-5"
              >
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest ml-1">ID do Produto</label>
                  <input 
                    type="text" 
                    value={exitId}
                    onChange={e => setExitId(e.target.value.toUpperCase())}
                    placeholder="Ex: ABC123"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-bold text-sm focus:border-red-600 outline-none transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest ml-1">Motivo da Saída</label>
                  <textarea 
                    value={exitReason}
                    onChange={e => setExitReason(e.target.value)}
                    placeholder="Ex: Envio para Matriz, Descarte, etc."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-bold text-sm focus:border-red-600 outline-none transition-all h-28 resize-none"
                  />
                </div>

                <button 
                  onClick={handleExitSubmit}
                  disabled={!exitId || !exitReason}
                  className="w-full py-4 bg-red-600 hover:bg-red-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-2xl font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-xl"
                >
                  Confirmar Saída <LogOut className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
