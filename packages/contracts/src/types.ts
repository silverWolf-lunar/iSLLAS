// ─────────────────────────────────────────────────────────────
// SLLAS Shared TypeScript Interfaces
// Source of truth for API request/response shapes
// Used by: API, Web, Mobile (via @sllas/api-client)
// ─────────────────────────────────────────────────────────────

import {
  UserStatus,
  Role,
  OfficeLevel,
  AdminAreaLevel,
  ParcelStatus,
  SoilType,
  NaturalRegion,
  RoadAccess,
  Terrain,
  ClientType,
  VerificationStatus,
  ApplicationStatus,
  LeaseStatus,
  RecommendationDirection,
  NotificationChannel,
  NotificationDeliveryStatus,
  JobStatus,
} from './enums';

// ─── Common ───

export interface PaginationMeta {
  nextCursor: string | null;
  hasMore: boolean;
  totalCount?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

export interface ErrorResponse {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  correlationId: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: ErrorResponse;
  correlationId?: string;
}

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface GeoJSON {
  type: 'Polygon' | 'MultiPolygon' | 'Point';
  coordinates: number[][][] | number[][][][] | number[];
}

// ─── Auth ───

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: UserProfile;
}

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  role?: Role;
  officeId: string | null;
  provinceId?: string | null;
  districtId?: string | null;
  phoneNumber?: string | null;
  status?: UserStatus;
  permissions?: string[];
}

// ─── Users ───

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  status: UserStatus;
  roles: UserRoleAssignment[];
  createdAt: string;
}

export interface UserRoleAssignment {
  role: Role;
  officeId: string | null;
  officeName: string | null;
}

export interface CreateUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  roles?: Array<{
    roleId: string;
    officeId?: string;
  }>;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  status?: UserStatus;
}

// ─── Offices ───

export interface Office {
  id: string;
  name: string;
  level: OfficeLevel;
  adminAreaId: string;
  adminAreaName: string;
  isActive: boolean;
}

export interface CreateOfficeRequest {
  name: string;
  level: OfficeLevel;
  adminAreaId: string;
}

// ─── Admin Areas ───

export interface AdminArea {
  id: string;
  name: string;
  code: string;
  level: AdminAreaLevel;
  parentId: string | null;
}

// ─── Client Profiles ───

export interface ClientProfile {
  id: string;
  userId: string;
  type: ClientType;
  nationalId: string | null;
  businessRegNumber: string | null;
  businessName: string | null;
  verificationStatus: VerificationStatus;
  createdAt: string;
}

export interface CreateClientProfileRequest {
  type: ClientType;
  nationalId?: string;
  businessRegNumber?: string;
  businessName?: string;
  address?: string;
}

// ─── Land Parcels ───

export interface Parcel {
  id: string;
  referenceNumber: string;
  provinceId: string;
  provinceName: string;
  districtId: string;
  districtName: string;
  wardId: string | null;
  wardName: string | null;
  landCategoryId: string;
  landCategoryName: string;
  areaHectares: number;
  status: ParcelStatus;
  centroid: GeoPoint | null;
  createdAt: string;
  updatedAt: string;
}

export interface ParcelDetail extends Parcel {
  boundary: GeoJSON;
  attributes: ParcelAttributes;
  files: ParcelFile[];
  registeredBy: string;
  verifiedBy: string | null;
}

export interface ParcelAttributes {
  soilType: SoilType | null;
  naturalRegion: NaturalRegion | null;
  rainfallBand: string | null;
  waterAccess: boolean | null;
  waterSources: string | null;
  roadAccess: RoadAccess | null;
  electricityAvailable: boolean | null;
  gridProximityKm: number | null;
  terrain: Terrain | null;
  currentUse: string | null;
  previousUse: string | null;
  zoningPermittedUses: string | null;
  restrictions: string | null;
}

export interface ParcelFile {
  id: string;
  fileId: string;
  fileType: string;
  originalName: string;
  downloadUrl: string;
}

export interface CreateParcelRequest {
  id?: string; // Client-generated UUID for offline
  provinceId: string;
  districtId: string;
  wardId?: string;
  landCategoryId: string;
  boundary: GeoJSON;
  attributes?: Partial<ParcelAttributes>;
  notes?: string;
}

export interface UpdateParcelRequest {
  landCategoryId?: string;
  boundary?: GeoJSON;
  attributes?: Partial<ParcelAttributes>;
  notes?: string;
  version: number; // Optimistic locking
}

export interface ParcelStatusTransitionRequest {
  toStatus: ParcelStatus;
  reason?: string;
}

export interface ParcelSearchParams {
  cursor?: string;
  limit?: number;
  sort?: string;
  provinceId?: string;
  districtId?: string;
  status?: ParcelStatus;
  categoryId?: string;
  minHectares?: number;
  maxHectares?: number;
  soilType?: SoilType;
  naturalRegion?: NaturalRegion;
  waterAccess?: boolean;
  roadAccess?: RoadAccess;
  electricity?: boolean;
  bbox?: string; // west,south,east,north
  near?: string; // lat,lng
  radiusKm?: number;
}

// ─── Applications ───

export interface Application {
  id: string;
  applicationNumber: string;
  clientProfileId: string;
  parcelId: string;
  parcelReference: string;
  intendedActivity: string;
  requestedTermYears: number;
  status: ApplicationStatus;
  assignedOfficerId: string | null;
  isOverdue: boolean;
  slaDeadline: string | null;
  createdAt: string;
}

export interface ApplicationDetail extends Application {
  planSummary: string | null;
  documents: ApplicationDocument[];
  statusHistory: StatusHistoryEntry[];
  reviews: ReviewEntry[];
  inspections: InspectionEntry[];
}

