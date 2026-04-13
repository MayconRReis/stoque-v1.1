
import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import { WarehouseSlot, SlotContent, SheetRow, StockStatus, InspectionData, translateSlotContent } from '../types';

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

export const ImportPage: React.FC<ImportPageProps> = ({ availableSlots, onProcess }) => {
  const [items, setItems] = useState<(CSVRow & { selected: boolean, suggestedSlot?: string, contentType: SlotContent })[]>([]);
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
        
        // Map CSV columns to our internal format and suggest slots
        const mappedItems = parsedData.map((row, index) => {
          const op = row.op || row.OP || '';
          const nome = row.nome || row.NOME || row.description || '';
          const lote = row.lote || row.LOTE || '';
          const quantidade = row.quantidade || row.QUANTIDADE || '1';
          const tipo = (row.tipo || row.TIPO || '').toUpperCase();

          let contentType = SlotContent.SUPPLIES;
          if (tipo.includes('FRASCO')) contentType = SlotContent.BOTTLES;
          else if (tipo.includes('ACABADO')) contentType = SlotContent.FINISHED_PRODUCT;
          else if (tipo.includes('INSUMO')) contentType = SlotContent.SUPPLIES;

          // Suggest slot based on type (same logic as MovementModal)
          let suggestedSlot: string | undefined;
          const usedSlotsInThisImport = parsedData.slice(0, index).map(p => p.suggestedSlot).filter(Boolean);
          const trulyAvailable = availableSlots.filter(s => !usedSlotsInThisImport.includes(s.id));

          if (contentType === SlotContent.BOTTLES) {
            suggestedSlot = trulyAvailable.find(s => s.rack === 'A' && s.position <= 16)?.id;
          } else if (contentType === SlotContent.SUPPLIES) {
            suggestedSlot = trulyAvailable.find(s => (s.rack === 'B' || s.rack === 'C') && s.level >= 2 && s.position <= 16)?.id;
          } else if (contentType === SlotContent.FINISHED_PRODUCT) {
            suggestedSlot = trulyAvailable.find(s => (s.rack === 'B' || s.rack === 'C') && s.level === 1 && s.position <= 14)?.id;
          } else {
            suggestedSlot = trulyAvailable.find(s => {
              const isBottleRange = s.rack === 'A' && s.position <= 16;
              const isSupplyRange = (s.rack === 'B' || s.rack === 'C') && s.level >= 2 && s.position <= 16;
              const isFinishedRange = (s.rack === 'B' || s.rack === 'C') && s.level === 1 && s.position <= 14;
              return !isBottleRange && !isSupplyRange && !isFinishedRange;
            })?.id;
          }

          return {
            op,
            nome,
            lote,
            quantidade,
            tipo,
            selected: true,
            suggestedSlot: suggestedSlot || trulyAvailable[0]?.id,
            contentType
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
          loadingId: tempId, // Temporary ID until analysis
          originOP: item.op,
          description: item.nome,
          lot: item.lote,
          pallets: 1, // Default to 1 pallet per row for individual analysis
          date: new Date().toLocaleDateString('pt-BR'),
          status: StockStatus.PENDING,
          inspections: [{
            bottles: item.contentType === SlotContent.BOTTLES ? parseInt(item.quantidade) : 0,
            caps: 0,
            boxes: 0,
            contentType: item.contentType,
            palletNumber: 1
          }]
        };
        return { row, slotId: '' }; // No slot assigned yet
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
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="bg-slate-900 p-8 md:p-12 rounded-[48px] border border-slate-800 shadow-3xl text-center">
        <div className="w-20 h-20 bg-blue-600/10 text-blue-500 rounded-[32px] flex items-center justify-center mx-auto mb-8 border border-blue-500/20 shadow-xl">
          <i className="fa-solid fa-file-import text-3xl"></i>
        </div>
        <h3 className="text-2xl md:text-3xl font-black text-white uppercase italic tracking-tighter mb-4">Importar Carregamento</h3>
        <p className="text-slate-500 text-xs md:text-sm font-bold uppercase tracking-widest leading-relaxed mb-10 max-w-md mx-auto">
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
          className="inline-flex items-center gap-3 px-10 py-5 bg-slate-950 hover:bg-slate-800 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] border border-slate-800 transition-all cursor-pointer shadow-xl active:scale-95"
        >
          Selecionar Arquivo <i className="fa-solid fa-upload"></i>
        </label>
      </div>

      {items.length > 0 && (
        <div className="bg-slate-900 rounded-[48px] border border-slate-800 shadow-3xl overflow-hidden animate-in slide-in-from-bottom-10 duration-500">
          <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-800/20">
            <div>
              <h4 className="text-xl font-black text-white uppercase italic tracking-tighter">Validar Pallets</h4>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">{items.length} itens encontrados no arquivo</p>
            </div>
            <button 
              onClick={handleProcess}
              disabled={isProcessing}
              className="px-8 py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 shadow-xl shadow-blue-900/20 transition-all"
            >
              {isProcessing ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Processando...</>
              ) : (
                <><i className="fa-solid fa-check-double"></i> Processar Selecionados</>
              )}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/50">
                  <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800">Status</th>
                  <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800">OP / Nome</th>
                  <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800">Lote</th>
                  <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800">Qtd / Tipo</th>
                  <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800">Vaga Sugerida</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {items.map((item, idx) => (
                  <tr key={idx} className={`hover:bg-slate-800/20 transition-colors ${!item.selected ? 'opacity-50' : ''}`}>
                    <td className="p-6">
                      <button 
                        onClick={() => {
                          const newItems = [...items];
                          newItems[idx].selected = !newItems[idx].selected;
                          setItems(newItems);
                        }}
                        className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${item.selected ? 'bg-blue-600 border-blue-400 text-white' : 'bg-slate-950 border-slate-800 text-transparent'}`}
                      >
                        <i className="fa-solid fa-check text-[10px]"></i>
                      </button>
                    </td>
                    <td className="p-6">
                      <p className="text-blue-400 font-black text-xs font-mono mb-1">{item.op}</p>
                      <p className="text-white font-bold text-sm uppercase tracking-tight line-clamp-1">{item.nome}</p>
                    </td>
                    <td className="p-6">
                      <p className="text-amber-500 font-black text-xs font-mono">{item.lote}</p>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-3">
                        <span className="text-white font-black text-sm">{item.quantidade}</span>
                        <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                          item.contentType === SlotContent.BOTTLES ? 'bg-blue-600/10 text-blue-500 border-blue-500/20' :
                          item.contentType === SlotContent.FINISHED_PRODUCT ? 'bg-green-600/10 text-green-500 border-green-500/20' :
                          'bg-amber-600/10 text-amber-500 border-amber-500/20'
                        }`}>
                          {translateSlotContent(item.contentType)}
                        </span>
                      </div>
                    </td>
                    <td className="p-6">
                      <select 
                        value={item.suggestedSlot}
                        onChange={(e) => {
                          const newItems = [...items];
                          newItems[idx].suggestedSlot = e.target.value;
                          setItems(newItems);
                        }}
                        className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-[10px] font-black text-white uppercase outline-none focus:border-blue-600 transition-all"
                      >
                        <option value="">Selecionar Vaga</option>
                        {availableSlots.map(slot => (
                          <option key={slot.id} value={slot.id}>{slot.id}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
