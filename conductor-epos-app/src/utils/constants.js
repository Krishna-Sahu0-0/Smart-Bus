export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';
export const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL || 'http://localhost:5000';
export const DEMO_BUS_ID = process.env.EXPO_PUBLIC_DEMO_BUS_ID || 'AP30Z1234';
export const DEMO_ROUTE_ID = process.env.EXPO_PUBLIC_DEMO_ROUTE_ID || 'R-SKLM-SMP-01';
export const DEMO_CONDUCTOR_ID = process.env.EXPO_PUBLIC_CONDUCTOR_ID || 'EMP-8842';
export const DEMO_CONDUCTOR_PIN = process.env.EXPO_PUBLIC_CONDUCTOR_PIN || '4521';
export const SERVICE_NUMBER = process.env.EXPO_PUBLIC_SERVICE_NUMBER || '4521';
export const DEPOT_CODE = process.env.EXPO_PUBLIC_DEPOT_CODE || 'SKLM-1';
export const TELEMETRY_INTERVAL_MS = 3000;
export const PAYMENT_TYPES = ['CASH', 'UPI', 'CARD'];
export const FARE_PER_STAGE = 35;
export const seatStatusLabels = {
  MANY_SEATS_AVAILABLE: { english: 'Seats Available', telugu: 'మంచి సీట్లు ఉన్నాయి' },
  FEW_SEATS_AVAILABLE: { english: 'Few Seats Available', telugu: 'కొద్దిగా సీట్లు ఉన్నాయి' },
  STANDING_ONLY: { english: 'Standing Only / Full', telugu: 'నిలబడే స్థలం మాత్రమే' },
};

export const colors = {
  background: '#F4F6F9',
  header: '#0D5C3A',
  headerDark: '#08472D',
  white: '#FFFFFF',
  ink: '#1F2937',
  muted: '#667085',
  line: '#D7DEE7',
  green: '#0D5C3A',
  greenSoft: '#E7F3ED',
  orange: '#D97706',
  orangeSoft: '#FFF4E5',
  red: '#C62828',
  redSoft: '#FDECEC',
  blue: '#1E3A8A',
};
