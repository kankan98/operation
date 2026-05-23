## Why

The web application bootstrap is complete and verified. The next operational step is containerizing the application so that:

- Development and production environments share the same runtime configuration.
- New team members can start the full stack with a single command without host-side Node.js/pnpm setup.
- CI/CD pipelines can build and test the application in an isolated, reproducible container.
- The application is ready for deployment to any container-compatible host without changing the build workflow.

This change adds Docker containerization for the `apps/web` Next.js application only. It does not add database, auth provider, AI provider, queue, storage, or external platform integration containers.

## What Changes

- Add a multi-stage `Dockerfile` at the repository root that builds and serves the Next.js application.
- Add a `.dockerignore` file to exclude unnecessary files from the Docker build context.
- Add a `docker-compose.yml` for local development and testing.
- Add deployment documentation covering build, run, environment variables, and container health-check.
- Add a `Dockerfile.dev` (or dev service in compose) for hot-reload development if needed.
- Update root `package.json` scripts to include Docker build/run convenience commands.
- Do not add production SSL termination, reverse proxy, database containers, or deployment platform configuration.

## Capabilities

### New Capabilities

- `docker-deployment`: Defines Docker containerization for the Next.js web application, including multi-stage build, development compose, production image, and health check.

### Modified Capabilities

- `web-application-bootstrap`: Updated root scripts with Docker convenience commands.

## Impact

- New files: `Dockerfile`, `.dockerignore`, `docker-compose.yml`.
- Modified files: root `package.json` (Docker script aliases).
- Documentation: updated `apps/web/README.md` with Docker commands.
- No changes to application source code, routing, components, or behavior.
- No new runtime dependencies.
- No production deployment provider lock-in.
