
import React from 'react';
import { Shipment, ShipmentType, ShipmentStatus, SheetRow } from '../types';
import { 
  Truck, 
  Calendar, 
  Clock, 
  Hash, 
  ChevronRight, 
  Package,
  AlertCircle
} from 'lucide-react';
import { motion } from 'motion/react';

interface ShipmentPageProps {
  shipments: Shipment[];
  inventory: SheetRow[];
  shipmentCounts: Record<string, number>;
  onOpenDetail: (shipment: Shipment) => void;
  onDelete?: (shipmentId: string) => void;
}

export const ShipmentPage: React.FC<ShipmentPageProps> = ({ shipments, inventory, shipmentCounts, onOpenDetail, onDelete }) => {
  const getPalletCount = (shipmentId: string) => {
    return shipmentCounts[shipmentId] || 0;
  };

  const openShipments = shipments.filter(s => s.status === ShipmentStatus.OPEN);
  const closedShipments = shipments.filter(s => s.status === ShipmentStatus.CLOSED);

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl md:text-4xl font-black text-white uppercase italic tracking-tighter mb-2">Carregamentos</h2>
          <p className="text-[10px] md:text-xs text-slate-500 font-bold uppercase tracking-[0.3em]">Gestão de saídas futuras e agrupamento de pallets</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-slate-900/50 border border-slate-800 px-6 py-3 rounded-2xl">
            <p className="text-[9px] text-slate-600 font-black uppercase mb-1">Em Aberto</p>
            <p className="text-xl font-black text-white italic">{openShipments.length}</p>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 px-6 py-3 rounded-2xl">
            <p className="text-[9px] text-slate-600 font-black uppercase mb-1">Finalizados</p>
            <p className="text-xl font-black text-slate-500 italic">{closedShipments.length}</p>
          </div>
        </div>
      </div>

      {openShipments.length === 0 ? (
        <div className="py-32 text-center border-2 border-dashed border-slate-900 rounded-[3rem] bg-slate-950/20">
          <div className="w-20 h-20 bg-slate-900/50 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-slate-800 shadow-2xl">
            <Truck className="w-10 h-10 text-slate-700" />
          </div>
          <h3 className="text-xl font-black text-slate-400 uppercase italic mb-2">Nenhum carregamento em aberto</h3>
          <p className="text-slate-600 font-bold uppercase text-[10px] tracking-[0.2em] max-w-xs mx-auto leading-relaxed">
            Selecione pallets no estoque geral e clique em "Enviar para Carregamento" para começar.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {openShipments.map(shipment => {
            const palletCount = getPalletCount(shipment.id);
            const isThirdParty = shipment.type === ShipmentType.THIRD_PARTY;
            
            return (
              <motion.div 
                layout
                key={shipment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="group h-full"
              >
                <div 
                  onClick={() => onOpenDetail(shipment)}
                  className="bg-slate-900/40 backdrop-blur-2xl border border-slate-800/80 rounded-[2.5rem] p-7 text-left hover:border-fuchsia-500/40 transition-all hover:bg-slate-800/30 relative overflow-hidden shadow-2xl cursor-pointer group/card h-full flex flex-col"
                >
                  {/* Background Ornament */}
                  <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full blur-[60px] opacity-20 transition-all group-hover/card:opacity-40 ${isThirdParty ? 'bg-fuchsia-600' : 'bg-pink-500'}`} />
                  
                  {/* Type Badge Floating */}
                  <div className="mb-6 flex items-center gap-3">
                    <div className={`w-14 h-14 rounded-[1.25rem] flex items-center justify-center border shadow-2xl transition-transform group-hover/card:scale-110 duration-500 ${isThirdParty ? 'bg-fuchsia-600/20 text-fuchsia-400 border-fuchsia-500/30' : 'bg-pink-600/20 text-pink-400 border-pink-500/30'}`}>
                      <Truck className="w-7 h-7" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <Hash className="w-3 h-3 text-slate-600" />
                        <span className="text-[10px] font-black text-white font-mono tracking-tighter uppercase">{shipment.id}</span>
                      </div>
                      <span className={`text-[8px] font-black px-2.5 py-1 rounded-lg uppercase tracking-[0.2em] border shadow-sm ${isThirdParty ? 'bg-fuchsia-500/10 text-fuchsia-500 border-fuchsia-500/20' : 'bg-pink-500/10 text-pink-500 border-pink-500/20'}`}>
                        {isThirdParty ? 'Terceirista' : 'Próprio'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4 mb-8 flex-1">
                    <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800/50 group-hover/card:border-slate-700/50 transition-colors">
                      <div className="flex items-center gap-3 mb-1">
                        <Calendar className="w-3.5 h-3.5 text-fuchsia-500/70" />
                        <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Data de Envio</p>
                      </div>
                      <p className="text-sm font-black text-white italic ml-6.5">{new Date(shipment.scheduledDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                    </div>

                    <div className="px-4">
                      <div className="flex items-center gap-3">
                        <Clock className="w-3.5 h-3.5 text-slate-600" />
                        <p className="text-[8px] text-slate-600 font-bold uppercase tracking-widest">Criado em {new Date(shipment.createdAt).toLocaleDateString('pt-BR')}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t border-slate-800/50">
                    <div className="flex items-center gap-3 bg-slate-950/60 px-4 py-2 rounded-xl border border-slate-800/80">
                      <Package className="w-4 h-4 text-fuchsia-500" />
                      <span className="text-xs font-black text-white italic">{palletCount} Pallets</span>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-slate-950 flex items-center justify-center border border-slate-800 group-hover/card:bg-fuchsia-600 group-hover/card:border-fuchsia-500 transition-all">
                      <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-white transition-all transform group-hover/card:translate-x-0.5" />
                    </div>
                  </div>

                  {/* Top Highlight line */}
                  <div className={`absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r ${isThirdParty ? 'from-fuchsia-600 to-fuchsia-400' : 'from-pink-600 to-pink-400'}`} />
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Finished Shipments Section (Optional/Subtle) */}
      {closedShipments.length > 0 && (
        <div className="pt-10 border-t border-slate-900">
          <h3 className="text-lg font-black text-slate-600 uppercase italic tracking-widest mb-6 px-4">Histórico Recente</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {closedShipments.slice(0, 4).map(shipment => (
              <div key={shipment.id} className="bg-slate-900/20 border border-slate-800/50 rounded-[2rem] p-5 flex justify-between items-center group/item hover:border-fuchsia-500/30 transition-all opacity-60 hover:opacity-100">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-[9px] font-black text-fuchsia-500/70 font-mono tracking-tighter uppercase">{shipment.id}</p>
                    <span className={`text-[7px] font-black px-1.5 py-0.5 rounded-md uppercase border ${shipment.type === ShipmentType.THIRD_PARTY ? 'bg-fuchsia-500/10 text-fuchsia-500 border-fuchsia-500/20' : 'bg-pink-500/10 text-pink-500 border-pink-500/20'}`}>
                      {shipment.type === ShipmentType.THIRD_PARTY ? 'T' : 'P'}
                    </span>
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase italic">Enviado em {new Date(shipment.scheduledDate).toLocaleDateString('pt-BR')}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 bg-slate-950/60 px-2.5 py-1 rounded-lg border border-slate-800">
                    <Package className="w-3 h-3 text-fuchsia-500/70" />
                    <span className="text-[9px] font-bold text-white italic">{getPalletCount(shipment.id)} PL</span>
                  </div>
                  <div 
                    onClick={() => onOpenDetail(shipment)}
                    className="w-8 h-8 rounded-lg bg-slate-950 text-slate-500 flex items-center justify-center border border-slate-800 cursor-pointer hover:bg-fuchsia-600 hover:text-white hover:border-fuchsia-500 transition-all"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
