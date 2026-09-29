import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../utils/constants';

export default function ConnectionStatus({ status }) {
  const color = status === 'LIVE' ? colors.green : status === 'CONNECTING' ? colors.amber : colors.red;
  return <View style={styles.row}><View style={[styles.dot, { backgroundColor: color }]} /><Text style={[styles.text, { color }]}>{status}</Text></View>;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  dot: { width: 9, height: 9, borderRadius: 5 },
  text: { fontSize: 12, fontWeight: '900', letterSpacing: 1 },
});
