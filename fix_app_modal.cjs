const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

const updateModal = `
      {/* Update Available Modal */}
      <AnimatePresence>
        {updateAvailable && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={reloadPage}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 text-center"
            >
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-6">
                <RefreshCw className="w-8 h-8 animate-spin-slow" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Nova Atualização!</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-8">
                Lançamos uma nova versão do Stoque+ com melhorias e correções. Clique no botão abaixo para recarregar a página e utilizar a nova versão.
              </p>
              
              <button
                onClick={reloadPage}
                className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-slate-900 dark:text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-900/20 active:scale-[0.98]"
              >
                Recarregar e Atualizar
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
`;

code = code.replace(
  `{/* Slot Actions Modal */}`,
  updateModal + `\n      {/* Slot Actions Modal */}`
);

fs.writeFileSync('App.tsx', code);
console.log('Update modal added');
