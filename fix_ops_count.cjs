const fs = require('fs');
let code = fs.readFileSync('services/supabaseService.ts', 'utf8');

code = code.replace(
  `    allInspections.forEach(item => {
      // Find OPs
      if (item.origin_op) {
        const match = item.origin_op.match(opRegex);
        if (match) {
          uniqueOps.add(match[0]);
        }
      }

      (item.inspections || []).forEach((insp: any) => {`,
  `    allInspections.forEach(item => {
      // Find OPs
      const hasPackagingMaterial = (item.inspections || []).some((insp: any) => {
        const type = insp.contentType;
        return type !== 'FINISHED_PRODUCT' && type !== 'CONTAINER_SJ' && type !== 'CONTAINER_LP' && type !== 'CONTAINER_CP';
      });

      if (hasPackagingMaterial && item.origin_op) {
        const match = item.origin_op.match(opRegex);
        if (match) {
          uniqueOps.add(match[0]);
        }
      }

      (item.inspections || []).forEach((insp: any) => {`
);

fs.writeFileSync('services/supabaseService.ts', code);
console.log('Fixed OPs count logic');
