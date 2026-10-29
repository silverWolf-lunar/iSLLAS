# ADR-005: Transactional Outbox for Reliable Async Events

**Status:** Accepted
**Date:** 2026-10-24
**Deciders:** Architecture team

## Context

When a lease application is approved, multiple side effects must happen:
1. Create the lease record
2. Update the parcel status to LEASED
3. Send notifications to the client (in-app, email, SMS, push)
4. Log an audit event

Steps 1-2 must be transactional. Steps 3-4 are asynchronous but must be reliable — a lost notification about a lease expiry could have legal consequences.

## Decision

Use the **Transactional Outbox Pattern**: write events to an `outbox_events` table within the same database transaction as the business operation. A separate poller (in the worker process) reads unpublished events and publishes them to RabbitMQ.

## How It Works

```
┌──────────────────────────────────────────────┐
│ Database Transaction                          │
│  1. UPDATE lease_applications SET status=...  │
│  2. INSERT INTO leases (...)                  │
│  3. INSERT INTO outbox_events (event_type,    │
│     payload, status='PENDING')                │
│  4. INSERT INTO audit_events (...)            │
│  COMMIT                                       │
└──────────────────────────────────────────────┘
        │
        ▼ (Poller, every 1-5 seconds)
┌──────────────────────────────────────────────┐
│ Outbox Poller (Worker)                        │
│  1. SELECT FROM outbox_events                 │
│     WHERE status = 'PENDING'                  │
│     ORDER BY created_at LIMIT 100             │
│     FOR UPDATE SKIP LOCKED                    │
│  2. Publish each to RabbitMQ                  │
│  3. UPDATE outbox_events SET                  │
│     status = 'PUBLISHED'                      │
└──────────────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────────────┐
│ RabbitMQ Consumer (Worker)                    │
│  1. Route to handler by event_type            │
│  2. Send notifications, update caches, etc.   │
│  3. ACK message                               │
│  4. On failure: NACK with requeue,            │
│     backoff, eventually DLQ                   │
└──────────────────────────────────────────────┘
```

## Rationale

- **Atomicity**: Events are written in the same transaction as the business data. No data can be committed without its events, and vice versa.
- **At-least-once delivery**: The poller retries unpublished events. Consumers are idempotent.
- **No dual-write problem**: Unlike publishing to RabbitMQ directly from the service, the outbox avoids the scenario where the DB commits but the message publish fails (or vice versa).
- **Auditability**: The outbox table is a log of all events ever produced.
- **Simplicity**: No CDC (Change Data Capture) tool like Debezium needed. A simple poller is sufficient at our scale.

## Alternatives Considered

| Alternative | Why Not |
|------------|---------|
| Direct RabbitMQ publish in transaction | Dual-write problem: DB commits but publish fails, or vice versa |
| CDC with Debezium | Complex infrastructure; overkill for our scale |
| Event sourcing | Fundamental architecture change; team unfamiliar; not justified for this domain |
| Synchronous processing | Blocks the API response; notifications can be slow (SMS, email) |

## Consumer Idempotency

Every consumer checks an idempotency key (the `outbox_events.id`) before processing. If already processed, it ACKs without re-executing. This handles:
- Poller re-publishing after a crash
- RabbitMQ redelivery
- Network failures

## Consequences

- ✅ Reliable event delivery without distributed transactions
- ✅ Simple implementation (SQL poller + RabbitMQ)
- ✅ Events are auditable and replayable
- ⚠️ Small delay between commit and event processing (polling interval)
- ⚠️ Outbox table grows; needs periodic cleanup (retain for audit, archive old published events)
- ⚠️ Poller adds a small constant load on the database
