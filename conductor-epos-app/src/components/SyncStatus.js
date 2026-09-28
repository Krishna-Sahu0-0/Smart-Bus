import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../utils/constants';

export default function SyncStatus({ status = 'SYNCED', pendingCount = 0, onSyncNow }) {
  const color = status === 'OFFLINE' ? colors.red : status === 'SYNCING' ? colors.amber : status === 'PENDING SYNC' ? colors.amber : colors.green;
  return <View style={styles.row}><Text style={[styles.text, { color }]}>{status}{pendingCount ? ` · ${pendingCount} PENDING` : ''}</Text>{onSyncNow ? <Pressable onPress={onSyncNow} disabled={status === 'SYNCING'}><Text style={styles.action}>SYNC NOW</Text></Pressable> : null}</View>;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  text: { fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  action: { color: colors.amber, fontSize: 12, fontWeight: '900', letterSpacing: 1 },
});