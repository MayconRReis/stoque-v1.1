const SlotContent = {
  EMPTY: 'EMPTY',
  BOTTLES: 'BOTTLES',
  SUPPLIES: 'SUPPLIES',
  RETURN: 'RETURN',
  // ...
};
const SHAREABLE_SLOT_TYPES = [
  SlotContent.RETURN,
  // ...
];
const allSlots = [
  { id: 'A.1.1', status: 'EMPTY' },
  { id: 'A.1.2', status: 'BOTTLES' },
  { id: 'A.1.3', status: 'SUPPLIES' },
];

const contentType = SlotContent.BOTTLES;

const computedAvailableSlots = allSlots.filter(s => {
  if (s.status === SlotContent.EMPTY) return true;
  
  if (SHAREABLE_SLOT_TYPES.includes(contentType) && SHAREABLE_SLOT_TYPES.includes(s.status)) {
    return true;
  }
  
  return false;
});

console.log(computedAvailableSlots);
