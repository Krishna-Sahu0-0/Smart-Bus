import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, occupancyTranslations, serviceTranslations } from '../utils/constants';

function serviceCopy(status) {
  return serviceTranslations[status] || { english: status || 'Unknown service state', telugu: 'స్థితి అందుబాటులో లేదు' };
}

function occupancyCopy(status) {
  return occupancyTranslations[status] || { english: 'Occupancy unavailable', telugu: 'ఆక్యుపెన్సీ సమాచారం లేదు' };
}

export default function BusCard({ bus, selected, onPress }) {
  const service = serviceCopy(bus.status);
  const occupancy = occupancyCopy(bus.occupancyStatus);
  return <Pressable onPress={onPress} style={[styles.card, selected && styles.selected]}><View style={styles.heading}><View><Text style={styles.busId}>{bus.busId}</Text><Text style={styles.route}>{bus.routeId}</Text></View><Text style={[styles.service, bus.status === 'VEHICLE_DISABLED' && styles.disabled]}>{service.english}</Text></View><View style={styles.metrics}><View><Text style={styles.label}>STAGE</Text><Text style={styles.value}>{bus.currentStageId || '—'}</Text></View><View><Text style={styles.label}>SEATS</Text><Text style={styles.value}>{bus.availableSeats ?? '—'}</Text></View><View><Text style={styles.label}>ETA</Text><Text style={styles.value}>{bus.eta?.etaAvailable ? `${bus.eta.etaMinutes} min` : '—'}</Text></View></View><Text style={styles.occupancy}>{bus.occupancy ?? '—'} occupied · {occupancy.english}</Text><Text style={styles.telugu}>{occupancy.telugu}</Text></Pressable>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, borderRadius: 12, padding: 16, gap: 11 },
  selected: { borderColor: colors.blue, borderWidth: 2 },
  heading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 },
  busId: { color: colors.ink, fontSize: 19, fontWeight: '900' },
  route: { color: colors.muted, fontSize: 12, fontWeight: '800', marginTop: 3 },
  service: { color: colors.green, fontSize: 12, fontWeight: '900', textAlign: 'right' },
  disabled: { color: colors.red },
  metrics: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { color: colors.muted, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  value: { color: colors.text, fontSize: 16, fontWeight: '900', marginTop: 3 },
  occupancy: { color: colors.text, fontSize: 13, fontWeight: '800' },
  telugu: { color: colors.muted, fontSize: 13 },
});
