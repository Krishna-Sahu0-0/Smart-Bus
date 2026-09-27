const crypto = require('crypto');
const Bus = require('../models/Bus');
const Route = require('../models/Route');
const Stage = require('../models/Stage');
const Ticket = require('../models/Ticket');
const Pass = require('../models/Pass');
const { calculateOccupancy, recalculateAndSave } = require('../services/occupancyService');

const ticketTypes = ['CASH', 'UPI', 'CARD', 'STUDENT_QR_PASS', 'SENIOR_QR_PASS', 'MONTHLY_PASS', 'QUICK_PASS_COUNT'];
const id = (prefix) => `${prefix}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
const error = (res, message, status = 400) => res.status(status).json({ success: false, message });
const ok = (res, data) => res.json({ success: true, ...data });

async function getJourney(busId, routeId, fromStage, toStage) {
  const bus = await Bus.findOne({ busId });
  if (!bus) return { message: 'Bus not found', status: 404 };
  const route = await Route.findOne({ routeId });
  if (!route) return { message: 'Route not found', status: 404 };
  if (bus.routeId !== routeId) return { message: 'Bus is not assigned to this route' };
  const stages = await Stage.find({ routeId, stageId: { $in: [fromStage, toStage] }, active: true }).lean();
  const origin = stages.find((stage) => stage.stageId === fromStage);
  const destination = stages.find((stage) => stage.stageId === toStage);
  if (!origin || !destination) return { message: 'Origin and destination stages must belong to the route' };
  if (origin.sequence >= destination.sequence) return { message: 'Origin stage must precede destination stage' };
  return { bus, route, origin, destination };
}

function emitOccupancy(io, bus, result) {
  io.emit('OCCUPANCY_UPDATE', { busId: bus.busId, ...result });
}

function createController(io) {
  return {
    listBuses: async (req, res) => ok(res, { buses: await Bus.find().lean() }),
    getBus: async (req, res) => { const bus = await Bus.findOne({ busId: req.params.busId }).lean(); return bus ? ok(res, { bus }) : error(res, 'Bus not found', 404); },
    listRoutes: async (req, res) => ok(res, { routes: await Route.find().populate('stageIds').lean() }),
    getRoute: async (req, res) => { const route = await Route.findOne({ routeId: req.params.routeId }).populate('stageIds').lean(); return route ? ok(res, { route }) : error(res, 'Route not found', 404); },
    listStages: async (req, res) => ok(res, { stages: await Stage.find({ routeId: req.params.routeId, active: true }).sort({ sequence: 1 }).lean() }),
    getOccupancy: async (req, res) => { const bus = await Bus.findOne({ busId: req.params.busId }); if (!bus) return error(res, 'Bus not found', 404); return ok(res, { occupancy: await calculateOccupancy(bus) }); },
    createTicket: async (req, res) => {
      const { busId, routeId, ticketType, fromStage, toStage, passengerCount, fareCharged = 0 } = req.body;
      if (!ticketTypes.includes(ticketType)) return error(res, 'Invalid ticket type');
      if (!Number.isInteger(passengerCount) || passengerCount < 1) return error(res, 'passengerCount must be a positive integer');
      const journey = await getJourney(busId, routeId, fromStage, toStage);
      if (journey.message) return error(res, journey.message, journey.status);
      const ticket = await Ticket.create({ ticketId: id('TKT'), busId, routeId, ticketType, fromStage, toStage, fromSequence: journey.origin.sequence, toSequence: journey.destination.sequence, passengerCount, fareCharged, status: 'ACTIVE' });
      const occupancy = await recalculateAndSave(journey.bus);
      emitOccupancy(io, journey.bus, occupancy);
      return res.status(201).json({ success: true, ticket, occupancy });
    },
    scanPass: async (req, res) => {
      const { passId, busId, routeId, fromStage, toStage } = req.body;
      const pass = await Pass.findOne({ passId });
      if (!pass) return error(res, 'Pass not found', 404);
      const now = new Date();
      if (!pass.active || now < pass.validFrom || now > pass.validUntil) return error(res, 'Pass is inactive or outside its validity period');
      if (!pass.permittedStages.includes(fromStage) || !pass.permittedStages.includes(toStage)) return error(res, 'Pass does not permit the requested stages');
      const journey = await getJourney(busId, routeId, fromStage, toStage);
      if (journey.message) return error(res, journey.message, journey.status);
      const ticketType = pass.passType === 'STUDENT' ? 'STUDENT_QR_PASS' : pass.passType === 'SENIOR_CITIZEN' ? 'SENIOR_QR_PASS' : 'MONTHLY_PASS';
      const ticket = await Ticket.create({ ticketId: id('TKT'), busId, routeId, ticketType, passId, fromStage, toStage, fromSequence: journey.origin.sequence, toSequence: journey.destination.sequence, passengerCount: 1, fareCharged: 0, status: 'ACTIVE' });
      const occupancy = await recalculateAndSave(journey.bus); emitOccupancy(io, journey.bus, occupancy);
      return res.status(201).json({ success: true, ticket, occupancy });
    },
    quickCount: async (req, res) => {
      const { busId, routeId, fromStage, toStage, passengerCount } = req.body;
      if (!Number.isInteger(passengerCount) || passengerCount < 1) return error(res, 'passengerCount must be a positive integer');
      const journey = await getJourney(busId, routeId, fromStage, toStage);
      if (journey.message) return error(res, journey.message, journey.status);
      const ticket = await Ticket.create({ ticketId: id('TKT'), busId, routeId, ticketType: 'QUICK_PASS_COUNT', fromStage, toStage, fromSequence: journey.origin.sequence, toSequence: journey.destination.sequence, passengerCount, fareCharged: 0, status: 'ACTIVE' });
      const occupancy = await recalculateAndSave(journey.bus); emitOccupancy(io, journey.bus, occupancy);
      return res.status(201).json({ success: true, ticket, occupancy });
    },
  };
}

module.exports = createController;