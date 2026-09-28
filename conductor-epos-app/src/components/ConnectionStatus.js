import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../utils/constants';

export default function ConnectionStatus({ online, status }) {
  const label = status || (online ? 'ONLINE' : 'OFFLINE');
  const color = label === 'LIVE' || (label === 'ONLINE' && online) ? colors.green : label === 'CONNECTING' ? colors.amber : colors.red;
  return <View style={styles.row}><View style={[styles.dot, { backgroundColor: color }]} /><Text style={styles.text}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  text: { color: colors.white, fontSize: 12, fontWeight: '900', letterSpacing: 1 },
});