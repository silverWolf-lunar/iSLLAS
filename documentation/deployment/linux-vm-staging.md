# Linux VM staging deployment

This Compose setup is a staging baseline for a Linux VM with a public DNS name. Caddy terminates HTTPS for the web app and API; PostgreSQL/PostGIS data is persisted in a named volume. PostgreSQL is not published to the host. The web app uses a NextAuth BFF with an HttpOnly session cookie; browser requests to application APIs are proxied server-side to the API. The development stack remains in `docker-compose.yml`.

## Prepare the VM

- Install Docker Engine and the Docker Compose plugin.
- Point `DOMAIN` and `api.DOMAIN` DNS records at the VM's public IP (the API hostname is `api.<DOMAIN>`). Configure `OIDC_ISSUER` to the Keycloak realm issuer URL and ensure the `sllas-web` client has the callback URI `https://<DOMAIN>/api/auth/callback/keycloak`.
- Allow inbound TCP ports 80 and 443, plus UDP 443 if HTTP/3 is desired. Restrict SSH and any VM management ports to approved operator addresses.
- Provide a trusted SMTP service supporting TLS. Do not use Mailpit or development credentials.

## Configure and start

```sh
cp .env.staging.example .env.staging
```

Edit `.env.staging` with the deployment's DNS name, Keycloak client settings, and unique secret values. Generate the database password, `JWT_SECRET`, `WORKER_API_TOKEN`, `NEXTAUTH_SECRET`, and the Keycloak web-client secret with a cryptographically secure secret manager or `openssl rand -base64 48`; use a different value for each. Do not commit the filled file or send secrets in chat.

Before the first sign-in, pre-provision each operator in the SLLAS database by linking their Keycloak subject (`sub`) to a `users` row in `user_identities` with provider `keycloak`. The API rejects authenticated identities that are not explicitly linked. Ensure each Keycloak account has the realm role matching its SLLAS role, for example `sllas_registry_officer`.

The repository does not ship demo accounts, sample parcels, or sample import data. Run the reference-data seed only after migrations; create real users through the approved identity and administration process, then link their Keycloak subjects.

Use the provisioning command below for each approved user. Set values in the operator shell or secret manager; do not put them in `.env`, source control, or chat:

```sh
KEYCLOAK_SUBJECT='keycloak-user-sub' \
USER_EMAIL='person@example.gov.zw' \
USER_FIRST_NAME='First' \
USER_LAST_NAME='Last' \
USER_ROLE='REGISTRY_OFFICER' \
USER_PHONE='+263...' \
USER_OFFICE_ID='<organization UUID>' \
USER_PROVINCE_ID='<province UUID>' \
USER_DISTRICT_ID='<district UUID>' \
pnpm user:provision
```

`USER_PHONE`, `USER_OFFICE_ID`, `USER_PROVINCE_ID`, and `USER_DISTRICT_ID` are optional. The command is idempotent for the same Keycloak subject, rejects conflicting email links, and activates the account in a transaction.

Check and start the stack:

```sh
docker compose --env-file .env.staging -f docker-compose.staging.yml config --quiet
docker compose --env-file .env.staging -f docker-compose.staging.yml up -d --build
docker compose --env-file .env.staging -f docker-compose.staging.yml ps
docker compose --env-file .env.staging -f docker-compose.staging.yml logs --tail=100 migrate api worker caddy
```

The one-shot migration service must complete successfully before the API starts. The worker uses `WORKER_API_TOKEN` to authenticate its outbox requests; keep that value identical for the API and worker. A failed migration blocks API startup; inspect its logs and resolve the migration failure before retrying. Do not use `docker compose down -v` on an environment with data to preserve.

## Backups and rollback

Before deploying an update, take and verify a PostgreSQL backup using the `pg_dump` client for PostgreSQL 16, and retain it outside the VM. Back up uploaded documents separately if an object-storage service is added. Roll back by redeploying the previous immutable image versions and restoring the matching database backup if that release applied a destructive migration. The Compose file currently builds images locally; pin and publish a tested image tag before adopting an automated upgrade process.

## Remaining operator-owned prerequisites

This baseline does not provision a VM, DNS, SMTP account, Keycloak, or secret manager. Development login is disabled in this stack. Production still requires a reviewed Keycloak realm, pre-provisioned and linked user identities, tested backups, SMTP verification, monitoring/alerting, and an approved rollback procedure before opening access beyond the intended pilot network.
