import { useMemo } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import ConnectionStatus from '../components/ConnectionStatus';
import BusCard from '../components/BusCard';
import { useFleet } from '../context/FleetContext';
import { colors, occupancyTranslations, serviceTranslations } from '../utils/constants';

function serviceCopy(status) {
  return serviceTranslations[status] || { english: status || 'Unknown service state', telugu: 'స్థితి అందుబాటులో లేదు' };
}

function occupancyCopy(status) {
  return occupancyTranslations[status] || { english: 'Occupancy unavailable', telugu: 'ఆక్యుపెన్సీ సమాచారం లేదు' };
}

function formatTime(value) {
  if (!value) return 'Not available';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Not available' : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function FleetScreen() {
  const { buses, alerts, selectedBus, selectedBusId, setSelectedBusId, stages, connectionStatus, loading, stagesLoading, error, refreshFleet } = useFleet();
  const currentStage = stages.find((stage) => stage.stageId === selectedBus?.currentStageId);
  const selectedAlert = selectedBus ? alerts[selectedBus.busId] : null;
  const service = serviceCopy(selectedBus?.status);
  const occupancy = occupancyCopy(selectedBus?.occupancyStatus);
  const hasFleet = buses.length > 0;
  const routeLabel = useMemo(() => selectedBus?.routeId || 'Select a bus', [selectedBus?.routeId]);

  return <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
    <View style={styles.header}><View><Text style={styles.brand}>SMARTBUS</Text><Text style={styles.subtitle}>Live public transport</Text></View><ConnectionStatus status={connectionStatus} /></View>
    <View style={styles.hero}><Text style={styles.heroEyebrow}>TODAY'S SERVICE</Text><Text style={styles.heroTitle}>Find your bus in real time.</Text><Text style={styles.heroText}>Live locations, capacity and service updates from the SmartBus network.</Text></View>
    <View style={styles.sectionHeading}><Text style={styles.sectionTitle}>LIVE BUSES</Text><Pressable onPress={refreshFleet}><Text style={styles.refresh}>REFRESH</Text></Pressable></View>
    {loading && !hasFleet ? <ActivityIndicator color={colors.blue} size="large" /> : null}
    {error && !hasFleet ? <View style={styles.errorBox}><Text style={styles.errorTitle}>FLEET UNAVAILABLE</Text><Text style={styles.errorText}>{error}</Text><Pressable onPress={refreshFleet}><Text style={styles.refresh}>TRY AGAIN</Text></Pressable></View> : null}
    <View style={styles.list}>{buses.map((bus) => <BusCard key={bus.busId} bus={bus} selected={bus.busId === selectedBusId} onPress={() => setSelectedBusId(bus.busId)} />)}</View>
    <View style={styles.sectionHeading}><Text style={styles.sectionTitle}>ROUTE / STAGE INFORMATION</Text><Text style={styles.routeName}>{routeLabel}</Text></View>
    <View style={styles.stagePanel}>{stagesLoading ? <ActivityIndicator color={colors.blue} /> : stages.length ? stages.map((stage) => <View key={stage.stageId} style={[styles.stageRow, stage.stageId === selectedBus?.currentStageId && styles.currentStage]}><View style={styles.sequence}><Text style={styles.sequenceText}>{stage.sequence}</Text></View><View><Text style={styles.stageName}>{stage.stageName}</Text>{stage.stageId === selectedBus?.currentStageId ? <Text style={styles.currentLabel}>CURRENT STAGE</Text> : null}</View></View>) : <Text style={styles.empty}>Select a bus to view its route stages.</Text>}</View>
    <View style={styles.sectionHeading}><Text style={styles.sectionTitle}>SELECTED BUS DETAILS</Text></View>
    {selectedBus ? <View style={styles.details}><View style={styles.detailHeader}><View><Text style={styles.detailBus}>{selectedBus.busId}</Text><Text style={styles.detailRoute}>{selectedBus.routeId}</Text></View><View style={[styles.statusBadge, selectedBus.status === 'VEHICLE_DISABLED' && styles.statusBadgeDisabled]}><Text style={styles.statusBadgeText}>{service.english}</Text></View></View>{selectedAlert ? <View style={styles.alert}><Text style={styles.alertTitle}>BUS SERVICE ALERT</Text><Text style={styles.alertText}>Backend incident: {selectedAlert.category || 'SERVICE ALERT'} · {selectedAlert.status || 'OPEN'}</Text><Text style={styles.alertTelugu}>ఈ బస్సులో సేవా హెచ్చరిక ఉంది</Text></View> : null}<View style={styles.detailGrid}><View><Text style={styles.label}>CURRENT STAGE</Text><Text style={styles.detailValue}>{currentStage?.stageName || selectedBus.currentStageId || 'Not available'}</Text></View><View><Text style={styles.label}>SERVICE</Text><Text style={styles.detailValue}>{service.english}</Text><Text style={styles.telugu}>{service.telugu}</Text></View><View><Text style={styles.label}>OCCUPANCY</Text><Text style={styles.detailValue}>{selectedBus.occupancy ?? '—'} / {selectedBus.capacity ?? '—'}</Text><Text style={styles.telugu}>{occupancy.english} · {occupancy.telugu}</Text></View><View><Text style={styles.label}>AVAILABLE SEATS</Text><Text style={styles.detailValue}>{selectedBus.availableSeats ?? '—'}</Text></View><View><Text style={styles.label}>ETA</Text><Text style={styles.detailValue}>{selectedBus.eta?.etaAvailable ? `${selectedBus.eta.etaMinutes} min` : 'Not available'}</Text></View><View><Text style={styles.label}>LAST TELEMETRY</Text><Text style={styles.detailValue}>{formatTime(selectedBus.lastTelemetryAt)}</Text></View><View><Text style={styles.label}>LATITUDE</Text><Text style={styles.detailValue}>{selectedBus.currentLatitude ?? '—'}</Text></View><View><Text style={styles.label}>LONGITUDE</Text><Text style={styles.detailValue}>{selectedBus.currentLongitude ?? '—'}</Text></View></View></View> : <View style={styles.emptyDetails}><Text style={styles.empty}>Choose a bus above to see live details.</Text></View>}
    <Text style={styles.footer}>SmartBus live data is provided by the operations backend.</Text>
  </ScrollView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.sky },
  content: { padding: 20, paddingTop: 58, gap: 18 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  brand: { color: colors.ink, fontSize: 26, fontWeight: '900', letterSpacing: 2 },
  subtitle: { color: colors.muted, fontSize: 13, fontWeight: '700', marginTop: 3 },
  hero: { backgroundColor: colors.navy, borderRadius: 16, padding: 20, gap: 8 },
  heroEyebrow: { color: colors.cyan, fontSize: 11, fontWeight: '900', letterSpacing: 1.4 },
  heroTitle: { color: colors.white, fontSize: 27, lineHeight: 32, fontWeight: '900' },
  heroText: { color: '#D9EDF8', fontSize: 14, lineHeight: 21 },
  sectionHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 },
  sectionTitle: { color: colors.ink, fontSize: 13, fontWeight: '900', letterSpacing: 1.4 },
  routeName: { color: colors.muted, fontSize: 12, fontWeight: '800' },
  refresh: { color: colors.blue, fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  list: { gap: 10 },
  errorBox: { backgroundColor: colors.redSoft, borderRadius: 12, padding: 16, gap: 7 },
  errorTitle: { color: colors.red, fontSize: 15, fontWeight: '900' },
  errorText: { color: colors.text, lineHeight: 20 },
  stagePanel: { backgroundColor: colors.white, borderRadius: 12, borderWidth: 1, borderColor: colors.line, padding: 15, gap: 4 },
  stageRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 8, borderRadius: 8 },
  currentStage: { backgroundColor: colors.greenSoft },
  sequence: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.sky, alignItems: 'center', justifyContent: 'center' },
  sequenceText: { color: colors.blue, fontWeight: '900' },
  stageName: { color: colors.text, fontSize: 15, fontWeight: '800' },
  currentLabel: { color: colors.green, fontSize: 10, fontWeight: '900', letterSpacing: 1, marginTop: 2 },
  details: { backgroundColor: colors.white, borderRadius: 12, borderWidth: 1, borderColor: colors.line, padding: 17, gap: 16 },
  detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  detailBus: { color: colors.ink, fontSize: 23, fontWeight: '900' },
  detailRoute: { color: colors.muted, fontWeight: '800', marginTop: 3 },
  statusBadge: { backgroundColor: colors.greenSoft, borderRadius: 20, paddingHorizontal: 11, paddingVertical: 7 },
  statusBadgeDisabled: { backgroundColor: colors.redSoft },
  statusBadgeText: { color: colors.green, fontSize: 11, fontWeight: '900' },
  alert: { backgroundColor: colors.redSoft, borderRadius: 10, padding: 12, gap: 4 },
  alertTitle: { color: colors.red, fontSize: 14, fontWeight: '900', letterSpacing: 1 },
  alertText: { color: colors.text, fontSize: 13, fontWeight: '800' },
  alertTelugu: { color: colors.red, fontSize: 13 },
  detailGrid: { gap: 14 },
  label: { color: colors.muted, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  detailValue: { color: colors.text, fontSize: 16, fontWeight: '800', marginTop: 3 },
  telugu: { color: colors.muted, fontSize: 12, marginTop: 2 },
  emptyDetails: { backgroundColor: colors.white, borderRadius: 12, padding: 18 },
  empty: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  footer: { color: colors.muted, textAlign: 'center', fontSize: 12, lineHeight: 18, paddingVertical: 8 },
});
