import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import Header from '../components/Header';
import PrimaryButton from '../components/PrimaryButton';
import { colors } from '../utils/constants';
import { login } from '../services/authService';
import { validateLogin } from '../utils/validators';

export default function LoginScreen({ onAuthenticated }) {
  const [staffId, setStaffId] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    const validationError = validateLogin(staffId, pin);
    if (validationError) return setError(validationError);
    setBusy(true); setError('');
    try { onAuthenticated(await login(staffId, pin)); } catch (loginError) { setError(loginError.message); } finally { setBusy(false); }
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.mark}><Text style={styles.brand}>SMARTBUS</Text><Text style={styles.kicker}>CONDUCTOR E-POS</Text></View>
      <View style={styles.panel}>
        <Header title="Sign in" subtitle="Local demo session · backend auth will be connected later" />
        <TextInput autoCapitalize="characters" autoCorrect={false} placeholder="STAFF ID" placeholderTextColor={colors.muted} value={staffId} onChangeText={setStaffId} style={styles.input} />
        <TextInput placeholder="PIN" placeholderTextColor={colors.muted} secureTextEntry value={pin} onChangeText={setPin} style={styles.input} />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <PrimaryButton label={busy ? 'SIGNING IN…' : 'ENTER TERMINAL'} onPress={submit} disabled={busy} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ink, justifyContent: 'center', padding: 24, gap: 34 },
  mark: { borderLeftWidth: 5, borderLeftColor: colors.amber, paddingLeft: 16 },
  brand: { color: colors.white, fontSize: 36, fontWeight: '900', letterSpacing: 2 },
  kicker: { color: colors.amber, fontSize: 13, fontWeight: '900', letterSpacing: 2 },
  panel: { backgroundColor: colors.panel, borderRadius: 10, padding: 22, gap: 16 },
  input: { minHeight: 58, borderRadius: 7, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.ink, color: colors.white, paddingHorizontal: 16, fontSize: 17, fontWeight: '700' },
  error: { color: colors.red, fontSize: 14, fontWeight: '700' },
});