import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Parcel } from '../parcels/parcel.entity';
import { ParcelStatus, RecommendationDirection, type RecommendationResponse } from '@sllas/contracts';
import { ActivityProfileRule, RecommendationParcel, scoreParcelForActivity } from './recommendation-scoring';
import { RunRecommendationInput } from '@sllas/validation';

const DEFAULT_PROFILE: ActivityProfileRule = {
  id: 'default-crop-farming',
  name: 'CROP_FARMING',
  displayName: 'Crop Farming',
  version: 1,
  hardConstraints: {
    minHectares: 5,
    waterAccess: true,
    allowedNaturalRegions: ['I', 'II', 'III'],
  },
  weightedPreferences: {
    soil_suitability: { weight: 0.35, preferred: ['LOAM', 'CLAY'] },
    natural_region: { weight: 0.25, preferredOrder: ['I', 'II', 'III'] },
    road_access: { weight: 0.2, preferredOrder: ['TARRED', 'GRAVEL', 'DIRT_TRACK'] },
    electricity: { weight: 0.1, preferred: [true] },
    grid_proximity: { weight: 0.1, maxKm: 50 },
  },
};

@Injectable()
export class RecommendationsService {
  private readonly logger = new Logger(RecommendationsService.name);

  constructor(
    @InjectRepository(Parcel)
    private readonly parcelRepo: Repository<Parcel>,
  ) {}

  async listProfiles() {
    return [{
      id: DEFAULT_PROFILE.id,
      name: DEFAULT_PROFILE.name,
      displayName: DEFAULT_PROFILE.displayName,
      description: 'Recommended profile for crop farming in Zimbabwe.',
      isActive: true,
      version: DEFAULT_PROFILE.version,
    }];
  }

  async runRecommendation(input: RunRecommendationInput, userId?: string): Promise<RecommendationResponse> {
    const profile = DEFAULT_PROFILE;

    const parcels = await this.parcelRepo.find({
      relations: ['landCategory'],
      where: {
        status: ParcelStatus.AVAILABLE,
        ...(input.preferredProvinceId ? { provinceId: input.preferredProvinceId } : {}),
      },
      order: { areaHectares: 'DESC' },
      take: 200,
    });

    const scored = parcels
      .filter((parcel) => {
        if (input.minHectares !== undefined && parcel.areaHectares < input.minHectares) return false;
        if (input.maxHectares !== undefined && parcel.areaHectares > input.maxHectares) return false;
        return true;
      })
      .map((parcel) => {
        const recommendationParcel: RecommendationParcel = {
          id: parcel.id,
          referenceNumber: parcel.referenceNumber,
          landCategoryId: parcel.landCategoryId,
          landCategoryCode: parcel.landCategory?.code ?? null,
          areaHectares: parcel.areaHectares,
          soilType: parcel.soilType,
          naturalRegion: parcel.naturalRegion,
          rainfallBand: parcel.rainfallBand,
          waterAccess: parcel.waterAccess,
          roadAccess: parcel.roadAccess,
          electricityAvailable: parcel.electricityAvailable,
          gridProximityKm: parcel.gridProximityKm,
        };

        const result = scoreParcelForActivity(profile, recommendationParcel);
        if (!result) return null;

        return {
          parcelId: parcel.id,
          parcelReference: parcel.referenceNumber,
          totalScore: result.score,
          rank: 0,
          explanations: result.explanation.map((item) => ({
            criterion: item.criterion,
            score: item.score,
            weight: item.weight,
            weightedScore: item.contribution,
            reason: item.reason,
          })),
        };
      })
      .filter((value): value is NonNullable<typeof value> => value !== null)
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, input.limit ?? 10)
      .map((entry, index) => ({ ...entry, rank: index + 1 }));

    this.logger.log(`Recommendation run requested by ${userId ?? 'system'}; ${scored.length} parcels matched`);

    return {
      runId: uuidv4(),
      direction: RecommendationDirection.ACTIVITY_TO_PARCELS,
      activityProfileName: profile.displayName,
      results: scored,
    };
  }

  async getRecommendationByParcel(parcelId: string): Promise<RecommendationResponse> {
    const parcel = await this.parcelRepo.findOne({
      relations: ['landCategory'],
      where: { id: parcelId },
    });
    if (!parcel) {
      throw new NotFoundException(`Parcel ${parcelId} not found`);
    }

    const profile = DEFAULT_PROFILE;
    const recommendationParcel: RecommendationParcel = {
      id: parcel.id,
      referenceNumber: parcel.referenceNumber,
      landCategoryId: parcel.landCategoryId,
      landCategoryCode: parcel.landCategory?.code ?? null,
      areaHectares: parcel.areaHectares,
      soilType: parcel.soilType,
      naturalRegion: parcel.naturalRegion,
      rainfallBand: parcel.rainfallBand,
      waterAccess: parcel.waterAccess,
      roadAccess: parcel.roadAccess,
      electricityAvailable: parcel.electricityAvailable,
      gridProximityKm: parcel.gridProximityKm,
    };

    const result = scoreParcelForActivity(profile, recommendationParcel);
    if (!result) {
      return {
        runId: uuidv4(),
        direction: RecommendationDirection.ACTIVITY_TO_PARCELS,
        activityProfileName: profile.displayName,
        results: [],
      };
    }

    return {
      runId: uuidv4(),
      direction: RecommendationDirection.ACTIVITY_TO_PARCELS,
      activityProfileName: profile.displayName,
      results: [{
        parcelId: parcel.id,
        parcelReference: parcel.referenceNumber,
        totalScore: result.score,
        rank: 1,
        explanations: result.explanation.map((item) => ({
          criterion: item.criterion,
          score: item.score,
          weight: item.weight,
          weightedScore: item.contribution,
          reason: item.reason,
        })),
      }],
    };
  }
}
