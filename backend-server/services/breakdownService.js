const crypto = require('crypto');
const Bus = require('../models/Bus');
const Incident = require('../models/Incident');
const { resetTrafficState } = require('./trafficService');

const STATIONARY_SPEED_THRESHOLD_KMH = 0;
const STATIONARY_TIMEOUT_MS = (Number(process.env.STATIONARY_TIMEOUT_MINUTES) || 15) * 60 * 1000;
const runtimeStates = new Map();

function incidentId() {
  return `INC-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
}

function resetStationaryState(busId) {
  runtimeStates.delete(busId);
}

function commuterPayload(incident, bus) {
  return {
    busId: incident.busId,
    routeId: incident.routeId,
    category: incident.category,
    stageId: bus.currentStageId,
    latitude: incident.latitude,
    longitude: incident.longitude,
    timestamp: incident.reportedAt,
    status: incident.status,
  };
}

async function emitIncident(io, incident, bus) {
  incident.commuterAlerted = true;
  await incident.save();
  io.emit('BREAKDOWN_REPORTED', {
    incidentId: incident.incidentId,
    busId: incident.busId,
    routeId: incident.routeId,
    category: incident.category,
    status: incident.status,
    reportedAt: incident.reportedAt,
  });
  io.emit('BREAKDOWN_ALERT', commuterPayload(incident, bus));
}

async function reportIncident({ io, bus, routeId, conductorId, category, description, latitude, longitude, stationarySince, reportedAt = new Date() }) {
  const existing = await Incident.findOne({ busId: bus.busId, status: 'OPEN' });
  if (existing) return { incident: existing, duplicate: true };
  const incident = await Incident.create({ incidentId: incidentId(), busId: bus.busId, routeId, conductorId, category, description, latitude, longitude, stationarySince, reportedAt, status: 'OPEN' });
  bus.status = 'VEHICLE_DISABLED';
  await bus.save();
  resetStationaryState(bus.busId);
  resetTrafficState(bus.busId);
  await emitIncident(io, incident, bus);
  return { incident, duplicate: false };
}

async function processStationaryBreakdown({ io, bus, routeId, speedKmh, timestamp, insideGeofence }) {
  const state = runtimeStates.get(bus.busId) || { stationarySince: null };
  const stationaryOutsideStage = speedKmh === STATIONARY_SPEED_THRESHOLD_KMH && !insideGeofence;
  if (bus.status === 'VEHICLE_DISABLED') {
    resetStationaryState(bus.busId);
    return { triggered: false, stationarySince: null, elapsedSeconds: 0 };
  }
  if (!stationaryOutsideStage) {
    resetStationaryState(bus.busId);
    return { triggered: false, stationarySince: null, elapsedSeconds: 0 };
  }
  if (!state.stationarySince) state.stationarySince = timestamp;
  runtimeStates.set(bus.busId, state);
  const elapsedSeconds = Math.max(0, (timestamp - state.stationarySince) / 1000);
  if (elapsedSeconds * 1000 <= STATIONARY_TIMEOUT_MS) return { triggered: false, stationarySince: state.stationarySince, elapsedSeconds };

  const existing = await Incident.findOne({ busId: bus.busId, status: 'OPEN' });
  if (existing) {
    bus.status = 'VEHICLE_DISABLED';
    return { triggered: false, existing: true, stationarySince: state.stationarySince, elapsedSeconds };
  }
  const result = await reportIncident({
    io,
    bus,
    routeId,
    category: 'STATIONARY_TIMEOUT',
    description: 'Bus remained at zero speed outside a stage geofence beyond the stationary timeout.',
    latitude: bus.currentLatitude,
    longitude: bus.currentLongitude,
    stationarySince: state.stationarySince,
    reportedAt: timestamp,
  });
  return { triggered: !result.duplicate, incident: result.incident, stationarySince: state.stationarySince, elapsedSeconds };
}

async function resolveIncident({ io, incident }) {
  incident.status = 'RESOLVED';
  incident.resolvedAt = new Date();
  await incident.save();
  const openIncidents = await Incident.countDocuments({ busId: incident.busId, status: 'OPEN' });
  const bus = await Bus.findOne({ busId: incident.busId });
  if (bus && openIncidents === 0 && bus.status === 'VEHICLE_DISABLED') {
    bus.status = 'OPERATIONAL';
    await bus.save();
  }
  resetStationaryState(incident.busId);
  resetTrafficState(incident.busId);
  io.emit('BREAKDOWN_RESOLVED', {
    incidentId: incident.incidentId,
    busId: incident.busId,
    routeId: incident.routeId,
    status: incident.status,
    resolvedAt: incident.resolvedAt,
  });
  return { incident, bus };
}

module.exports = {
  STATIONARY_SPEED_THRESHOLD_KMH,
  STATIONARY_TIMEOUT_MS,
  reportIncident,
  processStationaryBreakdown,
  resolveIncident,
  resetStationaryState,
};