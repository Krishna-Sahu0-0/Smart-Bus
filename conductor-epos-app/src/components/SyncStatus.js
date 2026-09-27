import { StyleSheet, Text } from 'react-native';
import { colors } from '../utils/constants';

export default function SyncStatus({ label = 'SYNCED' }) {
  return <Text style={styles.text}>{label}</Text>;
}

const styles = StyleSheet.create({ text: { color: colors.green, fontSize: 12, fontWeight: '900', letterSpacing: 1 } });