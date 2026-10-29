// ─────────────────────────────────────────────────────────────
// SLLAS Shared System Configuration & Reference Data
// ─────────────────────────────────────────────────────────────

export interface ProvinceData {
  id: string;
  name: string;
  code: string;
  capital: string;
  districts: string[];
}

export const ZIMBABWE_PROVINCES: ProvinceData[] = [
  {
    id: 'ZW-HA',
    name: 'Harare',
    code: 'HA',
    capital: 'Harare',
    districts: ['Harare Urban', 'Chitungwiza', 'Epworth'],
  },
  {
    id: 'ZW-BU',
    name: 'Bulawayo',
    code: 'BU',
    capital: 'Bulawayo',
    districts: ['Bulawayo Urban'],
  },
  {
    id: 'ZW-MA',
    name: 'Manicaland',
    code: 'MA',
    capital: 'Mutare',
    districts: ['Buhera', 'Chimanimani', 'Chipinge', 'Makoni', 'Mutare', 'Mutasa', 'Nyanga'],
  },
  {
    id: 'ZW-MC',
    name: 'Mashonaland Central',
    code: 'MC',
    capital: 'Bindura',
    districts: ['Bindura', 'Guruve', 'Mazowe', 'Mbire', 'Mount Darwin', 'Muzarabani', 'Rushinga', 'Shamva'],
  },
  {
    id: 'ZW-ME',
    name: 'Mashonaland East',
    code: 'ME',
    capital: 'Marondera',
    districts: ['Chikomba', 'Goromonzi', 'Marondera', 'Mudzi', 'Murehwa', 'Mutoko', 'Sekewards', 'Uzumba-Maramba-Pfungwe', 'Wedza'],
  },
  {
    id: 'ZW-MW',
    name: 'Mashonaland West',
    code: 'MW',
    capital: 'Chinhoyi',
    districts: ['Chegutu', 'Hurungwe', 'Kariba', 'Makonde', 'Mhondoro-Ngezi', 'Sanyati', 'Zvimba'],
  },
  {
    id: 'ZW-MV',
    name: 'Masvingo',
    code: 'MV',
    capital: 'Masvingo',
    districts: ['Bikita', 'Chiredzi', 'Chivi', 'Gutu', 'Masvingo', 'Mwenezi', 'Zaka'],
  },
  {
    id: 'ZW-MN',
    name: 'Matabeleland North',
    code: 'MN',
    capital: 'Lupane',
    districts: ['Binga', 'Bubi', 'Hwange', 'Lupane', 'Nkayi', 'Tsholotsho', 'Umguza'],
  },
  {
    id: 'ZW-MS',
    name: 'Matabeleland South',
    code: 'MS',
    capital: 'Gwanda',
    districts: ['Beitbridge', 'Bulilima', 'Gwanda', 'Insiza', 'Mangwe', 'Matobo', 'Umzingwane'],
  },
  {
    id: 'ZW-MI',
    name: 'Midlands',
    code: 'MI',
    capital: 'Gweru',
    districts: ['Chirumhanzu', 'Gokwe North', 'Gokwe South', 'Gweru', 'Kwekwe', 'Mberengwa', 'Shurugwi', 'Zvishavane'],
  },
];

export const NATURAL_REGIONS_INFO = {
  REGION_I: {
    name: 'Specialised and Diversified Farming Region',
    rainfallMm: '> 1000mm',
    description: 'High rainfall, low temperatures, suitable for forestry, tea, coffee, fruit, and intensive livestock.',
  },
  REGION_II: {
    name: 'Intensive Farming Region',
    rainfallMm: '750 - 1000mm',
    description: 'Reliable rainfall, suitable for intensive crop production (tobacco, maize, soy, wheat) and livestock.',
  },
  REGION_III: {
    name: 'Semi-Intensive Farming Region',
    rainfallMm: '650 - 800mm',
    description: 'Moderate rainfall with infrequent heavy falls and fair dry spells. Suitable for semi-intensive farming, drought-tolerant crops.',
  },
  REGION_IV: {
    name: 'Semi-Extensive Farming Region',
    rainfallMm: '450 - 650mm',
    description: 'Low and erratic rainfall, periodic seasonal droughts. Suitable for drought-resistant crops, sorghum, millet, and livestock.',
  },
  REGION_V: {
    name: 'Extensive Farming Region',
    rainfallMm: '< 450mm',
    description: 'Very low, erratic rainfall, high temperatures. Suitable for extensive cattle and game ranching, drought-tolerant feeds.',
  },
} as const;

export const SYSTEM_CONFIG = {
  PAGINATION_DEFAULT_LIMIT: 20,
  PAGINATION_MAX_LIMIT: 100,
  MAX_FILE_SIZE_BYTES: 25 * 1024 * 1024, // 25 MB
  ALLOWED_DOCUMENT_MIME_TYPES: [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/geo+json',
    'application/vnd.google-earth.kml+xml',
  ],
  LEASE_EXPIRY_NOTIFICATION_DAYS: [180, 90, 60, 30, 7, 0],
  REVIEW_SLA_DAYS: 14,
  INSPECTION_SLA_DAYS: 30,
  APPROVAL_SLA_DAYS: 7,
  SPATIAL_SRID: 4326, // WGS 84
  ZIMBABWE_BBOX: {
    minLng: 25.2,
    minLat: -22.4,
    maxLng: 33.1,
    maxLat: -15.6,
  },
  AUTH: {
    ACCESS_TOKEN_TTL_SECONDS: 900, // 15 mins
    REFRESH_TOKEN_TTL_SECONDS: 86400 * 7, // 7 days
    COOKIE_NAME: 'sllas_session',
  },
} as const;
