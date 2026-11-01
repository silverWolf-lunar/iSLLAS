import { ParcelStatus, NaturalRegion, SoilType, Role } from '@sllas/contracts';

export interface GeoPolygon {
  type: 'Polygon';
  coordinates: number[][][];
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
    permittedUses: parcel.zoningPermittedUses
      ? parcel.zoningPermittedUses.split(',').map((item: string) => item.trim())
      : [],
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
