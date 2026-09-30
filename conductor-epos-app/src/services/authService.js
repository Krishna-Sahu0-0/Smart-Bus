import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEMO_CONDUCTOR_ID, DEMO_CONDUCTOR_PIN } from '../utils/constants';

const SESSION_KEY = '@smartbus/conductor-session';

export async function login(staffId, pin) {
  if (staffId.trim() !== DEMO_CONDUCTOR_ID || pin.trim() !== DEMO_CONDUCTOR_PIN) {
    throw new Error('Invalid demo staff ID or PIN.');
  }
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
