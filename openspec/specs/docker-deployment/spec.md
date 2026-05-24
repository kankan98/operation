# docker-deployment Specification

## Purpose
Define the accepted Docker containerization baseline for building, running, and locally developing the Next.js web application without adding production infrastructure, external services, or provider-specific deployment configuration.
## Requirements
### Requirement: Docker image is buildable from root
The repository SHALL provide a Dockerfile at the root that produces a production-ready image of the Next.js web application.

#### Scenario: Docker build succeeds
- **WHEN** `docker build -t operation-web .` is run from the repository root
- **THEN** a multi-stage build completes without errors and produces a tagged image

#### Scenario: Build context is minimized
- **WHEN** the Docker build runs
- **THEN** `node_modules/`, `.next/`, `.git/`, `.env` files, and other non-essential files are excluded from the build context via `.dockerignore`

#### Scenario: Production image does not contain dev tooling
- **WHEN** the built image is inspected
- **THEN** only production dependencies, the compiled Next.js server, and static assets are present; dev dependencies, TypeScript source, and build caches are excluded

### Requirement: Docker container serves the application
The Docker image SHALL start a Next.js production server that responds to HTTP requests on port 3000.

#### Scenario: Container starts and responds
- **WHEN** a container is started from the production image
- **THEN** the root route (`/`) returns a 200 HTTP status and renders the Chinese operations shell

#### Scenario: Health check is configured
- **WHEN** the container runs
- **THEN** Docker HEALTHCHECK periodically verifies that the root route responds successfully

#### Scenario: Environment variables are configurable
- **WHEN** the container is started with custom `PORT` or `HOSTNAME` environment variables
- **THEN** the Next.js server respects the configured values

### Requirement: Local development via Docker Compose
The repository SHALL provide a `docker-compose.yml` for local development with hot-reload.

#### Scenario: Dev compose starts with hot-reload
- **WHEN** `docker compose up` is run from the repository root
- **THEN** a development container starts with Turbopack dev server on port 3000 and source files are bind-mounted for live editing

#### Scenario: Dev compose shuts down cleanly
- **WHEN** `docker compose down` is run
- **THEN** the container is removed and no orphan processes remain

### Requirement: Docker scripts are accessible from root
The root `package.json` SHALL provide convenience npm scripts for Docker operations.

#### Scenario: Build script works
- **WHEN** `pnpm docker:build` is run from the repository root
- **THEN** the Docker image is built with the same result as the direct `docker build` command

#### Scenario: Run script works
- **WHEN** `pnpm docker:run` is run from the repository root
- **THEN** a production container starts on port 3000 using the built image

### Requirement: Docker usage is documented
The app documentation SHALL include Docker build, run, and development commands.

#### Scenario: README includes Docker section
- **WHEN** a developer reads `apps/web/README.md`
- **THEN** they find commands for Docker build, production run, and development compose, with notes on environment variables and image size

### Requirement: Public preview can use Docker restart policy
The Docker deployment baseline SHALL document a long-lived public preview mode
that uses a named container and Docker restart policy so the preview can restart
after host or Docker daemon restarts when the Docker service is enabled.

#### Scenario: Public preview container is started
- **WHEN** a contributor starts the public preview as a long-lived container
- **THEN** the documented command uses a stable container name and a restart
  policy such as `--restart unless-stopped` instead of `--rm`

#### Scenario: Disposable local run is used
- **WHEN** a contributor starts a local one-off Docker run for quick
  verification
- **THEN** the disposable `docker:run` behavior may still remove the container
  on exit and is not treated as the public preview restart strategy

#### Scenario: Host restarts
- **WHEN** the server host or Docker daemon restarts after the public preview
  container was intentionally left running with restart policy
- **THEN** Docker is expected to restart the named preview container, subject to
  the Docker service itself being enabled on the host

### Requirement: Public preview can reach its preview database
The Docker deployment baseline SHALL provide a documented internal V0 public
preview launch path that gives the web preview container a container-reachable
PostgreSQL `DATABASE_URL` without exposing the local preview database publicly.

#### Scenario: Preview database service is started
- **WHEN** a contributor prepares the internal V0 public preview on the server
- **THEN** the documented steps SHALL start the Compose Postgres service on the
  repository's user-defined Docker network before launching the web preview

#### Scenario: Preview web container joins database network
- **WHEN** the long-lived web preview container is started for internal V0
  evaluation
- **THEN** the command SHALL attach it to the same user-defined Docker network
  as the preview Postgres service and pass a `DATABASE_URL` whose host is
  reachable from inside the web container

#### Scenario: Preview database stays local to host and Docker network
- **WHEN** the internal V0 public preview uses the Compose Postgres service
- **THEN** the database SHALL remain bound to the host loopback interface for
  host-side commands and reachable to the web preview through Docker networking,
  without publishing Postgres on a public interface

#### Scenario: Preview database URL can be overridden
- **WHEN** the default local Compose database is not the desired preview
  database
- **THEN** the launch path SHALL allow an operator-provided preview database URL
  without committing production credentials
