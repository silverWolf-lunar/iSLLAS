export interface ActivityProfileRule {
  id: string;
  name: string;
  displayName: string;
  version: number;
  hardConstraints: Record<string, unknown>;
  weightedPreferences: Record<string, unknown>;
}

export interface RecommendationParcel {
  id: string;
  referenceNumber: string;
  landCategoryId: string;
  landCategoryCode?: string | null;
  areaHectares: number | string;
  soilType: string | null;
  naturalRegion: string | null;
  rainfallBand: string | null;
  waterAccess: boolean;
  roadAccess: string | null;
  electricityAvailable: boolean;
  gridProximityKm: number | string | null;
}

export interface CriterionExplanation {
  criterion: string;
  weight: number;
  score: number;
  contribution: number;
  reason: string;
}

export interface ScoredRecommendation {
  parcelId: string;
  referenceNumber: string;
  score: number;
  profileVersion: number;
  explanation: CriterionExplanation[];
}

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function preferredValueScore(value: unknown, preference: Record<string, unknown>): number {
  const preferredOrder = preference.preferredOrder;
  if (Array.isArray(preferredOrder)) {
    const index = preferredOrder.indexOf(value);
    if (index < 0) return 0;
    return preferredOrder.length <= 1 ? 1 : 1 - index / (preferredOrder.length - 1);
  }

  const preferred = preference.preferred;
  if (Array.isArray(preferred)) {
    return preferred.includes(value) ? 1 : value == null ? 0 : 0.5;
  }
  return 0;
}

function criterionScore(
  criterion: string,
  preference: Record<string, unknown>,
  parcel: RecommendationParcel,
): { score: number; reason: string } {
  if (criterion === 'grid_proximity') {
    const distance = asNumber(parcel.gridProximityKm);
    const maximum = asNumber(preference.maxKm);
    if (distance === null || maximum === null || maximum <= 0) {
      return { score: 0, reason: 'Grid proximity data or a valid maximum distance is unavailable.' };
    }
    const score = Math.max(0, Math.min(1, 1 - distance / maximum));
    return { score, reason: `${distance} km from the grid; preference limit is ${maximum} km.` };
  }

  if (criterion === 'rainfall') {
    const minimum = asNumber(preference.minMm);
    const rainfall = parcel.rainfallBand?.match(/\d+(?:\.\d+)?/g)?.map(Number);
    if (minimum === null || !rainfall?.length) {
      return { score: 0, reason: 'Rainfall data or a valid minimum is unavailable.' };
    }
    const representativeRainfall = rainfall.reduce((sum, amount) => sum + amount, 0) / rainfall.length;
    const score = Math.max(0, Math.min(1, representativeRainfall / minimum));
    return { score, reason: `Rainfall band ${parcel.rainfallBand}; preference minimum is ${minimum} mm.` };
  }

  const parcelValue: unknown = {
    soil_suitability: parcel.soilType,
    natural_region: parcel.naturalRegion,
    road_access: parcel.roadAccess,
    electricity: parcel.electricityAvailable,
    water_access: parcel.waterAccess,
  }[criterion];
  const score = preferredValueScore(parcelValue, preference);
  return {
    score,
    reason: parcelValue == null
      ? 'Parcel data for this criterion is unavailable.'
      : `Parcel value is ${String(parcelValue)}; compared with the configured preference.`,
  };
}

export function scoreParcelForActivity(
  profile: ActivityProfileRule,
  parcel: RecommendationParcel,
): ScoredRecommendation | null {
  const hard = profile.hardConstraints;
  const area = asNumber(parcel.areaHectares);
  const minimum = asNumber(hard.minHectares);
  const maximum = asNumber(hard.maxHectares);
  if (area === null || (minimum !== null && area < minimum) || (maximum !== null && area > maximum)) return null;
  if (hard.waterAccess === true && !parcel.waterAccess) return null;
  if (Array.isArray(hard.allowedNaturalRegions) && !hard.allowedNaturalRegions.includes(parcel.naturalRegion)) return null;
  if (Array.isArray(hard.allowedCategoryCodes) && !hard.allowedCategoryCodes.includes(parcel.landCategoryCode ?? null)) return null;
  if (Array.isArray(hard.allowedLandCategoryIds) && !hard.allowedLandCategoryIds.includes(parcel.landCategoryId)) return null;

  const explanation: CriterionExplanation[] = [];
  for (const [criterion, rawPreference] of Object.entries(profile.weightedPreferences)) {
    if (!rawPreference || typeof rawPreference !== 'object' || Array.isArray(rawPreference)) continue;
    const preference = rawPreference as Record<string, unknown>;
    const weight = asNumber(preference.weight);
    if (weight === null || weight <= 0) continue;
    const result = criterionScore(criterion, preference, parcel);
    explanation.push({
      criterion,
      weight,
      score: result.score,
      contribution: result.score * weight,
      reason: result.reason,
    });
  }

  const totalWeight = explanation.reduce((sum, item) => sum + item.weight, 0);
  const weightedScore = totalWeight === 0
    ? 0
    : explanation.reduce((sum, item) => sum + item.contribution, 0) / totalWeight;
  return {
    parcelId: parcel.id,
    referenceNumber: parcel.referenceNumber,
    score: Math.round(weightedScore * 10000) / 100,
    profileVersion: profile.version,
    explanation,
  };
}