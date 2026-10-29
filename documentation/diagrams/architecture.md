# SLLAS Architecture Overview

## System Architecture

```mermaid
graph TB
    subgraph Clients["Client Applications"]
        WEB["Web App<br/>(Next.js + React)"]
        MOB["Mobile App<br/>(React Native + Expo)"]
    end

    subgraph Gateway["API Layer"]
        API["NestJS API<br/>(Modular Monolith)"]
    end

    subgraph Auth["Identity"]
        KC["Keycloak<br/>(OIDC / OAuth 2.0)"]
    end

    subgraph Data["Data Layer"]
        PG["PostgreSQL + PostGIS"]
        RD["Redis<br/>(Cache + Rate Limit)"]
        S3["MinIO / S3<br/>(Files)"]
    end

    subgraph Async["Async Processing"]
        RMQ["RabbitMQ"]
        WKR["Worker Process"]
    end

    subgraph Observe["Observability"]
        OTEL["OpenTelemetry"]
        JAEG["Jaeger / Logs"]
    end

    WEB -->|HTTP-only Cookies| API
    MOB -->|Bearer JWT (PKCE)| API
    WEB -->|OIDC Login| KC
    MOB -->|PKCE Flow| KC
    API -->|Validate JWT| KC
    API -->|SQL + PostGIS| PG
    API -->|Cache / Throttle| RD
    API -->|Signed URLs| S3
    API -->|Outbox Events| PG
    WKR -->|Poll Outbox| PG
    WKR -->|Publish| RMQ
    WKR -->|Consume| RMQ
    WKR -->|Send Notifications| SMTP["Email / SMS"]
    WKR -->|Generate PDFs| PDF["PDF Engine"]
    API -->|Traces| OTEL
    WKR -->|Traces| OTEL
    OTEL --> JAEG
```

## API Module Architecture

```mermaid
graph LR
    subgraph API["NestJS API (Modular Monolith)"]
        direction TB
        subgraph Modules["Feature Modules"]
            IDENT["Identity"]
            AC["Access Control"]
            ORG["Organizations"]
            LR["Land Registry"]
            CL["Clients"]
            APP["Applications"]
            LS["Leases"]
            REC["Recommendations"]
            NOT["Notifications"]
            FIL["Files"]
            REP["Reporting"]
            AUD["Audit"]
            ADM["Administration"]
        end

        subgraph Shared["Shared Infrastructure"]
            AUTH["Auth Guard"]
            RBAC["RBAC + Jurisdiction"]
            OUTBOX["Transactional Outbox"]
            OTEL2["Telemetry"]
            VALID["Validation Pipes"]
            ERR["Error Handling"]
        end
    end

    IDENT --> AC
    AC --> AUTH
    LR --> OUTBOX
    APP --> OUTBOX
    LS --> OUTBOX
    APP --> LR
    LS --> APP
    LS --> LR
    REC --> LR
    NOT --> OUTBOX
    REP --> LR
    REP --> APP
    REP --> LS
    AUD -.->|Listen| OUTBOX
```

## Module Layers (Each Module)

```mermaid
graph TB
    subgraph Module["Module (e.g., Land Registry)"]
        CTRL["Controllers<br/>(HTTP, validation, auth)"]
        SVC["Application Services<br/>(orchestration, transactions)"]
        DOM["Domain<br/>(entities, value objects, rules)"]
        INFRA["Infrastructure<br/>(repositories, adapters)"]

        CTRL --> SVC
        SVC --> DOM
        SVC --> INFRA
        INFRA --> DOM
    end

    EXT["External Systems<br/>(DB, Queue, S3)"] --> INFRA
```

## Data Flow: Application Approval

```mermaid
sequenceDiagram
    participant A as Approver (Web)
    participant API as NestJS API
    participant DB as PostgreSQL
    participant OB as Outbox Poller
    participant RMQ as RabbitMQ
    participant WKR as Worker
    participant CL as Client (Mobile)

    A->>API: POST /applications/{id}/transitions {toStatus: APPROVED}
    API->>DB: BEGIN TRANSACTION
    API->>DB: SELECT parcel FOR UPDATE (row lock)
    API->>DB: Check: approver ≠ reviewer
    API->>DB: Check: parcel status = RESERVED
    API->>DB: UPDATE application SET status = APPROVED
    API->>DB: UPDATE parcel SET status = ALLOCATED
    API->>DB: INSERT application_status_history
    API->>DB: INSERT audit_event
    API->>DB: INSERT outbox_event (APPLICATION_APPROVED)
    API->>DB: COMMIT
    API->>A: 200 OK {application}

    Note over OB,RMQ: Async (1-5s delay)
    OB->>DB: SELECT outbox_events WHERE status = PENDING
    OB->>RMQ: Publish APPLICATION_APPROVED
    OB->>DB: UPDATE outbox_event SET status = PUBLISHED

    RMQ->>WKR: Deliver APPLICATION_APPROVED
    WKR->>WKR: Generate offer letter PDF
    WKR->>DB: INSERT lease offer record
    WKR->>DB: INSERT notification_deliveries (email, SMS, push, in-app)
    WKR->>CL: Push notification
    WKR->>RMQ: ACK
```

## Deployment Architecture (Docker)

```mermaid
graph TB
    subgraph Docker["Docker Compose / Container Orchestration"]
        subgraph App["Application Containers"]
            API_C["sllas-api<br/>:3001"]
            WEB_C["sllas-web<br/>:3000"]
            WKR_C["sllas-worker"]
        end

        subgraph Infra["Infrastructure Containers"]
            PG_C["postgis/postgis:16<br/>:5432"]
            RD_C["redis:7<br/>:6379"]
            RMQ_C["rabbitmq:3.13<br/>:5672 / :15672"]
            MIN_C["minio<br/>:9000 / :9001"]
            KC_C["keycloak:24<br/>:8080"]
        end

        subgraph Dev["Dev Tools"]
            MAIL["mailpit<br/>:8025"]
            JAEG_C["jaeger<br/>:16686"]
        end
    end

    API_C --> PG_C
    API_C --> RD_C
    API_C --> MIN_C
    API_C --> KC_C
    WKR_C --> PG_C
    WKR_C --> RMQ_C
    WKR_C --> MIN_C
    WKR_C --> MAIL
    KC_C --> PG_C
    API_C --> JAEG_C
    WKR_C --> JAEG_C
```
