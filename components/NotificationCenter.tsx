import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, BellOff, X, Check, Info, AlertTriangle, AlertCircle, Settings } from 'lucide-react';
import { supabaseService } from '../services/supabaseService';
import { AppNotification } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface NotificationCenterProps {
  userId: string | undefined;
  userRole: string | undefined;
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ userId, userRole, isOpen, onClose }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isPushSupported, setIsPushSupported] = useState(false);
  const [isPushEnabled, setIsPushEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkPushSupport();
    if (isOpen && userId) {
      loadNotifications();
    }
  }, [isOpen, userId]);

  const checkPushSupport = async () => {
    const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    setIsPushSupported(supported);
    
    if (supported) {
      const registration = await navigator.serviceWorker.getRegistration();
      const subscription = await registration?.pushManager.getSubscription();
      setIsPushEnabled(!!subscription);
    }
  };

  const loadNotifications = async () => {
    try {
      const data = await supabaseService.getNotifications(userId, userRole);
      setNotifications(data);
    } catch (error) {
      console.error('Failed to load notifications', error);
    }
  };

  const handleTogglePush = async () => {
    if (!isPushSupported) {
      alert('Seu navegador não suporta notificações Push.');
      return;
    }

    setLoading(true);
    try {
      if (isPushEnabled) {
        // Disable
        const registration = await navigator.serviceWorker.getRegistration();
        const subscription = await registration?.pushManager.getSubscription();
        await subscription?.unsubscribe();
        setIsPushEnabled(false);
      } else {
        // Enable
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          alert('Permissão de notificação negada.');
          setLoading(false);
          return;
        }

        const registration = await navigator.serviceWorker.register('/sw.js');
        
        // Fetch VAPID public key from our server
        const response = await fetch('/api/notifications/public-key');
        const { publicKey } = await response.json();

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: publicKey
        });

        if (userId) {
          await supabaseService.savePushSubscription(userId, subscription);
        }
        setIsPushEnabled(true);
      }
    } catch (error) {
      console.error('Failed to toggle push notifications', error);
      alert('Erro ao configurar notificações. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await supabaseService.markNotificationAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (error) {
      console.error('Failed to mark as read', error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <Check className="w-4 h-4 text-emerald-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-rose-500" />;
      default: return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative w-full max-w-md bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
              <div>
                <h2 className="text-xl font-black text-white uppercase italic tracking-tight">Notificações</h2>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Central de Alertas Stoque+</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl transition-colors">
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>

            <div className="p-4 border-b border-slate-800 bg-slate-950/30">
              <button 
                onClick={handleTogglePush}
                disabled={loading || !isPushSupported}
                className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all border ${
                  isPushEnabled 
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' 
                    : 'bg-slate-800/50 border-slate-700 text-slate-400'
                } hover:brightness-110 disabled:opacity-50`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isPushEnabled ? 'bg-emerald-500/20' : 'bg-slate-700/50'}`}>
                  {isPushEnabled ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
                </div>
                <div className="text-left flex-1">
                  <p className="text-[11px] font-black uppercase tracking-widest">
                    {isPushEnabled ? 'Notificações Ativas' : 'Ativar Notificações no Chrome'}
                  </p>
                  <p className="text-[9px] font-bold opacity-70">
                    {isPushEnabled ? 'Você receberá alertas neste dispositivo' : 'Receba alertas mesmo com o app fechado'}
                  </p>
                </div>
                {loading && <Settings className="w-4 h-4 animate-spin text-slate-500" />}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {notifications.length === 0 ? (
                <div className="py-20 text-center space-y-4">
                  <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto">
                    <Bell className="w-8 h-8 text-slate-600" />
                  </div>
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Nenhuma notificação</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div 
                    key={n.id} 
                    onClick={() => !n.read && handleMarkAsRead(n.id)}
                    className={`p-4 rounded-[1.5rem] border transition-all cursor-pointer ${
                      n.read 
                        ? 'bg-slate-900/30 border-slate-800/50 opacity-60' 
                        : 'bg-slate-800/80 border-slate-700 shadow-lg scale-[1.02]'
                    }`}
                  >
                    <div className="flex gap-4">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        n.type === 'success' ? 'bg-emerald-500/10' :
                        n.type === 'warning' ? 'bg-amber-500/10' :
                        n.type === 'error' ? 'bg-rose-500/10' : 'bg-blue-500/10'
                      }`}>
                        {getIcon(n.type)}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-[11px] font-black text-white uppercase italic tracking-tight">{n.title}</h4>
                          <span className="text-[8px] font-bold text-slate-500 uppercase">{format(new Date(n.created_at), 'HH:mm', { locale: ptBR })}</span>
                        </div>
                        <p className="text-[10px] font-medium text-slate-400 leading-relaxed">{n.message}</p>
                        {!n.read && (
                          <div className="pt-2 flex justify-end">
                            <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest">Novo</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-6 border-t border-slate-800 bg-slate-900/50">
              <p className="text-[8px] font-bold text-slate-600 uppercase tracking-widest text-center">
                Histórico mantido por 30 dias • Sistema de Mensagens Stoque+
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
