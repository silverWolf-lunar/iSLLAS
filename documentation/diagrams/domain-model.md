# SLLAS Domain Model

## Entity-Relationship Diagram

```mermaid
erDiagram
    %% ─────────── IDENTITY & ACCESS ───────────
    users {
        uuid id PK
        varchar email UK
        varchar keycloak_sub UK
        varchar first_name
        varchar last_name
        varchar phone
        enum status "ACTIVE | SUSPENDED | DEACTIVATED"
        uuid created_by FK
        timestamptz created_at
        timestamptz updated_at
    }

    roles {
        uuid id PK
        varchar name UK "SYSTEM_ADMIN | REGISTRY_OFFICER | APPROVER | AUDITOR | CLIENT"
        varchar description
        boolean is_system "true for built-in roles"
        timestamptz created_at
    }

    permissions {
        uuid id PK
        varchar resource "parcels | applications | leases | ..."
        varchar action "create | read | update | delete | approve | verify | ..."
        varchar description
    }

    role_permissions {
        uuid role_id FK
        uuid permission_id FK
    }

    user_roles {
        uuid id PK
        uuid user_id FK
        uuid role_id FK
        uuid office_id FK "NULL for clients — jurisdiction scope"
        timestamptz assigned_at
        uuid assigned_by FK
    }

    %% ─────────── ORGANIZATIONS (Government Offices) ───────────
    offices {
        uuid id PK
        varchar name
        enum level "NATIONAL | PROVINCIAL | DISTRICT"
        uuid admin_area_id FK
        varchar address
        varchar phone
        varchar email
        boolean is_active
        timestamptz created_at
        timestamptz updated_at
    }

    %% ─────────── GEOGRAPHY ───────────
    admin_areas {
        uuid id PK
        varchar name
        varchar code UK
        enum level "PROVINCE | DISTRICT | WARD"
        uuid parent_id FK "self-referencing hierarchy"
        geometry boundary "MultiPolygon SRID 4326"
        timestamptz created_at
    }

    %% ─────────── LAND REGISTRY ───────────
    land_categories {
        uuid id PK
        varchar name UK "STATE | COMMUNAL | RESETTLEMENT | COUNCIL | COMMERCIAL_FARM | ..."
        varchar description
        boolean is_active
        timestamptz created_at
    }

    land_parcels {
        uuid id PK
        varchar reference_number UK
        uuid province_id FK "admin_areas"
        uuid district_id FK "admin_areas"
        uuid ward_id FK "admin_areas"
        uuid land_category_id FK
        geometry boundary "Polygon SRID 4326"
        geometry centroid "Point SRID 4326, computed"
        decimal area_hectares "computed from geometry"
        enum status "DRAFT | PENDING_VERIFICATION | AVAILABLE | RESERVED | ALLOCATED | LEASED | WITHDRAWN | DISPUTED"
        uuid registered_by FK "users"
        uuid verified_by FK "users, NULL until verified"
        text notes
        jsonb metadata "extensible attributes"
        timestamptz created_at
        timestamptz updated_at
        bigint version "optimistic locking"
    }

    parcel_attributes {
        uuid id PK
        uuid parcel_id FK UK
        enum soil_type "CLAY | LOAM | SANDY | SILT | PEAT | CHALKY | MIXED"
        enum natural_region "I | II | III | IV | V"
        varchar rainfall_band "e.g. 750-1000mm"
        boolean water_access
        text water_sources "description"
        enum road_access "TARRED | GRAVEL | DIRT_TRACK | NONE"
        boolean electricity_available
        decimal grid_proximity_km
        enum terrain "FLAT | GENTLY_UNDULATING | HILLY | MOUNTAINOUS | VALLEY"
        text current_use
        text previous_use
        text zoning_permitted_uses
        text restrictions
        text disputes
        timestamptz created_at
        timestamptz updated_at
    }

    parcel_status_history {
        uuid id PK
        uuid parcel_id FK
        enum from_status
        enum to_status
        uuid actor_id FK "users"
        text reason
        jsonb metadata
        timestamptz created_at
    }

    parcel_files {
        uuid id PK
        uuid parcel_id FK
        uuid file_id FK
        enum file_type "PHOTO | TITLE_DEED | SURVEY_PLAN | OTHER"
        integer sort_order
        timestamptz created_at
    }

    %% ─────────── CLIENT PROFILES ───────────
    client_profiles {
        uuid id PK
        uuid user_id FK "users"
        enum type "INDIVIDUAL | BUSINESS"
        varchar national_id "for individuals"
        varchar business_reg_number "for businesses"
        varchar business_name
        text directors "JSON array for businesses"
        text address
        enum verification_status "UNVERIFIED | PENDING | VERIFIED | REJECTED"
        uuid verified_by FK "users"
        timestamptz verified_at
        timestamptz created_at
        timestamptz updated_at
    }

    client_documents {
        uuid id PK
        uuid client_profile_id FK
        uuid file_id FK
        enum document_type "NATIONAL_ID | BUSINESS_REG | PROOF_OF_ADDRESS | TAX_CLEARANCE | OTHER"
        enum status "UPLOADED | VERIFIED | REJECTED"
        text rejection_reason
        uuid reviewed_by FK
        timestamptz reviewed_at
        timestamptz created_at
    }

    %% ─────────── LEASE APPLICATIONS ───────────
    lease_applications {
        uuid id PK
        varchar application_number UK "auto-generated"
        uuid client_profile_id FK
        uuid parcel_id FK
        uuid activity_profile_id FK "optional, for recommendation link"
        text intended_activity
        text plan_summary
        integer requested_term_years
        enum status "DRAFT | SUBMITTED | UNDER_REVIEW | INFO_REQUESTED | SITE_INSPECTION | APPROVED | REJECTED | OFFER_ISSUED | ACCEPTED | AGREEMENT_SIGNED | ACTIVE | WITHDRAWN"
        uuid assigned_officer_id FK "users"
        uuid assigned_approver_id FK "users"
        timestamptz sla_deadline
        boolean is_overdue
        text rejection_reason
        uuid idempotency_key UK "client-generated for offline"
        timestamptz submitted_at
        timestamptz created_at
        timestamptz updated_at
        bigint version
    }

    application_status_history {
        uuid id PK
        uuid application_id FK
        enum from_status
        enum to_status
        uuid actor_id FK
        text reason
        text comments
        jsonb metadata
        timestamptz created_at
    }

    application_documents {
        uuid id PK
        uuid application_id FK
        uuid file_id FK
        enum document_type "PLAN | SUPPORTING | ID_COPY | OTHER"
        text description
        timestamptz created_at
    }

    application_reviews {
        uuid id PK
        uuid application_id FK
        uuid reviewer_id FK "users"
        enum decision "RECOMMEND_APPROVE | RECOMMEND_REJECT | REQUEST_INFO | ESCALATE"
        text comments
        text conditions
        timestamptz created_at
    }

    site_inspections {
        uuid id PK
        uuid application_id FK
        uuid inspector_id FK "users"
        timestamptz scheduled_date
        timestamptz completed_date
        enum result "PASS | FAIL | CONDITIONAL"
        text findings
        text conditions
        jsonb gps_coordinates
        timestamptz created_at
        timestamptz updated_at
    }

    site_inspection_files {
        uuid id PK
        uuid inspection_id FK
        uuid file_id FK
        timestamptz created_at
    }

    %% ─────────── LEASES ───────────
    leases {
        uuid id PK
        varchar lease_number UK
        uuid application_id FK
        uuid parcel_id FK
        uuid client_profile_id FK
        tstzrange lease_period "start to end, with exclusion constraint"
        date start_date
        date end_date
        decimal annual_rent
        varchar currency "ZWL | USD"
        text terms_conditions
        enum status "ACTIVE | EXPIRING_SOON | EXPIRED | RENEWAL_REQUESTED | RENEWED | TERMINATED | SUSPENDED"
        uuid approved_by FK
        timestamptz approved_at
        timestamptz created_at
        timestamptz updated_at
        bigint version
    }

    lease_documents {
        uuid id PK
        uuid lease_id FK
        uuid file_id FK
        enum document_type "OFFER_LETTER | AGREEMENT | SIGNED_AGREEMENT | AMENDMENT | OTHER"
        timestamptz created_at
    }

    lease_renewals {
        uuid id PK
        uuid lease_id FK
        uuid requested_by FK "users"
        integer requested_term_years
        text justification
        enum status "REQUESTED | UNDER_REVIEW | APPROVED | REJECTED"
        uuid decided_by FK
        text decision_reason
        uuid new_lease_id FK "the resulting new lease"
        timestamptz requested_at
        timestamptz decided_at
        timestamptz created_at
    }

    %% ─────────── RECOMMENDATIONS ───────────
    activity_profiles {
        uuid id PK
        varchar name UK "CROP_FARMING | LIVESTOCK | HORTICULTURE | ..."
        varchar display_name
        text description
        jsonb hard_constraints "min_hectares, water_required, allowed_categories, ..."
        jsonb weighted_preferences "soil: 0.3, natural_region: 0.25, road: 0.2, ..."
        boolean is_active
        integer version
        uuid created_by FK
        timestamptz created_at
        timestamptz updated_at
    }

    recommendation_runs {
        uuid id PK
        uuid requested_by FK "users"
        enum direction "ACTIVITY_TO_PARCELS | PARCEL_TO_ACTIVITIES"
        uuid activity_profile_id FK "null if parcel→activities"
        uuid parcel_id FK "null if activity→parcels"
        integer activity_profile_version "snapshot"
        jsonb input_filters "province, district, etc."
        jsonb results "top N with scores and explanations"
        integer result_count
        timestamptz created_at
    }

    %% ─────────── NOTIFICATIONS ───────────
    notification_templates {
        uuid id PK
        varchar code UK "APP_STATUS_CHANGE | LEASE_EXPIRY_30D | ..."
        varchar channel "IN_APP | PUSH | EMAIL | SMS"
        varchar subject_template
        text body_template "Handlebars or similar"
        boolean is_active
        integer version
        timestamptz created_at
        timestamptz updated_at
    }

    notification_preferences {
        uuid id PK
        uuid user_id FK
        varchar channel "IN_APP | PUSH | EMAIL | SMS"
        boolean enabled
        timestamptz updated_at
    }

    notification_deliveries {
        uuid id PK
        uuid user_id FK
        uuid template_id FK
        varchar channel
        varchar subject
        text body
        jsonb context "template variables snapshot"
        enum status "QUEUED | SENT | DELIVERED | FAILED | DLQ"
        integer attempt_count
        text last_error
        varchar idempotency_key UK
        timestamptz sent_at
        timestamptz delivered_at
        timestamptz created_at
    }

    %% ─────────── FILES ───────────
    files {
        uuid id PK
        varchar original_name
        varchar storage_key "S3 key"
        varchar bucket
        varchar content_type
        bigint size_bytes
        varchar checksum_sha256
        enum scan_status "PENDING | CLEAN | INFECTED"
        uuid uploaded_by FK
        timestamptz created_at
    }

    %% ─────────── AUDIT ───────────
    audit_events {
        uuid id PK
        varchar entity_type
        uuid entity_id
        varchar action "CREATE | UPDATE | DELETE | STATUS_CHANGE | LOGIN | ..."
        uuid actor_id FK "users, null for system"
        varchar actor_ip
        jsonb old_values "redacted of PII"
        jsonb new_values "redacted of PII"
        varchar correlation_id
        timestamptz created_at
    }

    %% ─────────── OUTBOX ───────────
    outbox_events {
        uuid id PK
        varchar aggregate_type
        uuid aggregate_id
        varchar event_type
        jsonb payload
        enum status "PENDING | PUBLISHED | FAILED"
        integer retry_count
        timestamptz created_at
        timestamptz published_at
    }

    %% ─────────── IDEMPOTENCY ───────────
    idempotency_keys {
        uuid id PK
        varchar key UK
        varchar resource
        integer status_code
        jsonb response_body
        timestamptz expires_at
        timestamptz created_at
    }

    %% ─────────── RELATIONSHIPS ───────────
    users ||--o{ user_roles : "has"
    roles ||--o{ role_permissions : "grants"
    permissions ||--o{ role_permissions : "granted by"
    roles ||--o{ user_roles : "assigned as"
    offices ||--o{ user_roles : "scoped to"
    offices }o--|| admin_areas : "covers"

    admin_areas ||--o{ admin_areas : "parent→children"
    admin_areas ||--o{ land_parcels : "province"
    admin_areas ||--o{ land_parcels : "district"
    admin_areas ||--o{ land_parcels : "ward"

    land_categories ||--o{ land_parcels : "categorized as"
    land_parcels ||--|| parcel_attributes : "has"
    land_parcels ||--o{ parcel_status_history : "history"
    land_parcels ||--o{ parcel_files : "attachments"
    land_parcels ||--o{ lease_applications : "applied for"
    land_parcels ||--o{ leases : "leased as"

    files ||--o{ parcel_files : "referenced"
    files ||--o{ application_documents : "referenced"
    files ||--o{ lease_documents : "referenced"
    files ||--o{ client_documents : "referenced"
    files ||--o{ site_inspection_files : "referenced"

    users ||--o| client_profiles : "has profile"
    client_profiles ||--o{ client_documents : "has"
    client_profiles ||--o{ lease_applications : "applies"
    client_profiles ||--o{ leases : "holds"

    lease_applications ||--o{ application_status_history : "history"
    lease_applications ||--o{ application_documents : "docs"
    lease_applications ||--o{ application_reviews : "reviewed"
    lease_applications ||--o{ site_inspections : "inspected"
    lease_applications ||--o| leases : "results in"

    site_inspections ||--o{ site_inspection_files : "evidence"

    leases ||--o{ lease_documents : "docs"
    leases ||--o{ lease_renewals : "renewals"

    activity_profiles ||--o{ recommendation_runs : "used in"
    land_parcels ||--o{ recommendation_runs : "evaluated"
    users ||--o{ recommendation_runs : "requested"

    users ||--o{ notification_preferences : "prefers"
    users ||--o{ notification_deliveries : "receives"
    notification_templates ||--o{ notification_deliveries : "rendered from"

    users ||--o{ audit_events : "performed"
```

