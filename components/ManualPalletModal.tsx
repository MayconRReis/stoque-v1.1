import React, { useState, useEffect } from 'react';
import { WarehouseSlot, SlotContent, SheetRow } from '../types';
import { X, Plus, Truck, Package, ClipboardList, Info, FlaskConical, Database, ChevronDown, Trash2, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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

  // Autofill logic based on OP
  useEffect(() => {
    if (op && op.length >= 3) {
      const term = op.toUpperCase();
      let match = inventoryData.find(p => p.originOP === term);
      if (!match && historyData) {
        match = historyData.find(h => h.op === term);
      }
      if (match && !description) {
        setDescription(match.description || '');
        setLot(match.lot || '');
        if (match.inspections?.[0]?.contentType) {
          setContentType(match.inspections[0].contentType);
        }
      }
    }
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
        op,
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

  const inputCls = "w-full bg-[#0B1120] border border-slate-800 rounded-xl px-4 py-3.5 text-white font-bold text-lg focus:border-blue-500 outline-none placeholder:text-slate-700";
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
            <div className="flex items-center gap-1.5 mb-0.5">
              <Package className="w-3.5 h-3.5 text-blue-400" />
              <label className={labelCls}>Tipo</label>
            </div>
            <p className={subLabelCls}>O que é o pallet?</p>
            <div className="relative">
              <select
                value={contentType}
                onChange={e => setContentType(e.target.value as SlotContent)}
                className={`${inputCls} appearance-none`}
              >
                <option value={SlotContent.CONTAINER_CP}>Container Com Produto</option>
                <option value={SlotContent.CONTAINER_LP}>Container Limpo</option>
                <option value={SlotContent.CONTAINER_SJ}>Container Sujo</option>
                <option value={SlotContent.DISCARD}>Descarte</option>
                <option value={SlotContent.MISCELLANEOUS}>Diversos</option>
                <option value={SlotContent.ROTATIVE}>Estoque Rotativo</option>
                <option value={SlotContent.BOTTLES}>Frasco</option>
                <option value={SlotContent.SUPPLIES}>Insumo</option>
                <option value={SlotContent.OTHER}>Outro</option>
                <option value={SlotContent.FINISHED_PRODUCT}>Produto Acabado</option>
                <option value={SlotContent.REPROCESS}>Reprocesso</option>
                <option value={SlotContent.REWORK}>Retrabalho</option>
                <option value={SlotContent.RETURN}>Retorno</option>
                <option value={SlotContent.USE_CONSUMPTION}>Uso e Consumo</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* GRID: OP + LOTE */}
          <div className="grid grid-cols-2 gap-4">
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

          {/* NOME */}
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
                key="supply-fields"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="pt-2 space-y-4">
                  {/* Divider */}
                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-slate-800" />
                    <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest">Detalhes do Insumo</span>
                    <div className="h-px flex-1 bg-slate-800" />
                  </div>

                  {/* Frasco, Tampas, Caixas, Berços */}
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: 'Frascos', value: supplyFrascos, setter: setSupplyFrascos },
                      { label: 'Tampas', value: supplyTampas, setter: setSupplyTampas },
                      { label: 'Caixas', value: supplyCaixas, setter: setSupplyCaixas },
                      { label: 'Berços', value: supplyBercos, setter: setSupplyBercos },
                    ].map(({ label, value, setter }) => (
                      <div key={label} className="space-y-1">
                        <label className={labelCls}>{label}</label>
                        <input
                          type="number"
                          min="0"
                          value={value}
                          onChange={e => setter(Number(e.target.value))}
                          className={inputCls}
                          placeholder="0"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Itens extras já adicionados */}
                  {supplyExtras.length > 0 && (
                    <div className="space-y-2">
                      {supplyExtras.map(extra => (
                        <div
                          key={extra.id}
                          className="flex items-center gap-3 bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3"
                        >
                          <span className="flex-1 text-sm font-bold text-white truncate">{extra.name}</span>
                          <span className="text-xs font-black text-slate-400 shrink-0">{extra.quantity} un</span>
                          <button
                            onClick={() => handleRemoveExtra(extra.id)}
                            className="w-7 h-7 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 flex items-center justify-center transition-colors shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Adicionar item extra */}
                  <div className="flex items-end gap-3">
                    <div className="flex-1 space-y-1">
                      <label className={labelCls}>Adicionar item</label>
                      <input
                        type="text"
                        value={newExtraName}
                        onChange={e => setNewExtraName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAddExtra()}
                        placeholder="Nome do item..."
                        className={inputCls}
                      />
                    </div>
                    <div className="w-28 space-y-1">
                      <label className={labelCls}>Qtd</label>
                      <input
                        type="number"
                        min="0"
                        value={newExtraQty}
                        onChange={e => setNewExtraQty(Number(e.target.value))}
                        onKeyDown={e => e.key === 'Enter' && handleAddExtra()}
                        className={inputCls}
                        placeholder="0"
                      />
                    </div>
                    <button
                      onClick={handleAddExtra}
                      disabled={!newExtraName.trim()}
                      title="Adicionar"
                      className="h-[58px] w-14 shrink-0 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-xl flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ─── CAMPOS DINÂMICOS: RETRABALHO / REPROCESSO ─── */}
          <AnimatePresence>
            {isRework && (
              <motion.div
                key="rework-fields"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="pt-2 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-slate-800" />
                    <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest">Observação</span>
                    <div className="h-px flex-1 bg-slate-800" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
                      <label className={labelCls}>O que está faltando no pallet?</label>
                    </div>
                    <p className={subLabelCls}>Descreva o motivo do retrabalho ou o que está faltando</p>
                    <textarea
                      rows={3}
                      value={reworkObs}
                      onChange={e => setReworkObs(e.target.value)}
                      placeholder="Ex: Faltando lacre, etiqueta danificada..."
                      className="w-full bg-[#0B1120] border border-slate-800 rounded-xl px-4 py-3.5 text-white font-semibold text-base focus:border-purple-500 outline-none placeholder:text-slate-700 resize-none"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* VAGA */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 mb-0.5">
              <Database className="w-3.5 h-3.5 text-blue-400" />
              <label className={labelCls}>Vaga</label>
            </div>
            <p className={subLabelCls}>Local de armazenamento</p>
            <div className="relative">
              <select
                value={assignedSlot}
                onChange={e => setAssignedSlot(e.target.value)}
                className={`${inputCls} appearance-none`}
              >
                <option value="AGUARDANDO" className="text-amber-500 font-bold bg-[#0B1120]">AGUARDANDO VAGA</option>
                {[...availableSlots]
                  .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true, sensitivity: 'base' }))
                  .map(s => (
                    <option key={s.id} value={s.id} className="text-slate-200 bg-[#0B1120]">{s.id}</option>
                  ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* BOTÃO */}
          <button
            onClick={handleSave}
            disabled={isProcessing || !description}
            className="w-full py-4 mt-2 bg-slate-200 hover:bg-white text-slate-900 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-white/5"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-500 border-t-slate-900 rounded-full animate-spin" />
                Registrando...
              </>
            ) : (
              <>
                Confirmar Entrada <Plus className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
