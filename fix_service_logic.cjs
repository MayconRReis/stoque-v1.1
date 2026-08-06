const fs = require('fs');
let code = fs.readFileSync('services/supabaseService.ts', 'utf8');

code = code.replace(
  `    const uniqueOps = new Set<string>();

    const opRegex = /\\b\\d{3}-\\d{3}\\b/;

    allInspections.forEach(item => {
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
      }`,
  `    const uniqueOps = new Set<string>();

    allInspections.forEach(item => {
      // Find OPs
      const hasPackagingMaterial = (item.inspections || []).some((insp: any) => {
        const type = insp.contentType;
        return type !== 'FINISHED_PRODUCT' && type !== 'CONTAINER_SJ' && type !== 'CONTAINER_LP' && type !== 'CONTAINER_CP';
      });

      if (hasPackagingMaterial && item.origin_op) {
        const normalizedOp = formatOP(item.origin_op);
        if (normalizedOp) {
          uniqueOps.add(normalizedOp);
        }
      }`
);

fs.writeFileSync('services/supabaseService.ts', code);
console.log('Fixed OP count logic in supabaseService.ts');
