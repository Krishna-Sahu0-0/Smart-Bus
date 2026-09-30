const Ticket = require('../models/Ticket');
const Stage = require('../models/Stage');

function classifySeats(availableSeats) {
  if (availableSeats > 15) return { occupancyStatus: 'MANY_SEATS_AVAILABLE', statusEnglish: 'Seats Available', statusTelugu: 'మంచి సీట్లు ఉన్నాయి' };
  if (availableSeats > 0) return { occupancyStatus: 'FEW_SEATS_AVAILABLE', statusEnglish: 'Few Seats Available', statusTelugu: 'కొద్దిగా సీట్లు ఉన్నాయి' };
  return { occupancyStatus: 'STANDING_ONLY', statusEnglish: 'Standing Only / Full', statusTelugu: 'నిలబడే స్థలం మాత్రమే' };
}

async function calculateOccupancy(bus) {
  const currentStage = await Stage.findOne({ stageId: bus.currentStageId, routeId: bus.routeId }).lean();
  const currentStageSequence = currentStage ? currentStage.sequence : 0;
  const tickets = await Ticket.find({ busId: bus.busId, status: 'ACTIVE' }).lean();
  const capacity = 50;
  const occupancy = Math.max(0, Math.min(capacity, tickets.reduce((total, ticket) => (
    ticket.fromSequence <= currentStageSequence && currentStageSequence < ticket.toSequence
      ? total + ticket.passengerCount : total
  ), 0)));
  const availableSeats = Math.max(0, Math.min(capacity, capacity - occupancy));
  return { occupancy, availableSeats, capacity, ...classifySeats(availableSeats) };
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
