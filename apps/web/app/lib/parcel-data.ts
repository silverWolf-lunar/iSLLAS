import { ParcelStatus, NaturalRegion, SoilType, Role, LeaseClassification } from '@sllas/contracts';

export interface GeoPolygon {
  type: 'Polygon';
  coordinates: number[][][];
}

export interface LeaseClassificationInfo {
  code: LeaseClassification;
  shortName: string;
  fullName: string;
  termYears: number;
  termLabel: string;
  statutoryAct: string;
  bankability: string;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
  permittedEnterprises: string[];
}

export const LEASE_CLASSIFICATIONS_METADATA: Record<LeaseClassification, Omit<LeaseClassificationInfo, 'code'>> = {
  [LeaseClassification.A2_COMMERCIAL]: {
    shortName: 'A2 Commercial (99-Year)',
    fullName: 'A2 Commercial Agricultural Lease (99-Year Bankable Leasehold)',
    termYears: 99,
    termLabel: '99-Year Bankable Leasehold',
    statutoryAct: 'Agricultural Land Settlement Act [Cap 20:01] & S.I. 142 of 2026',
    bankability: 'Fully Bankable Collateral Security (Registrable Mortgage Bond under S.I. 142/2026)',
    color: '#4ade80',
    bgColor: 'rgba(34, 197, 94, 0.15)',
    borderColor: 'rgba(34, 197, 94, 0.35)',
    description: 'Medium-to-large scale commercial agricultural production with registrable bankable title security, transferability, and full financial mortgage eligibility.',
    permittedEnterprises: ['Commercial Maize & Wheat', 'Flue-Cured Tobacco', 'Soybeans & Oilseeds', 'Horticultural Crops', 'Commercial Livestock Breeding'],
  },
  [LeaseClassification.A1_SETTLEMENT]: {
    shortName: 'A1 Smallholder Permit',
    fullName: 'A1 Smallholder Settlement Permit / Leasehold',
    termYears: 99,
    termLabel: 'Renewable Permit / 99-Year Smallholder Lease',
    statutoryAct: 'Land Commission Act [Cap 20:29] & Model A1 Settlement Regulations',
    bankability: 'Limited Transferability (Micro-Agri Finance & Joint Contract Farming Eligible)',
    color: '#38bdf8',
    bgColor: 'rgba(14, 165, 233, 0.15)',
    borderColor: 'rgba(14, 165, 233, 0.35)',
    description: 'Smallholder arable settlement plots allocated for household food sovereignty, grain surplus, and sustainable communal agrarian stewardship.',
    permittedEnterprises: ['Household Food Grains', 'Traditional Small Grains', 'Legumes & Groundnuts', 'Free-Range Poultry', 'Small Ruminants'],
  },
  [LeaseClassification.PERI_URBAN_COMMERCIAL]: {
    shortName: 'Peri-Urban Agro-Plot',
    fullName: 'Peri-Urban Commercial Agro-Plot (Intensive Commercial)',
    termYears: 99,
    termLabel: '25 to 99-Year Commercial Agro Lease',
    statutoryAct: 'Agricultural Land Settlement Act [Cap 20:01] - Intensive Peri-Urban Scheme',
    bankability: 'Bankable Commercial Asset (Infrastructure & Intensive Asset Mortgage)',
    color: '#c084fc',
    bgColor: 'rgba(168, 85, 247, 0.15)',
    borderColor: 'rgba(168, 85, 247, 0.35)',
    description: 'High-value intensive agro-plots situated in peri-urban belts for greenhouse horticulture, poultry, floriculture, piggery, and direct city supply.',
    permittedEnterprises: ['Greenhouse Horticulture', 'Floriculture & Export Flowers', 'Commercial Broilers & Layers', 'Intensive Piggery', 'High-Density Citrus & Berry Orchards'],
  },
  [LeaseClassification.RANGELAND_PASTORAL]: {
    shortName: 'Rangeland Pastoral Lease',
    fullName: 'Extensive Rangeland / Livestock Pastoral Lease (99-Year)',
    termYears: 99,
    termLabel: '99-Year Pastoral Leasehold',
    statutoryAct: 'Agricultural Land Settlement Act [Cap 20:01] - Pastoral & Ranching Concessions',
    bankability: 'Bankable Asset (Carrying Capacity & Commercial Herd Asset Value)',
    color: '#fbbf24',
    bgColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.35)',
    description: 'Extensive rangeland grazing and livestock ranching concession suited for drought-resilient cattle paddocks, pastoral management, and game ranching.',
    permittedEnterprises: ['Commercial Beef Breeding & Fattening', 'Dairy Production', 'Goat & Sheep Pastoralism', 'Rangeland Fodder Cultivation', 'Wildlife Game Conservancy'],
  },
  [LeaseClassification.AGRO_INDUSTRIAL]: {
    shortName: 'Agro-Industrial Concession',
    fullName: 'Specialized Agro-Industrial Concession (Joint-Venture)',
    termYears: 99,
    termLabel: '99-Year Long-Term Concession',
    statutoryAct: 'Agricultural Land Settlement Act [Cap 20:01] & Joint-Venture Regulations',
    bankability: 'Tier-1 Bankable Joint-Venture Instrument (Off-Take Financing Covenants)',
    color: '#22d3ee',
    bgColor: 'rgba(6, 182, 212, 0.15)',
    borderColor: 'rgba(6, 182, 212, 0.35)',
    description: 'Specialized export plantation and agro-processing block with long-term capital guarantees and contract processing covenants.',
    permittedEnterprises: ['Sugarcane Estates & Milling', 'Macadamia & Tea Plantations', 'Coffee Estates', 'Commercial Timber & Forestry', 'Agro-Processing & Milling Hubs'],
  },
};

