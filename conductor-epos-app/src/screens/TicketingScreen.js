import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Header from '../components/Header';
import ConnectionStatus from '../components/ConnectionStatus';
import PrimaryButton from '../components/PrimaryButton';
import StageSelector from '../components/StageSelector';
import OccupancyCard from '../components/OccupancyCard';
import { apiService } from '../services/apiService';
import { colors, DEMO_BUS_ID, DEMO_ROUTE_ID, PAYMENT_TYPES } from '../utils/constants';
import { validateJourney } from '../utils/validators';

export default function TicketingScreen({ navigation, route }) {
  const [bus, setBus] = useState(null);
  const [occupancy, setOccupancy] = useState(null);
  const [stages, setStages] = useState([]);
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [passengerCount, setPassengerCount] = useState(1);
  const [paymentType, setPaymentType] = useState('CASH');
  const [fareText, setFareText] = useState('0');
  const [online, setOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  async function refresh() {
    setLoading(true); setError('');
    try { const [busResponse, stageResponse, occupancyResponse] = await Promise.all([apiService.getBus(DEMO_BUS_ID), apiService.getStages(DEMO_ROUTE_ID), apiService.getOccupancy(DEMO_BUS_ID)]); setBus(busResponse.bus); setOccupancy(occupancyResponse.occupancy); setStages([...stageResponse.stages].sort((a, b) => a.sequence - b.sequence)); setOnline(true); } catch (requestError) { setOnline(false); setError(requestError.message); } finally { setLoading(false); }
  }

  useEffect(() => { refresh(); }, []);

  useEffect(() => {
    const passResult = route.params?.passResult;
    if (!passResult) return;
    setResult({ kind: 'pass', ticket: passResult.ticket, occupancy: passResult.occupancy });
    setOccupancy(passResult.occupancy);
    setBus((current) => ({ ...current, occupancy: passResult.occupancy.occupancy, availableSeats: passResult.occupancy.availableSeats }));
    navigation.setParams({ passResult: null });
  }, [navigation, route.params?.passResult]);

  const fare = Number(fareText);
  const journeyError = useMemo(() => validateJourney(origin, destination, passengerCount, fare), [origin, destination, passengerCount, fare]);
  const vehicleDisabled = bus?.status === 'VEHICLE_DISABLED';
  const canSubmit = !loading && !busy && !journeyError && online && !vehicleDisabled;

  function selectOrigin(stage) { setOrigin(stage); if (destination && destination.sequence <= stage.sequence) setDestination(null); setResult(null); }
  function selectDestination(stage) { setDestination(stage); setResult(null); }
  function updateCount(delta) { setPassengerCount((count) => Math.max(1, count + delta)); setResult(null); }

  async function submitTicket() {
    if (journeyError) return setError(journeyError);
    setBusy(true); setError(''); setResult(null);
    try { const response = await apiService.createTicket({ busId: DEMO_BUS_ID, routeId: DEMO_ROUTE_ID, ticketType: paymentType, fromStage: origin.stageId, toStage: destination.stageId, passengerCount, fareCharged: fare }); setResult({ kind: 'ticket', ticket: response.ticket, occupancy: response.occupancy }); setOccupancy(response.occupancy); setBus((current) => ({ ...current, occupancy: response.occupancy.occupancy, availableSeats: response.occupancy.availableSeats })); } catch (requestError) { setError(requestError.message); } finally { setBusy(false); }
  }

  async function submitQuickCount() {
    const quickOrigin = origin || stages[0]; const quickDestination = destination || stages[stages.length - 1];
    const quickError = validateJourney(quickOrigin, quickDestination, passengerCount, 0);
    if (quickError) return setError(quickError);
    setBusy(true); setError(''); setResult(null);
    try { const response = await apiService.createQuickPassCount({ busId: DEMO_BUS_ID, routeId: DEMO_ROUTE_ID, fromStage: quickOrigin.stageId, toStage: quickDestination.stageId, passengerCount }); setResult({ kind: 'quick', ticket: response.ticket, occupancy: response.occupancy }); setOccupancy(response.occupancy); setBus((current) => ({ ...current, occupancy: response.occupancy.occupancy, availableSeats: response.occupancy.availableSeats })); } catch (requestError) { setError(requestError.message); } finally { setBusy(false); }
  }

  function openScanner() {
    if (!origin || !destination) return setError('Select an origin and destination before scanning.');
    navigation.navigate('QRScanner', { journey: { fromStage: origin.stageId, toStage: destination.stageId } });
  }

  return <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <View style={styles.topbar}><Header title="TICKETING" subtitle={`${DEMO_BUS_ID} · ${DEMO_ROUTE_ID}`} /><ConnectionStatus online={online} /></View>
    {vehicleDisabled ? <View style={styles.disabledBanner}><Text style={styles.disabledTitle}>VEHICLE DISABLED</Text><Text style={styles.disabledText}>Ticketing is paused until the backend clears the incident.</Text></View> : null}
    <Pressable onPress={() => navigation.goBack()}><Text style={styles.back}>‹ TERMINAL</Text></Pressable>
    {loading ? <ActivityIndicator color={colors.amber} size="large" /> : null}
    <StageSelector label="ORIGIN STAGE" stages={stages} selectedId={origin?.stageId} onSelect={selectOrigin} />
    <StageSelector label="DESTINATION STAGE" stages={stages} selectedId={destination?.stageId} disabledStageId={origin?.stageId} onSelect={selectDestination} />
    <View style={styles.group}><Text style={styles.label}>PASSENGER COUNT</Text><View style={styles.counter}><Pressable disabled={passengerCount <= 1} onPress={() => updateCount(-1)} style={[styles.counterButton, passengerCount <= 1 && styles.disabled]}><Text style={styles.counterSymbol}>−</Text></Pressable><Text style={styles.count}>{passengerCount}</Text><Pressable onPress={() => updateCount(1)} style={styles.counterButton}><Text style={styles.counterSymbol}>+</Text></Pressable></View></View>
    <View style={styles.group}><Text style={styles.label}>PAYMENT TYPE</Text><View style={styles.payments}>{PAYMENT_TYPES.map((type) => <Pressable key={type} onPress={() => setPaymentType(type)} style={[styles.payment, paymentType === type && styles.paymentSelected]}><Text style={[styles.paymentText, paymentType === type && styles.paymentSelectedText]}>{type}</Text></Pressable>)}</View></View>
    <View style={styles.group}><Text style={styles.label}>FARE</Text><TextInput keyboardType="decimal-pad" value={fareText} onChangeText={setFareText} style={styles.input} placeholder="0.00" placeholderTextColor={colors.muted} /></View>
    {journeyError ? <Text style={styles.hint}>{journeyError}</Text> : null}
    {error ? <Text style={styles.error}>{error}</Text> : null}
    <PrimaryButton label={busy ? 'PROCESSING…' : 'CREATE TICKET'} onPress={submitTicket} disabled={!canSubmit} />
    <PrimaryButton label="SCAN QR PASS" onPress={openScanner} disabled={loading || !online || vehicleDisabled || !origin || !destination} />
    <View style={styles.quickPanel}><Text style={styles.quickTitle}>1-TAP PASS COUNTER</Text><Text style={styles.quickText}>Uses the selected journey and records a zero-fare quick passenger count.</Text><PrimaryButton label={busy ? 'PROCESSING…' : 'ADD PASSENGERS'} onPress={submitQuickCount} disabled={busy || !online || loading || vehicleDisabled || !origin || !destination} /></View>
    {result ? <View style={styles.success}><Text style={styles.successTitle}>{result.kind === 'ticket' ? 'TICKET CREATED' : result.kind === 'pass' ? 'PASS ACCEPTED' : 'PASS COUNT RECORDED'}</Text><Text style={styles.successLine}>Ticket ID: {result.ticket.ticketId}</Text><Text style={styles.successLine}>Passengers: {result.ticket.passengerCount} · Fare: {result.ticket.fareCharged}</Text><Text style={styles.successLine}>Type: {result.ticket.ticketType}</Text><OccupancyCard occupancy={result.occupancy} /></View> : null}
    <OccupancyCard occupancy={occupancy} />
  </ScrollView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ink }, content: { padding: 22, paddingTop: 62, gap: 16 }, topbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }, back: { color: colors.amber, fontSize: 14, fontWeight: '900', letterSpacing: 1 }, group: { gap: 8 }, label: { color: colors.muted, fontSize: 12, fontWeight: '900', letterSpacing: 1.1 }, counter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.panel, borderRadius: 8, padding: 8 }, counterButton: { width: 58, height: 52, borderRadius: 7, backgroundColor: colors.amber, alignItems: 'center', justifyContent: 'center' }, counterSymbol: { color: colors.ink, fontSize: 30, fontWeight: '900' }, count: { color: colors.white, fontSize: 30, fontWeight: '900' }, disabled: { opacity: 0.35 }, payments: { flexDirection: 'row', gap: 8 }, payment: { flex: 1, minHeight: 52, borderWidth: 1, borderColor: colors.line, borderRadius: 7, alignItems: 'center', justifyContent: 'center' }, paymentSelected: { backgroundColor: '#3A3322', borderColor: colors.amber }, paymentText: { color: colors.muted, fontWeight: '900' }, paymentSelectedText: { color: colors.amber }, input: { minHeight: 54, backgroundColor: colors.panel, borderColor: colors.line, borderWidth: 1, borderRadius: 7, color: colors.white, fontSize: 18, fontWeight: '800', paddingHorizontal: 14 }, hint: { color: colors.amber, fontWeight: '700' }, error: { color: colors.red, fontWeight: '800' }, disabledBanner: { backgroundColor: '#5A2025', borderRadius: 9, padding: 14, gap: 4 }, disabledTitle: { color: colors.red, fontSize: 16, fontWeight: '900' }, disabledText: { color: colors.white, fontSize: 13, fontWeight: '700' }, quickPanel: { borderWidth: 1, borderColor: colors.line, borderRadius: 9, padding: 16, gap: 10 }, quickTitle: { color: colors.amber, fontSize: 16, fontWeight: '900', letterSpacing: 1 }, quickText: { color: colors.muted, lineHeight: 19 }, success: { backgroundColor: '#173A2A', borderRadius: 9, padding: 16, gap: 7 }, successTitle: { color: colors.green, fontSize: 18, fontWeight: '900' }, successLine: { color: colors.white, fontSize: 14, fontWeight: '700' },
});