const fs = require('fs');
let code = fs.readFileSync('components/ImportPage.tsx', 'utf8');

const sanitizeStringFn = `
  const sanitizeString = (str: string) => {
    if (!str) return '';
    return str
      .normalize('NFD')
      .replace(/[\\u0300-\\u036f]/g, '')
      .replace(//g, '') // Remove unrecognized characters
      .trim();
  };

  const sanitizeLote = (str: string) => {
    if (!str) return '';
    return str
      .normalize('NFD')
      .replace(/[\\u0300-\\u036f]/g, '')
      .replace(//g, '')
      .replace(/\\s+/g, ''); // Remove spaces
  };
`;

code = code.replace(
  `  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {`,
  `${sanitizeStringFn}\n  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {`
);

code = code.replace(
  `const op = formatOP(row.op || row.OP || '');`,
  `const op = formatOP(sanitizeLote(row.op || row.OP || ''));`
);

code = code.replace(
  `const nome = (row.nome || row.NOME || row.description || '').toUpperCase();`,
  `const nome = sanitizeString(row.nome || row.NOME || row.description || '').toUpperCase().replace(/\\s+/g, ' ');`
);

code = code.replace(
  `const lote = (row.lote || row.LOTE || '').toUpperCase();`,
  `const lote = sanitizeLote(row.lote || row.LOTE || '').toUpperCase();`
);

fs.writeFileSync('components/ImportPage.tsx', code);
console.log('Fixed CSV import sanitization');
