const fs = require('fs');
const file = 'App.tsx';
let content = fs.readFileSync(file, 'utf8');

const replacement = `  {activeSubTab === 'containers' && (
      <div className="space-y-6">
        {/* Search Area */}
        <div className="flex flex-col md:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-700 w-4 h-4" />
            <input 
              type="text" 
              value={inventorySearch}
              onChange={(e) => setInventorySearch(e.target.value)}
              placeholder="Pesquise o Container por Lote, OP ou Produto..." 
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-11 py-3 text-white font-semibold text-sm focus:border-blue-600 outline-none transition-all placeholder:text-slate-700"
            />
          </div>
        </div>

        {selectedPallets.length > 0 && (
          <div className="flex gap-3 w-full md:w-auto">
            <button 
              onClick={() => setIsShipmentModalOpen(true)}
              className="flex-1 md:flex-none px-5 py-3 bg-fuchsia-600 hover:bg-fuchsia-500 text-zinc-50 rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-fuchsia-900/20 animate-in zoom-in duration-200"
            >
              <Truck className="w-3.5 h-3.5" /> Carregamento ({selectedPallets.length})
            </button>
            <button 
              onClick={() => setIsBulkConfirmOpen(true)}
              className="flex-1 md:flex-none px-5 py-3 bg-blue-600 hover:bg-blue-500 text-zinc-50 rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 animate-in zoom-in duration-200"
            >
              <Send className="w-3.5 h-3.5" /> Enviar ({selectedPallets.length})
            </button>
          </div>
        )}

        {filteredInventory.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
            <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-900 rounded-[32px]">
              <p className="text-slate-700 font-black uppercase text-[10px] tracking-[0.3em]">Nenhum container encontrado</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredInventory.map(({ row, inspection, idx }) => (
              <InventoryCard
                key={\`\${row.id}::\${idx}\`}
                item={row}
                insp={inspection}
                idx={idx}
                isSelected={selectedPallets.includes(\`\${row.id}::\${idx}\`)}
                onToggleSelection={togglePalletSelection}
                onShowDetail={handleShowDetail}
                onEdit={handleEditPallet}
                onDelete={handleDeletePallet}
                userRole={user?.role}
              />
            ))}
          </div>
        )}

        {hasMoreInventory && (
          <div className="flex justify-center pt-8 pb-12">
            <button
              onClick={loadMoreInventory}
              disabled={isLoadingMore}
              className="px-8 py-4 bg-slate-900 text-white rounded-[20px] font-black uppercase text-xs tracking-widest hover:bg-slate-800 transition-all disabled:opacity-50 flex items-center gap-3 border border-slate-800 shadow-xl"
            >
              {isLoadingMore ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Carregando...</span>
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  <span>Carregar Mais Containers</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    )}`;

content = content.replace(
  "  {activeSubTab === 'containers' && (\n      <div className=\"py-20 text-center border-2 border-dashed border-slate-900 rounded-[2.5rem]\">\n        <Container className=\"w-12 h-12 text-slate-800 mx-auto mb-4\" />\n        <p className=\"text-slate-700 font-bold uppercase text-[10px] tracking-[0.3em]\">\n          Visualização de Containers em breve\n        </p>\n      </div>\n    )}",
  replacement
);

fs.writeFileSync(file, content);
