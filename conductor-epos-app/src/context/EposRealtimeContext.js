import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { DEMO_BUS_ID } from '../utils/constants';
import { subscribeToSocket } from '../services/socketService';

const EposRealtimeContext = createContext(null);

function belongsToDemoBus(payload) {
  return payload?.busId === DEMO_BUS_ID;
}

export function EposRealtimeProvider({ session, children }) {
  const [realtimeStatus, setRealtimeStatus] = useState(session ? 'CONNECTING' : 'OFFLINE');
  const [events, setEvents] = useState({
    telemetry: null,
    stageArrival: null,
    occupancy: null,
    eta: null,
    serviceStatus: null,
    breakdownAlert: null,
  });

  useEffect(() => {
    if (!session) {
      setRealtimeStatus('OFFLINE');
      return undefined;
    }

    setRealtimeStatus('CONNECTING');
    return subscribeToSocket((event, payload) => {
      if (!belongsToDemoBus(payload)) return;
      setEvents((current) => {
        if (event === 'BUS_TELEMETRY') return { ...current, telemetry: payload };
        if (event === 'STAGE_ARRIVAL') return { ...current, stageArrival: payload };
        if (event === 'OCCUPANCY_UPDATE') return { ...current, occupancy: payload };
        if (event === 'ETA_UPDATE') return { ...current, eta: payload };
        if (event === 'SERVICE_STATUS' || event === 'TRAFFIC_DELAY') return { ...current, serviceStatus: payload };
        if (event === 'BREAKDOWN_ALERT' || event === 'BREAKDOWN_REPORTED') return { ...current, breakdownAlert: payload };
        if (event === 'BREAKDOWN_RESOLVED') return { ...current, breakdownAlert: null };
        return current;
      });
    }, setRealtimeStatus);
  }, [session]);

  const value = useMemo(() => ({ realtimeStatus, ...events }), [events, realtimeStatus]);
  return <EposRealtimeContext.Provider value={value}>{children}</EposRealtimeContext.Provider>;
}

export function useEposRealtime() {
  return useContext(EposRealtimeContext);
}
