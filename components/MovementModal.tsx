import React, { useState, useEffect } from 'react';
import { SlotContent, WarehouseSlot, HistoryType, SheetRow } from '../types';

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
  
  // Entry Fields
  const [op, setOp] = useState('');
  const [name, setName] = useState('');
  const [lot, setLot] = useState('');
  const [quantity, setQuantity] = useState<number>(1);
  const [contentType, setContentType] = useState<SlotContent>(SlotContent.BOTTLES);
  const [slotId, setSlotId] = useState('');

  // Transfer Fields
  const [transferId, setTransferId] = useState('');
  const [fromSlot, setFromSlot] = useState('');
  const [toSlot, setToSlot] = useState('');

  // Exit Fields
  const [exitId, setExitId] = useState('');
  const [exitReason, setExitReason] = useState('');

  // Auto-select origin slot when transferId is entered
  useEffect(() => {
    if (type === 'transfer' && transferId.length >= 3) {
      const item = inventoryData.find(i => i.id === transferId);
      if (item && item.inspections && item.inspections[0]?.assignedSlot) {
        setFromSlot(item.inspections[0].assignedSlot);
      }
    }
  }, [transferId, type, inventoryData]);

  // Suggest next free slot based on content type
  useEffect(() => {
    if (type === 'entry' && isOpen) {
      let suggestedSlot: WarehouseSlot | undefined;

      if (contentType === SlotContent.BOTTLES) {
        // Frascos: A.1.1 - A.3.16
        suggestedSlot = availableSlots.find(s => s.rack === 'A' && s.position <= 16);
      } else if (contentType === SlotContent.SUPPLIES) {
        // Insumos: B.2.1 - B.3.16, C.2.1 - C.3.16
        suggestedSlot = availableSlots.find(s => (s.rack === 'B' || s.rack === 'C') && s.level >= 2 && s.position <= 16);
      } else if (contentType === SlotContent.FINISHED_PRODUCT) {
        // Produto Acabado: B.1.1 - B.1.14, C.1.1 - C.1.14
        suggestedSlot = availableSlots.find(s => (s.rack === 'B' || s.rack === 'C') && s.level === 1 && s.position <= 14);
      } else {
        // Outros: Vagas que sobraram (Rack D ou posições extras em A, B, C)
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
        // Fallback to any available slot if specific range is full
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
      slotId
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
    { value: SlotContent.RETURN, label: 'Retorno' },
    { value: SlotContent.CONTAINER_SJ, label: 'Container SJ' },
    { value: SlotContent.CONTAINER_LP, label: 'Container LP' },
    { value: SlotContent.CONTAINER_CP, label: 'Container CP' },
    { value: SlotContent.CLEAN_BUCKET, label: 'Balde Limpo' },
    { value: SlotContent.DIRTY_BUCKET, label: 'Balde Sujo' },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-2xl p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-[40px] shadow-3xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-500 my-auto">
        
        <div className="bg-slate-800/30 p-8 flex justify-between items-center border-b border-slate-800/50">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-900/40">
                <i className="fa-solid fa-truck-ramp-box text-white text-xl"></i>
             </div>
             <div>
                <h3 className="font-black text-2xl italic uppercase tracking-tighter text-white">Movimentação</h3>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Gestão de Fluxo G0</p>
             </div>
          </div>
          <button onClick={onClose} className="w-12 h-12 flex items-center justify-center bg-slate-950/50 rounded-2xl text-slate-500 hover:text-white transition-all">
            <i className="fa-solid fa-times text-lg"></i>
          </button>
        </div>

        <div className="p-8 space-y-8">
          {/* Type Selector */}
          <div className="flex p-1.5 bg-slate-950 rounded-2xl border border-slate-800">
            <button 
              onClick={() => setType('entry')}
              className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${type === 'entry' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Entrada
            </button>
            <button 
              onClick={() => setType('transfer')}
              className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${type === 'transfer' ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Transferência
            </button>
            <button 
              onClick={() => setType('exit')}
              className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${type === 'exit' ? 'bg-red-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Saída
            </button>
          </div>

          {type === 'entry' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">OP (Opcional)</label>
                  <input 
                    type="text" 
                    value={op}
                    onChange={e => setOp(e.target.value)}
                    placeholder="Ex: 410-152"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white font-bold focus:border-blue-600 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Nome (Obrigatório)</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Ex: SELANTE 500G"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white font-bold focus:border-blue-600 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Lote (Opcional)</label>
                  <input 
                    type="text" 
                    value={lot}
                    onChange={e => setLot(e.target.value)}
                    placeholder="Ex: 01260307143"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white font-bold focus:border-blue-600 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Quantidade (Obrigatório)</label>
                  <input 
                    type="number" 
                    value={quantity}
                    onChange={e => setQuantity(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white font-bold focus:border-blue-600 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Tipo (Obrigatório)</label>
                  <select 
                    value={contentType}
                    onChange={e => setContentType(e.target.value as SlotContent)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white font-bold focus:border-blue-600 outline-none transition-all appearance-none"
                  >
                    {contentTypes.map(ct => (
                      <option key={ct.value} value={ct.value}>{ct.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Vaga (Obrigatório)</label>
                  <select 
                    value={slotId}
                    onChange={e => setSlotId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white font-bold focus:border-blue-600 outline-none transition-all appearance-none"
                  >
                    <option value="">Selecione uma vaga</option>
                    {availableSlots.map(slot => (
                      <option key={slot.id} value={slot.id}>{slot.id}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button 
                onClick={handleEntrySubmit}
                disabled={!name || !quantity || !slotId}
                className="w-full py-6 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-[28px] font-black text-sm uppercase tracking-[0.4em] transition-all flex items-center justify-center gap-3 shadow-xl"
              >
                Confirmar Entrada <i className="fa-solid fa-plus"></i>
              </button>
            </div>
          )}

          {type === 'transfer' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">ID do Produto (Obrigatório)</label>
                <input 
                  type="text" 
                  value={transferId}
                  onChange={e => setTransferId(e.target.value.toUpperCase())}
                  placeholder="Ex: ABC123"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white font-bold focus:border-amber-600 outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Vaga de Origem (Obrigatório)</label>
                  <select 
                    value={fromSlot}
                    onChange={e => setFromSlot(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white font-bold focus:border-amber-600 outline-none transition-all appearance-none"
                  >
                    <option value="">Selecione a origem</option>
                    {occupiedSlots
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
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Vaga de Destino (Obrigatório)</label>
                  <select 
                    value={toSlot}
                    onChange={e => setToSlot(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white font-bold focus:border-amber-600 outline-none transition-all appearance-none"
                  >
                    <option value="">Selecione o destino</option>
                    {availableSlots.map(slot => (
                      <option key={slot.id} value={slot.id}>{slot.id}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button 
                onClick={handleTransferSubmit}
                disabled={!transferId || !fromSlot || !toSlot}
                className="w-full py-6 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-[28px] font-black text-sm uppercase tracking-[0.4em] transition-all flex items-center justify-center gap-3 shadow-xl"
              >
                Confirmar Transferência <i className="fa-solid fa-right-left"></i>
              </button>
            </div>
          )}

          {type === 'exit' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">ID do Produto (Obrigatório)</label>
                <input 
                  type="text" 
                  value={exitId}
                  onChange={e => setExitId(e.target.value.toUpperCase())}
                  placeholder="Ex: ABC123"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white font-bold focus:border-red-600 outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Motivo da Saída (Obrigatório)</label>
                <textarea 
                  value={exitReason}
                  onChange={e => setExitReason(e.target.value)}
                  placeholder="Ex: Envio para Matriz, Descarte, etc."
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white font-bold focus:border-red-600 outline-none transition-all h-32 resize-none"
                />
              </div>

              <button 
                onClick={handleExitSubmit}
                disabled={!exitId || !exitReason}
                className="w-full py-6 bg-red-600 hover:bg-red-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-[28px] font-black text-sm uppercase tracking-[0.4em] transition-all flex items-center justify-center gap-3 shadow-xl"
              >
                Confirmar Saída <i className="fa-solid fa-right-from-bracket"></i>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
