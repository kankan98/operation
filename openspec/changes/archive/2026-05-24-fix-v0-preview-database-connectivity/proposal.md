## Why

The public internal V0 preview currently renders static routes, but the
database-backed V0 bootstrap route returns HTTP 500 because the Docker preview
container does not receive a container-reachable `DATABASE_URL`. This blocks
the next usable-version milestone: evaluators cannot enter the V0 workspace and
try the saved-session, AI-review, talk-track, and next-action workflow.

Root-cause evidence:

- `http://203.195.161.93:3000/` and `/sessions` return HTTP 200.
- `POST /api/auth/operator-v0-session` returns HTTP 500.
- `docker logs operation-web-preview` reports `DATABASE_URL_REQUIRED`.
- `docker inspect operation-web-preview` shows no `DATABASE_URL` and the
  default `bridge` network.
- `operation-postgres-1` is on the `operation_default` user-defined bridge with
  aliases `postgres` and `operation-postgres-1`.

Source and value notes:

- Docker official bridge-network docs state that user-defined bridge networks
  let containers resolve each other by name or alias, while default bridge
  networking lacks that automatic DNS behavior:
  https://docs.docker.com/engine/network/drivers/bridge/
- Docker official restart-policy docs confirm `--restart unless-stopped` is
  the supported container restart policy for host or Docker daemon restart
  recovery: https://docs.docker.com/engine/containers/start-containers-automatically/
- PostgreSQL official libpq docs define `postgres://` and `postgresql://`
  connection URI forms, matching the app's accepted `DATABASE_URL` format:
  https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNSTRING-URIS
- `systematic-debugging` conclusion: the failing component boundary is Docker
  preview runtime configuration, not the auth route code. Static pages do not
  need DB access, but V0 auth/API routes do.
- `problem-statement` framing: an internal evaluator is trying to test the
  V0 operator workflow, but cannot enter the workspace because preview runtime
  config omits the database connection, which makes the product appear unusable
  even though the workflow code exists.

## What Changes

- Update the public Docker preview contract so database-backed V0 preview mode
  requires a reachable preview database configuration, not only auth preview
  flags.
- Update root Docker preview scripts to run the web preview container on the
  Compose user-defined bridge network and pass a container-reachable
  `DATABASE_URL`, with an override variable for non-default preview databases.
- Update README, app README, and technical roadmap instructions so operators run
  the local preview Postgres service, migrate it from the host, and launch the
  web preview with the container-network database URL.
- Keep the existing `--restart unless-stopped` recovery policy and internal V0
  HTTP preview data-safety boundaries.
- Do not add production authentication, managed database, HTTPS, backup,
  monitoring, or real sensitive-data readiness in this change.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `docker-deployment`: Public preview mode must document and support a
  database-backed V0 run command that joins the preview database network and
  passes a container-reachable `DATABASE_URL`.
- `v0-internal-trial-preview`: Internal V0 public preview must verify
  database-backed bootstrap/API access, not only static route health.

## Impact

- Affected files:
  - `package.json`
  - `.env.example`
  - `README.md`
  - `apps/web/README.md`
  - `docs/architecture/technical-implementation-roadmap.md`
  - `openspec/specs/docker-deployment/spec.md`
  - `openspec/specs/v0-internal-trial-preview/spec.md`
- Affected systems:
  - Docker public preview container `operation-web-preview`
  - Compose Postgres service `operation-postgres-1`
  - V0 auth bootstrap and protected scoped APIs
- No new npm package, provider SDK, external service, or production credential is
  introduced.
