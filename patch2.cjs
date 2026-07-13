const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

const target = "<InventoryDetailModal isOpen={!!detailContext} onClose={() => setDetailContext(null)} row={detailContext.row} inspection={detailContext.inspection} palletIdx={detailContext.idx} />";
const replacement = "<InventoryDetailModal isOpen={!!detailContext} onClose={() => setDetailContext(null)} row={detailContext.row} inspection={detailContext.inspection} palletIdx={detailContext.idx} onUnconsolidate={handleUnconsolidate} isUnconsolidating={isUnconsolidating} />";

code = code.replace(target, replacement);
fs.writeFileSync('App.tsx', code);
