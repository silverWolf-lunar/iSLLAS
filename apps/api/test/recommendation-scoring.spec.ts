import { ActivityProfileRule, RecommendationParcel, scoreParcelForActivity } from '../src/modules/recommendations/recommendation-scoring';

describe('scoreParcelForActivity', () => {
  const profile: ActivityProfileRule = {
    id: 'profile-id',
    name: 'CROP_FARMING',
    displayName: 'Crop Farming',
    version: 3,
    hardConstraints: {
      minHectares: 5,
      waterAccess: true,
      allowedNaturalRegions: ['I', 'II', 'III'],
    },
    weightedPreferences: {
      soil_suitability: { weight: 0.5, preferred: ['LOAM', 'CLAY'] },
      natural_region: { weight: 0.5, preferredOrder: ['I', 'II', 'III'] },
    },
  };
  const parcel: RecommendationParcel = {
    id: 'parcel-id',
    referenceNumber: 'P-001',
    landCategoryId: 'category-id',
    landCategoryCode: 'ARABLE',
    areaHectares: 10,
    soilType: 'LOAM',
    naturalRegion: 'II',
    rainfallBand: '600-800 mm',
    waterAccess: true,
    roadAccess: 'GRAVEL',
    electricityAvailable: false,
    gridProximityKm: 20,
  };

  it('normalizes weighted criteria and returns per-criterion explanations', () => {
    const result = scoreParcelForActivity(profile, parcel);

    expect(result?.score).toBe(75);
    expect(result?.profileVersion).toBe(3);
    expect(result?.explanation).toEqual(expect.arrayContaining([
      expect.objectContaining({ criterion: 'soil_suitability', score: 1, reason: expect.any(String) }),
      expect.objectContaining({ criterion: 'natural_region', score: 0.5, reason: expect.any(String) }),
    ]));
  });

  it.each([
    { areaHectares: 4 },
    { waterAccess: false },
    { naturalRegion: 'IV' },
  ])('excludes a parcel that fails hard constraints: %o', overrides => {
    expect(scoreParcelForActivity(profile, { ...parcel, ...overrides })).toBeNull();
  });

  it('returns zero for unknown preference values and records missing-data explanations', () => {
    const result = scoreParcelForActivity(profile, { ...parcel, soilType: null });

    expect(result?.explanation[0]).toMatchObject({ score: 0, reason: 'Parcel data for this criterion is unavailable.' });
  });

  it('rejects parcels whose land category code is not allowed by a hard constraint', () => {
    const result = scoreParcelForActivity({
      ...profile,
      hardConstraints: {
        ...profile.hardConstraints,
        allowedCategoryCodes: ['ARABLE'],
      },
    }, { ...parcel, landCategoryCode: 'GRAZING' });

    expect(result).toBeNull();
  });
});