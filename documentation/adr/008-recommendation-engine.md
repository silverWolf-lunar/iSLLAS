# ADR-008: Rules-Based Recommendation Engine (Data-Driven, Not Code-Driven)

**Status:** Accepted
**Date:** 2026-10-24
**Deciders:** Architecture team

## Context

SLLAS must recommend suitable land for a given activity (e.g., "crop farming" → best parcels) and suitable activities for a given parcel. The recommendations must be **explainable** ("why this match") and **admin-configurable** without code deployments.

## Decision

Build a **rules-based scoring engine** where activity profiles and their criteria are stored as **data in the database**, not as code. Design the scoring behind an interface so ML can be added later without changing the API.

## Scoring Algorithm

### 1. Activity Profile (stored in `activity_profiles` table)

```json
{
  "name": "CROP_FARMING",
  "hard_constraints": {
    "min_hectares": 5,
    "water_access": true,
    "allowed_categories": ["STATE", "COMMUNAL", "RESETTLEMENT"],
    "allowed_natural_regions": ["I", "II", "III"]
  },
  "weighted_preferences": {
    "soil_suitability": { "weight": 0.30, "preferred": ["LOAM", "CLAY"] },
    "natural_region": { "weight": 0.25, "preferred_order": ["I", "II", "III"] },
    "road_access": { "weight": 0.20, "preferred_order": ["TARRED", "GRAVEL", "DIRT_TRACK"] },
    "electricity": { "weight": 0.10, "preferred": true },
    "grid_proximity": { "weight": 0.10, "max_km": 50 },
    "rainfall": { "weight": 0.05, "min_mm": 600 }
  }
}
```

### 2. Scoring Process

```
For each AVAILABLE parcel:
  1. Check hard constraints → if any fail, EXCLUDE parcel
  2. For each weighted preference:
     a. Normalize criterion value to [0, 1]
     b. Multiply by weight
  3. Sum weighted scores → total score ∈ [0, 1]
  4. Record per-criterion scores for explanation
  5. Sort by total score, return top N
```

### 3. Normalization Rules

| Criterion | Normalization |
|-----------|---------------|
| Soil suitability | 1.0 if in preferred list, 0.5 if partially suitable, 0.0 otherwise |
| Natural Region | 1.0 for first preferred, 0.75 for second, 0.5 for third, etc. |
| Road access | 1.0 for first preferred, 0.66 for second, 0.33 for third, 0.0 for NONE |
| Electricity | 1.0 if available, 0.0 otherwise |
| Grid proximity | Linear decay: `max(0, 1 - (distance_km / max_km))` |
| Rainfall | 1.0 if above min, linear decay below |

### 4. Explanation Output

```json
{
  "parcel_id": "...",
  "total_score": 0.82,
  "rank": 1,
  "explanations": [
    { "criterion": "soil_suitability", "score": 0.90, "weight": 0.30, "weighted": 0.27, "reason": "Loam soil is ideal for crop farming" },
    { "criterion": "natural_region", "score": 1.00, "weight": 0.25, "weighted": 0.25, "reason": "Region I — highest rainfall, best growing conditions" },
    { "criterion": "road_access", "score": 0.66, "weight": 0.20, "weighted": 0.13, "reason": "Gravel road access — suitable but not ideal" },
    { "criterion": "electricity", "score": 1.00, "weight": 0.10, "weighted": 0.10, "reason": "Electricity is available on-site" },
    { "criterion": "grid_proximity", "score": 0.70, "weight": 0.10, "weighted": 0.07, "reason": "15 km from nearest grid connection" },
    { "criterion": "rainfall", "score": 1.00, "weight": 0.05, "weighted": 0.05, "reason": "800mm annual rainfall exceeds 600mm minimum" }
  ],
  "excluded_by": []
}
```

## Interface for Future ML

```typescript
interface RecommendationEngine {
  recommend(
    input: RecommendationInput,
    options: RecommendationOptions,
  ): Promise<RecommendationResult[]>;
}

// Current implementation
class RulesBasedRecommendationEngine implements RecommendationEngine { ... }

// Future implementation
class MLRecommendationEngine implements RecommendationEngine { ... }

// Hybrid: rules for hard constraints, ML for scoring
class HybridRecommendationEngine implements RecommendationEngine { ... }
```

## Audit Trail

Every recommendation run is stored in `recommendation_runs`:
- Input parameters (activity profile, filters)
- Rule version at the time of the run
- Full results with scores and explanations
- Who requested it and when

This enables:
- Debugging why a parcel was or wasn't recommended
- Tuning weights based on outcomes
- Compliance auditing

## Consequences

- ✅ Admins can add/edit activity profiles and weights without deployments
- ✅ Fully explainable: every score has a per-criterion breakdown
- ✅ Auditable: every run is logged with inputs and outputs
- ✅ ML-ready: interface allows swapping the scoring engine
- ⚠️ Rules-based scoring has limited expressiveness (no feature interactions, no learning)
- ⚠️ Weight tuning is manual; admins need guidance
- ⚠️ Performance: scoring all available parcels for every request; cache results in Redis
