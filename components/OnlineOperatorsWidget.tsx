import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, User } from 'lucide-react';

export interface OnlineOperator {
  id?: string;
  name: string;
  role: string;
  email?: string;
  sessionId?: string;
  onlineAt?: string;
}

interface OnlineOperatorsWidgetProps {
  operators: OnlineOperator[];
  currentUser?: { id?: string; name: string; role: string; email?: string } | null;
}

export const OnlineOperatorsWidget: React.FC<OnlineOperatorsWidgetProps> = ({
  operators,
  currentUser
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Compute effective operators list, ensuring current user is present if logged in
  const effectiveOperators = React.useMemo(() => {
    const list = [...operators];
    if (currentUser && !list.some(o => o.id === currentUser.id || o.name === currentUser.name)) {
      list.push({
        id: currentUser.id,
        name: currentUser.name,
        role: currentUser.role,
        email: currentUser.email
      });
    }
    const seen = new Set<string>();
    return list.filter(o => {
      const key = o.id || o.name;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [operators, currentUser]);

  const count = effectiveOperators.length;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="flex items-center gap-2 h-10 px-3.5 rounded-full bg-slate-100 dark:bg-slate-900/50 hover:bg-slate-200 dark:hover:bg-slate-800/80 border border-slate-300 dark:border-slate-800/50 text-slate-700 dark:text-slate-200 transition-all active:scale-95 shadow-sm cursor-pointer group"
        title={`Operadores ativos (${count}):\n${effectiveOperators.map(o => `• ${o.name} (${o.role === 'admin' ? 'Administrador' : 'Operador'})`).join('\n')}`}
        aria-label="Operadores ativos"
      >
        {/* Ponto verde ao lado esquerdo */}
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
        </span>

        {/* Número do lado direito */}
        <span className="text-xs md:text-sm font-bold text-slate-800 dark:text-slate-100 tabular-nums">
          {count}
        </span>
      </button>

      {/* Popover com lista de operadores conectados */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop no mobile para toque externo */}
            <div 
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-xs sm:hidden"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="fixed sm:absolute top-[4.25rem] sm:top-full left-3 right-3 sm:left-auto sm:right-0 mt-2 max-w-sm sm:max-w-none sm:w-72 mx-auto sm:mx-0 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-4 z-50 backdrop-blur-md"
            >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Usuários Ativos
                </h4>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase">
                {count} {count === 1 ? 'Conectado' : 'Conectados'}
              </span>
            </div>

            <div className="mt-3 space-y-2 max-h-60 overflow-y-auto">
              {effectiveOperators.map((op, idx) => {
                const isCurrent = currentUser && (op.id === currentUser.id || op.name === currentUser.name);
                return (
                  <div 
                    key={op.id || op.sessionId || idx}
                    className={`flex items-center justify-between p-2 rounded-xl transition-colors ${
                      isCurrent 
                        ? 'bg-blue-500/10 border border-blue-500/20' 
                        : 'bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                        {op.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                          {op.name}
                          {isCurrent && (
                            <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400 bg-blue-500/20 px-1.5 py-0.2 rounded-md">
                              Você
                            </span>
                          )}
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          {op.role === 'admin' ? (
                            <span className="flex items-center gap-0.5 text-amber-600 dark:text-amber-400 font-semibold">
                              <Shield className="w-2.5 h-2.5" /> Administrador
                            </span>
                          ) : (
                            <span className="flex items-center gap-0.5 text-slate-500 dark:text-slate-400">
                              <User className="w-2.5 h-2.5" /> Operador
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 ml-2" title="Online agora" />
                  </div>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
      </AnimatePresence>
    </div>
  );
};
export default OnlineOperatorsWidget;
