import { StyleSheet, Text, View } from 'react-native';
import { colors, seatStatusLabels } from '../utils/constants';

export default function OccupancyCard({ occupancy }) {
  const labels = seatStatusLabels[occupancy?.occupancyStatus] || { english: 'Unavailable', telugu: 'స్థితి అందుబాటులో లేదు' };
  const occupancyValue = occupancy?.occupancy;
  const capacity = occupancy?.capacity ?? 50;
  const tone = occupancyValue > capacity ? styles.overCapacity : occupancyValue >= 40 ? styles.nearCapacity : styles.normal;
  return <View style={styles.card}><View style={styles.numbers}><View><Text style={styles.label}>OCCUPIED / CAPACITY</Text><Text style={[styles.number, tone]}>{occupancyValue ?? '—'} / {capacity}</Text></View><View><Text style={styles.label}>AVAILABLE</Text><Text style={styles.number}>{occupancy?.availableSeats ?? '—'}</Text></View></View><Text style={[styles.status, tone]}>{labels.english}</Text><Text style={styles.telugu}>{labels.telugu}</Text></View>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.panelRaised, borderRadius: 10, padding: 18, gap: 10 },
  numbers: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { color: colors.muted, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  number: { color: colors.white, fontSize: 30, fontWeight: '900', marginTop: 4 },
  status: { color: colors.green, fontSize: 16, fontWeight: '900' },
  normal: { color: colors.green },
  nearCapacity: { color: colors.amber },
  overCapacity: { color: colors.red },
  telugu: { color: colors.white, fontSize: 15, fontWeight: '700' },
});