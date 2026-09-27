import { Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '../utils/constants';

export default function PrimaryButton({ label, onPress, disabled = false, tone = 'amber' }) {
  return (
    <Pressable disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.button, tone === 'red' && styles.red, disabled && styles.disabled, pressed && !disabled && styles.pressed]}>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { minHeight: 58, borderRadius: 8, backgroundColor: colors.amber, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  red: { backgroundColor: colors.red },
  disabled: { opacity: 0.45 },
  pressed: { transform: [{ scale: 0.98 }] },
  label: { color: colors.ink, fontSize: 18, fontWeight: '800', letterSpacing: 0.4 },
});