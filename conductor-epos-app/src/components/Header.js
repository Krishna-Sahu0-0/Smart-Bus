import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../utils/constants';

export default function Header({ title, subtitle }) {
  return <View style={styles.wrap}><Text style={styles.title}>{title}</Text><Text style={styles.subtitle}>{subtitle}</Text></View>;
}

const styles = StyleSheet.create({
  wrap: { gap: 4 },
  title: { color: colors.white, fontSize: 27, fontWeight: '900' },
  subtitle: { color: colors.muted, fontSize: 14, fontWeight: '600' },
});