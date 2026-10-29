# ADR-003: TypeORM over Prisma for Data Access

**Status:** Accepted
**Date:** 2026-10-24
**Deciders:** Architecture team

## Context

The API needs an ORM or query builder for PostgreSQL. Prisma is popular in the TypeScript ecosystem but lacks native support for PostGIS geometry types, custom column types, and raw spatial queries. TypeORM supports custom column types and raw SQL.

## Decision

Use **TypeORM** with **versioned migrations** for all data access. Use raw SQL or the query builder for spatial queries.

## Rationale

- **Custom column types**: TypeORM supports `@Column({ type: 'geometry', spatialFeatureType: 'Polygon', srid: 4326 })` natively.
- **Raw SQL**: Complex spatial queries (overlap detection, bbox search, radius search) are written as raw SQL or query builder expressions, which is more natural than trying to force Prisma to handle geometry.
- **Migrations**: TypeORM generates migration files from entity changes. Migrations are versioned and run in order.
- **Exclusion constraints**: Can be added in migrations using raw SQL — TypeORM doesn't abstract them but doesn't prevent them.
- **NestJS integration**: `@nestjs/typeorm` is first-party and well-documented.

## Trade-offs

| Aspect | TypeORM | Prisma |
|--------|---------|--------|
| Type safety | Good (decorators) | Excellent (generated client) |
| Spatial support | Native column type + raw SQL | Not supported natively |
| Migration tooling | Entity-driven generation | Schema-driven, excellent DX |
| Raw SQL | Natural escape hatch | `$queryRaw` works but loses type safety |
| Performance | QueryBuilder is flexible | Generated queries are optimized |
| Community | Large, but less active recently | Very active |

## Consequences

- ✅ Full PostGIS support without workarounds
- ✅ Migrations can include raw SQL for extensions, constraints, indexes
- ⚠️ TypeORM's type safety is weaker than Prisma's generated client
- ⚠️ QueryBuilder API can be verbose
- ⚠️ Team must write and review raw SQL for spatial operations
- 📋 Mitigation: Spatial queries are encapsulated in repository classes with typed return values
