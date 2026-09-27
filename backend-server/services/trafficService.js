const LOW_SPEED_THRESHOLD_KMH = 5;
const TRAFFIC_DELAY_THRESHOLD_MS = 5 * 60 * 1000;
const EWMA_GAMMA = 0.3;

const runtimeStates = new Map();

function getState(busId) {
  if (!runtimeStates.has(busId)) runtimeStates.set(busId, { lowSpeedSince: null, lastTimestamp: null });
  return runtimeStates.get(busId);
}

function processTraffic({ bus, speedKmh, timestamp, insideGeofence }) {
  const state = getState(bus.busId);
  const previousStatus = bus.status;
  const previousEwma = Number.isFinite(bus.ewmaSpeedKmh) ? bus.ewmaSpeedKmh : null;
  const ewmaSpeedKmh = previousEwma === null
    ? Math.max(0, speedKmh)
    : Math.max(0, EWMA_GAMMA * speedKmh + (1 - EWMA_GAMMA) * previousEwma);
  bus.ewmaSpeedKmh = ewmaSpeedKmh;
  state.lastTimestamp = timestamp;

  const anomalyCondition = speedKmh < LOW_SPEED_THRESHOLD_KMH && !insideGeofence;
  if (!anomalyCondition) {
    state.lowSpeedSince = null;
    if (bus.status === 'TRAFFIC_DELAY') {
      bus.status = 'OPERATIONAL';
      bus.trafficDelaySince = null;
    }
  } else if (!state.lowSpeedSince) {
    state.lowSpeedSince = timestamp;
  } else if (timestamp.getTime() - state.lowSpeedSince.getTime() > TRAFFIC_DELAY_THRESHOLD_MS && bus.status === 'OPERATIONAL') {
    bus.status = 'TRAFFIC_DELAY';
    bus.trafficDelaySince = timestamp;
  }

  return {
    status: bus.status,
    previousStatus,
    statusChanged: previousStatus !== bus.status,
    ewmaSpeedKmh,
    lowSpeedSince: state.lowSpeedSince,
    elapsedLowSpeedSeconds: state.lowSpeedSince ? Math.max(0, (timestamp - state.lowSpeedSince) / 1000) : 0,
    anomalyCondition,
  };
}

function resetTrafficState(busId) {
  runtimeStates.delete(busId);
}

module.exports = {
  EWMA_GAMMA,
  LOW_SPEED_THRESHOLD_KMH,
  TRAFFIC_DELAY_THRESHOLD_MS,
  processTraffic,
  resetTrafficState,
};