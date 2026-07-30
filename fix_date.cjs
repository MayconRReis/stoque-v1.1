const fs = require('fs');

function fixFile(file) {
  let code = fs.readFileSync(file, 'utf8');
  code = code.replace(
    /new Date\(shipment\.scheduledDate\?\.includes\('T'\) \? shipment\.scheduledDate : shipment\.scheduledDate \+ 'T12:00:00'\)\.toLocaleDateString\('pt-BR'(, \{[^}]+\})?\)/g,
    "(shipment.scheduledDate ? new Date(shipment.scheduledDate.includes('T') ? shipment.scheduledDate : shipment.scheduledDate + 'T12:00:00').toLocaleDateString('pt-BR'$1) : 'Data não definida')"
  );
  fs.writeFileSync(file, code);
}

fixFile('components/ShipmentPage.tsx');
fixFile('components/ShipmentModal.tsx');
console.log('Fixed dates');
