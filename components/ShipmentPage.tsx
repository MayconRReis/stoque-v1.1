
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
import { motion } from 'framer-motion';

interface ShipmentPageProps {
  shipments: Shipment[];
  inventory: SheetRow[];
  onOpenDetail: (shipment: Shipment) => void;
}

export const ShipmentPage: React.FC<ShipmentPageProps> = ({ shipments, inventory, onOpenDetail }) => {
  const getPalletCount = (shipmentId: string) => {
    return inventory.reduce((acc, item) => {
      const count = (item.inspections || []).filter(insp => {
        const sId = insp.shipmentId || (insp as any).shipment_id;
        return sId === shipmentId;
      }).length;
      return acc + count;
    }, 0);
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
            return (
              <motion.button 
                layout
                key={shipment.id}
                onClick={() => onOpenDetail(shipment)}
                className="group bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-[2.5rem] p-6 text-left hover:border-purple-500/40 transition-all hover:bg-slate-800/20 relative overflow-hidden shadow-2xl"
              >
                {/* Accent line */}
                <div className={`absolute top-0 left-0 w-full h-1.5 ${shipment.type === ShipmentType.THIRD_PARTY ? 'bg-purple-600' : 'bg-blue-600'}`}></div>
                
                <div className="flex justify-between items-start mb-6">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-lg group-hover:scale-110 transition-transform ${shipment.type === ShipmentType.THIRD_PARTY ? 'bg-purple-600/10 text-purple-500 border-purple-500/20' : 'bg-blue-600/10 text-blue-500 border-blue-500/20'}`}>
                    <Truck className="w-6 h-6" />
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-white font-mono uppercase mb-1">{shipment.id}</p>
                    <span className={`text-[8px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest border ${shipment.type === ShipmentType.THIRD_PARTY ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' : 'bg-blue-600/10 text-blue-500 border-blue-500/20'}`}>
                      {shipment.type === ShipmentType.THIRD_PARTY ? 'Terceirista' : 'Próprio'}
                    </span>
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-slate-950 flex items-center justify-center text-slate-500 border border-slate-800">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[8px] text-slate-600 font-black uppercase tracking-widest">Data de Envio</p>
                      <p className="text-xs font-black text-white italic">{new Date(shipment.scheduledDate).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-slate-950 flex items-center justify-center text-slate-500 border border-slate-800">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[8px] text-slate-600 font-black uppercase tracking-widest">Criado em</p>
                      <p className="text-xs font-black text-slate-400 italic">{new Date(shipment.createdAt).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-slate-800/50">
                  <div className="flex items-center gap-2">
                    <Package className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-xs font-black text-white italic">{palletCount} Pallets</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-700 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </div>
              </motion.button>
            );
          })}
        </div>
      )}

      {/* Finished Shipments Section (Optional/Subtle) */}
      {closedShipments.length > 0 && (
        <div className="pt-10 border-t border-slate-900">
          <h3 className="text-lg font-black text-slate-600 uppercase italic tracking-widest mb-6 px-4">Histórico Recente</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 opacity-60">
            {closedShipments.slice(0, 4).map(shipment => (
              <div key={shipment.id} className="bg-slate-900/20 border border-slate-800/50 rounded-[2rem] p-5 flex justify-between items-center">
                <div>
                  <p className="text-[9px] font-black text-slate-500 font-mono mb-1">{shipment.id}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase italic">Enviado em {new Date(shipment.scheduledDate).toLocaleDateString('pt-BR')}</p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-green-500/10 text-green-500 flex items-center justify-center border border-green-500/20">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
