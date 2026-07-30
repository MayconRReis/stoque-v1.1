const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

code = code.replace(
  `  const [detailContext, setDetailContext] = useState<{ row: SheetRow, inspection: InspectionData, idx: number } | null>(null);`,
  `  React.useEffect(() => {\n    setDataRef.current = setData;\n  }, [setData]);\n\n  const [detailContext, setDetailContext] = useState<{ row: SheetRow, inspection: InspectionData, idx: number } | null>(null);`
);

fs.writeFileSync('App.tsx', code);
console.log('Fixed setDataRef update');
