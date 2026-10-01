const Ticket = require('../models/Ticket');
const Stage = require('../models/Stage');

function classifySeats(occupancy, capacity) {
  if (occupancy > capacity) return { occupancyStatus: 'OVER_CAPACITY', statusEnglish: 'OVER CAPACITY', statusTelugu: 'సామర్థ్యాన్ని మించింది' };
  if (occupancy >= 40) return { occupancyStatus: 'NEAR_CAPACITY', statusEnglish: 'Near capacity', statusTelugu: 'సీట్లు దాదాపు నిండాయి' };
  if (occupancy > 0) return { occupancyStatus: 'FEW_SEATS_AVAILABLE', statusEnglish: 'Seats available', statusTelugu: 'సీట్లు అందుబాటులో ఉన్నాయి' };
  return { occupancyStatus: 'MANY_SEATS_AVAILABLE', statusEnglish: 'Seats available', statusTelugu: 'మంచి సీట్లు ఉన్నాయి' };
}

async function calculateOccupancy(bus) {
  const currentStage = await Stage.findOne({ stageId: bus.currentStageId, routeId: bus.routeId }).lean();
  const currentStageSequence = currentStage ? currentStage.sequence : 0;
  const tickets = await Ticket.find({ busId: bus.busId, status: 'ACTIVE' }).lean();
  const capacity = 50;
  const occupancy = Math.max(0, tickets.reduce((total, ticket) => (
    ticket.fromSequence <= currentStageSequence && currentStageSequence < ticket.toSequence
      ? total + ticket.passengerCount : total
  ), 0));
  const availableSeats = Math.max(0, capacity - occupancy);
  return { occupancy, availableSeats, capacity, ...classifySeats(occupancy, capacity) };
}

async function recalculateAndSave(bus) {
  const result = await calculateOccupancy(bus);
  bus.capacity = 50;
  bus.occupancy = result.occupancy;
  bus.availableSeats = result.availableSeats;
  await bus.save();
  return result;
}

module.exports = { calculateOccupancy, recalculateAndSave, classifySeats };
