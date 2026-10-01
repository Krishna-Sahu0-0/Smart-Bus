require('dotenv').config();
const { execFileSync } = require('child_process');
const mongoose = require('mongoose');
const Bus = require('../models/Bus');
const Stage = require('../models/Stage');
const { processTelemetry } = require('../services/telemetryService');
const { calculateEta } = require('../services/etaService');
const { resetTrafficState } = require('../services/trafficService');

const busId = 'AP30Z1234';
const routeId = 'R-SKLM-SMP-01';
const outsidePosition = { latitude: 18.50, longitude: 84.10 };
function at(base, minutes, milliseconds = 0) { return new Date(base.getTime() + minutes * 60 * 1000 + milliseconds); }

async function run() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not configured');
  execFileSync(process.execPath, ['scripts/seed.js'], { stdio: 'inherit' });
  await mongoose.connect(process.env.MONGODB_URI);
  const bus = await Bus.findOne({ busId });
  const stages = await Stage.find({ routeId, active: true }).sort({ sequence: 1 }).lean();
  if (!bus || stages.length < 7) throw new Error('Srikakulam demo bus or seven stages are missing');
  const events = [];
  const io = { emit: (event, payload) => events.push({ event, payload }) };
  const base = new Date(Date.now());
  const send = (timestamp, speedKmh, position = outsidePosition) => processTelemetry({ io, bus, routeId, ...position, speedKmh, timestamp });
  const prepare = async (stageId = stages[0].stageId, position = outsidePosition) => { resetTrafficState(busId); bus.currentStageId = stageId; bus.currentLatitude = position.latitude; bus.currentLongitude = position.longitude; bus.status = 'OPERATIONAL'; bus.trafficDelaySince = null; bus.ewmaSpeedKmh = null; await bus.save(); };

  await prepare();
  const firstLow = await send(at(base, 0), 3); const beforeThreshold = await send(at(base, 4), 2); const delayed = await send(at(base, 5, 1), 3); const cleared = await send(at(base, 6), 20);
  await prepare(stages[0].stageId, { latitude: stages[0].latitude, longitude: stages[0].longitude });
  const atStageStart = await send(at(base, 7), 0, { latitude: stages[0].latitude, longitude: stages[0].longitude }); const atStageAfterSixMinutes = await send(at(base, 13), 0, { latitude: stages[0].latitude, longitude: stages[0].longitude });
  await prepare(); await send(at(base, 14), 10); await send(at(base, 15), 4); await send(at(base, 19), 3); const jitterCleared = await send(at(base, 20), 7);
  await prepare(); await send(at(base, 21), 10); const ewmaSample = await send(at(base, 21, 1000), 4); const finiteEta = await calculateEta(bus); bus.ewmaSpeedKmh = 0; bus.currentSpeedKmh = 0; const zeroSpeedEta = await calculateEta(bus); bus.status = 'VEHICLE_DISABLED'; bus.ewmaSpeedKmh = 10; const disabledEta = await calculateEta(bus);
  bus.status = 'OPERATIONAL'; bus.ewmaSpeedKmh = 10; bus.trafficDelaySince = null; await bus.save();
  const result = { threshold: { firstStatus: firstLow.traffic.status, beforeFiveMinutes: beforeThreshold.traffic.status, afterFiveMinutes: delayed.traffic.status, clearedStatus: cleared.traffic.status }, stageExclusion: { atStageStart: atStageStart.traffic.status, afterSixMinutes: atStageAfterSixMinutes.traffic.status }, timerReset: { statusAfterSpeedRise: jitterCleared.traffic.status }, ewma: { expected: 8.2, actual: ewmaSample.traffic.ewmaSpeedKmh }, eta: { finite: { etaAvailable: finiteEta.etaAvailable, etaMinutes: finiteEta.etaMinutes }, zeroSpeed: { etaAvailable: zeroSpeedEta.etaAvailable, etaMinutes: zeroSpeedEta.etaMinutes }, disabled: { etaAvailable: disabledEta.etaAvailable, etaMinutes: disabledEta.etaMinutes } }, eventCounts: events.reduce((counts, event) => { counts[event.event] = (counts[event.event] || 0) + 1; return counts; }, {}) };
  console.log(JSON.stringify(result, null, 2));
  if (result.threshold.beforeFiveMinutes !== 'OPERATIONAL' || result.threshold.afterFiveMinutes !== 'TRAFFIC_DELAY' || result.threshold.clearedStatus !== 'OPERATIONAL' || result.stageExclusion.afterSixMinutes !== 'OPERATIONAL' || result.timerReset.statusAfterSpeedRise !== 'OPERATIONAL' || Math.abs(result.ewma.actual - 8.2) > 0.001 || !result.eta.finite.etaAvailable || !result.eta.zeroSpeed.etaAvailable || result.eta.zeroSpeed.etaMinutes > 180 || result.eta.disabled.etaAvailable) throw new Error('Traffic simulation assertion failed');
}
run().catch((error) => { console.error(`Traffic simulation failed: ${error.message}`); process.exitCode = 1; }).finally(() => mongoose.disconnect());
