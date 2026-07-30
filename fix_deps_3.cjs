const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

code = code.replace(
  `  } = useWarehouseData(
    (() => { setDataRef.current = setData; return inventoryPage; })(),
    PAGE_SIZE,`,
  `  } = useWarehouseData(
    inventoryPage,
    PAGE_SIZE,`
);

// We need to add the useEffect somewhere right after useWarehouseData
const insertStr = `  useEffect(() => {
    setDataRef.current = setData;
  }, [setData]);`;

code = code.replace(
  ");\n  \n  const [detailContext, setDetailContext]",
  ");\n\n  useEffect(() => { setDataRef.current = setData; }, [setData]);\n\n  const [detailContext, setDetailContext]"
);

fs.writeFileSync('App.tsx', code);
console.log('Fixed deps 3');