## Key Design Decisions

### 1. Geometry Storage
- All geometries use **SRID 4326** (WGS 84) for GPS compatibility
- `land_parcels.boundary` — `Polygon` type with GiST index
- `land_parcels.centroid` — `Point`, computed from boundary for fast point queries
- `land_parcels.area_hectares` — computed via `ST_Area(boundary::geography) / 10000`
- `admin_areas.boundary` — `MultiPolygon` for province/district boundaries

### 2. Exclusion Constraint (No Double Allocation)
```sql
ALTER TABLE leases ADD CONSTRAINT no_overlapping_leases
  EXCLUDE USING gist (
    parcel_id WITH =,
    lease_period WITH &&
  ) WHERE (status IN ('ACTIVE', 'EXPIRING_SOON', 'RENEWAL_REQUESTED', 'RENEWED'));
```
Requires `btree_gist` extension.

### 3. Append-Only History
- `parcel_status_history`, `application_status_history`, and `audit_events` are INSERT-only
- No `UPDATE` or `DELETE` allowed (enforced by application and optionally by row-level security)

### 4. Soft References for PII
- `audit_events` stores redacted snapshots — no raw national IDs or personal data in audit metadata
- `client_profiles` stores PII; access is restricted by RBAC

### 5. Client-Generated UUIDs
- `lease_applications.idempotency_key` — mobile clients generate UUIDs for offline submission
- `idempotency_keys` table deduplicates replay

