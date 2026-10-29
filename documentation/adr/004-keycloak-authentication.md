# ADR-004: Keycloak for Authentication and Identity

**Status:** Accepted
**Date:** 2026-10-24
**Deciders:** Architecture team

## Context

SLLAS handles sensitive government land-tenure data and serves both staff (with MFA) and public clients. The system needs OIDC/OAuth 2.0 with support for:
- MFA for staff accounts
- PKCE flow for mobile
- HTTP-only cookie sessions for web
- Self-hosting for data sovereignty (government requirement)
- User management, role mapping, and session management

## Decision

Use **Keycloak** as the identity provider, self-hosted via Docker.

## Rationale

- **Data sovereignty**: Self-hosted, no data leaves the government's infrastructure.
- **OIDC/OAuth 2.0**: Standards-based; the API validates JWTs without Keycloak-specific code.
- **MFA**: Built-in TOTP, WebAuthn, and SMS OTP support.
- **PKCE flow**: Native support for mobile OAuth flows.
- **Admin console**: Built-in UI for managing users, roles, sessions, and identity providers.
- **Customizable**: Themes, login flows, and extensions via SPI.
- **Mature**: Used by Red Hat customers, government agencies worldwide, banks.

## Alternatives Considered

| Alternative | Why Not |
|------------|---------|
| Auth0 | SaaS, data leaves the country, recurring cost |
| AWS Cognito | Cloud-specific, data sovereignty concerns |
| Custom JWT auth | Reinventing the wheel; MFA, session management, and OIDC are complex |
| Supabase Auth | Less mature, limited MFA, not self-hostable in the same way |

## Architecture

```
[Web App] ──cookie──→ [API (session)] ──validate──→ [Keycloak]
[Mobile]  ──PKCE────→ [Keycloak] → access_token → [API (bearer)]
```

- Web: Keycloak issues session; API sets HTTP-only secure cookie. No tokens in browser JS.
- Mobile: PKCE flow; tokens stored in secure storage (Expo SecureStore). Refresh token rotation enabled.
- API: Validates access tokens via Keycloak's JWKS endpoint (cached).
- RBAC roles are stored in the SLLAS database, not in Keycloak. Keycloak handles authentication only; the API handles authorization.

## Consequences

- ✅ Standards-based, battle-tested authentication
- ✅ Self-hosted for data sovereignty
- ✅ MFA, session management, and brute-force protection out of the box
- ⚠️ Operational overhead: Keycloak needs its own database, monitoring, and updates
- ⚠️ Keycloak upgrades can be complex (database migrations)
- ⚠️ Learning curve for Keycloak administration
- 📋 Mitigation: Docker Compose for dev; production HA guide in runbooks
