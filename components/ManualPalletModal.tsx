import React, { useState, useEffect, useRef } from 'react';
import { WarehouseSlot, SlotContent, SheetRow, translateSlotContent, getContentTypeColor, AutocompleteItem } from '../types';
import { X, Plus, Truck, Package, ClipboardList, Info, FlaskConical, Database, ChevronDown, Trash2, MessageSquare, Sparkles, CheckCircle2, Loader2, RotateCcw } from 'lucide-react';
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

  // Suggestions & Autocomplete state
  const [suggestions, setSuggestions] = useState<AutocompleteItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<'op' | 'desc' | null>(null);
  const [autofillSource, setAutofillSource] = useState<string | null>(null);

  const opContainerRef = useRef<HTMLDivElement>(null);
  const descContainerRef = useRef<HTMLDivElement>(null);

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
    setSuggestions([]);
    setActiveDropdown(null);
    setAutofillSource(null);
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        opContainerRef.current && !opContainerRef.current.contains(e.target as Node) &&
        descContainerRef.current && !descContainerRef.current.contains(e.target as Node)
      ) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Apply suggestion
  const applySuggestion = (item: AutocompleteItem) => {
    if (item.originOP) setOp(formatOP(item.originOP));
    if (item.description) setDescription(item.description);
    if (item.lot) setLot(item.lot);
    if (item.contentType) setContentType(item.contentType);
    if (item.units !== undefined && item.units > 0) setUnits(item.units);

    if (item.contentType === SlotContent.SUPPLIES && item.supplyDetails) {
      setSupplyFrascos(item.supplyDetails.frascos || 0);
      setSupplyTampas(item.supplyDetails.tampas || 0);
      setSupplyCaixas(item.supplyDetails.caixas || 0);
      setSupplyBercos(item.supplyDetails.bercos || 0);
      if (item.supplyDetails.extras) {
        setSupplyExtras(item.supplyDetails.extras);
      }
    }

    if (item.reworkObs) {
      setReworkObs(item.reworkObs);
    }

    setAutofillSource(item.originOP ? `OP ${item.originOP}` : (item.description || 'Histórico'));
    setActiveDropdown(null);
  };

  // Debounced search when OP changes
  useEffect(() => {
    if (!op || op.trim().length < 2) {
      if (activeDropdown === 'op') {
        setSuggestions([]);
      }
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const rawTerm = op.trim();
        const formatted = formatOP(rawTerm);
        const results = await supabaseService.searchOpOrProduct(rawTerm);

        // Also search in local props as fallback / immediate supplement
        const localMatches: AutocompleteItem[] = [];
        const upperTerm = rawTerm.toUpperCase();
        const upperFmt = formatted.toUpperCase();

        (inventoryData || []).forEach(row => {
          const rowOp = (row.originOP || '').toUpperCase();
          if (rowOp.includes(upperTerm) || rowOp.includes(upperFmt)) {
            const insp = row.inspections?.[0];
            localMatches.push({
              originOP: row.originOP,
              description: row.description,
              lot: row.lot,
              contentType: insp?.contentType || SlotContent.FINISHED_PRODUCT,
              units: (insp?.bottles || 0) + (insp?.boxes || 0) + (insp?.caps || 0) + (insp?.cradles || 0) || row.pallets,
              source: 'inventory'
            });
          }
        });

        // Merge results
        const combined = [...results];
        localMatches.forEach(lm => {
          if (!combined.some(c => c.originOP === lm.originOP && c.description === lm.description && c.lot === lm.lot)) {
            combined.push(lm);
          }
        });

        setSuggestions(combined);

        // Direct Auto-fill if exact match or single high-confidence match and description is not filled or matched
        const exactMatch = combined.find(item => 
          item.originOP.toUpperCase() === upperTerm || 
          item.originOP.toUpperCase() === upperFmt ||
          formatOP(item.originOP) === formatted
        );

        if (exactMatch && (!description || description === exactMatch.description || !autofillSource)) {
          setDescription(exactMatch.description || '');
          setLot(exactMatch.lot || '');
          if (exactMatch.contentType) {
            setContentType(exactMatch.contentType);
          }
          if (exactMatch.units && exactMatch.units > 0 && units === 0) {
            setUnits(exactMatch.units);
          }
          setAutofillSource(`OP ${exactMatch.originOP}`);
        }
      } catch (err) {
        console.error('Error fetching OP autocomplete:', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [op, inventoryData]);

  // Debounced search when Description (Nome) changes
  const handleDescriptionChange = async (val: string) => {
    const upperVal = val.toUpperCase();
    setDescription(upperVal);

    if (upperVal.trim().length >= 3) {
      setIsSearching(true);
      setActiveDropdown('desc');
      try {
        const results = await supabaseService.searchOpOrProduct(upperVal.trim());
        setSuggestions(results);
      } catch (e) {
        console.error(e);
      } finally {
        setIsSearching(false);
      }
    } else {
      if (activeDropdown === 'desc') {
        setSuggestions([]);
      }
    }
  };

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

        {/* Autofill Notification Banner */}
        <AnimatePresence>
          {autofillSource && (
            <motion.div
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              className="px-8 pb-2 overflow-hidden"
            >
              <div className="bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border border-blue-500/30 rounded-xl px-4 py-2.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <p className="text-xs text-blue-200 font-semibold truncate">
                    Auto-preenchido com dados de <strong className="text-white">{autofillSource}</strong>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAutofillSource(null);
                    setDescription('');
                    setLot('');
                    setUnits(0);
                  }}
                  className="text-[10px] font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 uppercase tracking-wider shrink-0 bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/20 transition-all hover:bg-blue-500/20"
                >
                  <RotateCcw className="w-3 h-3" /> Limpar
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
            {/* OP Input with Autocomplete dropdown */}
            <div ref={opContainerRef} className="space-y-2 relative">
              <div className="flex items-center justify-between mb-0.5">
                <div className="flex items-center gap-1.5">
                  <ClipboardList className="w-3.5 h-3.5 text-blue-400" />
                  <label className={labelCls}>OP (Opcional)</label>
                </div>
                {isSearching && activeDropdown === 'op' && (
                  <Loader2 className="w-3 h-3 text-blue-400 animate-spin" />
                )}
              </div>
              <p className={subLabelCls}>Ordem de Produção (Auto-busca)</p>
              <div className="relative">
                <input
                  type="text"
                  value={op}
                  onChange={e => {
                    setOp(e.target.value.toUpperCase());
                    setActiveDropdown('op');
                  }}
                  onFocus={() => {
                    if (suggestions.length > 0) setActiveDropdown('op');
                  }}
                  placeholder="Ex: 410-152"
                  className={`${inputCls} uppercase pr-8`}
                />
                {op && (
                  <button
                    type="button"
                    onClick={() => {
                      setOp('');
                      setSuggestions([]);
                      setActiveDropdown(null);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Suggestions Dropdown for OP */}
              <AnimatePresence>
                {activeDropdown === 'op' && suggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute top-full left-0 right-0 z-50 mt-1.5 bg-[#0e1726] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden max-h-56 overflow-y-auto divide-y divide-slate-800/60 backdrop-blur-xl"
                  >
                    <div className="px-3 py-1.5 bg-slate-900/90 text-[9px] font-black uppercase tracking-widest text-blue-400 flex items-center justify-between">
                      <span>Sugestões Encontradas</span>
                      <span>{suggestions.length} resultado(s)</span>
                    </div>
                    {suggestions.map((item, idx) => (
                      <button
                        key={`${item.originOP}_${item.lot}_${idx}`}
                        type="button"
                        onClick={() => applySuggestion(item)}
                        className="w-full px-3.5 py-2.5 text-left hover:bg-blue-600/10 transition-colors flex items-start justify-between gap-2 group"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-mono text-xs font-black text-blue-400 group-hover:text-blue-300">
                              OP {item.originOP || 'S/OP'}
                            </span>
                            {item.lot && (
                              <span className="text-[10px] text-amber-400/90 font-mono font-bold">
                                Lote: {item.lot}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-white font-bold truncate group-hover:text-blue-200">
                            {item.description}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-slate-800 ${getContentTypeColor(item.contentType)}`}>
                            {translateSlotContent(item.contentType)}
                          </span>
                          {item.units !== undefined && item.units > 0 && (
                            <p className="text-[9px] font-mono text-slate-400 mt-1">{item.units} UN</p>
                          )}
                        </div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
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

          {/* NOME (Descrição) with Autocomplete dropdown */}
          <div ref={descContainerRef} className="space-y-2 relative">
            <div className="flex items-center justify-between mb-0.5">
              <div className="flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-blue-400" />
                <label className={labelCls}>Nome (Obrigatório)</label>
              </div>
              {isSearching && activeDropdown === 'desc' && (
                <Loader2 className="w-3 h-3 text-blue-400 animate-spin" />
              )}
            </div>
            <p className={subLabelCls}>Informar o nome do produto (digite para buscar produtos conhecidos)</p>
            <div className="relative">
              <input
                type="text"
                value={description}
                onChange={e => handleDescriptionChange(e.target.value)}
                onFocus={() => {
                  if (suggestions.length > 0 && activeDropdown === 'desc') setActiveDropdown('desc');
                }}
                placeholder="Ex: SELANTE 500G"
                className={`${inputCls} uppercase`}
              />
            </div>

            {/* Suggestions Dropdown for Description */}
            <AnimatePresence>
              {activeDropdown === 'desc' && suggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="absolute top-full left-0 right-0 z-50 mt-1.5 bg-[#0e1726] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden max-h-56 overflow-y-auto divide-y divide-slate-800/60 backdrop-blur-xl"
                >
                  <div className="px-3 py-1.5 bg-slate-900/90 text-[9px] font-black uppercase tracking-widest text-blue-400 flex items-center justify-between">
                    <span>Produtos Encontrados</span>
                    <span>{suggestions.length} resultado(s)</span>
                  </div>
                  {suggestions.map((item, idx) => (
                    <button
                      key={`desc_${item.originOP}_${item.lot}_${idx}`}
                      type="button"
                      onClick={() => applySuggestion(item)}
                      className="w-full px-3.5 py-2.5 text-left hover:bg-blue-600/10 transition-colors flex items-start justify-between gap-2 group"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-white font-bold truncate group-hover:text-blue-200">
                          {item.description}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {item.originOP && (
                            <span className="font-mono text-[10px] font-black text-blue-400">
                              OP {item.originOP}
                            </span>
                          )}
                          {item.lot && (
                            <span className="text-[10px] text-amber-400/90 font-mono font-bold">
                              Lote: {item.lot}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-slate-800 ${getContentTypeColor(item.contentType)}`}>
                          {translateSlotContent(item.contentType)}
                        </span>
                        {item.units !== undefined && item.units > 0 && (
                          <p className="text-[9px] font-mono text-slate-400 mt-1">{item.units} UN</p>
                        )}
                      </div>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
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
