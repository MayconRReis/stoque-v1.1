const fs = require('fs');
let code = fs.readFileSync('services/supabaseService.ts', 'utf8');

code = code.replace(
  `      if (error) {\n        console.error('Supabase addHistoryEntry error:', error);\n        throw error;\n      }`,
  `      if (error) {
        if (error.code === '42703' && error.message.includes('pallet_type')) {
          console.warn('Column pallet_type missing, retrying without it');
          const { error: retryError } = await supabase
            .from('history')
            .insert({
              id: entry.id,
              type: entry.type,
              timestamp: entry.timestamp,
              loading_id: entry.loadingId,
              description: entry.description,
              op: entry.op,
              lot: entry.lot,
              pallet_number: entry.palletNumber,
              total_pallets: entry.totalPallets,
              slot: entry.slot,
              details: entry.details,
              operator_name: entry.operatorName
            });
            
          if (retryError) {
             console.error('Supabase addHistoryEntry retry error:', retryError);
             throw retryError;
          }
        } else {
          console.error('Supabase addHistoryEntry error:', error);
          throw error;
        }
      }`
);

fs.writeFileSync('services/supabaseService.ts', code);
console.log('Added fallback for history table');
