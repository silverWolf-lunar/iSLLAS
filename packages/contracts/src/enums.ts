// ─────────────────────────────────────────────────────────────
// SLLAS Shared Enums
// Source of truth for all status values, types, and categories
// Used by: API, Web, Mobile, Worker
// ─────────────────────────────────────────────────────────────

// ─── User & Auth ───

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  DEACTIVATED = 'DEACTIVATED',
}

export enum Role {
  SYSTEM_ADMIN = 'SYSTEM_ADMIN',
  REGISTRY_OFFICER = 'REGISTRY_OFFICER',
  APPROVER = 'APPROVER',
  ESTATES_OFFICER = 'ESTATES_OFFICER',
  AUDITOR = 'AUDITOR',
  CLIENT = 'CLIENT',
}

export enum OfficeLevel {
  NATIONAL = 'NATIONAL',
  PROVINCIAL = 'PROVINCIAL',
  DISTRICT = 'DISTRICT',
}

// ─── Geography ───

export enum AdminAreaLevel {
  PROVINCE = 'PROVINCE',
  DISTRICT = 'DISTRICT',
  WARD = 'WARD',
}

// ─── Land ───

export enum ParcelStatus {
  DRAFT = 'DRAFT',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  AVAILABLE = 'AVAILABLE',
  RESERVED = 'RESERVED',
  ALLOCATED = 'ALLOCATED',
  LEASED = 'LEASED',
  WITHDRAWN = 'WITHDRAWN',
  DISPUTED = 'DISPUTED',
}

export enum SoilType {
  CLAY = 'CLAY',
  LOAM = 'LOAM',
  SANDY = 'SANDY',
  SILT = 'SILT',
  PEAT = 'PEAT',
  CHALKY = 'CHALKY',
  MIXED = 'MIXED',
}

export enum NaturalRegion {
  I = 'I',
  II = 'II',
  III = 'III',
  IV = 'IV',
  V = 'V',
}

export enum RoadAccess {
  TARRED = 'TARRED',
  GRAVEL = 'GRAVEL',
  DIRT_TRACK = 'DIRT_TRACK',
  NONE = 'NONE',
}

export enum Terrain {
  FLAT = 'FLAT',
  GENTLY_UNDULATING = 'GENTLY_UNDULATING',
  HILLY = 'HILLY',
  MOUNTAINOUS = 'MOUNTAINOUS',
  VALLEY = 'VALLEY',
}

export enum ParcelFileType {
  PHOTO = 'PHOTO',
  TITLE_DEED = 'TITLE_DEED',
  SURVEY_PLAN = 'SURVEY_PLAN',
  OTHER = 'OTHER',
}

// ─── Client ───

export enum ClientType {
  INDIVIDUAL = 'INDIVIDUAL',
  BUSINESS = 'BUSINESS',
}

export enum VerificationStatus {
  UNVERIFIED = 'UNVERIFIED',
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}

export enum ClientDocumentType {
  NATIONAL_ID = 'NATIONAL_ID',
  BUSINESS_REG = 'BUSINESS_REG',
  PROOF_OF_ADDRESS = 'PROOF_OF_ADDRESS',
  TAX_CLEARANCE = 'TAX_CLEARANCE',
  OTHER = 'OTHER',
}

export enum ClientDocumentStatus {
  UPLOADED = 'UPLOADED',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}

// ─── Applications ───

export enum ApplicationStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  INFO_REQUESTED = 'INFO_REQUESTED',
  SITE_INSPECTION = 'SITE_INSPECTION',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  OFFER_ISSUED = 'OFFER_ISSUED',
  ACCEPTED = 'ACCEPTED',
  AGREEMENT_SIGNED = 'AGREEMENT_SIGNED',
  ACTIVE = 'ACTIVE',
  WITHDRAWN = 'WITHDRAWN',
}

export enum ReviewDecision {
  RECOMMEND_APPROVE = 'RECOMMEND_APPROVE',
  RECOMMEND_REJECT = 'RECOMMEND_REJECT',
  REQUEST_INFO = 'REQUEST_INFO',
  ESCALATE = 'ESCALATE',
}

export enum InspectionResult {
  PASS = 'PASS',
  FAIL = 'FAIL',
  CONDITIONAL = 'CONDITIONAL',
}

