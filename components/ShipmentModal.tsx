
import React, { useState } from 'react';
import { Shipment, ShipmentType, ShipmentStatus } from '../types';
import { 
  X, 
  Plus, 
  List, 
  Truck, 
  Calendar, 
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ShipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  openShipments: Shipment[];
  onCreateNew: (data: { type: ShipmentType, scheduledDate: string }) => Promise<void>;
  onAddToExisting: (shipmentId: string) => Promise<void>;
  selectedCount: number;
}

export const ShipmentModal: React.FC<ShipmentModalProps> = ({ 
  isOpen, 
  onClose, 
  openShipments, 
  onCreateNew, 
  onAddToExisting,
  selectedCount
}) => {
  const [mode, setMode] = useState<'choice' | 'create' | 'existing'>('choice');
  const [type, setType] = useState<ShipmentType>(ShipmentType.THIRD_PARTY);
  const [scheduledDate, setScheduledDate] = useState('');
  const [selectedShipmentId, setSelectedShipmentId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleCreate = async () => {
    if (!scheduledDate) return;
    setIsProcessing(true);
    try {
      await onCreateNew({ type, scheduledDate });
      onClose();
    } catch (error) {
      console.error('Error creating shipment:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAdd = async () => {
    if (!selectedShipmentId) return;
    setIsProcessing(true);
    try {
      await onAddToExisting(selectedShipmentId);
      onClose();
    } catch (error) {
      console.error('Error adding to shipment:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/90 backdrop-blur-xl p-4 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-3xl w-full max-w-lg overflow-hidden"
      >
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-fuchsia-600 rounded-xl flex items-center justify-center text-white shadow-xl">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white uppercase italic tracking-tight">Enviar para Carregamento</h3>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{selectedCount} pallets selecionados</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-slate-950 text-slate-500 hover:text-white flex items-center justify-center border border-slate-800 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6">
          {mode === 'choice' && (
            <div className="grid grid-cols-1 gap-4">
              <button 
                onClick={() => setMode('create')}
                className="group p-6 bg-slate-950/50 border border-slate-800 hover:border-fuchsia-500/50 rounded-3xl text-left transition-all hover:bg-slate-800/30"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-fuchsia-600/10 rounded-2xl flex items-center justify-center text-fuchsia-500 border border-fuchsia-500/20 group-hover:scale-110 transition-transform">
                    <Plus className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold uppercase text-sm">Criar Novo Carregamento</h4>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">Gerar novo ID e definir data de envio</p>
                  </div>
                </div>
              </button>

              <button 
                onClick={() => setMode('existing')}
                disabled={openShipments.length === 0}
                className="group p-6 bg-slate-950/50 border border-slate-800 hover:border-pink-500/50 rounded-3xl text-left transition-all hover:bg-slate-800/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-pink-600/10 rounded-2xl flex items-center justify-center text-pink-500 border border-pink-500/20 group-hover:scale-110 transition-transform">
                    <List className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold uppercase text-sm">Adicionar a Existente</h4>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">
                      {openShipments.length > 0 
                        ? `${openShipments.length} carregamentos em aberto` 
                        : 'Nenhum carregamento aberto disponível'}
                    </p>
                  </div>
                </div>
              </button>
            </div>
          )}

          {mode === 'create' && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest ml-1">Tipo do Carregamento</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => setType(ShipmentType.THIRD_PARTY)}
                      className={`py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest border transition-all ${type === ShipmentType.THIRD_PARTY ? 'bg-fuchsia-600 border-fuchsia-400 text-white shadow-lg shadow-fuchsia-900/20' : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'}`}
                    >
                      Terceirista
                    </button>
                    <button 
                      onClick={() => setType(ShipmentType.OWN)}
                      className={`py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest border transition-all ${type === ShipmentType.OWN ? 'bg-pink-600 border-pink-400 text-white shadow-lg shadow-pink-900/20' : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'}`}
                    >
                      Próprio
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest ml-1">Data Prevista de Envio</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                      type="date" 
                      value={scheduledDate}
                      onChange={e => setScheduledDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-12 pr-4 py-3 text-white font-bold text-sm focus:border-fuchsia-600 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setMode('choice')}
                  className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all"
                >
                  Voltar
                </button>
                <button 
                  onClick={handleCreate}
                  disabled={isProcessing || !scheduledDate}
                  className="flex-[2] py-4 bg-fuchsia-600 hover:bg-fuchsia-500 disabled:bg-slate-800 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-fuchsia-900/40 transition-all flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Processando</>
                  ) : (
                    <><CheckCircle2 className="w-4 h-4" /> Criar e Adicionar</>
                  )}
                </button>
              </div>
            </div>
          )}

          {mode === 'existing' && (
            <div className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest ml-1">Selecionar Carregamento</label>
                <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                  {openShipments.map(shipment => (
                    <button 
                      key={shipment.id}
                      onClick={() => setSelectedShipmentId(shipment.id)}
                      className={`w-full p-4 rounded-2xl border text-left transition-all ${selectedShipmentId === shipment.id ? 'bg-fuchsia-600/10 border-fuchsia-500 shadow-lg' : 'bg-slate-950 border-slate-800 hover:border-slate-700'}`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-[10px] font-black text-white font-mono uppercase mb-1">{shipment.id}</p>
                          <div className="flex items-center gap-2">
                            <span className={`text-[8px] font-black px-2 py-0.5 rounded-md uppercase tracking-tighter ${shipment.type === ShipmentType.THIRD_PARTY ? 'bg-fuchsia-500/20 text-fuchsia-400' : 'bg-pink-500/20 text-pink-400'}`}>
                              {shipment.type === ShipmentType.THIRD_PARTY ? 'Terceirista' : 'Próprio'}
                            </span>
                            <span className="text-[8px] font-bold text-slate-500 uppercase">Envio: {new Date(shipment.scheduledDate).toLocaleDateString('pt-BR')}</span>
                          </div>
                        </div>
                        {selectedShipmentId === shipment.id && <CheckCircle2 className="w-4 h-4 text-fuchsia-500" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setMode('choice')}
                  className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all"
                >
                  Voltar
                </button>
                <button 
                  onClick={handleAdd}
                  disabled={isProcessing || !selectedShipmentId}
                  className="flex-[2] py-4 bg-fuchsia-600 hover:bg-fuchsia-500 disabled:bg-slate-800 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-fuchsia-900/40 transition-all flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Processando</>
                  ) : (
                    <><ArrowRight className="w-4 h-4" /> Adicionar Selecionados</>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
