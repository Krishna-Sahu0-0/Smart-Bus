const Bus = require('../models/Bus');
const Route = require('../models/Route');
const Stage = require('../models/Stage');
const Ticket = require('../models/Ticket');
const Telemetry = require('../models/Telemetry');
const { processGeofence } = require('./geofenceService');
const { recalculateAndSave } = require('./occupancyService');

async function processTelemetry({ io, bus, routeId, latitude, longitude, speedKmh, timestamp }) {
  const telemetry = await Telemetry.create({ busId: bus.busId, routeId, latitude, longitude, speedKmh, timestamp });
  bus.currentLatitude = latitude;
  bus.currentLongitude = longitude;
  bus.currentSpeedKmh = speedKmh;
  bus.lastTelemetryAt = telemetry.receivedAt;

  const geofence = await processGeofence(bus, latitude, longitude);
  let expiredTicketCount = 0;
  if (geofence.stageArrived) {
    bus.currentStageId = geofence.stage.stageId;
    const expiration = await Ticket.updateMany(
      { busId: bus.busId, routeId, toStage: geofence.stage.stageId, status: 'ACTIVE' },
      { $set: { status: 'EXPIRED', expiredAt: new Date() } },
    );
    expiredTicketCount = expiration.modifiedCount;
    geofence.expiredTicketCount = expiredTicketCount;
  }

  await bus.save();
  const occupancy = await recalculateAndSave(bus);
  const telemetryPayload = {
    busId: bus.busId,
    routeId,
    latitude,
    longitude,
    speedKmh,
    currentStageId: bus.currentStageId,
    timestamp: telemetry.timestamp,
  };
  io.emit('BUS_TELEMETRY', telemetryPayload);
  if (geofence.stageArrived) {
    io.emit('STAGE_ARRIVAL', {
      busId: bus.busId,
      routeId,
      ...geofence.stage,
      timestamp: telemetry.timestamp,
    });
  }
  io.emit('OCCUPANCY_UPDATE', { busId: bus.busId, ...occupancy });

  return { telemetry: telemetryPayload, geofence, occupancy };
}

async function validateTelemetryInput({ busId, routeId, latitude, longitude, speedKmh, timestamp }) {
  const bus = await Bus.findOne({ busId });
  if (!bus) return { message: 'Bus not found', status: 404 };
  if (bus.status === 'VEHICLE_DISABLED') return { message: 'Bus is not active', status: 409 };
  const route = await Route.findOne({ routeId });
  if (!route) return { message: 'Route not found', status: 404 };
  if (bus.routeId !== routeId) return { message: 'Bus is not assigned to this route', status: 400 };
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) return { message: 'latitude must be between -90 and 90' };
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) return { message: 'longitude must be between -180 and 180' };
  if (!Number.isFinite(speedKmh) || speedKmh < 0) return { message: 'speedKmh must be a non-negative number' };
  const parsedTimestamp = new Date(timestamp);
  if (!timestamp || Number.isNaN(parsedTimestamp.getTime())) return { message: 'timestamp must be a valid date' };
  return { bus, route, timestamp: parsedTimestamp };
}

module.exports = { processTelemetry, validateTelemetryInput };