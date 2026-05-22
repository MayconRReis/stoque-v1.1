
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp, 
  User, 
  Calendar, 
  MessageSquare,
  FileText,
  Package,
  ExternalLink,
  ArrowRight,
  Info
} from 'lucide-react';
import { supabaseService } from '../services/supabaseService';
import { InventoryEditRequest, translateSlotContent } from '../types';

interface ApprovalsPageProps {
  currentUser: any;
}

const ApprovalsPage: React.FC<ApprovalsPageProps> = ({ currentUser }) => {
  const [requests, setRequests] = useState<InventoryEditRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [adminComment, setAdminComment] = useState('');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const data = await supabaseService.getEditRequests();
      setRequests(data);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProcessRequest = async (requestId: string, status: 'approved' | 'rejected') => {
    setIsProcessing(requestId);
    try {
      await supabaseService.processEditRequest(requestId, currentUser.id, status, adminComment);
      await fetchRequests();
      setAdminComment('');
      setExpandedId(null);
    } catch (error) {
      console.error('Error processing request:', error);
      alert('Erro ao processar solicitação.');
    } finally {
      setIsProcessing(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mb-4" />
        <p className="text-slate-500 font-black uppercase text-[10px] tracking-widest">Carregando solicitações...</p>
      </div>
    );
  }

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const historyRequests = requests.filter(r => r.status !== 'pending');

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter flex items-center gap-3">
            <Clock className="w-8 h-8 text-amber-500" /> Aprovações
          </h2>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">
            Gerencie solicitações de alteração feitas por operadores
          </p>
        </div>
        <div className="flex gap-4">
          <div className="px-4 py-2 bg-slate-900/60 rounded-xl border border-slate-800 flex flex-col items-center">
            <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">{pendingRequests.length}</span>
            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Pendentes</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {pendingRequests.length === 0 ? (
          <div className="bg-slate-900/40 border-2 border-dashed border-slate-800 rounded-[32px] py-12 text-center">
            <CheckCircle2 className="w-12 h-12 text-slate-800 mx-auto mb-4" />
            <p className="text-slate-600 font-bold uppercase text-xs tracking-widest">Nenhuma solicitação pendente</p>
          </div>
        ) : (
          pendingRequests.map(request => (
            <div key={request.id}>
              <RequestCard 
                request={request}
                isExpanded={expandedId === request.id}
                onToggle={() => setExpandedId(expandedId === request.id ? null : request.id)}
                onProcess={handleProcessRequest}
                adminComment={adminComment}
                setAdminComment={setAdminComment}
                isProcessing={isProcessing === request.id}
              />
            </div>
          ))
        )}
      </div>

      {historyRequests.length > 0 && (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-black text-slate-400 italic uppercase tracking-tighter flex items-center gap-2">
              <FileText className="w-5 h-5" /> Histórico de Decisões
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {historyRequests.map(request => (
              <div key={request.id}>
                <HistoryCard request={request} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const RequestCard = ({ 
  request, 
  isExpanded, 
  onToggle, 
  onProcess, 
  adminComment, 
  setAdminComment,
  isProcessing 
}: { 
  request: InventoryEditRequest; 
  isExpanded: boolean; 
  onToggle: () => void;
  onProcess: (id: string, state: 'approved' | 'rejected') => void;
  adminComment: string;
  setAdminComment: (c: string) => void;
  isProcessing: boolean;
}) => {
  return (
    <div className={`bg-slate-900/60 backdrop-blur-md rounded-[2.5rem] border transition-all duration-300 overflow-hidden ${isExpanded ? 'border-amber-500/50 ring-1 ring-amber-500/20' : 'border-slate-800 hover:border-slate-700'}`}>
      <div className="p-6 cursor-pointer" onClick={onToggle}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-amber-500/10 rounded-[1.25rem] flex items-center justify-center border border-amber-500/20">
              <Package className="w-7 h-7 text-amber-500" />
            </div>
            <div>
              <h4 className="text-lg font-black text-white italic uppercase tracking-tighter leading-tight">
                {request.product_description}
              </h4>
              <div className="flex flex-wrap items-center gap-3 mt-1.5">
                <span className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                  <User className="w-3 h-3" /> {request.requester_name}
                </span>
                <span className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                  <Calendar className="w-3 h-3" /> {new Date(request.requested_at).toLocaleString('pt-BR')}
                </span>
                <span className="flex items-center gap-1.5 text-[9px] font-black text-amber-500 uppercase tracking-widest italic">
                  ID: {request.inventory_id}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden md:block">
              <p className="text-[10px] font-black text-white uppercase italic tracking-tighter">Aguardando Aprovação</p>
              <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Status Pendente</p>
            </div>
            {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-500" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
          </div>
        </div>

        <div className="mt-4 p-4 bg-slate-950/40 rounded-2xl border border-amber-500/10">
          <p className="text-[9px] text-amber-500 font-black uppercase tracking-widest mb-1.5 flex items-center gap-2">
            <MessageSquare className="w-3 h-3" /> Motivo da Solicitação:
          </p>
          <p className="text-xs text-slate-300 font-medium italic leading-relaxed">"{request.reason}"</p>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-slate-800 overflow-hidden"
          >
            <div className="p-6 space-y-8 bg-slate-950/20">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Before Data */}
                <div className="space-y-4">
                  <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-slate-700" /> Estado Atual
                  </h5>
                  <DataPreview data={request.before_data} baseColor="slate" />
                </div>

                {/* After Data */}
                <div className="space-y-4">
                  <h5 className="text-[10px] font-black text-purple-500 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-500" /> Mudanças Solicitadas
                  </h5>
                  <DataPreview data={request.after_data} baseColor="purple" isChanged comparison={request.before_data} />
                </div>
              </div>

              <div className="pt-6 border-t border-slate-800 space-y-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Comentário do Administrador (Opcional)</label>
                  <textarea 
                    value={adminComment}
                    onChange={e => setAdminComment(e.target.value)}
                    placeholder="Adicione um motivo para a aprovação ou rejeição..."
                    className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl px-4 py-3 text-white font-medium text-sm focus:border-purple-500 outline-none transition-all resize-none"
                    rows={2}
                  />
                </div>

                <div className="flex gap-4">
                  <button 
                    disabled={isProcessing}
                    onClick={() => onProcess(request.id, 'rejected')}
                    className="flex-1 py-4 bg-slate-900 hover:bg-red-600/10 text-red-500 border border-slate-800 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" /> Rejeitar Alteração
                  </button>
                  <button 
                    disabled={isProcessing}
                    onClick={() => onProcess(request.id, 'approved')}
                    className="flex-[2] py-4 bg-green-600 hover:bg-green-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-xl shadow-green-900/20 active:scale-95 disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    Aprovar e Aplicar Alteração
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const DataPreview = ({ data, baseColor, isChanged, comparison }: { data: any, baseColor: string, isChanged?: boolean, comparison?: any }) => {
  const fields = [
    { key: 'description', label: 'Descrição' },
    { key: 'originOP', label: 'OP Origem' },
    { key: 'lot', label: 'Lote' },
    { key: 'pallets', label: 'Qtd (Pallets)' },
    { key: 'loadingId', label: 'ID Final' },
    { key: 'status', label: 'Status' }
  ];

  return (
    <div className={`p-5 rounded-3xl bg-slate-950/40 border ${isChanged ? 'border-purple-500/20' : 'border-slate-800/40'} space-y-4`}>
      <div className="grid grid-cols-2 gap-4">
        {fields.map(field => {
          const val = data[field.key as keyof any];
          const prevVal = comparison ? comparison[field.key as keyof any] : undefined;
          const hasChanged = isChanged && comparison && JSON.stringify(val) !== JSON.stringify(prevVal);

          return (
            <div key={field.key} className={`space-y-1 ${field.key === 'description' ? 'col-span-2' : ''}`}>
              <p className="text-[7px] text-slate-600 font-bold uppercase tracking-widest">{field.label}</p>
              <div className="flex items-center gap-2">
                <p className={`text-xs font-bold leading-tight ${hasChanged ? 'text-amber-400' : 'text-slate-300'} font-mono italic`}>
                  {String(val || 'N/A')}
                </p>
                {hasChanged && <ArrowRight className="w-2.5 h-2.5 text-amber-500" />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const HistoryCard = ({ request }: { request: InventoryEditRequest }) => {
  const isApproved = request.status === 'approved';
  
  return (
    <div className="bg-slate-900/40 rounded-[2rem] border border-slate-800/50 p-6 flex flex-col h-full hover:border-slate-700/50 transition-all">
      <div className="flex justify-between items-start mb-4">
        <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest italic ${isApproved ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
          {isApproved ? 'Aprovado' : 'Rejeitado'}
        </div>
        <span className="text-[8px] text-slate-600 font-bold uppercase tracking-widest">
          {new Date(request.reviewed_at || '').toLocaleDateString('pt-BR')}
        </span>
      </div>

      <h4 className="text-sm font-black text-white italic uppercase tracking-tighter mb-2 line-clamp-1">
        {request.product_description}
      </h4>

      <div className="space-y-2 mb-4 flex-1">
        <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
          <User className="w-2.5 h-2.5 text-blue-500" /> Solicitante: {request.requester_name}
        </p>
        <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
          <CheckCircle2 className={`w-2.5 h-2.5 ${isApproved ? 'text-green-500' : 'text-red-500'}`} /> Revisor: {request.reviewer_name}
        </p>
      </div>

      {request.admin_comment && (
        <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
          <p className="text-[7px] text-slate-500 font-bold uppercase tracking-widest mb-1">Comentário:</p>
          <p className="text-[10px] text-slate-400 italic">"{request.admin_comment}"</p>
        </div>
      )}
    </div>
  );
};

export default ApprovalsPage;
