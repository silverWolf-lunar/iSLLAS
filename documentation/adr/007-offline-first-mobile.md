# ADR-007: Offline-First Design for Field Operations

**Status:** Accepted
**Date:** 2026-10-24
**Deciders:** Architecture team

## Context

Field officers in rural Zimbabwe often have unreliable or no internet connectivity. They need to:
- Walk parcel boundaries using GPS
- Capture photos of the land
- Record parcel attributes (soil type, road access, etc.)
- Submit all data when connectivity is available

Clients on low-end phones also need basic offline capabilities (viewing cached data).

## Decision

Implement **offline-first** for field officer parcel capture on mobile, and **read-only offline caching** for client features.

## Design

### Field Officer: Offline Parcel Capture

```
┌────────────────────────────────────────┐
│ Mobile App (React Native + Expo)       │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │ Offline Queue (Encrypted SQLite) │  │
│  │  - GPS boundary points           │  │
│  │  - Compressed photos             │  │
│  │  - Parcel attributes             │  │
│  │  - Client-generated UUID         │  │
│  │  - Idempotency key               │  │
│  │  - Timestamp                     │  │
│  └──────────────┬───────────────────┘  │
│                 │                      │
│  ┌──────────────▼───────────────────┐  │
│  │ Background Sync Service          │  │
│  │  - Monitors connectivity         │  │
│  │  - Uploads photos first (largest) │  │
│  │  - Submits parcel data with      │  │
│  │    idempotency key               │  │
│  │  - Retries with backoff          │  │
│  │  - Shows sync status             │  │
│  └──────────────────────────────────┘  │
└────────────────────────────────────────┘
```

### Conflict Resolution

| Data Type | Strategy | Rationale |
|-----------|----------|-----------|
| Draft parcel attributes | Last-write-wins (field-level) | Drafts are informal; latest data is most current |
| Verified parcel data | Conflict screen | Verified data is authoritative; human must decide |
| Parcel boundary (geometry) | Last-write-wins for draft; conflict for verified | Boundary is critical; verified boundaries need human review |
| Workflow status | Server-authoritative | Status transitions must follow the state machine |
| Photos | Append-only | Photos are additive; no conflict |
| Application data | Client-generated UUID + idempotency | Prevents duplicates on replay |

### Client: Read-Only Offline Cache

- Cache recently viewed parcels (attributes, not full geometry) for up to 7 days
- Cache application status for the client's own applications
- Show "Last updated: X" timestamp on cached data
- Show "Offline" badge and disable submit/apply actions

### API Support

- `POST /parcels` accepts client-generated UUIDs via the `id` field
- `POST /parcels` accepts `Idempotency-Key` header; returns the same response for duplicate submissions
- `GET /sync/changes?cursor=…` returns changes since the cursor for incremental sync
- `POST /files/upload-intents` returns signed URLs; offline queue stores file data locally until upload

## Image Compression

Mobile devices compress images before queuing:
- Maximum resolution: 1920x1080
- JPEG quality: 80%
- Maximum file size: 2MB per image
- Strip EXIF except GPS coordinates

## Security

- Offline queue is encrypted at rest (Expo SecureStore for keys, encrypted SQLite)
- Biometric unlock required to access the app
- Sync uploads are authenticated with the stored access token
- Token refresh happens before sync; if token is expired and refresh fails, user must re-authenticate

## Consequences

- ✅ Field officers can work without connectivity
- ✅ Data is not lost if the app crashes or the phone runs out of battery
- ✅ Idempotent replay prevents duplicate submissions
- ⚠️ Complex sync logic; thorough testing required
- ⚠️ Conflict resolution UX needs careful design
- ⚠️ Encrypted local storage adds complexity
- ⚠️ Photos stored locally consume device storage
