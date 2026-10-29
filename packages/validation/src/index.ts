import { z } from 'zod';
import {
  Role,
  NaturalRegion,
  SoilType,
  RoadAccess,
  Terrain,
  ParcelStatus,
  ApplicationStatus,
  LeaseStatus,
  ClientType,
  Currency,
  NotificationChannel,
  RecommendationDirection,
} from '@sllas/contracts';

// ─────────────────────────────────────────────────────────────
// Common & Pagination Schemas
// ─────────────────────────────────────────────────────────────

export const paginationQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.string().optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const idParamSchema = z.object({
  id: z.string().uuid({ message: 'Invalid UUID identifier' }),
});

// ─────────────────────────────────────────────────────────────
// GeoJSON Geometry Schemas
// ─────────────────────────────────────────────────────────────

export const coordinateSchema = z.tuple([
  z.number().min(-180).max(180), // Longitude
  z.number().min(-90).max(90),   // Latitude
]);

export const polygonGeometrySchema = z.object({
  type: z.literal('Polygon'),
  coordinates: z.array(z.array(coordinateSchema)).min(1, 'Polygon must have at least one linear ring'),
});

export const pointGeometrySchema = z.object({
  type: z.literal('Point'),
  coordinates: coordinateSchema,
});

// ─────────────────────────────────────────────────────────────
// Auth & Identity Schemas
// ─────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email('Valid email address is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const registerUserSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(2).max(100),
  lastName: z.string().min(2).max(100),
  phoneNumber: z.string().regex(/^\+?263\d{9}$|^0\d{9}$/, 'Must be a valid Zimbabwean phone number'),
  role: z.nativeEnum(Role),
  officeId: z.string().uuid().optional(),
  provinceId: z.string().uuid().optional(),
  districtId: z.string().uuid().optional(),
});

// ─────────────────────────────────────────────────────────────
// Client Profile Schemas
// ─────────────────────────────────────────────────────────────

export const clientProfileSchema = z.object({
  clientType: z.nativeEnum(ClientType),
  nationalIdNumber: z.string().regex(/^\d{2}-\d{6,7}\s?[A-Z]\s?\d{2}$/, 'Valid Zimbabwe National ID required (e.g. 63-123456 A 01)').optional(),
  registrationNumber: z.string().min(3).max(50).optional(),
  companyName: z.string().min(2).max(255).optional(),
  taxClearanceNumber: z.string().max(100).optional(),
  address: z.string().min(5).max(500),
  provinceId: z.string().uuid(),
  districtId: z.string().uuid(),
  directors: z.array(z.object({
    fullName: z.string().min(2),
    nationalId: z.string(),
    phoneNumber: z.string(),
  })).optional(),
}).refine(data => {
  if (data.clientType === ClientType.INDIVIDUAL) {
    return !!data.nationalIdNumber;
  }
  return !!data.registrationNumber && !!data.companyName;
}, {
  message: 'National ID is required for individuals, Registration Number and Company Name for businesses',
});

// ─────────────────────────────────────────────────────────────
// Land Parcel Schemas
// ─────────────────────────────────────────────────────────────

export const parcelAttributesSchema = z.object({
  soilType: z.nativeEnum(SoilType).nullable().optional(),
  naturalRegion: z.nativeEnum(NaturalRegion).nullable().optional(),
  rainfallBand: z.string().max(50).nullable().optional(),
  waterAccess: z.boolean().nullable().optional(),
  waterSources: z.string().max(255).nullable().optional(),
  roadAccess: z.nativeEnum(RoadAccess).nullable().optional(),
  electricityAvailable: z.boolean().nullable().optional(),
  gridProximityKm: z.number().nonnegative().nullable().optional(),
  terrain: z.nativeEnum(Terrain).nullable().optional(),
  currentUse: z.string().max(255).nullable().optional(),
  previousUse: z.string().max(255).nullable().optional(),
  zoningPermittedUses: z.string().max(255).nullable().optional(),
  restrictions: z.string().nullable().optional(),
});

export const createParcelSchema = z.object({
  id: z.string().uuid().optional(), // Offline client-generated UUID
  provinceId: z.string().uuid(),
  districtId: z.string().uuid(),
  wardId: z.string().uuid().optional(),
  landCategoryId: z.string().uuid(),
  boundary: polygonGeometrySchema,
  attributes: parcelAttributesSchema.optional(),
  notes: z.string().max(2000).optional(),
});

export const updateParcelSchema = z.object({
  landCategoryId: z.string().uuid().optional(),
  boundary: polygonGeometrySchema.optional(),
  attributes: parcelAttributesSchema.optional(),
  notes: z.string().max(2000).optional(),
  version: z.number().int().nonnegative(),
});

export const updateParcelStatusSchema = z.object({
  toStatus: z.nativeEnum(ParcelStatus),
  reason: z.string().min(3).max(1000).optional(),
});

export const verifyParcelSchema = z.object({
  decision: z.enum(['VERIFY', 'RETURN_FOR_CORRECTION']),
  notes: z.string().min(3).max(2000),
  checklist: z.record(z.boolean()).optional(),
});

export const bulkImportParcelsSchema = z.object({
  dryRun: z.boolean().default(false),
  parcels: z.array(createParcelSchema).min(1).max(500),
});

