export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';
export const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL || 'http://localhost:5000';
export const DEMO_BUS_ID = process.env.EXPO_PUBLIC_DEMO_BUS_ID || 'AP11Z1234';
export const DEMO_ROUTE_ID = process.env.EXPO_PUBLIC_DEMO_ROUTE_ID || 'R-VJA-GNT-01';
export const DEMO_CONDUCTOR_ID = process.env.EXPO_PUBLIC_CONDUCTOR_ID || 'COND-001';
export const PAYMENT_TYPES = ['CASH', 'UPI', 'CARD'];
export const seatStatusLabels = {
  MANY_SEATS_AVAILABLE: { english: 'Seats Available', telugu: 'మంచి సీట్లు ఉన్నాయి' },
  FEW_SEATS_AVAILABLE: { english: 'Few Seats Available', telugu: 'కొద్దిగా సీట్లు ఉన్నాయి' },
  STANDING_ONLY: { english: 'Standing Only / Full', telugu: 'నిలబడే స్థలం మాత్రమే' },
};

export const colors = {
  ink: '#101820',
  panel: '#182732',
  panelRaised: '#223746',
  white: '#F4F7F8',
  muted: '#9FB1BA',
  amber: '#FFB000',
  green: '#54D18A',
  red: '#FF5D5D',
  line: '#35505F',
};