export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';
export const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL || 'http://localhost:5000';

export const colors = {
  ink: '#102A43',
  navy: '#173F5F',
  sky: '#EAF6FF',
  blue: '#2D8CDB',
  cyan: '#8ED8E8',
  white: '#FFFFFF',
  text: '#183B56',
  muted: '#6B8499',
  line: '#D8E6EF',
  green: '#168B62',
  greenSoft: '#E6F7EF',
  amber: '#B56B00',
  amberSoft: '#FFF3D6',
  red: '#C83D4B',
  redSoft: '#FFE8EB',
};

export const serviceTranslations = {
  OPERATIONAL: { english: 'Operational', telugu: 'సేవ అందుబాటులో ఉంది' },
  TRAFFIC_DELAY: { english: 'Traffic delay', telugu: 'ట్రాఫిక్ ఆలస్యం' },
  VEHICLE_DISABLED: { english: 'Vehicle disabled', telugu: 'బస్సు సేవలో లేదు' },
};

export const occupancyTranslations = {
  MANY_SEATS_AVAILABLE: { english: 'Seats available', telugu: 'సీట్లు అందుబాటులో ఉన్నాయి' },
  FEW_SEATS_AVAILABLE: { english: 'Few seats available', telugu: 'కొన్ని సీట్లు మాత్రమే ఉన్నాయి' },
  STANDING_ONLY: { english: 'Standing only / full', telugu: 'నిలబడే స్థలం మాత్రమే' },
  NEAR_CAPACITY: { english: 'Near capacity', telugu: 'సీట్లు దాదాపు నిండాయి' },
  OVER_CAPACITY: { english: 'OVER CAPACITY', telugu: 'సామర్థ్యాన్ని మించింది' },
};