### 6. Optimistic Locking
- `land_parcels.version` and `lease_applications.version` — prevents concurrent edits from clobbering each other

## Indexes

| Table | Index | Type | Purpose |
|-------|-------|------|---------|
| `land_parcels` | `boundary` | GiST | Spatial queries (bbox, contains, intersects, overlap detection) |
| `land_parcels` | `centroid` | GiST | Near-me radius search |
| `land_parcels` | `(province_id, status)` | B-tree | Filter by province + status |
| `land_parcels` | `(district_id, status)` | B-tree | Filter by district + status |
| `land_parcels` | `(land_category_id)` | B-tree | Category filter |
| `land_parcels` | `reference_number` | B-tree (unique) | Lookup by ref |
| `lease_applications` | `(client_profile_id, status)` | B-tree | Client's applications |
| `lease_applications` | `(parcel_id, status)` | B-tree | Applications for a parcel |
| `lease_applications` | `(assigned_officer_id, is_overdue)` | B-tree | Officer workload |
| `leases` | `lease_period` | GiST | Exclusion constraint + expiry queries |
| `leases` | `(parcel_id, status)` | B-tree | Active lease lookup |
| `leases` | `(end_date)` | B-tree | Expiry scheduler |
| `leases` | `(client_profile_id)` | B-tree | Client's leases |
| `admin_areas` | `boundary` | GiST | Contains/intersects queries |
| `admin_areas` | `(level, parent_id)` | B-tree | Hierarchy traversal |
| `audit_events` | `(entity_type, entity_id)` | B-tree | Audit trail per entity |
| `audit_events` | `(actor_id, created_at)` | B-tree | Actor audit trail |
| `outbox_events` | `(status, created_at)` | B-tree | Polling for unpublished |
| `notification_deliveries` | `(user_id, created_at)` | B-tree | User notification history |
| `notification_deliveries` | `(status)` | B-tree | Queue processing |

## Database Extensions Required

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";      -- UUID generation
CREATE EXTENSION IF NOT EXISTS "postgis";         -- Spatial types and functions
CREATE EXTENSION IF NOT EXISTS "btree_gist";      -- GiST index for scalar types (exclusion constraints)
CREATE EXTENSION IF NOT EXISTS "pg_trgm";         -- Trigram similarity for text search (future)
```