export interface ApplicationDocument {
  id: string;
  fileId: string;
  documentType: string;
  description: string | null;
  originalName: string;
  downloadUrl: string;
  createdAt: string;
}

export interface CreateApplicationRequest {
  parcelId: string;
  activityProfileId?: string;
  intendedActivity: string;
  planSummary?: string;
  requestedTermYears: number;
}

export interface UpdateApplicationRequest {
  intendedActivity?: string;
  planSummary?: string;
  requestedTermYears?: number;
}

export interface ApplicationTransitionRequest {
  toStatus: ApplicationStatus;
  reason?: string;
  comments?: string;
}

// ─── Status History ───

export interface StatusHistoryEntry {
  id: string;
  fromStatus: string;
  toStatus: string;
  actorName: string;
  reason: string | null;
  createdAt: string;
}

export interface ReviewEntry {
  id: string;
  reviewerName: string;
  decision: string;
  comments: string | null;
  conditions: string | null;
  createdAt: string;
}

export interface InspectionEntry {
  id: string;
  inspectorName: string;
  scheduledDate: string;
  completedDate: string | null;
  result: string | null;
  findings: string | null;
}

// ─── Leases ───

export interface Lease {
  id: string;
  leaseNumber: string;
  applicationId: string;
  parcelId: string;
  parcelReference: string;
  clientProfileId: string;
  clientName: string;
  startDate: string;
  endDate: string;
  annualRent: number | null;
  currency: string | null;
  status: LeaseStatus;
}

export interface LeaseDetail extends Lease {
  documents: LeaseDocument[];
  renewals: LeaseRenewalSummary[];
}

export interface LeaseDocument {
  id: string;
  documentType: string;
  downloadUrl: string;
}

export interface LeaseRenewalSummary {
  id: string;
  status: string;
  requestedTermYears: number;
  requestedAt: string;
}

export interface RequestRenewalRequest {
  requestedTermYears: number;
  justification: string;
}

export interface DecideRenewalRequest {
  decision: 'APPROVE' | 'REJECT';
  reason?: string;
}

export interface TerminateLeaseRequest {
  reason: string;
}

// ─── Recommendations ───

export interface RecommendationRequest {
  direction: RecommendationDirection;
  activityProfileId?: string;
  parcelId?: string;
  filters?: {
    provinceId?: string;
    districtId?: string;
    minHectares?: number;
    maxHectares?: number;
  };
  topN?: number;
}

export interface RecommendationResponse {
  runId: string;
  direction: RecommendationDirection;
  activityProfileName: string | null;
  results: RecommendationResult[];
}

export interface RecommendationResult {
  parcelId: string;
  parcelReference: string;
  totalScore: number;
  rank: number;
  explanations: RecommendationExplanation[];
}

export interface RecommendationExplanation {
  criterion: string;
  score: number;
  weight: number;
  weightedScore: number;
  reason: string;
}

// ─── Activity Profiles ───

export interface ActivityProfile {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  isActive: boolean;
  version: number;
}

export interface ActivityProfileDetail extends ActivityProfile {
  hardConstraints: Record<string, unknown>;
  weightedPreferences: Record<string, unknown>;
}

export interface CreateActivityProfileRequest {
  name: string;
  displayName: string;
  description?: string;
  hardConstraints: Record<string, unknown>;
  weightedPreferences: Record<string, unknown>;
}

// ─── Notifications ───

export interface NotificationPreference {
  channel: NotificationChannel;
  enabled: boolean;
}

export interface NotificationItem {
  id: string;
  subject: string;
  body: string;
  channel: NotificationChannel;
  status: NotificationDeliveryStatus;
  createdAt: string;
  readAt: string | null;
}

// ─── Files ───

export interface UploadIntentRequest {
  fileName: string;
  contentType: string;
  fileSizeBytes?: number;
}

export interface UploadIntentResponse {
  fileId: string;
  uploadUrl: string;
  expiresAt: string;
}

export interface DownloadResponse {
  downloadUrl: string;
  expiresAt: string;
}

// ─── Reports ───

export interface DashboardData {
  parcelsByStatus: Record<string, number>;
  parcelsByProvince: Record<string, number>;
  idleLandHectares: number;
  applicationPipeline: Record<string, number>;
  avgProcessingDays: number;
  leaseExpiryForecast: Array<{ month: string; count: number }>;
  approvalRate: number;
  rejectionRate: number;
}

export interface ExportRequest {
  reportType: 'PARCELS' | 'APPLICATIONS' | 'LEASES' | 'AUDIT';
  format: 'CSV' | 'XLSX' | 'PDF';
  filters?: Record<string, unknown>;
}

export interface JobStatusResponse {
  jobId: string;
  status: JobStatus;
  progress: number;
  resultUrl: string | null;
  errorMessage: string | null;
}

// ─── Sync ───

export interface SyncChange {
  entityType: string;
  entityId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  data: Record<string, unknown>;
  timestamp: string;
}

export interface SyncChangesResponse {
  changes: SyncChange[];
  nextCursor: string;
}

export interface SyncPushRequest {
  changes: SyncChange[];
}

export interface SyncPushResponse {
  syncedCount: number;
  conflicts: Array<{
    entityId: string;
    serverVersion: number;
    message: string;
  }>;
}

// ─── Land Categories ───

export interface LandCategory {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
}

// ─── Notification Templates ───

export interface NotificationTemplate {
  id: string;
  code: string;
  channel: NotificationChannel;
  subjectTemplate: string;
  bodyTemplate: string;
  isActive: boolean;
  version: number;
}
