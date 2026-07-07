const generalSlotsTotal = 264;
let occupiedGeneral = 64;
let waitingPallets = 10;
let newOccupied = occupiedGeneral + waitingPallets;
let freeSlots = generalSlotsTotal - occupiedGeneral; // 200
console.log("Free slots:", freeSlots, "Occupied:", newOccupied);
