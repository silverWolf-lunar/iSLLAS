# SLLAS — Risks, Assumptions, and Open Questions

## Assumptions (Proceeding with Defaults)

| # | Assumption | Default | Impact if Wrong | Mitigation |
|---|-----------|---------|-----------------|------------|
| A1 | **Land categories** are configurable and not hard-coded to specific legislation | Admin-managed lookup table seeded with: STATE, COMMUNAL, RESETTLEMENT, COUNCIL, COMMERCIAL_FARM, URBAN, PERI_URBAN | Incorrect categories would confuse officers; seed data would need updating | Validate with Ministry of Lands before pilot. Configuration is admin-editable at runtime |
| A2 | **Single approver** per application | One approver, configurable chain later | Multi-level approval would require workflow engine changes | Service layer designed with strategy pattern; adding approval levels = new strategy, not a rewrite |
| A3 | **Payments** are record-keeping only | Record rent amounts and payment status; no live payment gateway integration | Cannot collect fees electronically | Payment adapter interface defined; EcoCash/bank integration is a Phase 7+ task |
| A4 | **Digital signatures** are not legally accepted yet | Scan upload of wet-ink signed agreements | Workflow has an extra manual step | e-signing can be added behind the same file upload interface |
| A5 | **Identity verification** is manual | Officers manually verify national ID / business registration documents | Slower onboarding, potential for human error | API adapter interface for national ID registry integration (future) |
| A6 | **English only** at launch | All UI strings in English, i18n infrastructure ready (next-intl / react-i18next) | Excludes Shona/Ndebele speakers initially | Translation files can be added without code changes |
| A7 | **Cloud-agnostic** deployment | Docker containers, Terraform modules, no cloud-specific services | May miss managed-service optimizations | Terraform modules abstract provider; can add AWS/Azure/GCP specifics later |
| A8 | **Keycloak** for auth | Self-hosted Keycloak with OIDC | Operational overhead of running Keycloak | Keycloak is mature, well-documented; Docker simplifies deployment |
| A9 | **TypeORM** for data access | TypeORM with raw SQL for spatial queries | Prisma would be simpler for non-spatial work | TypeORM supports custom column types and raw queries; worth the trade-off for PostGIS |
| A10 | **Offline scope** is limited | Field officers: offline parcel capture with sync. Clients: read-only cache of recent views | Full offline workflow for clients would require significant additional complexity | Offline-first for field capture is highest ROI; client offline can be expanded later |
| A11 | **Natural Regions** are I–V per Zimbabwe's agro-ecological classification | Standard Zimbabwe Natural Regions used in agriculture | — | Well-established classification, unlikely to change |
| A12 | **No multi-tenancy** | Single-tenant system for Zimbabwe government | Cannot be reused for other countries without modification | Clean module boundaries make future multi-tenancy feasible |

---

## Risks

### Technical Risks

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|-----------|--------|------------|
| R1 | **PostGIS query performance** degrades at scale (100k+ parcels with complex polygons) | Medium | High — search and map become unusable | GiST indexes, spatial index tuning, result caching in Redis, EXPLAIN ANALYZE in load tests, simplify display geometries (ST_Simplify) |
| R2 | **Keycloak becomes a single point of failure** | Medium | High — no one can log in | HA deployment (2+ replicas with shared DB), health checks, graceful degradation (cached session validation) |
| R3 | **Offline sync conflicts** corrupt data | Medium | High — incorrect parcel boundaries or attributes | Client-generated UUIDs, idempotent replay, server-authoritative for workflow statuses, field-level last-write-wins for drafts, conflict resolution UI for verified records |
| R4 | **RabbitMQ message loss** causes missed notifications | Low | Medium — clients don't get expiry warnings | Transactional outbox guarantees at-least-once publishing, dead-letter queues, idempotent consumers, monitoring alerts on DLQ depth |
| R5 | **Large file uploads** fail on low-bandwidth connections | High | Medium — field officers can't upload photos | Compress images before upload (client-side), chunked upload with resume, background upload queue, progress indicators |
| R6 | **Race condition** on double allocation | Low | Critical — two leases for same parcel | PostgreSQL exclusion constraint (database-level guard), application-level row locking with SELECT FOR UPDATE, integration test that simulates concurrent approvals |
| R7 | **Boundary data quality** — officers draw inaccurate polygons | High | Medium — incorrect area calculations, overlap false positives | Validation rules (min area, max vertices, self-intersection check), snap-to-grid, GPS walk feature with accuracy indicators, human verification step |
| R8 | **Migration rollback** breaks production | Low | High | Backward-compatible migrations only, blue-green deploy, tested rollback scripts, database snapshots before migration |

