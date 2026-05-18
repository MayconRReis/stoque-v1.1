const fs = require('fs');
const file = 'App.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "  // Debounced search for server-side filtering\n  useEffect(() => {\n    const timer = setTimeout(() => {\n      const fetchFilteredData = async () => {\n        setIsLoadingMore(true);\n        try {\n          const result = await supabaseService.getInventoryPaginated(0, PAGE_SIZE, {\n            searchTerm: inventorySearch,\n            typeFilter: inventoryTypeFilter\n          });",
  "  // Debounced search for server-side filtering\n  useEffect(() => {\n    const timer = setTimeout(() => {\n      const fetchFilteredData = async () => {\n        setIsLoadingMore(true);\n        try {\n          const typeFilterToUse = activeSubTab === 'containers' ? 'CONTAINER' : inventoryTypeFilter;\n          const result = await supabaseService.getInventoryPaginated(0, PAGE_SIZE, {\n            searchTerm: inventorySearch,\n            typeFilter: typeFilterToUse\n          });"
);

content = content.replace(
  "    return () => clearTimeout(timer);\n  }, [inventorySearch, inventoryTypeFilter, user, isPublicView]);",
  "    return () => clearTimeout(timer);\n  }, [inventorySearch, inventoryTypeFilter, user, isPublicView, activeSubTab]);"
);

fs.writeFileSync(file, content);
