export function validateLogin(staffId, pin) {
  if (!staffId.trim()) return 'Enter your staff ID.';
  if (!pin.trim()) return 'Enter your PIN.';
  return null;
}