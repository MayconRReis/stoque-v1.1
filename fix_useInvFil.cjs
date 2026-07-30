const fs = require('fs');
let code = fs.readFileSync('hooks/useInventoryFilters.ts', 'utf8');

code = code.replace("import { supabaseService, AppUser } from '../services/supabaseService';", "import { supabaseService } from '../services/supabaseService';");
code = code.replace("import { useState, useEffect } from 'react';", "import React, { useState, useEffect } from 'react';\nimport { User as AppUser } from '../types';");

fs.writeFileSync('hooks/useInventoryFilters.ts', code);
console.log('Fixed');
