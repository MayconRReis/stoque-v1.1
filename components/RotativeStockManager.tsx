import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Minus, 
  Trash2, 
  Search, 
  Box, 
  AlertCircle,
  Warehouse,
  Package,
  History,
  TrendingUp,
  Boxes
} from 'lucide-react';
import { RotativeStockItem, WarehouseSlot, SlotContent } from '../types';
import { supabaseService } from '../services/supabaseService';

interface RotativeStockManagerProps {
  slots: WarehouseSlot[];
  onUpdateSlot: (slot: WarehouseSlot) => Promise<void>;
  onShowNotification: (message: string, type?: 'info' | 'error') => void;
  operatorName?: string;
}

export const RotativeStockManager: React.FC<RotativeStockManagerProps> = ({
  slots,
  onUpdateSlot,
  onShowNotification,
  operatorName
}) => {
  const [items, setItems] = useState<RotativeStockItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);
  
  // Entry Form State
  const [isEntryMode, setIsEntryMode] = useState(false);
  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState<number>(0);
  const [productType, setProductType] = useState('Frasco');
  const [selectedSlotId, setSelectedSlotId] = useState('');

  const rotativeTypes = ['Frasco', 'Caixa', 'Tampa', 'Sleev'];

  const loadItems = async () => {
    try {
      const data = await supabaseService.getRotativeStock();
      setItems(data);
    } catch (error) {
      console.error('Error loading rotative stock:', error);
      onShowNotification('Erro ao carregar estoque rotativo', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
    const channel = supabaseService.subscribeToRotativeStock(() => {
      loadItems();
    });
    return () => {
      channel.unsubscribe();
    };
  }, []);

  const availableSlots = slots.filter(s => 
    s.status === SlotContent.ROTATIVE
  );

  const handleEntry = async () => {
    if (!productName || quantity <= 0 || !selectedSlotId) {
      onShowNotification('Preencha todos os campos corretamente', 'error');
      return;
    }

    try {
      // Check if product already exists in this slot with SAME TYPE
      const existingItem = items.find(
        i => i.productName.toLowerCase() === productName.toLowerCase() && 
             i.slotId === selectedSlotId &&
             i.type === productType
      );

      const targetSlot = slots.find(s => s.id === selectedSlotId);

      if (existingItem) {
        // Update existing
        await supabaseService.saveRotativeStockItem({
          ...existingItem,
          quantity: existingItem.quantity + quantity
        });
      } else {
        // Create new
        await supabaseService.saveRotativeStockItem({
          id: Math.random().toString(36).substring(2, 9),
          productName,
          quantity,
          slotId: selectedSlotId,
          type: productType,
          updatedAt: new Date().toISOString()
        });
      }

      // Update slot status to ROTATIVE if it was EMPTY
      if (targetSlot && targetSlot.status !== SlotContent.ROTATIVE) {
        await onUpdateSlot({
          ...targetSlot,
          status: SlotContent.ROTATIVE,
          occupiedBy: 'ESTOQUE ROTATIVO'
        });
      }

      onShowNotification(`Entrada de ${quantity}x ${productName} realizada`);
      setIsEntryMode(false);
      setProductName('');
      setQuantity(0);
      setProductType('Frasco');
      setSelectedSlotId('');
      loadItems();
    } catch (error) {
      console.error('Error in rotative entry:', error);
      onShowNotification('Erro ao processar entrada', 'error');
    }
  };

  const handleExit = async (itemId: string, exitQty: number) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    if (exitQty > item.quantity) {
      onShowNotification('Quantidade de saída maior que o saldo', 'error');
      return;
    }

    try {
      const newQuantity = item.quantity - exitQty;
      const slotId = item.slotId;

      if (newQuantity === 0) {
        await supabaseService.deleteRotativeStockItem(itemId);
      } else {
        await supabaseService.saveRotativeStockItem({
          ...item,
          quantity: newQuantity
        });
      }

      // Check if slot becomes empty
      // Need to check updated items list AFTER this operation
      // Actually, let's refresh and check
      const updatedData = await supabaseService.getRotativeStock();
      const remainingInSlot = updatedData.filter(i => i.slotId === slotId).length;

      if (remainingInSlot === 0) {
        const targetSlot = slots.find(s => s.id === slotId);
        if (targetSlot) {
          await onUpdateSlot({
            ...targetSlot,
            status: SlotContent.EMPTY,
            occupiedBy: undefined
          });
        }
      }

      onShowNotification(`Saída de ${exitQty}x ${item.productName} realizada`);
      loadItems();
    } catch (error) {
      console.error('Error in rotative exit:', error);
      onShowNotification('Erro ao processar saída', 'error');
    }
  };

  const filteredItems = items.filter(i => {
    const matchesSearch = i.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         i.slotId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'ALL' || i.type === typeFilter;
    return matchesSearch && matchesType;
  });

  // Group items by slot for display
  const itemsBySlot = filteredItems.reduce((acc, item) => {
    if (!acc[item.slotId]) acc[item.slotId] = [];
    acc[item.slotId].push(item);
    return acc;
  }, {} as Record<string, RotativeStockItem[]>);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-blue-500" />
            Estoque Rotativo
          </h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Gestão de itens fracionados e controle dinâmico de vagas</p>
        </div>
        <button
          onClick={() => setIsEntryMode(true)}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-blue-900/20 transition-all border border-blue-400/20"
        >
          <Plus className="w-4 h-4" /> Nova Entrada
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 w-4 h-4" />
          <input 
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar no estoque rotativo..."
            className="w-full bg-slate-900/60 border border-slate-800 rounded-2xl px-12 py-4 text-white font-bold text-sm focus:border-blue-500/50 outline-none transition-all placeholder:text-slate-700"
          />
        </div>
        <div className="flex gap-2 bg-slate-900/60 p-1.5 rounded-2xl border border-slate-800">
          {['ALL', ...rotativeTypes].map(type => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                typeFilter === type ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {type === 'ALL' ? 'Todos' : type}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {(Object.entries(itemsBySlot) as [string, RotativeStockItem[]][]).map(([slotId, slotItems]) => {
          const occupancy = slotItems.reduce((sum, item) => sum + item.quantity, 0);
          return (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              key={slotId}
              className="bg-slate-900/40 p-6 rounded-[2.5rem] border border-slate-800/80 shadow-2xl space-y-4 hover:border-slate-700 transition-all transition-transform hover:scale-[1.01] group"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600/10 text-blue-500 rounded-xl flex items-center justify-center border border-blue-500/20">
                    <Warehouse className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white uppercase italic tracking-tight">Vaga {slotId}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Estoque Rotativo</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                {slotItems.map(item => (
                  <div key={item.id} className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800/50 group/item hover:border-slate-700 transition-all">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[8px] px-2 py-0.5 bg-blue-600/10 text-blue-500 border border-blue-500/20 rounded font-black uppercase tracking-widest">{item.type}</span>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Produto</p>
                        </div>
                        <h4 className="text-white font-black uppercase text-xs sm:text-sm leading-tight">{item.productName}</h4>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Saldo</p>
                        <p className="text-lg font-black text-white italic">{item.quantity} <span className="text-[10px] text-slate-600 px-1 font-normal tracking-normal not-italic">Un</span></p>
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/30">
                      <button 
                        onClick={() => {
                          const qty = prompt(`Quantas unidades de ${item.productName} deseja retirar?`, '1');
                          if (qty) handleExit(item.id, parseInt(qty));
                        }}
                        className="p-2 bg-red-600/10 text-red-500 rounded-lg hover:bg-red-600 hover:text-white transition-all border border-red-500/20"
                        title="Retirar do estoque"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => {
                          const qty = prompt(`Quantas unidades de ${item.productName} deseja adicionar?`, '1');
                          if (qty) {
                            // Update item logic shortcut
                            handleEntryShortcut(item.slotId, item.productName, parseInt(qty));
                          }
                        }}
                        className="p-2 bg-green-600/10 text-green-500 rounded-lg hover:bg-green-600 hover:text-white transition-all border border-green-500/20"
                        title="Adicionar mais"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })}

        {filteredItems.length === 0 && !isLoading && (
          <div className="col-span-full py-32 text-center border-2 border-dashed border-slate-900 rounded-[2.5rem]">
            <Boxes className="w-12 h-12 text-slate-800 mx-auto mb-4" />
            <p className="text-slate-700 font-bold uppercase text-[10px] tracking-[0.3em]">Nenhum item no estoque rotativo</p>
          </div>
        )}
      </div>

      {/* Entry Modal Placeholder */}
      <AnimatePresence>
        {isEntryMode && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEntryMode(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl relative z-10 space-y-6"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-black text-white uppercase italic tracking-tight">Nova Entrada Rotativa</h3>
                <button 
                  onClick={() => setIsEntryMode(false)}
                  className="p-2 hover:bg-slate-800 rounded-xl transition-colors"
                >
                  <AlertCircle className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1">Nome do Produto</label>
                  <input 
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3.5 text-white font-bold text-sm focus:border-blue-500 outline-none transition-all outline-none"
                    placeholder="Ex: Frasco 500ml"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1">Tipo de Item</label>
                  <div className="grid grid-cols-2 gap-2">
                    {rotativeTypes.map(type => (
                      <button
                        key={type}
                        onClick={() => setProductType(type)}
                        className={`px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                          productType === type 
                            ? 'bg-blue-600 text-white border-blue-400 shadow-lg shadow-blue-900/20' 
                            : 'bg-slate-950 text-slate-500 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1">Quantidade</label>
                  <input 
                    type="number"
                    value={quantity || ''}
                    onChange={(e) => setQuantity(parseInt(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3.5 text-white font-bold text-sm focus:border-blue-500 outline-none transition-all outline-none"
                    placeholder="Quantidade de unidades"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1">Selecionar Vaga</label>
                  <select
                    value={selectedSlotId}
                    onChange={(e) => setSelectedSlotId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3.5 text-white font-bold text-sm focus:border-blue-500 outline-none transition-all outline-none appearance-none"
                  >
                    <option value="">Selecione uma vaga...</option>
                    {availableSlots.map(s => (
                      <option key={s.id} value={s.id}>
                        Vaga {s.id}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  onClick={() => setIsEntryMode(false)}
                  className="flex-1 px-6 py-4 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-2xl font-bold text-xs uppercase tracking-widest transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleEntry}
                  className="flex-1 px-6 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-blue-900/20 transition-all"
                >
                  Registrar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );

  function handleEntryShortcut(slotId: string, pName: string, qty: number, pType?: string) {
     const type = pType || 'Frasco';
     setProductName(pName);
     setQuantity(qty);
     setProductType(type);
     setSelectedSlotId(slotId);
     setTimeout(() => handleEntryWithParams(pName, qty, slotId, type), 50);
  }

  const handleEntryWithParams = async (pName: string, qty: number, sId: string, pType: string) => {
    try {
      const existingItem = items.find(
        i => i.productName.toLowerCase() === pName.toLowerCase() && i.slotId === sId && i.type === pType
      );

      if (existingItem) {
        await supabaseService.saveRotativeStockItem({
          ...existingItem,
          quantity: existingItem.quantity + qty
        });
        onShowNotification(`Adicionado ${qty}x ${pName} à vaga ${sId}`);
        loadItems();
      }
    } catch (error) {
      onShowNotification('Erro ao processar entrada', 'error');
    }
  };
};
