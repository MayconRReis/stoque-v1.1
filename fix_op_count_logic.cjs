const fs = require('fs');
let code = fs.readFileSync('services/supabaseService.ts', 'utf8');

code = code.replace(
  `      const hasPackagingMaterial = (item.inspections || []).some((insp: any) => {
        const type = insp.contentType;
        return type !== 'FINISHED_PRODUCT' && type !== 'CONTAINER_SJ' && type !== 'CONTAINER_LP' && type !== 'CONTAINER_CP';
      });

      if (hasPackagingMaterial && item.origin_op) {`,
  `      const hasRelevantMaterial = (item.inspections || []).some((insp: any) => {
        return insp.contentType === 'BOTTLES' || insp.contentType === 'SUPPLIES';
      });

      if (hasRelevantMaterial && item.origin_op) {`
);

fs.writeFileSync('services/supabaseService.ts', code);
console.log('Fixed OP count logic in supabaseService.ts');
