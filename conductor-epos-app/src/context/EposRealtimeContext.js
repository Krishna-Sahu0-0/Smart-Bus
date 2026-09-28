import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { DEMO_BUS_ID } from '../utils/constants';
import { subscribeToSocket } from '../services/socketService';
import { apiService } from '../services/apiService';
import { configureSyncService, getSyncState, subscribeToSync, syncQueuedTransactions } from '../services/syncService';

const EposRealtimeContext = createContext(null);

function belongsToDemoBus(payload) {
  return payload?.busId === DEMO_BUS_ID;
}

export function EposRealtimeProvider({ session, children }) {
  const [realtimeStatus, setRealtimeStatus] = useState(session ? 'CONNECTING' : 'OFFLINE');
  const [syncState, setSyncState] = useState(getSyncState());
  const [lastSyncEvent, setLastSyncEvent] = useState(null);
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
    function handleRealtimeStatus(status) {
      setRealtimeStatus(status);
      if (status === 'LIVE') syncQueuedTransactions();
    }

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
    }, handleRealtimeStatus);
  }, [session]);

  useEffect(() => {
    if (!session) return undefined;
    configureSyncService(apiService);
    const unsubscribe = subscribeToSync((nextState, event) => {
      setSyncState(nextState);
      if (event) setLastSyncEvent(event);
    });
    syncQueuedTransactions();
    return unsubscribe;
  }, [session]);

  const value = useMemo(() => ({
    realtimeStatus,
    syncState,
    lastSyncEvent,
    syncNow: syncQueuedTransactions,
    ...events,
  }), [events, lastSyncEvent, realtimeStatus, syncState]);
  return <EposRealtimeContext.Provider value={value}>{children}</EposRealtimeContext.Provider>;
}

export function useEposRealtime() {
  return useContext(EposRealtimeContext);
}
