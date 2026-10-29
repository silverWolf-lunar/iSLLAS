# SLLAS — Smart Land Lease and Allocation System

> A cross-platform system for identifying, registering, and leasing idle land across Zimbabwe's provinces, with real-time status tracking, expiry notifications, and explainable land-use recommendations.

## Quick Start

```bash
# Prerequisites: Node.js ≥ 20, pnpm ≥ 9, Docker, Docker Compose

# 1. Clone and install
pnpm install

# 2. Build workspace packages and apps
pnpm build

# 3. Start infrastructure
docker compose up -d

# 4. Run database migrations and seeds
pnpm db:migrate
pnpm db:seed

# 5. Start development servers
pnpm dev:api     # NestJS API at http://localhost:3001
pnpm dev:web     # Next.js at http://localhost:3000
pnpm dev:worker  # Background worker
```

## Repository Structure

```
sllas/
├── apps/
│   ├── api/              # NestJS modular monolith
│   ├── web/              # Next.js (React + TypeScript)
│   ├── mobile/           # React Native (Expo)
│   └── worker/           # Background job processor
├── packages/
│   ├── api-client/       # Generated typed API client
│   ├── contracts/        # Shared TypeScript types & enums
│   ├── validation/       # Zod schemas (shared web/mobile/API)
│   ├── config/           # Shared configuration
│   └── design-tokens/    # Shared design tokens
├── database/
│   ├── migrations/       # TypeORM versioned migrations
│   └── seeds/            # Reference data seeds
├── documentation/
│   ├── adr/              # Architecture Decision Records
│   ├── diagrams/         # ERD, state machines, architecture
│   └── api/              # OpenAPI spec
├── infrastructure/
│   ├── docker/           # Dockerfiles
│   ├── terraform/        # IaC modules
│   ├── kubernetes/       # K8s manifests (future)
│   └── monitoring/       # Dashboards, alerts
├── tests/
│   ├── integration/      # API + DB integration tests
│   ├── end-to-end/       # Full journey tests
│   ├── security/         # IDOR, authz, privilege escalation
│   └── performance/      # Load and stress tests
├── .github/workflows/    # CI/CD pipelines
├── docker-compose.yml
├── pnpm-workspace.yaml
└── README.md
```

## Architecture

- **API**: Modular monolith (NestJS) with strong module boundaries
- **Worker**: Separate process for background jobs (notifications, expiry checks, imports/exports)
- **Event bus**: Transactional outbox → RabbitMQ → Worker
- **Auth**: Keycloak (OIDC/OAuth 2.0) — HTTP-only cookies for web, PKCE for mobile
- **Database**: PostgreSQL + PostGIS — spatial queries, exclusion constraints, append-only history
- **Cache**: Redis — throttling, search caching
- **Files**: S3-compatible (MinIO in dev) — signed URLs, malware scanning hook
- **Maps**: MapLibre + OpenStreetMap tiles

## Delivery Phases

| Phase | Scope | Status |
|-------|-------|--------|
| 0 | Design — ERD, state machines, OpenAPI, permissions, ADRs | ✅ Completed |
| 1 | Platform foundation — Auth, RBAC, audit, outbox, CI | ✅ Completed |
| 2 | Land registry — Parcels, boundaries, search | ✅ Completed |
| 3 | Applications & leases — Workflow, double-allocation guard | ✅ Completed |
| 4 | Notifications & recommendations — Scheduler, scoring engine | ✅ Completed |
| 5 | Mobile app — Offline capture, sync, push | ✅ Completed |
| 6 | Reporting & hardening — Dashboards, load tests, security | ✅ Completed |
| 7 | Pilot launch — Staging, production, monitoring | ✅ Pilot readiness baseline complete |

## Documentation

- [Domain Model (ERD)](documentation/diagrams/domain-model.md)
- [State Machines](documentation/diagrams/state-machines.md)
- [Permission Matrix](documentation/permission-matrix.md)
- [Risk & Assumptions](documentation/risks-and-assumptions.md)
- [OpenAPI Skeleton](documentation/api/openapi-skeleton.yaml)
- Architecture Decision Records: see [documentation/adr/](documentation/adr/)

## Pilot Launch Readiness Checklist

- Production identity and role mapping configured in Keycloak
- Rate limiting and security headers enabled at the API edge
- Health checks and Prometheus metrics monitored in deployment
- Audit export and operational dashboard access restricted to approved roles
- Staging environment verified for parcel, application, and notification flows
- Incident runbook and rollback plan reviewed before launch

## Environment Variables

Copy `.env.example` to `.env` for development or `.env.staging.example` to `.env.staging` for deployment. Production/staging requires Keycloak OIDC variables (`OIDC_ISSUER`, `OIDC_AUDIENCE`, `KEYCLOAK_CLIENT_ID`, `KEYCLOAK_CLIENT_SECRET`, and `NEXTAUTH_SECRET`) in addition to the database, SMTP, and service secrets. Never commit either filled environment file.

## Staging Deployment

The Linux VM staging Compose baseline, required DNS/TLS setup, and known pilot blockers are documented in [the staging deployment guide](documentation/deployment/linux-vm-staging.md).

## License

Proprietary — Government of Zimbabwe
