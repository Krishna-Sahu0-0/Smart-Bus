import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Header from '../components/Header';
import ConnectionStatus from '../components/ConnectionStatus';
import SyncStatus from '../components/SyncStatus';
import PrimaryButton from '../components/PrimaryButton';
import { apiService } from '../services/apiService';
import { logout } from '../services/authService';
import { colors, DEMO_BUS_ID, DEMO_ROUTE_ID } from '../utils/constants';
import { requestForegroundLocation, startForegroundTracking, toTelemetryPosition } from '../services/locationService';
import { useEposRealtime } from '../context/EposRealtimeContext';

export default function EposShellScreen({ navigation, session, onLogout }) {
  const [bus, setBus] = useState(null);
  const [stages, setStages] = useState([]);
  const [online, setOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [gpsStatus, setGpsStatus] = useState('PERMISSION REQUIRED');
  const [gpsPosition, setGpsPosition] = useState(null);
  const [lastTelemetrySent, setLastTelemetrySent] = useState(null);
  const [telemetryError, setTelemetryError] = useState('');
  const [permissionCanAskAgain, setPermissionCanAskAgain] = useState(true);
  const [gpsRetry, setGpsRetry] = useState(0);
  const [eta, setEta] = useState(null);
  const watcherStop = useRef(null);
  const { realtimeStatus, telemetry, stageArrival, occupancy: liveOccupancy, eta: liveEta, serviceStatus, breakdownAlert } = useEposRealtime();

  useEffect(() => {
    let active = true;
    Promise.all([apiService.get(`/buses/${DEMO_BUS_ID}`), apiService.get(`/stages/${DEMO_ROUTE_ID}`)])
      .then(([busResponse, stagesResponse]) => { if (active) { setBus(busResponse.bus); setStages(stagesResponse.stages); setOnline(true); } })
      .catch(() => { if (active) setOnline(false); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    async function beginTelemetry() {
      const permission = await requestForegroundLocation().catch(() => ({ granted: false, canAskAgain: true }));
      if (!active) return;
      setPermissionCanAskAgain(permission.canAskAgain);
      if (!permission.granted) {
        setGpsStatus(permission.canAskAgain ? 'PERMISSION REQUIRED' : 'DISABLED');
        return;
      }
      setGpsStatus('ENABLED');
      const stopWatcher = await startForegroundTracking(async (location) => {
        if (!active) return;
        const position = toTelemetryPosition(location);
        setGpsPosition(position);
        try {
          const response = await apiService.sendTelemetry({ busId: DEMO_BUS_ID, routeId: DEMO_ROUTE_ID, latitude: position.latitude, longitude: position.longitude, speedKmh: position.speedKmh, timestamp: position.timestamp });
          if (!active) return;
          setLastTelemetrySent(new Date().toISOString());
          setTelemetryError('');
          setBus((current) => ({ ...current, currentLatitude: response.telemetry.latitude, currentLongitude: response.telemetry.longitude, currentSpeedKmh: response.telemetry.speedKmh, currentStageId: response.telemetry.currentStageId, status: response.traffic.status }));
          setEta(response.eta);
        } catch (error) {
          if (active) setTelemetryError(error.message);
        }
      }, (error) => { if (active) { setGpsStatus('DISABLED'); setTelemetryError(error.message || 'GPS unavailable.'); } });
      if (active) watcherStop.current = stopWatcher;
      else stopWatcher();
    }
    beginTelemetry();
    return () => { active = false; if (watcherStop.current) watcherStop.current(); };
  }, [gpsRetry]);

  useEffect(() => {
    if (!telemetry) return;
    setGpsPosition({ latitude: telemetry.latitude, longitude: telemetry.longitude, speedKmh: telemetry.speedKmh, speedAvailable: true, timestamp: telemetry.timestamp });
    setLastTelemetrySent(telemetry.timestamp);
    setBus((current) => current ? { ...current, currentLatitude: telemetry.latitude, currentLongitude: telemetry.longitude, currentSpeedKmh: telemetry.speedKmh, currentStageId: telemetry.currentStageId } : current);
  }, [telemetry]);

  useEffect(() => {
    if (stageArrival) setBus((current) => current ? { ...current, currentStageId: stageArrival.stageId } : current);
  }, [stageArrival]);

  useEffect(() => {
    if (liveOccupancy) setBus((current) => current ? { ...current, occupancy: liveOccupancy.occupancy, availableSeats: liveOccupancy.availableSeats } : current);
  }, [liveOccupancy]);

  useEffect(() => {
    if (liveEta) setEta(liveEta);
  }, [liveEta]);

  useEffect(() => {
    if (serviceStatus?.status) setBus((current) => current ? { ...current, status: serviceStatus.status } : current);
  }, [serviceStatus]);

  async function signOut() { await logout(); onLogout(); navigation.replace('Login'); }

  const currentStage = stages.find((stage) => stage.stageId === bus?.currentStageId);
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.topbar}><Header title="E-POS TERMINAL" subtitle={`CONDUCTOR · ${session?.staffId || 'DEMO'}`} /><View style={styles.connectionGroup}><ConnectionStatus online={online} /><ConnectionStatus online={realtimeStatus === 'LIVE'} status={realtimeStatus} /></View></View>
      <View style={styles.statusbar}><SyncStatus /><Pressable onPress={signOut}><Text style={styles.signout}>SIGN OUT</Text></Pressable></View>
      <View style={styles.identity}><Text style={styles.label}>BUS</Text><Text style={styles.value}>{bus?.busId || DEMO_BUS_ID}</Text><Text style={styles.label}>ROUTE</Text><Text style={styles.value}>{bus?.routeId || DEMO_ROUTE_ID}</Text><Text style={styles.label}>CURRENT STAGE</Text><Text style={styles.value}>{currentStage?.stageName || bus?.currentStageId || 'UNAVAILABLE'}</Text></View>
      {bus?.status === 'VEHICLE_DISABLED' ? <View style={styles.disabledBanner}><Text style={styles.disabledTitle}>VEHICLE DISABLED</Text><Text style={styles.disabledText}>Ticketing is paused until the backend clears the incident.</Text></View> : null}
      {breakdownAlert ? <View style={styles.alertBanner}><Text style={styles.alertTitle}>BREAKDOWN ALERT</Text><Text style={styles.alertText}>{breakdownAlert.category || 'SERVICE INCIDENT'} · BACKEND ALERT ACTIVE</Text></View> : null}
      {loading ? <ActivityIndicator color={colors.amber} size="large" /> : null}
      <View style={styles.metrics}><View><Text style={styles.label}>OCCUPANCY</Text><Text style={styles.metric}>{bus?.occupancy ?? '—'}</Text></View><View><Text style={styles.label}>AVAILABLE SEATS</Text><Text style={styles.metric}>{bus?.availableSeats ?? '—'}</Text></View><View><Text style={styles.label}>SERVICE</Text><Text style={[styles.metric, bus?.status === 'VEHICLE_DISABLED' && { color: colors.red }]}>{bus?.status || 'UNKNOWN'}</Text></View></View>
      <View style={styles.telemetry}><View style={styles.telemetryHeading}><Text style={styles.telemetryTitle}>GPS / TELEMETRY</Text><Text style={[styles.gpsStatus, gpsStatus === 'ENABLED' ? styles.enabled : styles.disabled]}>{gpsStatus}</Text></View><Text style={styles.telemetryLine}>LATITUDE: {gpsPosition?.latitude?.toFixed(6) || '—'}</Text><Text style={styles.telemetryLine}>LONGITUDE: {gpsPosition?.longitude?.toFixed(6) || '—'}</Text><Text style={styles.telemetryLine}>SPEED: {gpsPosition ? `${gpsPosition.speedKmh.toFixed(1)} km/h${gpsPosition.speedAvailable ? '' : ' · device speed unavailable'}` : '—'}</Text><Text style={styles.telemetryLine}>LAST SENT: {lastTelemetrySent ? new Date(lastTelemetrySent).toLocaleTimeString() : '—'}</Text>{telemetryError ? <Text style={styles.telemetryError}>{telemetryError}</Text> : null}{gpsStatus === 'PERMISSION REQUIRED' && permissionCanAskAgain ? <Pressable onPress={() => setGpsRetry((value) => value + 1)}><Text style={styles.settings}>REQUEST LOCATION PERMISSION</Text></Pressable> : null}{gpsStatus === 'DISABLED' || (gpsStatus === 'PERMISSION REQUIRED' && !permissionCanAskAgain) ? <Pressable onPress={Linking.openSettings}><Text style={styles.settings}>OPEN LOCATION SETTINGS</Text></Pressable> : null}</View>
      <View style={styles.liveState}><Text style={styles.label}>BACKEND STATE</Text><Text style={styles.telemetryLine}>CURRENT STAGE: {currentStage?.stageName || bus?.currentStageId || 'UNAVAILABLE'}</Text><Text style={styles.telemetryLine}>SERVICE: {bus?.status || 'UNKNOWN'}</Text><Text style={styles.telemetryLine}>ETA: {eta?.etaAvailable ? `${eta.etaMinutes} min` : 'UNAVAILABLE'}</Text></View>
      <PrimaryButton label="OPEN TICKETING" onPress={() => navigation.navigate('Ticketing')} disabled={!online || bus?.status === 'VEHICLE_DISABLED'} />
      <View style={styles.coming}><Text style={styles.comingTitle}>TERMINAL READY</Text><Text style={styles.comingText}>Ticketing controls will be added after this launch milestone is verified on Expo Go.</Text></View>
      <PrimaryButton label="SIGN OUT" onPress={signOut} tone="red" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ink },
  content: { padding: 22, paddingTop: 62, gap: 18 },
  topbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  connectionGroup: { alignItems: 'flex-end', gap: 8 },
  statusbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.line, paddingVertical: 12 },
  signout: { color: colors.amber, fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  identity: { backgroundColor: colors.panel, borderRadius: 10, padding: 20, gap: 5 },
  label: { color: colors.muted, fontSize: 11, fontWeight: '900', letterSpacing: 1.2 },
  value: { color: colors.white, fontSize: 22, fontWeight: '900', marginBottom: 12 },
  metrics: { backgroundColor: colors.panelRaised, borderRadius: 10, padding: 18, gap: 15 },
  metric: { color: colors.green, fontSize: 24, fontWeight: '900', marginTop: 4 },
  telemetry: { backgroundColor: colors.panel, borderRadius: 10, padding: 18, gap: 8 },
  telemetryHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  telemetryTitle: { color: colors.amber, fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  gpsStatus: { fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  enabled: { color: colors.green },
  disabled: { color: colors.red },
  telemetryLine: { color: colors.white, fontSize: 14, fontWeight: '700' },
  telemetryError: { color: colors.red, fontSize: 13, fontWeight: '700' },
  settings: { color: colors.amber, fontSize: 12, fontWeight: '900', letterSpacing: 0.8, marginTop: 4 },
  liveState: { borderWidth: 1, borderColor: colors.line, borderRadius: 10, padding: 18, gap: 8 },
  disabledBanner: { backgroundColor: '#5A2025', borderRadius: 9, padding: 14, gap: 4 },
  disabledTitle: { color: colors.red, fontSize: 16, fontWeight: '900' },
  disabledText: { color: colors.white, fontSize: 13, fontWeight: '700' },
  alertBanner: { backgroundColor: '#4A3820', borderRadius: 9, padding: 14, gap: 4 },
  alertTitle: { color: colors.amber, fontSize: 16, fontWeight: '900' },
  alertText: { color: colors.white, fontSize: 13, fontWeight: '700' },
  coming: { borderWidth: 1, borderColor: colors.line, borderRadius: 10, padding: 18, gap: 8 },
  comingTitle: { color: colors.amber, fontSize: 15, fontWeight: '900', letterSpacing: 1 },
  comingText: { color: colors.muted, fontSize: 14, lineHeight: 21 },
});