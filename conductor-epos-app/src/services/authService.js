import { DEMO_CONDUCTOR_ID, DEMO_CONDUCTOR_PIN } from '../utils/constants';

export async function login(staffId, pin) {
  if (staffId.trim() !== DEMO_CONDUCTOR_ID || pin.trim() !== DEMO_CONDUCTOR_PIN) {
    throw new Error('Invalid demo staff ID or PIN.');
  }
  return { staffId: DEMO_CONDUCTOR_ID, role: 'CONDUCTOR', signedInAt: new Date().toISOString() };
}

export function logout() {}
