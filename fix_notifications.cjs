const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

// Insert notificationsCount calculation before return
const calcCode = `
  const notifications = [
    ...(user?.role === 'admin' && pendingApprovalsCount > 0 ? [{ id: 'approvals', label: 'Aprovações Pendentes', count: pendingApprovalsCount, tab: 'approvals', icon: ClipboardCheck }] : []),
    ...(pendingRows.length > 0 ? [{ id: 'analysis', label: 'Análises Pendentes', count: pendingRows.length, tab: 'analysis', icon: ClipboardCheck }] : []),
    ...(shipments.filter(s => s.status === ShipmentStatus.OPEN).length > 0 ? [{ id: 'shipments', label: 'Carregamentos Abertos', count: shipments.filter(s => s.status === ShipmentStatus.OPEN).length, tab: 'shipments', icon: Truck }] : [])
  ];
  const totalNotifications = notifications.reduce((acc, n) => acc + n.count, 0);

  if (isAuthLoading) {
`;

code = code.replace(/if \(isAuthLoading\) \{/, calcCode);

// Replace the div with the notification button and dropdown
const bellCode = `
            {!isPublicView && (
              <div className="relative">
                <button
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  className="flex items-center justify-center w-10 h-10 bg-slate-100 dark:bg-slate-900/50 hover:bg-slate-200 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-800/50 rounded-full text-slate-600 dark:text-slate-500 hover:text-slate-900 dark:text-white transition-all active:scale-95 shadow-sm relative"
                  title="Notificações"
                >
                  <Bell className="w-4 h-4" />
                  {totalNotifications > 0 && (
                    <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-slate-950 animate-pulse">
                      {totalNotifications > 9 ? '9+' : totalNotifications}
                    </span>
                  )}
                </button>

                <AnimatePresence>
                  {isNotificationsOpen && (
                    <>
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-40"
                        onClick={() => setIsNotificationsOpen(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden"
                      >
                        <div className="p-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
                          <h3 className="font-bold text-slate-800 dark:text-white text-sm">Notificações</h3>
                          {totalNotifications > 0 && (
                            <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs font-bold px-2 py-0.5 rounded-full">
                              {totalNotifications}
                            </span>
                          )}
                        </div>
                        <div className="max-h-[60vh] overflow-y-auto relative z-50">
                          {notifications.length > 0 ? (
                            <div className="p-2 space-y-1">
                              {notifications.map((n) => (
                                <button
                                  key={n.id}
                                  onClick={() => {
                                    navigateToTab(n.tab);
                                    setIsNotificationsOpen(false);
                                  }}
                                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left"
                                >
                                  <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                                    <n.icon className="w-5 h-5" />
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-sm font-semibold text-slate-800 dark:text-white">{n.label}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{n.count} {n.count === 1 ? 'item pendente' : 'itens pendentes'}</p>
                                  </div>
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div className="p-6 text-center text-slate-500 dark:text-slate-400 text-sm flex flex-col items-center">
                              <Bell className="w-8 h-8 text-slate-300 dark:text-slate-700 mb-2" />
                              <p>Nenhuma notificação</p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            )}
`;

const searchStr = `<div className="flex items-center justify-center w-10 h-6 bg-slate-100 dark:bg-slate-900/50 rounded-full border border-slate-300 dark:border-slate-800/50">
               <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
             </div>`;

code = code.replace(searchStr, bellCode);

fs.writeFileSync('App.tsx', code);
