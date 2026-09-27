const turf = require('@turf/turf');
const Stage = require('../models/Stage');

const GEOFENCE_RADIUS_METERS = 150;

async function detectStage(bus, latitude, longitude) {
  const stages = await Stage.find({ routeId: bus.routeId, active: true }).sort({ sequence: 1 }).lean();
  const position = turf.point([longitude, latitude]);
  const currentStage = stages.find((stage) => stage.stageId === bus.currentStageId);
  const currentSequence = currentStage ? currentStage.sequence : 0;
  const candidates = stages
    .filter((stage) => stage.sequence >= currentSequence)
    .map((stage) => ({
      stage,
      distanceMeters: turf.distance(position, turf.point([stage.longitude, stage.latitude]), { units: 'meters' }),
    }))
    .filter(({ distanceMeters }) => distanceMeters <= GEOFENCE_RADIUS_METERS)
    .sort((left, right) => left.distanceMeters - right.distanceMeters);

  return candidates.length ? candidates[0].stage : null;
}

async function processGeofence(bus, latitude, longitude) {
  const stage = await detectStage(bus, latitude, longitude);
  if (!stage) return { stageArrived: false, insideGeofence: false };
  if (stage.stageId === bus.currentStageId) return { stageArrived: false, insideGeofence: true };

  const currentStage = await Stage.findOne({ stageId: bus.currentStageId, routeId: bus.routeId }).lean();
  if (currentStage && stage.sequence < currentStage.sequence) return { stageArrived: false, insideGeofence: false };
  return {
    stageArrived: true,
    insideGeofence: true,
    stage: { stageId: stage.stageId, stageName: stage.stageName, sequence: stage.sequence },
  };
}

module.exports = { GEOFENCE_RADIUS_METERS, detectStage, processGeofence };