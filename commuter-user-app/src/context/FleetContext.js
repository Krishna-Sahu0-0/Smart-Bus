import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { apiService } from '../services/apiService';
import { subscribeToSocket } from '../services/socketService';

const FleetContext = createContext(null);

function mergeBus(buses, busId, changes) {
  return buses.map((bus) => bus.busId === busId ? { ...bus, ...changes } : bus);
}

function applyEvent(buses, event, payload) {
  if (!payload?.busId) return buses;
  const bus = buses.find((item) => item.busId === payload.busId);
  if (!bus) return buses;
  let changes = {};
  if (event === 'BUS_TELEMETRY') changes = { currentLatitude: payload.latitude, currentLongitude: payload.longitude, currentSpeedKmh: payload.speedKmh, currentStageId: payload.currentStageId, lastTelemetryAt: payload.timestamp };
  if (event === 'STAGE_ARRIVAL') changes = { currentStageId: payload.stageId };
  if (event === 'OCCUPANCY_UPDATE') changes = payload;
  if (event === 'TRAFFIC_DELAY' || event === 'SERVICE_STATUS') changes = { status: payload.status };
  if (event === 'ETA_UPDATE') changes = { eta: payload };
  return mergeBus(buses, payload.busId, changes);
}

async function hydrateBuses() {
  const response = await apiService.getBuses();
  return Promise.all(response.buses.map(async (bus) => {
    const [occupancyResult, etaResult] = await Promise.allSettled([apiService.getOccupancy(bus.busId), apiService.getEta(bus.busId)]);
    return {
      ...bus,
      ...(occupancyResult.status === 'fulfilled' ? occupancyResult.value.occupancy : {}),
      eta: etaResult.status === 'fulfilled' ? etaResult.value.eta : null,
    };
  }));
}

export function FleetProvider({ children }) {
  const [buses, setBuses] = useState([]);
  const [alerts, setAlerts] = useState({});
  const [selectedBusId, setSelectedBusId] = useState(null);
  const [stages, setStages] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('CONNECTING');
  const [loading, setLoading] = useState(true);
  const [stagesLoading, setStagesLoading] = useState(false);
  const [error, setError] = useState('');

  async function refreshFleet() {
    setLoading(true); setError('');
    try {
      const loadedBuses = await hydrateBuses();
      setBuses(loadedBuses);
      setSelectedBusId((current) => current && loadedBuses.some((bus) => bus.busId === current) ? current : loadedBuses[0]?.busId || null);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshFleet();
    return subscribeToSocket((event, payload) => {
      setBuses((current) => applyEvent(current, event, payload));
      if (event === 'BREAKDOWN_ALERT' || event === 'BREAKDOWN_REPORTED') setAlerts((current) => ({ ...current, [payload.busId]: payload }));
      if (event === 'BREAKDOWN_RESOLVED') setAlerts((current) => { const next = { ...current }; delete next[payload.busId]; return next; });
    }, setConnectionStatus);
  }, []);

  useEffect(() => {
    const selectedBus = buses.find((bus) => bus.busId === selectedBusId);
    if (!selectedBus) return;
    setStagesLoading(true);
    apiService.getStages(selectedBus.routeId).then((response) => setStages(response.stages)).catch(() => setStages([])).finally(() => setStagesLoading(false));
  }, [selectedBusId, buses.find((bus) => bus.busId === selectedBusId)?.routeId]);

  const selectedBus = buses.find((bus) => bus.busId === selectedBusId) || null;
  const value = useMemo(() => ({ buses, alerts, selectedBus, selectedBusId, setSelectedBusId, stages, connectionStatus, loading, stagesLoading, error, refreshFleet }), [alerts, buses, connectionStatus, error, loading, refreshFleet, selectedBus, selectedBusId, stages, stagesLoading]);
  return <FleetContext.Provider value={value}>{children}</FleetContext.Provider>;
}

export function useFleet() {
  return useContext(FleetContext);
}
