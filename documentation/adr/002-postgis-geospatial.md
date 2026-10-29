# ADR-002: PostgreSQL with PostGIS for Geospatial Data

**Status:** Accepted
**Date:** 2026-10-24
**Deciders:** Architecture team

## Context

SLLAS must store, query, and validate land parcel boundaries (polygons), support spatial searches (bounding box, radius, point-in-polygon), detect overlapping boundaries, and compute areas. These are core features, not nice-to-haves.

## Decision

Use **PostgreSQL** with the **PostGIS** extension for all geospatial data storage and queries.

## Rationale

- **Native spatial types**: `geometry(Polygon, 4326)`, `geometry(Point, 4326)`, `geometry(MultiPolygon, 4326)` map directly to the domain.
- **Spatial functions**: `ST_Intersects`, `ST_Contains`, `ST_Within`, `ST_DWithin`, `ST_Area`, `ST_Centroid`, `ST_IsValid`, `ST_Simplify` — all available natively without external services.
- **Overlap detection**: `ST_Intersects(a.boundary, b.boundary)` is the exact operation needed for parcel boundary validation.
- **GiST indexes**: Efficient spatial indexing for queries over 100k+ parcels.
- **Exclusion constraints**: Combined with `btree_gist`, enables database-level enforcement of no-double-allocation (`parcel_id + lease_period` range overlap exclusion).
- **Standards-based**: SRID 4326 (WGS 84) is the GPS standard. GeoJSON import/export is built in (`ST_GeomFromGeoJSON`, `ST_AsGeoJSON`).
- **Ecosystem**: Mature, well-documented, widely deployed in GIS applications worldwide.

## Alternatives Considered

| Alternative | Why Not |
|------------|---------|
| MongoDB with geospatial indexes | Polygon queries are limited; no spatial joins; no exclusion constraints |
| Elasticsearch geospatial | Good for search but not a primary data store; no transactions |
| Application-level geometry (Turf.js) | Cannot index, cannot enforce at database level, slow at scale |
| Separate GIS service (GeoServer) | Added complexity; another service to manage; PostGIS covers our needs |

## Consequences

- ✅ All spatial operations handled by the database, not application code
- ✅ Exclusion constraints enforce data integrity at the database level
- ✅ Well-indexed spatial queries meet p95 < 1s target
- ⚠️ Requires PostGIS extension in all environments (dev, CI, staging, production)
- ⚠️ TypeORM has limited PostGIS support; raw SQL needed for spatial queries
- ⚠️ Team needs basic PostGIS knowledge
