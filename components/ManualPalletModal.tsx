import React, { useState, useEffect } from 'react';
import { WarehouseSlot, SlotContent, SheetRow, translateSlotContent, getContentTypeColor, parseSlotContent } from '../types';
import { X, Plus, Truck, Package, ClipboardList, Info, FlaskConical, Database, ChevronDown, Trash2, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabaseService } from '../services/supabaseService';
import { formatOP } from '../lib/formatters';

interface SupplyExtra {
  id: string;
  name: string;
  quantity: number;
}

interface ManualPalletModalProps {
  inventoryData: SheetRow[];
  historyData: any[];
  isOpen: boolean;
  onClose: () => void;
  availableSlots: WarehouseSlot[];
  onSave: (data: any) => Promise<void>;
}

export const ManualPalletModal: React.FC<ManualPalletModalProps> = ({ isOpen, onClose, availableSlots, onSave, inventoryData, historyData }) => {
  const [description, setDescription] = useState('');
  const [op, setOp] = useState('');
  const [lot, setLot] = useState('');
  const [contentType, setContentType] = useState<SlotContent>(SlotContent.FINISHED_PRODUCT);
  const [units, setUnits] = useState(0);
  const [assignedSlot, setAssignedSlot] = useState('AGUARDANDO');
  const [isProcessing, setIsProcessing] = useState(false);

  // Supply specific fields
  const [supplyFrascos, setSupplyFrascos] = useState(0);
  const [supplyTampas, setSupplyTampas] = useState(0);
  const [supplyCaixas, setSupplyCaixas] = useState(0);
  const [supplyBercos, setSupplyBercos] = useState(0);
  const [supplyExtras, setSupplyExtras] = useState<SupplyExtra[]>([]);
  const [newExtraName, setNewExtraName] = useState('');
  const [newExtraQty, setNewExtraQty] = useState(0);

  // Rework specific
  const [reworkObs, setReworkObs] = useState('');

  const isSupply = contentType === SlotContent.SUPPLIES;
  const isRework = contentType === SlotContent.REWORK || contentType === SlotContent.REPROCESS;

  // Reset all form fields
  const resetForm = () => {
    setDescription('');
    setOp('');
    setLot('');
    setContentType(SlotContent.FINISHED_PRODUCT);
    setUnits(0);
    setAssignedSlot('AGUARDANDO');
    setSupplyFrascos(0);
    setSupplyTampas(0);
    setSupplyCaixas(0);
    setSupplyBercos(0);
    setSupplyExtras([]);
    setNewExtraName('');
    setNewExtraQty(0);
    setReworkObs('');
  };

  // Auto-fill silently when an OP that already passed through stock is entered
  useEffect(() => {
    if (!op || op.trim().length < 3) return;

    const rawTerm = op.trim();
    const formatted = formatOP(rawTerm);
    const upperTerm = rawTerm.toUpperCase();
    const upperFmt = formatted.toUpperCase();

    // 1. Check local inventoryData first
    const invMatch = inventoryData?.find(p => {
      const pOp = (p.originOP || '').toUpperCase();
      return pOp === upperTerm || pOp === upperFmt || formatOP(pOp) === formatted;
    });

    if (invMatch) {
      if (invMatch.description) setDescription(invMatch.description);
      if (invMatch.lot) setLot(invMatch.lot);
      const insp = invMatch.inspections?.[0];
      if (insp?.contentType) {
        setContentType(insp.contentType);
      }
      const totalUnits = (insp?.bottles || 0) + (insp?.boxes || 0) + (insp?.caps || 0) + (insp?.cradles || 0) +
        (insp?.others?.reduce((acc, curr) => acc + (Number(curr.quantity) || 0), 0) || 0);
      if (totalUnits > 0) {
        setUnits(totalUnits);
      }
      if (insp?.contentType === SlotContent.SUPPLIES) {
        setSupplyFrascos(insp.bottles || 0);
        setSupplyTampas(insp.caps || 0);
        setSupplyCaixas(insp.boxes || 0);
        setSupplyBercos(insp.cradles || 0);
        if (insp.others && Array.isArray(insp.others)) {
          setSupplyExtras(insp.others.map((o: any) => ({
            id: Math.random().toString(36).slice(2),
            name: o.name,
            quantity: Number(o.quantity) || 0
          })));
        }
      }
      if (insp?.reworkObs) {
        setReworkObs(insp.reworkObs);
      }
      return;
    }

    // 2. Check local historyData
    const histMatch = historyData?.find(h => {
      const hOp = (h.op || h.origin_op || '').toUpperCase();
      return hOp === upperTerm || hOp === upperFmt || formatOP(hOp) === formatted;
    });

    if (histMatch) {
      if (histMatch.description) setDescription(histMatch.description);
      if (histMatch.lot) setLot(histMatch.lot);
      if (histMatch.pallet_type || histMatch.palletType) {
        setContentType(parseSlotContent(histMatch.pallet_type || histMatch.palletType));
      }
      return;
    }

    // 3. Search via Supabase backend if not found locally
    const timer = setTimeout(async () => {
      try {
        const results = await supabaseService.searchOpOrProduct(rawTerm);
        const match = results.find(item => 
          item.originOP.toUpperCase() === upperTerm ||
          item.originOP.toUpperCase() === upperFmt ||
          formatOP(item.originOP) === formatted
        );

        if (match) {
          if (match.description) setDescription(match.description);
          if (match.lot) setLot(match.lot);
          if (match.contentType) setContentType(match.contentType);
          if (match.units && match.units > 0) setUnits(match.units);
          if (match.contentType === SlotContent.SUPPLIES && match.supplyDetails) {
            setSupplyFrascos(match.supplyDetails.frascos || 0);
            setSupplyTampas(match.supplyDetails.tampas || 0);
            setSupplyCaixas(match.supplyDetails.caixas || 0);
            setSupplyBercos(match.supplyDetails.bercos || 0);
            if (match.supplyDetails.extras) {
              setSupplyExtras(match.supplyDetails.extras);
            }
          }
          if (match.reworkObs) {
            setReworkObs(match.reworkObs);
          }
        }
      } catch (err) {
        console.warn('Erro ao buscar auto-preenchimento por OP:', err);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [op, inventoryData, historyData]);

  const handleAddExtra = () => {
    if (!newExtraName.trim()) return;
    setSupplyExtras(prev => [...prev, {
      id: Math.random().toString(36).slice(2),
      name: newExtraName.trim(),
      quantity: newExtraQty
    }]);
    setNewExtraName('');
    setNewExtraQty(0);
  };

  const handleRemoveExtra = (id: string) => {
    setSupplyExtras(prev => prev.filter(e => e.id !== id));
  };

  const handleSave = async () => {
    setIsProcessing(true);
    try {
      const payload: any = {
        description,
        op: formatOP(op),
        lot,
        palletsCount: 1,
        units,
        contentType,
        assignedSlot,
      };

      if (isSupply) {
        payload.supplyDetails = {
          frascos: supplyFrascos,
          tampas: supplyTampas,
          caixas: supplyCaixas,
          bercos: supplyBercos,
          extras: supplyExtras,
        };
      }

      if (isRework) {
        payload.reworkObs = reworkObs;
      }

      await onSave(payload);

      // Limpar todos os campos após finalizar com sucesso
      resetForm();
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  const inputCls = "w-full bg-[#0B1120] border border-slate-800 rounded-xl px-4 py-3.5 text-white font-bold text-lg focus:border-blue-500 outline-none placeholder:text-slate-700 transition-colors";
  const labelCls = "text-[10px] font-black text-slate-300 uppercase tracking-widest";
  const subLabelCls = "text-[9px] text-slate-500 italic";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={handleClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-2xl bg-[#0f1522] rounded-[2rem] border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Left blue accent line */}
        <div className="absolute top-8 left-0 w-1 h-16 bg-blue-500 rounded-r-md"></div>

        {/* Header */}
        <div className="p-8 pb-6 flex justify-between items-start shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl border border-slate-700 flex items-center justify-center bg-[#0B1120]">
              <Truck className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white italic tracking-tight leading-none mb-1">ENTRADA</h2>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Fluxo Operacional GO</p>
              </div>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-10 h-10 rounded-xl border border-slate-700 flex items-center justify-center hover:bg-slate-800 transition-colors bg-[#0B1120]"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Form - scrollable */}
        <div className="px-8 pb-8 space-y-5 overflow-y-auto flex-1">

          {/* TIPO */}
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-0.5">
              <div className="flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-blue-400" />
                <label className={labelCls}>Tipo</label>
              </div>
              <span className={`text-[10px] font-black uppercase tracking-wider ${getContentTypeColor(contentType)}`}>
                {translateSlotContent(contentType)}
              </span>
            </div>
            <p className={subLabelCls}>O que é o pallet?</p>
            <div className="relative">
              <select
                value={contentType}
                onChange={e => setContentType(e.target.value as SlotContent)}
                className={`${inputCls} appearance-none`}
              >
                <option value={SlotContent.FINISHED_PRODUCT}>Produto Acabado</option>
                <option value={SlotContent.BOTTLES}>Frasco</option>
                <option value={SlotContent.SUPPLIES}>Insumo</option>
                <option value={SlotContent.REWORK}>Retrabalho</option>
                <option value={SlotContent.REPROCESS}>Reprocesso</option>
                <option value={SlotContent.RETURN}>Retorno</option>
                <option value={SlotContent.ROTATIVE}>Estoque Rotativo</option>
                <option value={SlotContent.CONTAINER_CP}>Container Com Produto</option>
                <option value={SlotContent.CONTAINER_LP}>Container Limpo</option>
                <option value={SlotContent.CONTAINER_SJ}>Container Sujo</option>
                <option value={SlotContent.USE_CONSUMPTION}>Uso e Consumo</option>
                <option value={SlotContent.MISCELLANEOUS}>Diversos</option>
                <option value={SlotContent.DISCARD}>Descarte</option>
                <option value={SlotContent.OTHER}>Outro</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* GRID: OP + LOTE */}
          <div className="grid grid-cols-2 gap-4">
            {/* OP Input */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 mb-0.5">
                <ClipboardList className="w-3.5 h-3.5 text-blue-400" />
                <label className={labelCls}>OP (Opcional)</label>
              </div>
              <p className={subLabelCls}>Ordem de Produção</p>
              <input
                type="text"
                value={op}
                onChange={e => setOp(e.target.value.toUpperCase())}
                placeholder="Ex: 410-152"
                className={`${inputCls} uppercase`}
              />
            </div>

            {/* Lote */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Package className="w-3.5 h-3.5 text-blue-400" />
                <label className={labelCls}>Lote (Opcional)</label>
              </div>
              <p className={subLabelCls}>Informar conforme etiqueta</p>
              <input
                type="text"
                value={lot}
                onChange={e => setLot(e.target.value.toUpperCase())}
                placeholder="Ex: 01260307143"
                className={`${inputCls} uppercase`}
              />
            </div>
          </div>

          {/* NOME (Descrição) */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 mb-0.5">
              <Info className="w-3.5 h-3.5 text-blue-400" />
              <label className={labelCls}>Nome (Obrigatório)</label>
            </div>
            <p className={subLabelCls}>Informar o nome do produto</p>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value.toUpperCase())}
              placeholder="Ex: SELANTE 500G"
              className={`${inputCls} uppercase`}
            />
          </div>

          {/* QUANTIDADE UN */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 mb-0.5">
              <FlaskConical className="w-3.5 h-3.5 text-blue-400" />
              <label className={labelCls}>Qtd. Unidades</label>
            </div>
            <p className={subLabelCls}>Total de unidades/kg</p>
            <input
              type="number"
              min="0"
              value={units}
              onChange={e => setUnits(Number(e.target.value))}
              className={inputCls}
            />
          </div>

          {/* ─── CAMPOS DINÂMICOS: INSUMO ─── */}
          <AnimatePresence>
            {isSupply && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4 pt-2 border-t border-slate-800"
              >
                <div className="flex items-center gap-2 text-indigo-400">
                  <Package className="w-4 h-4" />
                  <span className="text-xs font-black uppercase tracking-wider">Detalhamento de Insumos</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className={labelCls}>Frascos</label>
                    <input
                      type="number"
                      min="0"
                      value={supplyFrascos}
                      onChange={e => setSupplyFrascos(Number(e.target.value))}
                      className={inputCls}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className={labelCls}>Tampas</label>
                    <input
                      type="number"
                      min="0"
                      value={supplyTampas}
                      onChange={e => setSupplyTampas(Number(e.target.value))}
                      className={inputCls}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className={labelCls}>Caixas</label>
                    <input
                      type="number"
                      min="0"
                      value={supplyCaixas}
                      onChange={e => setSupplyCaixas(Number(e.target.value))}
                      className={inputCls}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className={labelCls}>Berços</label>
                    <input
                      type="number"
                      min="0"
                      value={supplyBercos}
                      onChange={e => setSupplyBercos(Number(e.target.value))}
                      className={inputCls}
                    />
                  </div>
                </div>

                {/* Itens Extras */}
                <div className="space-y-2 pt-2">
                  <label className={labelCls}>Itens Extras</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Nome do item"
                      value={newExtraName}
                      onChange={e => setNewExtraName(e.target.value)}
                      className="flex-1 bg-[#0B1120] border border-slate-800 rounded-xl px-3 py-2 text-white font-bold text-sm focus:border-indigo-500 outline-none"
                    />
                    <input
                      type="number"
                      min="0"
                      placeholder="Qtd"
                      value={newExtraQty || ''}
                      onChange={e => setNewExtraQty(Number(e.target.value))}
                      className="w-24 bg-[#0B1120] border border-slate-800 rounded-xl px-3 py-2 text-white font-bold text-sm focus:border-indigo-500 outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddExtra}
                      className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs flex items-center gap-1 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add
                    </button>
                  </div>

                  {supplyExtras.length > 0 && (
                    <div className="space-y-1.5 mt-2">
                      {supplyExtras.map(extra => (
                        <div key={extra.id} className="flex items-center justify-between bg-[#0B1120] px-3 py-2 rounded-lg border border-slate-800 text-xs">
                          <span className="text-white font-bold">{extra.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-indigo-400 font-mono font-bold">{extra.quantity} un</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveExtra(extra.id)}
                              className="text-slate-500 hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ─── CAMPOS DINÂMICOS: RETRABALHO / REPROCESSO ─── */}
          <AnimatePresence>
            {isRework && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2 pt-2 border-t border-slate-800"
              >
                <div className="flex items-center gap-2 text-amber-400">
                  <MessageSquare className="w-4 h-4" />
                  <span className="text-xs font-black uppercase tracking-wider">Observações de Retrabalho/Reprocesso</span>
                </div>
                <textarea
                  rows={2}
                  value={reworkObs}
                  onChange={e => setReworkObs(e.target.value)}
                  placeholder="Ex: Troca de válvula, correção de rotulagem..."
                  className="w-full bg-[#0B1120] border border-slate-800 rounded-xl px-4 py-3 text-white font-bold text-sm focus:border-amber-500 outline-none placeholder:text-slate-700 resize-none"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* LOCALIZAÇÃO (VAGA) */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 mb-0.5">
              <Database className="w-3.5 h-3.5 text-blue-400" />
              <label className={labelCls}>Localização (Vaga)</label>
            </div>
            <p className={subLabelCls}>Vaga onde o pallet será armazenado</p>
            <div className="relative">
              <select
                value={assignedSlot}
                onChange={e => setAssignedSlot(e.target.value)}
                className={`${inputCls} appearance-none`}
              >
                <option value="AGUARDANDO">AGUARDANDO</option>
                {availableSlots.map(slot => (
                  <option key={slot.id} value={slot.id}>
                    {slot.id} ({slot.currentPallets}/{slot.maxPallets})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-8 pt-4 border-t border-slate-800/80 bg-[#0f1522] shrink-0">
          <button
            onClick={handleSave}
            disabled={!description.trim() || isProcessing}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 text-sm uppercase tracking-wider transition-all"
          >
            <Plus className="w-4 h-4" />
            {isProcessing ? 'Adicionando...' : 'Adicionar Pallet'}
          </button>
        </div>

      </motion.div>
    </div>
  );
};

