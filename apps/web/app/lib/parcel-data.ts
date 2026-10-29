// ─────────────────────────────────────────────────────────────
// SLLAS Land Registry — Parcel Data & Business Logic
// Pre-seeded with authentic Zimbabwean provincial & land data
// ─────────────────────────────────────────────────────────────

import { ParcelStatus, NaturalRegion, SoilType } from '@sllas/contracts';

export interface GeoPolygon {
  type: 'Polygon';
  coordinates: number[][][]; // GeoJSON format: [[[lng, lat], ...]]
}

export interface ParcelRecord {
  id: string;
  referenceNumber: string;
  name: string;
  province: string;
  district: string;
  ward: string;
  landCategory: string;
  areaHectares: number;
  status: ParcelStatus;
  boundary: GeoPolygon;
  centroid: { lat: number; lng: number };
  naturalRegion: NaturalRegion;
  soilType: SoilType;
  waterSources: string[];
  roadAccess: boolean;
  electricityAccess: boolean;
  gridProximityKm: number;
  terrain: string;
  currentUse: string;
  permittedUses: string[];
  knownRestrictions?: string;
  registeredByUserId: string;
  registeredByUserName: string;
  registeredAt: string;
  verification?: {
    verifiedByUserId: string;
    verifiedByUserName: string;
    verifiedAt: string;
    decision: 'VERIFY' | 'RETURN_FOR_CORRECTION';
    notes: string;
  };
}

export interface ProvinceStat {
  code: string;
  name: string;
  totalParcels: number;
  idleHectares: number;
  availableHectares: number;
  pendingCount: number;
  center: { lat: number; lng: number };
}

export const ZIMBABWE_PROVINCES: ProvinceStat[] = [
  { code: 'HRE', name: 'Harare', totalParcels: 14, idleHectares: 3200, availableHectares: 1850, pendingCount: 3, center: { lat: -17.8252, lng: 31.0335 } },
  { code: 'BYO', name: 'Bulawayo', totalParcels: 9, idleHectares: 2450, availableHectares: 1200, pendingCount: 1, center: { lat: -20.1500, lng: 28.5833 } },
  { code: 'MAN', name: 'Manicaland', totalParcels: 28, idleHectares: 12400, availableHectares: 8900, pendingCount: 5, center: { lat: -19.0000, lng: 32.5000 } },
  { code: 'MEC', name: 'Mashonaland Central', totalParcels: 35, idleHectares: 18200, availableHectares: 11400, pendingCount: 4, center: { lat: -16.7667, lng: 31.0833 } },
  { code: 'ME', name: 'Mashonaland East', totalParcels: 42, idleHectares: 21600, availableHectares: 15300, pendingCount: 6, center: { lat: -18.2000, lng: 31.8000 } },
  { code: 'MW', name: 'Mashonaland West', totalParcels: 48, idleHectares: 34100, availableHectares: 24500, pendingCount: 8, center: { lat: -17.5000, lng: 29.8000 } },
  { code: 'MAS', name: 'Masvingo', totalParcels: 31, idleHectares: 26800, availableHectares: 17200, pendingCount: 3, center: { lat: -20.0744, lng: 30.8328 } },
  { code: 'MN', name: 'Matabeleland North', totalParcels: 22, idleHectares: 38400, availableHectares: 29100, pendingCount: 4, center: { lat: -19.0000, lng: 27.5000 } },
  { code: 'MS', name: 'Matabeleland South', totalParcels: 19, idleHectares: 29500, availableHectares: 21800, pendingCount: 2, center: { lat: -21.0000, lng: 29.0000 } },
  { code: 'MID', name: 'Midlands', totalParcels: 38, idleHectares: 25700, availableHectares: 18400, pendingCount: 7, center: { lat: -19.4500, lng: 29.8167 } },
];