export enum ApplicationDocumentType {
  PLAN = 'PLAN',
  SUPPORTING = 'SUPPORTING',
  ID_COPY = 'ID_COPY',
  OTHER = 'OTHER',
}

// ─── Leases ───

export enum LeaseStatus {
  ACTIVE = 'ACTIVE',
  EXPIRING_SOON = 'EXPIRING_SOON',
  EXPIRED = 'EXPIRED',
  RENEWAL_REQUESTED = 'RENEWAL_REQUESTED',
  RENEWED = 'RENEWED',
  TERMINATED = 'TERMINATED',
  SUSPENDED = 'SUSPENDED',
}

export enum RenewalStatus {
  REQUESTED = 'REQUESTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum LeaseDocumentType {
  OFFER_LETTER = 'OFFER_LETTER',
  AGREEMENT = 'AGREEMENT',
  SIGNED_AGREEMENT = 'SIGNED_AGREEMENT',
  AMENDMENT = 'AMENDMENT',
  OTHER = 'OTHER',
}

export enum Currency {
  ZWL = 'ZWL',
  USD = 'USD',
}

// ─── Recommendations ───

export enum RecommendationDirection {
  ACTIVITY_TO_PARCELS = 'ACTIVITY_TO_PARCELS',
  PARCEL_TO_ACTIVITIES = 'PARCEL_TO_ACTIVITIES',
}

// ─── Notifications ───

export enum NotificationChannel {
  IN_APP = 'IN_APP',
  PUSH = 'PUSH',
  EMAIL = 'EMAIL',
  SMS = 'SMS',
}

export enum NotificationDeliveryStatus {
  QUEUED = 'QUEUED',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  DLQ = 'DLQ',
}

// ─── Files ───

export enum FileScanStatus {
  PENDING = 'PENDING',
  CLEAN = 'CLEAN',
  INFECTED = 'INFECTED',
}

// ─── Outbox ───

export enum OutboxEventStatus {
  PENDING = 'PENDING',
  PUBLISHED = 'PUBLISHED',
  FAILED = 'FAILED',
}

// ─── Audit ───

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  STATUS_CHANGE = 'STATUS_CHANGE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  VERIFY = 'VERIFY',
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  UPLOAD = 'UPLOAD',
  DOWNLOAD = 'DOWNLOAD',
  EXPORT = 'EXPORT',
  IMPORT = 'IMPORT',
}

// ─── Jobs ───

export enum JobStatus {
  QUEUED = 'QUEUED',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

// ─── Event Types (Outbox) ───

export enum EventType {
  // Parcel events
  PARCEL_CREATED = 'PARCEL_CREATED',
  PARCEL_UPDATED = 'PARCEL_UPDATED',
  PARCEL_STATUS_CHANGED = 'PARCEL_STATUS_CHANGED',
  PARCEL_VERIFIED = 'PARCEL_VERIFIED',

  // Application events
  APPLICATION_SUBMITTED = 'APPLICATION_SUBMITTED',
  APPLICATION_STATUS_CHANGED = 'APPLICATION_STATUS_CHANGED',
  APPLICATION_APPROVED = 'APPLICATION_APPROVED',
  APPLICATION_REJECTED = 'APPLICATION_REJECTED',
  APPLICATION_INFO_REQUESTED = 'APPLICATION_INFO_REQUESTED',

  // Lease events
  LEASE_CREATED = 'LEASE_CREATED',
  LEASE_EXPIRING_SOON = 'LEASE_EXPIRING_SOON',
  LEASE_EXPIRED = 'LEASE_EXPIRED',
  LEASE_RENEWAL_REQUESTED = 'LEASE_RENEWAL_REQUESTED',
  LEASE_RENEWED = 'LEASE_RENEWED',
  LEASE_TERMINATED = 'LEASE_TERMINATED',

  // Inspection events
  INSPECTION_SCHEDULED = 'INSPECTION_SCHEDULED',
  INSPECTION_COMPLETED = 'INSPECTION_COMPLETED',

  // Offer events
  OFFER_ISSUED = 'OFFER_ISSUED',
  OFFER_ACCEPTED = 'OFFER_ACCEPTED',

  // Client events
  CLIENT_PROFILE_VERIFIED = 'CLIENT_PROFILE_VERIFIED',
  CLIENT_PROFILE_REJECTED = 'CLIENT_PROFILE_REJECTED',
}
