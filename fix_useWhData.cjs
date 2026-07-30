const fs = require('fs');
let code = fs.readFileSync('hooks/useWarehouseData.ts', 'utf8');

code = code.replace(
  "import { useState, useCallback } from 'react';",
  "import React, { useState, useCallback } from 'react';"
);

fs.writeFileSync('hooks/useWarehouseData.ts', code);
console.log('Fixed react import');
