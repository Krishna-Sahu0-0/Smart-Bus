const turf = require('@turf/turf');
const Stage = require('../models/Stage');

const BASELINE_SPEED_KMH = Number(process.env.ETA_BASELINE_SPEED_KMH) || 30;
const BASE_DWELL_TIME_SECONDS = Number(process.env.ETA_BASE_DWELL_SECONDS) || 30;

async function calculateEta(bus) {
  const stages = await Stage.find({ routeId: bus.routeId, active: true }).sort({ sequence: 1 }).lean();
  const currentStage = stages.find((stage) => stage.stageId === bus.currentStageId);
  const currentSequence = currentStage ? currentStage.sequence : 0;
  const downstreamStages = stages.filter((stage) => stage.sequence > currentSequence);
  const targetStage = downstreamStages[downstreamStages.length - 1] || currentStage;
  const ewmaSpeedKmh = Number.isFinite(bus.ewmaSpeedKmh) ? Math.max(0, bus.ewmaSpeedKmh) : 0;
  const base = {
    busId: bus.busId,
    etaAvailable: false,
    etaMinutes: null,
    remainingDistanceKm: 0,
    ewmaSpeedKmh,
    trafficDelayMinutes: 0,
    expectedDwellMinutes: 0,
    targetStageId: targetStage ? targetStage.stageId : null,
  };

  if (bus.status === 'VEHICLE_DISABLED' || !targetStage || !Number.isFinite(bus.currentLatitude) || !Number.isFinite(bus.currentLongitude) || ewmaSpeedKmh <= 0) return base;

  const currentPosition = turf.point([bus.currentLongitude, bus.currentLatitude]);
  let previousPoint = currentPosition;
  let remainingDistanceKm = 0;
  downstreamStages.forEach((stage) => {
    const stagePoint = turf.point([stage.longitude, stage.latitude]);
    remainingDistanceKm += turf.distance(previousPoint, stagePoint, { units: 'kilometers' });
    previousPoint = stagePoint;
  });

  const travelSeconds = (remainingDistanceKm / ewmaSpeedKmh) * 3600;
  const baselineTravelSeconds = (remainingDistanceKm / BASELINE_SPEED_KMH) * 3600;
  const trafficDelaySeconds = Math.max(0, travelSeconds - baselineTravelSeconds);
  const expectedDwellSeconds = downstreamStages.length * BASE_DWELL_TIME_SECONDS;
  const totalSeconds = travelSeconds + expectedDwellSeconds + trafficDelaySeconds;
  return {
    ...base,
    etaAvailable: Number.isFinite(totalSeconds),
    etaMinutes: Number.isFinite(totalSeconds) ? Number((totalSeconds / 60).toFixed(2)) : null,
    remainingDistanceKm: Number(remainingDistanceKm.toFixed(3)),
    trafficDelayMinutes: Number((trafficDelaySeconds / 60).toFixed(2)),
    expectedDwellMinutes: Number((expectedDwellSeconds / 60).toFixed(2)),
  };
}

module.exports = { BASELINE_SPEED_KMH, BASE_DWELL_TIME_SECONDS, calculateEta };