### Operational Risks

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|-----------|--------|------------|
| R9 | **Rural connectivity** prevents real-time features | High | Medium — field officers can't sync, clients can't track | Offline-first design for field capture, background sync, SMS fallback for notifications, progressive enhancement |
| R10 | **User adoption** is low due to unfamiliarity | High | High — system unused | Training program, simple mobile UI, bilingual support (Phase 7+), help tooltips, progressive disclosure |
| R11 | **Data migration** from existing manual records is slow/error-prone | High | High — system launches with no data | Bulk CSV/GeoJSON import with row-level error reports, validation, import dashboard, dedicated data entry phase |
| R12 | **Legal/regulatory changes** invalidate workflow or categories | Medium | Medium — rework required | Configurable categories, statuses, and workflow steps where possible; ADR documents which aspects are hardcoded vs. configurable |

### Security Risks

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|-----------|--------|------------|
| R13 | **IDOR** — client accesses another client's application/lease | Medium | Critical — data breach | Backend authorization on every operation, object-level ownership checks, automated IDOR security tests |
| R14 | **Privilege escalation** — officer acts outside jurisdiction | Medium | High — unauthorized land allocation | Jurisdiction scoping enforced at service layer, integration tests for cross-jurisdiction access, audit trail |
| R15 | **PII exposure** in logs or audit events | Medium | High — violates Cyber and Data Protection Act | PII redaction in audit events, structured logging with PII-aware formatters, no personal data in log messages |
| R16 | **Malware upload** via document attachments | Medium | High — system compromise | S3 signed upload URLs, malware scanning hook (ClamAV), quarantine infected files, file type whitelist, size limits |

---

## Open Questions (Blocking or Near-Blocking)

| # | Question | Who Should Answer | Default if No Answer | Phase Affected |
|---|----------|-------------------|---------------------|----------------|
| Q1 | Which specific **land categories** and **tenure types** should be seeded? | Ministry of Lands / Legal | STATE, COMMUNAL, RESETTLEMENT, COUNCIL, COMMERCIAL_FARM, URBAN, PERI_URBAN | Phase 2 (seeds) |
| Q2 | What is the **approval hierarchy**? Single approver, or provincial + national for large parcels? | Policy owner | Single approver, configurable | Phase 3 |
| Q3 | Are **application fees** or **rent payments** collected digitally? If so, which payment provider? | Finance / Policy | Record-keeping only | Phase 3 |
| Q4 | Is **e-signing** legally valid under Zimbabwean law? | Legal | Scan upload | Phase 3 |
| Q5 | Is there an API for the **national ID registry** or **company registry** (ZIMRA, ZimConnect)? | IT / Identity authority | Manual verification | Phase 3 |
| Q6 | What is the **SLA** for application processing? (e.g., 30 days from submission to decision) | Policy owner | 30 days, configurable | Phase 3 |
| Q7 | Which **SMS aggregator** is preferred? (e.g., Econet, Telecel, NetOne) | IT / Procurement | Adapter interface, mock in dev | Phase 4 |
| Q8 | **Hosting environment**: Government cloud, private data centre, or commercial cloud? | IT / Policy | Cloud-agnostic Docker; Terraform for any provider | Phase 7 |
| Q9 | **Data retention** requirements under the Cyber and Data Protection Act? | Legal / Compliance | Retain all records indefinitely, soft delete, encryption at rest | Phase 6 |
| Q10 | Which **province** will pilot? | Stakeholder | To be determined | Phase 7 |
| Q11 | Existing **digital parcel data**? Is there a GIS dataset to import? | Ministry GIS unit | Start with manual entry + bulk import tool | Phase 2 |
| Q12 | **Tile server**: Use public OSM tiles (subject to usage policy) or self-host? | IT | Public OSM tiles initially; self-host option documented | Phase 2 |

---

## Dependencies

| Dependency | Owner | Status | Notes |
|-----------|-------|--------|-------|
| Keycloak instance | DevOps | Docker in dev, production TBD | Needs realm configuration, client setup |
| PostgreSQL + PostGIS | DevOps | Docker in dev | Production: managed or self-hosted |
| RabbitMQ | DevOps | Docker in dev | Production: managed or self-hosted |
| MinIO / S3 | DevOps | Docker in dev (MinIO) | Production: S3 or compatible |
| Map tile server | External / Self-hosted | OSM public tiles for dev | Usage limits apply |
| SMS provider API | Procurement | Not started | Interface defined, mock implementation |
| ClamAV or scanning service | DevOps | Docker in dev | Production: managed or self-hosted |
| SSL certificates | DevOps | Not needed for dev | Required for production |
