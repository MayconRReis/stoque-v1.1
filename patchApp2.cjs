const fs = require('fs');
const file = 'App.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "        // Type filter check\n        const matchesType = inventoryTypeFilter === 'ALL' || \n          insp.contentType === inventoryTypeFilter ||\n          (inventoryTypeFilter === 'CONTAINER' && [SlotContent.CONTAINER_SJ, SlotContent.CONTAINER_LP, SlotContent.CONTAINER_CP].includes(insp.contentType));",
  "        // Type filter check\n        const matchesType = (activeSubTab === 'containers' && [SlotContent.CONTAINER_SJ, SlotContent.CONTAINER_LP, SlotContent.CONTAINER_CP].includes(insp.contentType)) ||\n          (activeSubTab !== 'containers' && (inventoryTypeFilter === 'ALL' || insp.contentType === inventoryTypeFilter || (inventoryTypeFilter === 'CONTAINER' && [SlotContent.CONTAINER_SJ, SlotContent.CONTAINER_LP, SlotContent.CONTAINER_CP].includes(insp.contentType))));"
);

fs.writeFileSync(file, content);