export const INITIAL_PARCELS: ParcelRecord[] = [
  {
    id: 'prc-001',
    referenceNumber: 'HRE-2026-0041',
    name: 'Pomona Innovation & Light Industrial Zone',
    province: 'Harare',
    district: 'Harare North',
    ward: 'Ward 42',
    landCategory: 'State Land',
    areaHectares: 48.5,
    status: ParcelStatus.AVAILABLE,
    boundary: {
      type: 'Polygon',
      coordinates: [[
        [31.080, -17.740],
        [31.095, -17.740],
        [31.095, -17.755],
        [31.080, -17.755],
        [31.080, -17.740],
      ]],
    },
    centroid: { lat: -17.7475, lng: 31.0875 },
    naturalRegion: NaturalRegion.II,
    soilType: SoilType.CLAY,
    waterSources: ['Municipal Borehole', 'Gwebi River Tributary'],
    roadAccess: true,
    electricityAccess: true,
    gridProximityKm: 0.5,
    terrain: 'Gentle Slope',
    currentUse: 'Idle Fallov',
    permittedUses: ['Agro-Processing', 'Logistics Hub', 'Cold Storage'],
    registeredByUserId: 'usr-officer-01',
    registeredByUserName: 'Officer T. Moyo',
    registeredAt: '2026-09-12T09:30:00Z',
    verification: {
      verifiedByUserId: 'usr-officer-02',
      verifiedByUserName: 'Senior Officer C. Chidzero',
      verifiedAt: '2026-09-15T14:20:00Z',
      decision: 'VERIFY',
      notes: 'Boundary survey confirmed with Surveyor General sheet SG-2025/110. Water rights verified.',
    },
  },
  {
    id: 'prc-002',
    referenceNumber: 'MW-2026-0189',
    name: 'Banket Estate South Parcel B',
    province: 'Mashonaland West',
    district: 'Zvimba',
    ward: 'Ward 18',
    landCategory: 'Commercial Farmland',
    areaHectares: 215.0,
    status: ParcelStatus.PENDING_VERIFICATION,
    boundary: {
      type: 'Polygon',
      coordinates: [[
        [30.380, -17.410],
        [30.410, -17.410],
        [30.410, -17.435],
        [30.380, -17.435],
        [30.380, -17.410],
      ]],
    },
    centroid: { lat: -17.4225, lng: 30.3950 },
    naturalRegion: NaturalRegion.II,
    soilType: SoilType.LOAM,
    waterSources: ['Manyame Catchment Dam', '2 Perennial Streams'],
    roadAccess: true,
    electricityAccess: true,
    gridProximityKm: 1.2,
    terrain: 'Flat Arable',
    currentUse: 'Idle Savanna Grassland',
    permittedUses: ['Horticulture', 'Grain Farming', 'Seed Multiplication'],
    registeredByUserId: 'usr-officer-01',
    registeredByUserName: 'Officer T. Moyo',
    registeredAt: '2026-10-18T11:15:00Z',
  },
  {
    id: 'prc-003',
    referenceNumber: 'MID-2026-0092',
    name: 'Kwekwe East Grazing & Agro-Forestry Tract',
    province: 'Midlands',
    district: 'Kwekwe',
    ward: 'Ward 7',
    landCategory: 'Resettlement Area',
    areaHectares: 420.0,
    status: ParcelStatus.AVAILABLE,
    boundary: {
      type: 'Polygon',
      coordinates: [[
        [29.850, -18.900],
        [29.890, -18.900],
        [29.890, -18.940],
        [29.850, -18.940],
        [29.850, -18.900],
      ]],
    },
    centroid: { lat: -18.9200, lng: 29.8700 },
    naturalRegion: NaturalRegion.III,
    soilType: SoilType.SANDY,
    waterSources: ['Sebakwe River Pipeline (2km)', 'Groundwater'],
    roadAccess: true,
    electricityAccess: false,
    gridProximityKm: 3.5,
    terrain: 'Undulating Savanna',
    currentUse: 'Underutilized Grazing',
    permittedUses: ['Livestock Grazing', 'Solar Farm', 'Pasture Production'],
    registeredByUserId: 'usr-officer-03',
    registeredByUserName: 'Officer F. Sibanda',
    registeredAt: '2026-08-04T08:00:00Z',
    verification: {
      verifiedByUserId: 'usr-officer-02',
      verifiedByUserName: 'Senior Officer C. Chidzero',
      verifiedAt: '2026-08-10T11:45:00Z',
      decision: 'VERIFY',
      notes: 'No traditional leadership boundary disputes. Approved for renewable and ranching lease.',
    },
  },
  {
    id: 'prc-004',
    referenceNumber: 'MAN-2026-0054',
    name: 'Chimanimani Plateau Tea & Avocado Parcel',
    province: 'Manicaland',
    district: 'Chimanimani',
    ward: 'Ward 12',
    landCategory: 'State Land',
    areaHectares: 85.0,
    status: ParcelStatus.PENDING_VERIFICATION,
    boundary: {
      type: 'Polygon',
      coordinates: [[
        [32.820, -19.780],
        [32.850, -19.780],
        [32.850, -19.810],
        [32.820, -19.810],
        [32.820, -19.780],
      ]],
    },
    centroid: { lat: -19.7950, lng: 32.8350 },
    naturalRegion: NaturalRegion.I,
    soilType: SoilType.LOAM,
    waterSources: ['High Rainfall Zone (>1000mm/yr)', 'Mountain Springs'],
    roadAccess: true,
    electricityAccess: true,
    gridProximityKm: 0.8,
    terrain: 'Highland Ridge',
    currentUse: 'Idle Former Timber Strip',
    permittedUses: ['Macadamia Orchards', 'Tea/Coffee', 'Eco-Tourism'],
    registeredByUserId: 'usr-officer-02',
    registeredByUserName: 'Senior Officer C. Chidzero',
    registeredAt: '2026-10-21T15:00:00Z',
  },
  {
    id: 'prc-005',
    referenceNumber: 'MAS-2026-0112',
    name: 'Chiredzi Sugarcane & Irrigation Block 4',
    province: 'Masvingo',
    district: 'Chiredzi',
    ward: 'Ward 22',
    landCategory: 'State Land',
    areaHectares: 310.0,
    status: ParcelStatus.AVAILABLE,
    boundary: {
      type: 'Polygon',
      coordinates: [[
        [31.550, -21.020],
        [31.590, -21.020],
        [31.590, -21.050],
        [31.550, -21.050],
        [31.550, -21.020],
      ]],
    },
    centroid: { lat: -21.0350, lng: 31.5700 },
    naturalRegion: NaturalRegion.V,
    soilType: SoilType.CLAY,
    waterSources: ['Tugwi-Mukosi Canal Access (Allocated 15ML)', 'Runde River'],
    roadAccess: true,
    electricityAccess: true,
    gridProximityKm: 1.0,
    terrain: 'Lowveld Flat',
    currentUse: 'Uncleared Bushland',
    permittedUses: ['Sugarcane', 'Citrus Irrigation', 'Wheat/Barley'],
    registeredByUserId: 'usr-officer-01',
    registeredByUserName: 'Officer T. Moyo',
    registeredAt: '2026-07-22T10:00:00Z',
    verification: {
      verifiedByUserId: 'usr-officer-03',
      verifiedByUserName: 'Officer F. Sibanda',
      verifiedAt: '2026-07-28T09:15:00Z',
      decision: 'VERIFY',
      notes: 'Water allocation permit verified with ZINWA. Ready for high-impact irrigation leasing.',
    },
  },
  {
    id: 'prc-006',
    referenceNumber: 'BYO-2026-0017',
    name: 'Umguza Peri-Urban Logistics Gateway',
    province: 'Bulawayo',
    district: 'Umguza Border',
    ward: 'Ward 2',
    landCategory: 'Municipal Council Land',
    areaHectares: 62.0,
    status: ParcelStatus.DRAFT,
    boundary: {
      type: 'Polygon',
      coordinates: [[
        [28.520, -20.080],
        [28.545, -20.080],
        [28.545, -20.100],
        [28.520, -20.100],
        [28.520, -20.080],
      ]],
    },
    centroid: { lat: -20.0900, lng: 28.5325 },
    naturalRegion: NaturalRegion.IV,
    soilType: SoilType.MIXED,
    waterSources: ['Bulawayo City Water Pipeline'],
    roadAccess: true,
    electricityAccess: true,
    gridProximityKm: 0.2,
    terrain: 'Graded Flat',
    currentUse: 'Vacant Council Reserve',
    permittedUses: ['Inland Container Depot', 'Industrial Warehousing'],
    registeredByUserId: 'usr-officer-01',
    registeredByUserName: 'Officer T. Moyo',
    registeredAt: '2026-10-23T16:45:00Z',
  },
];

