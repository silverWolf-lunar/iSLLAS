# ADR-006: No Double Allocation via Database Exclusion Constraint

**Status:** Accepted
**Date:** 2026-10-24
**Deciders:** Architecture team

## Context

A critical invariant: **two active leases must never exist for the same parcel with overlapping time periods**. This must hold even under concurrent requests (two approvers clicking "approve" at the same millisecond).

## Decision

Enforce no-double-allocation at **three levels**:

1. **Database exclusion constraint** (ultimate guard)
2. **Application-level row locking** (prevents wasted work)
3. **UI-level status checks** (fast feedback)

## Implementation

### Level 1: Database Exclusion Constraint

```sql
-- Requires btree_gist extension for combining B-tree and GiST
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE leases ADD CONSTRAINT no_overlapping_leases
  EXCLUDE USING gist (
    parcel_id WITH =,
    lease_period WITH &&
  ) WHERE (status IN ('ACTIVE', 'EXPIRING_SOON', 'RENEWAL_REQUESTED', 'RENEWED'));
```

This constraint makes it **physically impossible** to insert two active leases for the same parcel with overlapping `tstzrange` periods. Even if two transactions commit simultaneously, the database rejects the second one.

### Level 2: Application-Level Locking

```typescript
// In the approval service
async approveApplication(applicationId: string, approverId: string) {
  return this.dataSource.transaction(async (manager) => {
    // Lock the parcel row to prevent concurrent approvals
    const parcel = await manager
      .createQueryBuilder(LandParcel, 'p')
      .setLock('pessimistic_write')
      .where('p.id = :id', { id: application.parcelId })
      .getOne();

    if (parcel.status !== 'RESERVED') {
      throw new ConflictException('Parcel is no longer available');
    }

    // Check no active lease exists (belt-and-suspenders)
    const activeLease = await manager.findOne(Lease, {
      where: { parcelId: parcel.id, status: In(['ACTIVE', 'EXPIRING_SOON']) }
    });
    if (activeLease) {
      throw new ConflictException('Parcel already has an active lease');
    }

    // Create lease, update parcel status, etc.
    // ...
  });
}
```

### Level 3: UI Status Checks

The UI checks parcel status before showing the "Approve" button and refreshes via SSE/polling. This is for UX only — it does not replace backend enforcement.

## Alternatives Considered

| Alternative | Why Not |
|------------|---------|
| Application-level locking only | Race conditions possible if app crashes between check and insert |
| Advisory locks | Don't survive connection drops; less reliable than row locks |
| Serializable isolation | Too aggressive; causes unnecessary retries on unrelated operations |
| Optimistic locking only | Version checks happen after the fact; doesn't prevent the INSERT |

## Testing

Integration test: two concurrent transactions attempt to create overlapping leases for the same parcel. Exactly one must succeed; the other must fail with a constraint violation.

```typescript
it('prevents double allocation', async () => {
  const results = await Promise.allSettled([
    approveApplication(app1.id, approver1.id),
    approveApplication(app2.id, approver2.id),
  ]);

  const successes = results.filter(r => r.status === 'fulfilled');
  const failures = results.filter(r => r.status === 'rejected');

  expect(successes).toHaveLength(1);
  expect(failures).toHaveLength(1);
});
```

## Consequences

- ✅ Database-level guarantee: impossible to violate even with bugs in application code
- ✅ Application-level lock: prevents wasted work (approval processing, PDF generation)
- ✅ Testable: integration test proves the constraint works
- ⚠️ Requires `btree_gist` extension in all PostgreSQL instances
- ⚠️ The exclusion constraint uses a GiST index, which has some write overhead
- ⚠️ Error handling must catch the constraint violation and return a user-friendly error
