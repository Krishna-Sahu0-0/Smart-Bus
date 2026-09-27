import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Header from '../components/Header';
import ConnectionStatus from '../components/ConnectionStatus';
import SyncStatus from '../components/SyncStatus';
import PrimaryButton from '../components/PrimaryButton';
import { apiService } from '../services/apiService';
import { logout } from '../services/authService';
import { colors, DEMO_BUS_ID, DEMO_ROUTE_ID } from '../utils/constants';

export default function EposShellScreen({ navigation, session, onLogout }) {
  const [bus, setBus] = useState(null);
  const [stages, setStages] = useState([]);
  const [online, setOnline] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([apiService.get(`/buses/${DEMO_BUS_ID}`), apiService.get(`/stages/${DEMO_ROUTE_ID}`)])
      .then(([busResponse, stagesResponse]) => { if (active) { setBus(busResponse.bus); setStages(stagesResponse.stages); setOnline(true); } })
      .catch(() => { if (active) setOnline(false); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function signOut() { await logout(); onLogout(); navigation.replace('Login'); }

  const currentStage = stages.find((stage) => stage.stageId === bus?.currentStageId);
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.topbar}><Header title="E-POS TERMINAL" subtitle={`CONDUCTOR · ${session?.staffId || 'DEMO'}`} /><ConnectionStatus online={online} /></View>
      <View style={styles.statusbar}><SyncStatus /><Pressable onPress={signOut}><Text style={styles.signout}>SIGN OUT</Text></Pressable></View>
      <View style={styles.identity}><Text style={styles.label}>BUS</Text><Text style={styles.value}>{bus?.busId || DEMO_BUS_ID}</Text><Text style={styles.label}>ROUTE</Text><Text style={styles.value}>{bus?.routeId || DEMO_ROUTE_ID}</Text><Text style={styles.label}>CURRENT STAGE</Text><Text style={styles.value}>{currentStage?.stageName || bus?.currentStageId || 'UNAVAILABLE'}</Text></View>
      {loading ? <ActivityIndicator color={colors.amber} size="large" /> : null}
      <View style={styles.metrics}><View><Text style={styles.label}>OCCUPANCY</Text><Text style={styles.metric}>{bus?.occupancy ?? '—'}</Text></View><View><Text style={styles.label}>AVAILABLE SEATS</Text><Text style={styles.metric}>{bus?.availableSeats ?? '—'}</Text></View><View><Text style={styles.label}>SERVICE</Text><Text style={[styles.metric, bus?.status === 'VEHICLE_DISABLED' && { color: colors.red }]}>{bus?.status || 'UNKNOWN'}</Text></View></View>
      <PrimaryButton label="OPEN TICKETING" onPress={() => navigation.navigate('Ticketing')} disabled={!online} />
      <View style={styles.coming}><Text style={styles.comingTitle}>TERMINAL READY</Text><Text style={styles.comingText}>Ticketing controls will be added after this launch milestone is verified on Expo Go.</Text></View>
      <PrimaryButton label="SIGN OUT" onPress={signOut} tone="red" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ink },
  content: { padding: 22, paddingTop: 62, gap: 18 },
  topbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  statusbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.line, paddingVertical: 12 },
  signout: { color: colors.amber, fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  identity: { backgroundColor: colors.panel, borderRadius: 10, padding: 20, gap: 5 },
  label: { color: colors.muted, fontSize: 11, fontWeight: '900', letterSpacing: 1.2 },
  value: { color: colors.white, fontSize: 22, fontWeight: '900', marginBottom: 12 },
  metrics: { backgroundColor: colors.panelRaised, borderRadius: 10, padding: 18, gap: 15 },
  metric: { color: colors.green, fontSize: 24, fontWeight: '900', marginTop: 4 },
  coming: { borderWidth: 1, borderColor: colors.line, borderRadius: 10, padding: 18, gap: 8 },
  comingTitle: { color: colors.amber, fontSize: 15, fontWeight: '900', letterSpacing: 1 },
  comingText: { color: colors.muted, fontSize: 14, lineHeight: 21 },
});