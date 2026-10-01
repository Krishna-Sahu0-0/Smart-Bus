const Bus = require('../models/Bus');
const Ticket = require('../models/Ticket');
const Telemetry = require('../models/Telemetry');
const Incident = require('../models/Incident');
const Stage = require('../models/Stage');

// Faculty-demo startup reset: clear transient trip state while preserving master data and passes.
async function resetFacultyDemoState(routeConfig) {
  const bus = await Bus.findOne({ busId: routeConfig.bus.busId });
  const stage = await Stage.findOne({ routeId: routeConfig.routeId, stageId: 'STAGE_01', active: true }).lean();
  if (!bus || !stage) throw new Error('Faculty demo bus or STAGE_01 is missing');

  await Promise.all([
    Ticket.deleteMany({ busId: bus.busId }),
    Telemetry.deleteMany({ busId: bus.busId }),
    Incident.deleteMany({ busId: bus.busId }),
  ]);

  bus.status = 'OPERATIONAL';
  bus.currentStageId = stage.stageId;
  bus.currentLatitude = stage.latitude;
  bus.currentLongitude = stage.longitude;
  bus.currentSpeedKmh = 0;
  bus.occupancy = 0;
  bus.availableSeats = bus.capacity;
  bus.lastTelemetryAt = null;
  bus.trafficDelaySince = null;
  bus.ewmaSpeedKmh = null;
  await bus.save();
}

module.exports = { resetFacultyDemoState };