const Stage = require('../models/Stage');

const EARTH_RADIUS_KM = 6371;
const BASELINE_SPEED_KMH = Number(process.env.ETA_BASELINE_SPEED_KMH) || 35;
const BASE_DWELL_TIME_SECONDS = Number(process.env.ETA_BASE_DWELL_SECONDS) || 90;
const MIN_NEAR_STAGE_ETA_MINUTES = 2;
const MAX_ETA_MINUTES = 180;

function haversineDistanceKm(latitude1, longitude1, latitude2, longitude2) {
  const toRadians = (degrees) => (degrees * Math.PI) / 180;
  const phi1 = toRadians(latitude1);
  const phi2 = toRadians(latitude2);
  const deltaPhi = toRadians(latitude2 - latitude1);
  const deltaLambda = toRadians(longitude2 - longitude1);
  const a = Math.sin(deltaPhi / 2) ** 2
    + Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) ** 2;
  return EARTH_RADIUS_KM * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function safeSpeed(bus) {
  const instant = Number(bus.currentSpeedKmh);
  const ewma = Number(bus.ewmaSpeedKmh);
  if (Number.isFinite(ewma) && ewma > 0) return ewma;
  if (Number.isFinite(instant) && instant > 0) return instant;
  return BASELINE_SPEED_KMH;
}

async function calculateEta(bus) {
  const stages = await Stage.find({ routeId: bus.routeId, active: true }).sort({ sequence: 1 }).lean();
  const currentStage = stages.find((stage) => stage.stageId === bus.currentStageId);
  const currentSequence = currentStage ? currentStage.sequence : 0;
  const downstreamStages = stages.filter((stage) => stage.sequence > currentSequence);
  const targetStage = downstreamStages[0] || currentStage;
  const speedKmh = safeSpeed(bus);
  const base = {
    busId: bus.busId,
    etaAvailable: false,
    etaMinutes: null,
    remainingDistanceKm: 0,
    ewmaSpeedKmh: Number.isFinite(Number(bus.ewmaSpeedKmh)) ? Number(bus.ewmaSpeedKmh) : speedKmh,
    trafficDelayMinutes: 0,
    expectedDwellMinutes: 0,
    targetStageId: targetStage ? targetStage.stageId : null,
    targetStageName: targetStage ? targetStage.stageName : null,
  };

  if (bus.status === 'VEHICLE_DISABLED' || !targetStage
    || !Number.isFinite(Number(bus.currentLatitude))
    || !Number.isFinite(Number(bus.currentLongitude))) return base;

  const latitude = Number(bus.currentLatitude);
  const longitude = Number(bus.currentLongitude);
  const distanceToTargetKm = haversineDistanceKm(latitude, longitude, targetStage.latitude, targetStage.longitude);
  const remainingDistanceKm = downstreamStages.length > 0
    ? downstreamStages.reduce((sum, stage, index) => {
      if (index === 0) return sum + distanceToTargetKm;
      const previous = downstreamStages[index - 1];
      return sum + haversineDistanceKm(previous.latitude, previous.longitude, stage.latitude, stage.longitude);
    }, 0)
    : distanceToTargetKm;

  const travelMinutes = (remainingDistanceKm / Math.max(speedKmh, 1)) * 60;
  const dwellMinutes = downstreamStages.length * (BASE_DWELL_TIME_SECONDS / 60);
  const baselineMinutes = (remainingDistanceKm / BASELINE_SPEED_KMH) * 60;
  const trafficDelayMinutes = Math.max(0, travelMinutes - baselineMinutes);
  let etaMinutes = travelMinutes + dwellMinutes;

  if (distanceToTargetKm <= 1) etaMinutes = Math.max(MIN_NEAR_STAGE_ETA_MINUTES, Math.min(3, etaMinutes));
  etaMinutes = Math.min(MAX_ETA_MINUTES, Math.max(MIN_NEAR_STAGE_ETA_MINUTES, etaMinutes));

  return {
    ...base,
    etaAvailable: true,
    etaMinutes: Number(etaMinutes.toFixed(1)),
    remainingDistanceKm: Number(remainingDistanceKm.toFixed(3)),
    trafficDelayMinutes: Number(Math.min(trafficDelayMinutes, MAX_ETA_MINUTES).toFixed(1)),
    expectedDwellMinutes: Number(dwellMinutes.toFixed(1)),
  };
}

module.exports = {
  EARTH_RADIUS_KM,
  BASELINE_SPEED_KMH,
  BASE_DWELL_TIME_SECONDS,
  MAX_ETA_MINUTES,
  haversineDistanceKm,
  calculateEta,
};
