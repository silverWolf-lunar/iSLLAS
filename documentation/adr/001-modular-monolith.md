# ADR-001: Modular Monolith over Microservices

**Status:** Accepted
**Date:** 2026-10-24
**Deciders:** Architecture team

## Context

SLLAS requires multiple bounded contexts (land registry, applications, leases, recommendations, notifications) that share data and need transactional consistency. The team is small and needs to move fast.

## Decision

Use a **modular monolith** architecture for the API (NestJS), with strong module boundaries, plus a separate **worker** process for background jobs.

## Rationale

- **Transactional consistency**: Many operations span multiple aggregates (approve application → create lease → update parcel status). A monolith provides native database transactions without saga complexity.
- **Team size**: A small team managing 10+ microservices would spend more time on infrastructure than features.
- **Performance**: In-process calls are faster than network calls. No service mesh overhead.
- **Simpler deployment**: One API container + one worker container. No service discovery, circuit breakers, or distributed tracing across services.
- **Migration path**: Module boundaries are enforced via NestJS module encapsulation. If a module needs to scale independently later, it can be extracted into a service.

## Module boundaries

- Each module has its own directory under `src/modules/`
- Modules communicate via:
  - **Direct imports** for synchronous queries (read models)
  - **Transactional outbox events** for asynchronous side effects (notifications, status updates)
- No module directly accesses another module's database tables. Shared access goes through the owning module's service layer.
- Shared types, validation schemas, and enums live in `packages/contracts` and `packages/validation`.

## Consequences

- ✅ Simpler development and deployment
- ✅ Transactional consistency without distributed transactions
- ✅ Clear migration path to microservices if needed
- ⚠️ Must enforce module boundaries through code review and linting rules
- ⚠️ Single deployment unit means all modules deploy together
- ⚠️ Scaling is vertical (bigger instance) until extraction is needed
