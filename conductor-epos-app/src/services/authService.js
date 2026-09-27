import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEMO_CONDUCTOR_ID } from '../utils/constants';

const SESSION_KEY = '@smartbus/conductor-session';

export async function login(staffId, pin) {
  // The backend has no authentication endpoint yet. This is a local demo session, not PIN verification.
  if (staffId.trim() !== DEMO_CONDUCTOR_ID || !pin.trim()) throw new Error('Use the configured demo staff ID and a non-empty demo PIN.');
  const session = { staffId: DEMO_CONDUCTOR_ID, role: 'CONDUCTOR', signedInAt: new Date().toISOString() };
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export async function getSession() {
  const saved = await AsyncStorage.getItem(SESSION_KEY);
  return saved ? JSON.parse(saved) : null;
}

export async function logout() {
  await AsyncStorage.removeItem(SESSION_KEY);
}