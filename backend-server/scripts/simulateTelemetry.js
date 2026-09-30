require('dotenv').config();
const crypto = require('crypto');
const mongoose = require('mongoose');
const Bus = require('../models/Bus');
const Route = require('../models/Route');
const Stage = require('../models/Stage');
const Ticket = require('../models/Ticket');
const { processTelemetry } = require('../services/telemetryService');
const { recalculateAndSave } = require('../services/occupancyService');

const busId = 'AP30Z1234';
const routeId = 'R-SKLM-SMP-01';
const ticketId = () => `SIM-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;

async function run() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not configured');
  await mongoose.connect(process.env.MONGODB_URI);
  const bus = await Bus.findOne({ busId });
  const route = await Route.findOne({ routeId });
  const stages = await Stage.find({ routeId, active: true }).sort({ sequence: 1 }).lean();
  if (!bus || !route || stages.length < 5) throw new Error('Srikakulam demo bus, route, or stages are missing');

  await Ticket.updateMany({ busId, status: 'ACTIVE' }, { $set: { status: 'CANCELLED' } });
  bus.currentStageId = stages[0].stageId;
  bus.currentLatitude = stages[0].latitude;
  bus.currentLongitude = stages[0].longitude;
  await recalculateAndSave(bus);
  await Ticket.create([
    { ticketId: ticketId(), busId, routeId, ticketType: 'CASH', fromStage: stages[0].stageId, toStage: stages[2].stageId, fromSequence: stages[0].sequence, toSequence: stages[2].sequence, passengerCount: 2, fareCharged: 140, status: 'ACTIVE' },
    { ticketId: ticketId(), busId, routeId, ticketType: 'CASH', fromStage: stages[0].stageId, toStage: stages[3].stageId, fromSequence: stages[0].sequence, toSequence: stages[3].sequence, passengerCount: 1, fareCharged: 105, status: 'ACTIVE' },
  ]);
  await recalculateAndSave(bus);

  const events = [];
  const io = { emit: (event, payload) => events.push({ event, payload }) };
  const send = (stage, offset) => processTelemetry({ io, bus, routeId, latitude: stage.latitude + offset, longitude: stage.longitude, speedKmh: 28, timestamp: new Date(Date.now() + stage.sequence * 1000) });
  const stageTwo = await send(stages[1], 0);
  const stageThree = await send(stages[2], 0);
  await send(stages[2], 0.0001);
  await send(stages[2], -0.0001);
  const activeTickets = await Ticket.find({ busId, status: 'ACTIVE' }).lean();
  const stageArrivalEvents = events.filter(({ event }) => event === 'STAGE_ARRIVAL');
  console.log(JSON.stringify({
    stageTwo: { currentStageId: stageTwo.telemetry.currentStageId, occupancy: stageTwo.occupancy.occupancy, availableSeats: stageTwo.occupancy.availableSeats },
    stageThree: { currentStageId: stageThree.telemetry.currentStageId, expiredTicketCount: stageThree.geofence.expiredTicketCount, occupancy: stageThree.occupancy.occupancy, availableSeats: stageThree.occupancy.availableSeats },
    repeatedStageThreeArrivals: stageArrivalEvents.filter(({ payload }) => payload.stageId === stages[2].stageId).length,
    activeDestinations: activeTickets.map((ticket) => ticket.toStage),
    emittedEvents: [...new Set(events.map(({ event }) => event))],
  }, null, 2));
}

run().catch((error) => { console.error(`Telemetry simulation failed: ${error.message}`); process.exitCode = 1; }).finally(() => mongoose.disconnect());
