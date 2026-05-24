## Context

The internal V0 preview was recently made browser-accessible over the public
HTTP IP by enabling explicit short-lived non-`Secure` preview cookies. That
solved the cookie policy issue, but the deployed `operation-web-preview`
container still lacks database runtime configuration. Static pages render
without `DATABASE_URL`, while `POST /api/auth/operator-v0-session` and protected
V0 APIs require the app-owned session ledger and scoped repositories.

The current server state shows:

- `operation-postgres-1` is healthy and attached to `operation_default`.
- The Postgres service has Docker DNS aliases `postgres` and
  `operation-postgres-1`.
- `operation-web-preview` is healthy for `/`, but runs on the default `bridge`
  network with no `DATABASE_URL`.

## Goals / Non-Goals

**Goals:**

- Make the long-lived Docker public preview capable of completing the internal
  V0 bootstrap route and protected V0 browser workflows.
- Keep a single explicit internal-preview launch path that is repeatable after
  rebuilds and server restarts.
- Preserve the Docker restart policy and current "demo/internal data only"
  security boundary.
- Keep secrets out of committed files; only the existing local Compose
  development password may be used as a documented non-production default.

**Non-Goals:**

- No production auth provider, HTTPS/domain setup, team invitation flow, managed
  database, backup/restore, monitoring, queue, storage, or external platform
  integration.
- No real customer/private/order/supplier/pricing data in the HTTP preview.
- No app code change to make database-backed APIs silently work without
  `DATABASE_URL`; missing DB config should remain a safe failure for protected
  routes.

## Decisions

1. **Attach `operation-web-preview` to `operation_default`.**
   - Rationale: Docker's user-defined bridge network supports name/alias
     resolution between containers. The existing Postgres service already has
     the `postgres` alias on `operation_default`, so the web preview can use
     `postgres:5432`.
   - Alternative: connect to host `127.0.0.1:5433` from inside the web
     container. Rejected because container loopback points at the web container,
     not the host database.
   - Alternative: publish Postgres to a public interface. Rejected because the
     current local-only DB should not be exposed beyond host/container network
     boundaries.

2. **Use `OPERATION_PREVIEW_DATABASE_URL` as the Docker preview override.**
   - Rationale: host-side checks and migrations use
     `127.0.0.1:5433`, while the web container must use `postgres:5432`.
     A distinct override avoids accidentally passing the host-only URL into the
     container.
   - Default: `postgres://operation:operation_dev_password@postgres:5432/operation_dev`
     for the existing local Compose database only.
   - Alternative: require `DATABASE_URL` to be set by the operator. Rejected for
     this V0 preview because it is easy to set the host URL and reproduce the
     outage.

3. **Keep `docker:preview` focused on launching the web preview.**
   - Rationale: existing scripts build and run containers separately. Docs will
     state the prerequisite `docker compose --profile db up -d postgres` and
     host-side migration command before `pnpm docker:preview`.
   - Alternative: make `docker:preview` also start Postgres and run migrations.
     Deferred because migrations are a separate DB operation with different host
     URL semantics and should remain explicit until production ops is defined.

## Risks / Trade-offs

- **Preview DB is local-only and not production-grade** -> Mitigation: docs keep
  the internal/demo data boundary and call out that HTTPS, production auth,
  backup/restore, and monitoring remain future productionization work.
- **Network `operation_default` may not exist on a fresh server** -> Mitigation:
  docs require `docker compose --profile db up -d postgres` before launching the
  preview; the command fails visibly if the network is missing.
- **Schema may be stale after rebuild** -> Mitigation: docs require host-side
  `DATABASE_URL=postgres://operation:operation_dev_password@127.0.0.1:5433/operation_dev pnpm db:migrate`
  before deploying the preview.
- **Committed default contains the existing local Compose password** ->
  Mitigation: it is the already committed development credential for the
  local-only Compose service, not a production secret; override is available for
  any non-default environment.
- **HTTP preview cookie remains insecure by production standards** ->
  Mitigation: no scope expansion; this remains internal V0 only.

## Migration Plan

1. Start or keep the Compose Postgres service running:
   `docker compose --profile db up -d postgres`.
2. Run migrations from the host using the host-reachable DB URL.
3. Rebuild the web image.
4. Recreate `operation-web-preview` with `--network operation_default`,
   `DATABASE_URL` set to the container-network URL, the two V0 preview flags,
   and `--restart unless-stopped`.
5. Verify static routes, V0 bootstrap, auth session view, and a browser V0 flow.
6. Roll back by removing the preview container and relaunching the prior static
   preview command without V0 bootstrap flags, accepting that protected V0
   browser workflows will not work.
