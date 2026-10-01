require('dotenv').config();
const { execFileSync } = require('child_process');
const mongoose = require('mongoose');
const Bus = require('../models/Bus');
const Stage = require('../models/Stage');
const Incident = require('../models/Incident');
const { processTelemetry } = require('../services/telemetryService');
const { reportIncident, resolveIncident, resetStationaryState, STATIONARY_TIMEOUT_MS } = require('../services/breakdownService');
const { resetTrafficState } = require('../services/trafficService');

const busId = 'AP30Z1234';
const routeId = 'R-SKLM-SMP-01';
const conductorId = 'EMP-1089';
const outsidePosition = { latitude: 18.50, longitude: 84.10 };
function at(base, minutes, milliseconds = 0) { return new Date(base.getTime() + minutes * 60 * 1000 + milliseconds); }

async function run() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not configured');
  execFileSync(process.execPath, ['scripts/seed.js'], { stdio: 'inherit' });
  await mongoose.connect(process.env.MONGODB_URI);
  const bus = await Bus.findOne({ busId }); const stages = await Stage.find({ routeId, active: true }).sort({ sequence: 1 }).lean();
  if (!bus || stages.length < 5) throw new Error('Srikakulam demo bus or stages are missing');
  const events = []; const io = { emit: (event, payload) => events.push({ event, payload }) }; const base = new Date(Date.now());
  const send = (timestamp, speedKmh, position = outsidePosition) => processTelemetry({ io, bus, routeId, ...position, speedKmh, timestamp });
  const prepare = async (position = outsidePosition) => { resetStationaryState(busId); resetTrafficState(busId); bus.status = 'OPERATIONAL'; bus.currentStageId = stages[0].stageId; bus.currentLatitude = position.latitude; bus.currentLongitude = position.longitude; bus.currentSpeedKmh = 0; bus.trafficDelaySince = null; bus.ewmaSpeedKmh = null; await bus.save(); };
  await prepare(); const sos = await reportIncident({ io, bus, routeId, conductorId, category: 'ENGINE_FAILURE', description: 'Demo SOS', latitude: outsidePosition.latitude, longitude: outsidePosition.longitude }); const sosOpen = sos.incident.status === 'OPEN' && bus.status === 'VEHICLE_DISABLED'; const sosResolved = await resolveIncident({ io, incident: sos.incident });
  await prepare(); await send(at(base, 0), 0); const exactTimeoutResult = await send(at(base, 15), 0); const timeoutResult = await send(at(base, 15, 1), 0); const automaticOpen = await Incident.find({ busId, category: 'STATIONARY_TIMEOUT', status: 'OPEN' }).lean(); const timeoutDetected = !exactTimeoutResult.breakdown.triggered && timeoutResult.breakdown.triggered && automaticOpen.length === 1 && bus.status === 'VEHICLE_DISABLED'; await resolveIncident({ io, incident: await Incident.findOne({ incidentId: automaticOpen[0].incidentId }) });
  await prepare({ latitude: stages[0].latitude, longitude: stages[0].longitude }); await send(at(base, 12), 0, { latitude: stages[0].latitude, longitude: stages[0].longitude }); await send(at(base, 12 + (STATIONARY_TIMEOUT_MS / 60000) + 1), 0, { latitude: stages[0].latitude, longitude: stages[0].longitude }); const stageExcluded = (await Incident.countDocuments({ busId, category: 'STATIONARY_TIMEOUT', status: 'OPEN' })) === 0 && bus.status === 'OPERATIONAL';
  await prepare(); await send(at(base, 25), 0); await send(at(base, 30), 1); await send(at(base, 40), 0); await send(at(base, 55), 0); const movementReset = (await Incident.countDocuments({ busId, category: 'STATIONARY_TIMEOUT', status: 'OPEN' })) === 0 && bus.status !== 'VEHICLE_DISABLED';
  await prepare(); const resolutionIncident = (await reportIncident({ io, bus, routeId, conductorId, category: 'ELECTRICAL_FAILURE', description: 'Resolution demo', latitude: outsidePosition.latitude, longitude: outsidePosition.longitude })).incident; const duplicate = await reportIncident({ io, bus, routeId, conductorId, category: 'FUEL_ISSUE', description: 'Duplicate demo', latitude: outsidePosition.latitude, longitude: outsidePosition.longitude }); const resolved = await resolveIncident({ io, incident: resolutionIncident }); const resolutionCheck = resolved.incident.status === 'RESOLVED' && resolved.incident.resolvedAt && resolved.bus.status === 'OPERATIONAL'; const duplicateCheck = duplicate.duplicate === true;
  const result = { stationarySpeedKmh: 0, stationaryTimeoutMinutes: STATIONARY_TIMEOUT_MS / 60000, sos: { openAndDisabled: sosOpen, resolved: sosResolved.incident.status === 'RESOLVED' }, stationaryTimeout: { exactFifteenMinutesNoBreakdown: !exactTimeoutResult.breakdown.triggered, beyondFifteenMinutesDetected: timeoutDetected, openIncidentCount: automaticOpen.length }, stageExclusion: stageExcluded, movementReset, resolution: resolutionCheck, duplicateProtection: duplicateCheck, eventCounts: events.reduce((counts, event) => { counts[event.event] = (counts[event.event] || 0) + 1; return counts; }, {}) };
  console.log(JSON.stringify(result, null, 2)); if (!sosOpen || !result.sos.resolved || !timeoutDetected || !stageExcluded || !movementReset || !resolutionCheck || !duplicateCheck) throw new Error('Breakdown simulation assertion failed');
}
run().catch((error) => { console.error(`Breakdown simulation failed: ${error.message}`); process.exitCode = 1; }).finally(() => mongoose.disconnect());