// Helper to calculate approximate polygon area in Hectares
export function calculatePolygonAreaHa(coords: number[][]): number {
  if (coords.length < 3) return 0;
  // Planar shoelace with spherical latitude correction
  let total = 0;
  for (let i = 0; i < coords.length - 1; i++) {
    const [x1, y1] = coords[i];
    const [x2, y2] = coords[i + 1];
    total += (x1 * y2) - (x2 * y1);
  }
  const meanLat = coords.reduce((acc, c) => acc + c[1], 0) / coords.length;
  const metersPerDegLat = 111132.954;
  const metersPerDegLng = 111412.84 * Math.cos((meanLat * Math.PI) / 180);
  const sqMeters = Math.abs(total / 2) * metersPerDegLat * metersPerDegLng;
  return Math.round((sqMeters / 10000) * 10) / 10;
}

// Helper to compute centroid
export function calculateCentroid(coords: number[][]): { lat: number; lng: number } {
  const pts = coords.slice(0, coords.length - 1);
  const lat = pts.reduce((sum, p) => sum + p[1], 0) / pts.length;
  const lng = pts.reduce((sum, p) => sum + p[0], 0) / pts.length;
  return {
    lat: Math.round(lat * 10000) / 10000,
    lng: Math.round(lng * 10000) / 10000,
  };
}

// Bounding box overlap check
export function checkBoundingBoxOverlap(
  poly1: number[][],
  poly2: number[][],
): boolean {
  const minX1 = Math.min(...poly1.map(p => p[0]));
  const maxX1 = Math.max(...poly1.map(p => p[0]));
  const minY1 = Math.min(...poly1.map(p => p[1]));
  const maxY1 = Math.max(...poly1.map(p => p[1]));

  const minX2 = Math.min(...poly2.map(p => p[0]));
  const maxX2 = Math.max(...poly2.map(p => p[0]));
  const minY2 = Math.min(...poly2.map(p => p[1]));
  const maxY2 = Math.max(...poly2.map(p => p[1]));

  return !(maxX1 <= minX2 || minX1 >= maxX2 || maxY1 <= minY2 || minY1 >= maxY2);
}
