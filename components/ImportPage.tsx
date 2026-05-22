
import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import { WarehouseSlot, SlotContent, SheetRow, StockStatus, translateSlotContent } from '../types';
import { FileUp, Upload, Check, CheckCircle2, FileText, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatOP } from '../lib/formatters';

interface ImportPageProps {
  availableSlots: WarehouseSlot[];
  onProcess: (entries: { row: SheetRow, slotId: string }[]) => Promise<void>;
}

interface CSVRow {
  op: string;
  nome: string;
  lote: string;
  quantidade: string;
  tipo: string;
}

export const ImportPage: React.FC<ImportPageProps> = ({ onProcess }) => {
  const [items, setItems] = useState<(CSVRow & { selected: boolean, contentType: SlotContent })[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsedData = results.data as any[];
        
        const mappedItems = parsedData.map((row, index) => {
          const op = formatOP(row.op || row.OP || '');
          const nome = (row.nome || row.NOME || row.description || '').toUpperCase();
          const lote = (row.lote || row.LOTE || '').toUpperCase();
          const quantidade = row.quantidade || row.QUANTIDADE || '1';
          const tipo = (row.tipo || row.TIPO || '').toUpperCase();

          let inferredContentType = SlotContent.SUPPLIES;
          if (tipo.includes('FRASCO')) inferredContentType = SlotContent.BOTTLES;
          else if (tipo.includes('ACABADO')) inferredContentType = SlotContent.FINISHED_PRODUCT;
          else if (tipo.includes('INSUMO')) inferredContentType = SlotContent.SUPPLIES;
          else if (tipo.includes('RETRABALHO')) inferredContentType = SlotContent.REWORK;
          else if (tipo.includes('REPROCESSO')) inferredContentType = SlotContent.REPROCESS;
          else if (tipo.includes('DIVERSOS')) inferredContentType = SlotContent.MISCELLANEOUS;
          else if (tipo.includes('DESCARTE')) inferredContentType = SlotContent.DISCARD;
          else if (tipo.includes('OUTRO')) inferredContentType = SlotContent.OTHER;
          else if (tipo.includes('CONTAINER')) {
            if (tipo.includes('SJ')) inferredContentType = SlotContent.CONTAINER_SJ;
            else if (tipo.includes('LP')) inferredContentType = SlotContent.CONTAINER_LP;
            else inferredContentType = SlotContent.CONTAINER_CP;
          }

          return {
            op,
            nome,
            lote,
            quantidade,
            tipo,
            selected: true,
            contentType: inferredContentType
          };
        });

        setItems(mappedItems);
      },
      error: (error) => {
        console.error('CSV Parsing Error:', error);
        alert('Erro ao processar arquivo CSV.');
      }
    });
  };

  const handleProcess = async () => {
    const selectedItems = items.filter(i => i.selected);
    if (selectedItems.length === 0) return;

    setIsProcessing(true);
    try {
      const entries = selectedItems.map(item => {
        const tempId = Math.random().toString(36).substring(2, 8).toUpperCase();
        const row: SheetRow = {
          id: `ROW-${Date.now()}-${Math.random()}`,
          loadingId: tempId,
          originOP: item.op,
          description: item.nome,
          lot: item.lote,
          pallets: parseInt(item.quantidade) || 0,
          date: new Date().toLocaleDateString('pt-BR'),
          status: StockStatus.PENDING,
          inspections: [{
            bottles: item.contentType === SlotContent.BOTTLES ? parseInt(item.quantidade) : 0,
            caps: 0,
            boxes: 0,
            cradles: 0,
            contentType: item.contentType,
            palletNumber: 1
          }]
        };
        return { row, slotId: '' };
      });

      await onProcess(entries);
      setItems([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      console.error('Processing error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="bg-slate-900/40 backdrop-blur-xl p-8 md:p-16 rounded-[2.5rem] border border-slate-800 shadow-3xl text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/20 to-transparent"></div>
        <div className="w-16 h-16 bg-blue-600/10 text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-8 border border-blue-500/20 shadow-xl">
          <FileUp className="w-8 h-8" />
        </div>
        <h3 className="text-2xl md:text-3xl font-black text-white uppercase italic tracking-tight mb-4">Importar Carregamento</h3>
        <p className="text-slate-500 text-[11px] md:text-xs font-bold uppercase tracking-widest leading-relaxed mb-10 max-w-md mx-auto">
          Selecione um arquivo CSV para pré-carregar os pallets. Após a importação, eles ficarão na aba <span className="text-blue-400">Análise</span> para conferência e alocação.
        </p>
        
        <input 
          type="file" 
          accept=".csv" 
          onChange={handleFileUpload} 
          ref={fileInputRef}
          className="hidden" 
          id="csv-upload"
        />
        <label 
          htmlFor="csv-upload"
          className="inline-flex items-center gap-2.5 px-8 py-4 bg-slate-950 hover:bg-slate-800 text-white rounded-xl font-bold text-[11px] uppercase tracking-widest border border-slate-800 transition-all cursor-pointer shadow-xl active:scale-95 group"
        >
          <Upload className="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform" /> Selecionar Arquivo
        </label>
      </div>

      <AnimatePresence>
        {items.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-slate-900/40 backdrop-blur-xl rounded-[2.5rem] border border-slate-800 shadow-3xl overflow-hidden"
          >
            <div className="p-6 md:p-8 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-center bg-slate-800/20 gap-4">
              <div>
                <h4 className="text-lg font-black text-white uppercase italic tracking-tight">Validar Pallets</h4>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">{items.length} itens encontrados no arquivo</p>
              </div>
              <button 
                onClick={handleProcess}
                disabled={isProcessing}
                className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 transition-all"
              >
                {isProcessing ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Processando</>
                ) : (
                  <><CheckCircle2 className="w-3.5 h-3.5" /> Processar Selecionados</>
                )}
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/50">
                    <th className="p-5 text-[9px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800/50">Status</th>
                    <th className="p-5 text-[9px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800/50">OP / Nome</th>
                    <th className="p-5 text-[9px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800/50">Lote</th>
                    <th className="p-5 text-[9px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800/50">Qtd / Tipo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/30">
                  {items.map((item, idx) => (
                    <tr key={idx} className={`hover:bg-slate-800/20 transition-colors ${!item.selected ? 'opacity-40' : ''}`}>
                      <td className="p-5">
                        <button 
                          onClick={() => {
                            const newItems = [...items];
                            newItems[idx].selected = !newItems[idx].selected;
                            setItems(newItems);
                          }}
                          className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${item.selected ? 'bg-blue-600 border-blue-400 text-white' : 'bg-slate-950 border-slate-800 text-transparent'}`}
                        >
                          <Check className="w-3 h-3" />
                        </button>
                      </td>
                      <td className="p-5">
                        <p className="text-blue-400 font-black text-[10px] font-mono mb-0.5">{item.op}</p>
                        <p className="text-white font-bold text-xs uppercase tracking-tight line-clamp-1">{item.nome}</p>
                      </td>
                      <td className="p-5">
                        <p className="text-amber-500 font-black text-[10px] font-mono">{item.lote}</p>
                      </td>
                      <td className="p-5">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-black text-xs">{item.quantidade}</span>
                          <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest border ${
                            item.contentType === SlotContent.BOTTLES ? 'bg-blue-600/10 text-blue-500 border-blue-500/20' :
                            item.contentType === SlotContent.FINISHED_PRODUCT ? 'bg-green-600/10 text-green-500 border-green-500/20' :
                            'bg-amber-600/10 text-amber-500 border-amber-500/20'
                          }`}>
                            {translateSlotContent(item.contentType)}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