export const parcelSearchQuerySchema = paginationQuerySchema.extend({
  provinceId: z.string().uuid().optional(),
  districtId: z.string().uuid().optional(),
  landCategoryId: z.string().uuid().optional(),
  naturalRegion: z.nativeEnum(NaturalRegion).optional(),
  soilType: z.nativeEnum(SoilType).optional(),
  status: z.nativeEnum(ParcelStatus).optional(),
  minHectares: z.coerce.number().positive().optional(),
  maxHectares: z.coerce.number().positive().optional(),
  roadAccess: z.nativeEnum(RoadAccess).optional(),
  waterAccess: z.coerce.boolean().optional(),
  electricityAvailable: z.coerce.boolean().optional(),
  bbox: z.string().optional(), // "minLng,minLat,maxLng,maxLat"
  near: z.string().optional(), // "lat,lng"
  radiusKm: z.coerce.number().positive().max(500).optional(),
});

// ─────────────────────────────────────────────────────────────
// Lease Application Schemas
// ─────────────────────────────────────────────────────────────

export const createApplicationSchema = z.object({
  id: z.string().uuid().optional(),
  parcelId: z.string().uuid(),
  intendedActivity: z.string().min(3).max(255),
  activityProfileId: z.string().uuid().optional(),
  businessPlanSummary: z.string().min(50).max(5000),
  requestedTermYears: z.number().int().min(1).max(99),
  proposedInvestmentUsd: z.number().nonnegative().optional(),
  expectedJobsCreated: z.number().int().nonnegative().optional(),
});

export const applicationReviewSchema = z.object({
  comments: z.string().min(3).max(2000),
});

export const applicationRejectionSchema = z.object({
  reason: z.string().min(3).max(2000),
});

export const signLeaseAgreementSchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  annualRent: z.coerce.number().nonnegative(),
  currency: z.nativeEnum(Currency).default(Currency.USD),
  termsConditions: z.string().min(3).max(10000).optional(),
}).refine(({ startDate, endDate }) => endDate > startDate, {
  message: 'Lease end date must be after the start date',
  path: ['endDate'],
});

export const verifyClientProfileSchema = z.object({
  decision: z.enum(['VERIFY', 'REJECT']),
  reason: z.string().min(3).max(2000).optional(),
}).refine(({ decision, reason }) => decision === 'VERIFY' || !!reason, {
  message: 'A rejection reason is required when rejecting a client profile',
  path: ['reason'],
});

export const applicationTransitionSchema = z.object({
  toStatus: z.nativeEnum(ApplicationStatus),
  comments: z.string().min(3).max(2000),
  metadata: z.record(z.any()).optional(),
});

// ─────────────────────────────────────────────────────────────
// Recommendation Engine Schemas
// ─────────────────────────────────────────────────────────────

export const runRecommendationSchema = z.object({
  activityProfileId: z.string().uuid().optional(),
  preferredProvinceId: z.string().uuid().optional(),
  minHectares: z.number().positive().optional(),
  maxHectares: z.number().positive().optional(),
  limit: z.number().int().min(1).max(50).default(10),
});

export const activityProfileSchema = z.object({
  name: z.string().trim().min(3).max(100).regex(/^[A-Z][A-Z0-9_]*$/, 'Use upper-case snake case'),
  displayName: z.string().trim().min(3).max(150),
  description: z.string().trim().min(3).max(2000).optional(),
  hardConstraints: z.object({
    minHectares: z.number().positive().optional(),
    maxHectares: z.number().positive().optional(),
    waterAccess: z.boolean().optional(),
    allowedCategoryCodes: z.array(z.string().trim().min(1).max(50)).min(1).optional(),
    allowedLandCategoryIds: z.array(z.string().trim().min(1).max(80)).min(1).optional(),
    allowedNaturalRegions: z.array(z.nativeEnum(NaturalRegion)).min(1).optional(),
  }).default({}),
  weightedPreferences: z.record(z.object({
    weight: z.number().positive().max(1),
    preferred: z.array(z.union([z.string(), z.number(), z.boolean()])).min(1).optional(),
    preferredOrder: z.array(z.union([z.string(), z.number(), z.boolean()])).min(1).optional(),
    maxKm: z.number().positive().optional(),
    minMm: z.number().nonnegative().optional(),
  })).refine(preferences => {
    const totalWeight = Object.values(preferences).reduce((sum, criterion) => sum + criterion.weight, 0);
    return totalWeight > 0 && totalWeight <= 1.00001;
  }, 'Preference weights must add up to 1 or less'),
});

export const parcelRecommendationQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const notificationReadSchema = z.object({
  notificationIds: z.array(z.string().uuid()).min(1).max(100),
});

// Export all types inferred from schemas
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterUserInput = z.infer<typeof registerUserSchema>;
export type ClientProfileInput = z.infer<typeof clientProfileSchema>;
export type CreateParcelInput = z.infer<typeof createParcelSchema>;
export type UpdateParcelInput = z.infer<typeof updateParcelSchema>;
export type UpdateParcelStatusInput = z.infer<typeof updateParcelStatusSchema>;
export type VerifyParcelInput = z.infer<typeof verifyParcelSchema>;
export type BulkImportParcelsInput = z.infer<typeof bulkImportParcelsSchema>;
export type ParcelSearchQuery = z.infer<typeof parcelSearchQuerySchema>;
export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;
export type ApplicationTransitionInput = z.infer<typeof applicationTransitionSchema>;
export type ApplicationReviewInput = z.infer<typeof applicationReviewSchema>;
export type ApplicationRejectionInput = z.infer<typeof applicationRejectionSchema>;
export type SignLeaseAgreementInput = z.infer<typeof signLeaseAgreementSchema>;
export type VerifyClientProfileInput = z.infer<typeof verifyClientProfileSchema>;
export type RunRecommendationInput = z.infer<typeof runRecommendationSchema>;
export type ActivityProfileInput = z.infer<typeof activityProfileSchema>;
export type ParcelRecommendationQuery = z.infer<typeof parcelRecommendationQuerySchema>;
export type NotificationReadInput = z.infer<typeof notificationReadSchema>;