export function determineLeaseClassification(parcel: {
  landCategory?: string;
  areaHectares: number;
  currentUse?: string;
  notes?: string;
  name?: string;
  district?: string;
  naturalRegion?: NaturalRegion | string | null;
  permittedUses?: string[];
}): LeaseClassificationInfo {
  const text = `${parcel.landCategory || ''} ${parcel.currentUse || ''} ${parcel.name || ''} ${parcel.notes || ''} ${(parcel.permittedUses || []).join(' ')}`.toLowerCase();
  const district = (parcel.district || '').toLowerCase();
  const hectares = Number(parcel.areaHectares) || 0;
  const region = (parcel.naturalRegion || '').toString().toUpperCase();

  // 1. Specialized Agro-Industrial Concession
  if (
    text.includes('agro-industrial') ||
    text.includes('sugarcane') ||
    text.includes('cane') ||
    text.includes('macadamia') ||
    text.includes('tea plot') ||
    text.includes('timber') ||
    (text.includes('estate') && (text.includes('processing') || text.includes('milling') || text.includes('cane') || text.includes('industrial')))
  ) {
    return {
      code: LeaseClassification.AGRO_INDUSTRIAL,
      ...LEASE_CLASSIFICATIONS_METADATA[LeaseClassification.AGRO_INDUSTRIAL],
    };
  }

  // 2. Extensive Rangeland / Livestock Pastoral Lease
  if (
    text.includes('livestock') ||
    text.includes('cattle') ||
    text.includes('rangeland') ||
    text.includes('grazing') ||
    text.includes('pastoral') ||
    text.includes('conservancy') ||
    (hectares >= 250 && (region === 'IV' || region === 'V' || region.includes('IV') || region.includes('V')))
  ) {
    return {
      code: LeaseClassification.RANGELAND_PASTORAL,
      ...LEASE_CLASSIFICATIONS_METADATA[LeaseClassification.RANGELAND_PASTORAL],
    };
  }

  // 3. Peri-Urban Commercial Agro-Plot (Intensive)
  const isPeriUrbanDistrict = ['goromonzi', 'mazowe', 'ruwa', 'umguza', 'marondera', 'norton', 'harare', 'bulawayo'].some(d => district.includes(d));
  if (
    (text.includes('horticulture') || text.includes('horticultural') || text.includes('citrus') || text.includes('poultry') || text.includes('peri-urban')) &&
    (isPeriUrbanDistrict || hectares <= 85)
  ) {
    return {
      code: LeaseClassification.PERI_URBAN_COMMERCIAL,
      ...LEASE_CLASSIFICATIONS_METADATA[LeaseClassification.PERI_URBAN_COMMERCIAL],
    };
  }

  // 4. A1 Smallholder Settlement Permit / Lease
  if (
    text.includes('a1') ||
    text.includes('smallholder') ||
    text.includes('villagised') ||
    text.includes('self-contained') ||
    (hectares < 50 && (text.includes('mixed') || text.includes('subsistence') || text.includes('communal') || text.includes('family')))
  ) {
    return {
      code: LeaseClassification.A1_SETTLEMENT,
      ...LEASE_CLASSIFICATIONS_METADATA[LeaseClassification.A1_SETTLEMENT],
    };
  }

  // 5. Default: A2 Commercial Agricultural Lease (99-Year Bankable)
  return {
    code: LeaseClassification.A2_COMMERCIAL,
    ...LEASE_CLASSIFICATIONS_METADATA[LeaseClassification.A2_COMMERCIAL],
  };
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
  leaseClassification: LeaseClassificationInfo;
  boundary: GeoPolygon;
  centroid: { lat: number; lng: number };
  naturalRegion: NaturalRegion | null;
  soilType: SoilType | null;
  waterSources: string[];
  roadAccess: boolean;
  electricityAccess: boolean;
  gridProximityKm: number | null;
  terrain: string;
  currentUse: string;
  permittedUses: string[];
  knownRestrictions?: string | null;
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
  id: string;
  code: string;
  name: string;
  totalParcels: number;
  idleHectares: number;
  availableHectares: number;
  pendingCount: number;
  center?: { lat: number; lng: number };
}

export interface AdminAreaRecord {
  id: string;
  code: string;
  name: string;
  level: string;
  parentId?: string | null;
}

export interface LandCategoryRecord {
  id: string;
  name: string;
}

