import { useRef, useState } from 'react';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import Header from '../components/Header';
import PrimaryButton from '../components/PrimaryButton';
import { apiService } from '../services/apiService';
import { colors, DEMO_BUS_ID, DEMO_ROUTE_ID } from '../utils/constants';

function parsePassPayload(rawValue, journey) {
  let payload;
  try { payload = JSON.parse(rawValue); } catch { payload = { passId: rawValue.trim() }; }
  const passId = typeof payload?.passId === 'string' ? payload.passId.trim() : '';
  if (!passId) throw new Error('QR payload does not contain a pass ID.');
  const fromStage = payload.fromStage || journey.fromStage;
  const toStage = payload.toStage || journey.toStage;
  if (!fromStage || !toStage) throw new Error('Select an origin and destination before scanning.');
  return { busId: DEMO_BUS_ID, routeId: DEMO_ROUTE_ID, passId, fromStage, toStage };
}

export default function QRScannerScreen({ navigation, route }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const scanLocked = useRef(false);
  const journey = route.params?.journey || {};

  async function handleBarcodeScanned({ data }) {
    if (scanLocked.current || processing) return;
    scanLocked.current = true;
    setProcessing(true); setError('');
    try {
      const response = await apiService.scanPass(parsePassPayload(data, journey));
      navigation.navigate('Ticketing', { passResult: response });
    } catch (scanError) {
      setError(scanError.message);
      setProcessing(false);
      setTimeout(() => { scanLocked.current = false; }, 1200);
    }
  }

  if (!permission) return <View style={styles.center}><ActivityIndicator color={colors.amber} size="large" /></View>;
  if (!permission.granted) return <View style={styles.screen}><Header title="SCAN QR PASS" subtitle="Camera access is required for pass validation" /><View style={styles.permission}><Text style={styles.permissionTitle}>CAMERA UNAVAILABLE</Text><Text style={styles.permissionText}>{permission.canAskAgain ? 'Allow camera access to scan a passenger pass.' : 'Camera access was denied. Enable it in phone settings, then return here.'}</Text><PrimaryButton label={permission.canAskAgain ? 'ALLOW CAMERA' : 'OPEN SETTINGS'} onPress={permission.canAskAgain ? requestPermission : Linking.openSettings} /><PrimaryButton label="BACK TO TICKETING" onPress={() => navigation.goBack()} tone="red" /></View></View>;

  return <View style={styles.screen}><View style={styles.header}><Header title="SCAN QR PASS" subtitle="Hold the pass inside the frame" /><Pressable onPress={() => navigation.goBack()}><Text style={styles.back}>CANCEL</Text></Pressable></View><View style={styles.cameraFrame}><CameraView style={styles.camera} facing="back" barcodeScannerSettings={{ barcodeTypes: ['qr'] }} onBarcodeScanned={processing ? undefined : handleBarcodeScanned} /><View pointerEvents="none" style={styles.scanBox} /></View>{processing ? <Text style={styles.processing}>VALIDATING PASS…</Text> : null}{error ? <View style={styles.errorBox}><Text style={styles.errorTitle}>PASS INVALID</Text><Text style={styles.errorText}>{error}</Text><PrimaryButton label="SCAN AGAIN" onPress={() => { setError(''); scanLocked.current = false; }} /></View> : null}<PrimaryButton label="BACK TO TICKETING" onPress={() => navigation.goBack()} tone="red" /></View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ink, padding: 22, paddingTop: 62, gap: 18 },
  center: { flex: 1, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  back: { color: colors.amber, fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  cameraFrame: { height: 390, overflow: 'hidden', borderRadius: 10, borderWidth: 2, borderColor: colors.amber, backgroundColor: '#000' },
  camera: { flex: 1 },
  scanBox: { position: 'absolute', width: 220, height: 220, borderWidth: 3, borderColor: colors.amber, alignSelf: 'center', top: 85 },
  processing: { color: colors.amber, textAlign: 'center', fontSize: 16, fontWeight: '900' },
  permission: { flex: 1, justifyContent: 'center', gap: 18 },
  permissionTitle: { color: colors.red, fontSize: 22, fontWeight: '900' },
  permissionText: { color: colors.white, fontSize: 16, lineHeight: 23 },
  errorBox: { backgroundColor: '#5A2025', borderRadius: 9, padding: 16, gap: 10 },
  errorTitle: { color: colors.red, fontSize: 18, fontWeight: '900' },
  errorText: { color: colors.white, fontSize: 14, lineHeight: 20 },
});