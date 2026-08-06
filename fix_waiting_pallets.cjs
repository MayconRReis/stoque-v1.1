const fs = require('fs');
let code = fs.readFileSync('services/supabaseService.ts', 'utf8');

code = code.replace(
  `    let waitingPallets = 0;
    const productDistribution: Record<string, number> = {};`,
  `    let waitingPallets = 0;
    let waitingPalletsGeneral = 0;
    const productDistribution: Record<string, number> = {};`
);

code = code.replace(
  `        if (insp.assignedSlot === 'AGUARDANDO') {
          waitingPallets += 1;
        }`,
  `        if (insp.assignedSlot === 'AGUARDANDO') {
          waitingPallets += 1;
          const type = insp.contentType || 'OTHER';
          if (!['CONTAINER_SJ', 'CONTAINER_LP', 'CONTAINER_CP'].includes(type)) {
            waitingPalletsGeneral += 1;
          }
        }`
);

code = code.replace(
  `      occupiedSlots: occupiedGeneralPhysical + waitingPallets,
      freeSlots: totalGeneral - occupiedGeneralPhysical,
      occupancyRate: totalGeneral > 0 ? Math.round(((occupiedGeneralPhysical + waitingPallets) / totalGeneral) * 100) : 0,`,
  `      occupiedSlots: occupiedGeneralPhysical + waitingPalletsGeneral,
      freeSlots: totalGeneral - occupiedGeneralPhysical,
      occupancyRate: totalGeneral > 0 ? Math.round(((occupiedGeneralPhysical + waitingPalletsGeneral) / totalGeneral) * 100) : 0,`
);

fs.writeFileSync('services/supabaseService.ts', code);
console.log('Fixed waiting pallets');