export function mapApiParcel(parcel: Record<string, any>): ParcelRecord {
  const province = parcel.province?.name ?? parcel.provinceId;
  const district = parcel.district?.name ?? parcel.districtId;
  const category = parcel.landCategory?.name ?? parcel.landCategoryId;
  const registeredBy = parcel.registeredByUser;
  const verifiedBy = parcel.verifiedByUser;

  const permittedUses = parcel.zoningPermittedUses
    ? parcel.zoningPermittedUses.split(',').map((item: string) => item.trim())
    : [];

  const leaseClassification = determineLeaseClassification({
    landCategory: category,
    areaHectares: Number(parcel.areaHectares),
    currentUse: parcel.currentUse,
    notes: parcel.notes,
    name: parcel.notes,
    district,
    naturalRegion: parcel.naturalRegion,
    permittedUses,
  });

  return {
    id: parcel.id,
    referenceNumber: parcel.referenceNumber,
    name: parcel.notes ?? parcel.referenceNumber,
    province,
    district,
    ward: parcel.wardId ?? '',
    landCategory: category,
    areaHectares: Number(parcel.areaHectares),
    status: parcel.status,
    leaseClassification,
    boundary: parcel.boundaryGeojson,
    centroid: { lat: Number(parcel.centroidLat), lng: Number(parcel.centroidLng) },
    naturalRegion: parcel.naturalRegion,
    soilType: parcel.soilType,
    waterSources: parcel.waterSources ? parcel.waterSources.split(',').map((item: string) => item.trim()) : [],
    roadAccess: Boolean(parcel.roadAccess) && parcel.roadAccess !== 'NONE',
    electricityAccess: Boolean(parcel.electricityAvailable),
    gridProximityKm: parcel.gridProximityKm == null ? null : Number(parcel.gridProximityKm),
    terrain: parcel.terrain ?? '',
    currentUse: parcel.currentUse ?? '',
    permittedUses,
    knownRestrictions: parcel.restrictions,
    registeredByUserId: parcel.registeredBy,
    registeredByUserName: registeredBy
      ? `${registeredBy.firstName} ${registeredBy.lastName}`.trim()
      : parcel.registeredBy,
    registeredAt: parcel.createdAt,
    verification: parcel.verifiedBy
      ? {
          verifiedByUserId: parcel.verifiedBy,
          verifiedByUserName: verifiedBy
            ? `${verifiedBy.firstName} ${verifiedBy.lastName}`.trim()
            : parcel.verifiedBy,
          verifiedAt: parcel.verifiedAt,
          decision: parcel.status === ParcelStatus.AVAILABLE ? 'VERIFY' : 'RETURN_FOR_CORRECTION',
          notes: parcel.rejectionReason ?? '',
        }
      : undefined,
  };
}

/**
 * Builds province statistics from the parcels returned by the API so the
 * numbers always reflect what is stored in the database.
 */
export function buildProvinceStats(
  provinces: Array<{ id: string; code: string; name: string }>,
  rawParcels: Array<Record<string, any>>,
): ProvinceStat[] {
  return provinces.map(province => {
    const inProvince = rawParcels.filter(parcel => parcel.provinceId === province.id);
    const hectares = (rows: Array<Record<string, any>>) =>
      rows.reduce((sum, parcel) => sum + (Number(parcel.areaHectares) || 0), 0);
    return {
      id: province.id,
      code: province.code,
      name: province.name,
      totalParcels: inProvince.length,
      idleHectares: hectares(inProvince),
      availableHectares: hectares(inProvince.filter(parcel => parcel.status === ParcelStatus.AVAILABLE)),
      pendingCount: inProvince.filter(parcel => parcel.status === ParcelStatus.PENDING_VERIFICATION).length,
    };
  });
}

export function calculatePolygonAreaHa(coords: number[][]): number {
  let area = 0;
  for (let i = 0; i < coords.length - 1; i += 1) {
    area += coords[i][0] * coords[i + 1][1] - coords[i + 1][0] * coords[i][1];
  }
  return Math.abs(area / 2) * 111.32 * 111.32;
}

export function calculateCentroid(coords: number[][]): { lat: number; lng: number } {
  const points = coords.slice(0, -1);
  const lng = points.reduce((sum, point) => sum + point[0], 0) / points.length;
  const lat = points.reduce((sum, point) => sum + point[1], 0) / points.length;
  return { lat, lng };
}

export function checkBoundingBoxOverlap(first: number[][], second: number[][]): boolean {
  const bounds = (points: number[][]) => ({
    minLng: Math.min(...points.map(point => point[0])),
    maxLng: Math.max(...points.map(point => point[0])),
    minLat: Math.min(...points.map(point => point[1])),
    maxLat: Math.max(...points.map(point => point[1])),
  });
  const a = bounds(first);
  const b = bounds(second);
  return a.minLng < b.maxLng && a.maxLng > b.minLng && a.minLat < b.maxLat && a.maxLat > b.minLat;
}

export interface CurrentIdentity {
  id: string;
  name: string;
  role: Role;
  office: string;
}
