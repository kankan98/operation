## Context

The bootstrap change (`bootstrap-web-application`) delivered a working Next.js application under `apps/web` with pnpm workspace, TypeScript, Tailwind CSS, shadcn/ui, and lucide-react. All static checks pass: lint, typecheck, and production build.

The application currently runs via `pnpm dev` (Turbopack dev server) or `pnpm build && pnpm start` (production server). Both require Node.js 24+, pnpm 11.2.2, and project dependencies installed on the host.

This change adds Docker-based build and run so the application can be built and served in a containerized environment without host-side tooling beyond Docker.

Relevant constraints from existing design decisions:

- The application is a pure Next.js App Router static+server app with no database, no auth provider, no AI provider calls, and no external integrations yet.
- The root package manager is pnpm 11.2.2, and the workspace is configured via `pnpm-workspace.yaml`.
- The app lives under `apps/web` and uses `@/*` import aliases.
- Architecture boundaries prevent adding production deployment provider configuration (e.g., Vercel, Fly, AWS ECS) in this change.
- Sensitive environment variables must not be baked into the image.

## Goals / Non-Goals

**Goals:**

- Create a reproducible multi-stage Docker image for the Next.js application.
- Support local development via `docker compose up` with hot-reload.
- Support production-like image build and run for testing and CI.
- Include `.dockerignore` to keep build context small.
- Document all Docker commands in the app README.
- Add root-level pnpm scripts for Docker convenience.

**Non-Goals:**

- Do not add database containers, reverse proxy, SSL termination, or platform-specific deployment config.
- Do not modify any application source code (components, routes, styles, logic).
- Do not introduce Docker Compose for production deployment; the compose file is for local development and testing only.
- Do not configure CI/CD pipelines or deployment orchestration.
- Do not add health-check endpoints in application code; use Docker-level health checks only.

## Decisions

1. **Multi-stage Dockerfile with pnpm + Node.js 24.**
   - Rationale: The project uses pnpm 11.2.2 and Node.js 24. Using the official Node.js 24 image with corepack/pnpm avoids version drift and matches the local development environment. The default image source is ECR Public's Docker Official Images mirror (`public.ecr.aws/docker/library/node:24-alpine`) because Docker Hub access is unreliable in the current server network; other environments can override `NODE_IMAGE=node:24-alpine`.
   - Stages:
     - `deps`: install dependencies with pnpm.
     - `builder`: run `pnpm build` for the web app.
     - `runner`: copy built artifacts and production node_modules, serve with `next start`.
   - Alternatives considered: Single-stage image; rejected because dev tooling and source code should not be in the production image.

2. **Use `.dockerignore` to minimize build context.**
   - Rationale: Large `node_modules`, `.next` caches, git history, and `.env` files should never be sent to the Docker daemon. A strict `.dockerignore` prevents accidental secret leakage and speeds up builds.
   - Files excluded: `node_modules/`, `.next/`, `.git/`, `.env`, `.env.*`, `*.md` (except README), `pnpm-lock.yaml` is needed but already at root.

3. **docker-compose.yml for local dev only.**
   - Rationale: A single service compose file lets developers run `docker compose up` without remembering Docker build/run flags. It maps port 3000, mounts source for hot-reload, and sets required env vars.
   - Dev mode: bind-mount `apps/web` and use `pnpm dev` via Turbopack with file-watching.
   - Production mode: build the image and run without source mounts.
   - Alternatives considered: No compose file; rejected because it adds unnecessary friction for team members who want a single command to start.

4. **Environment variables via `.env` file (documented), not baked into image.**
   - Rationale: The app currently has no secrets, but the Dockerfile pattern should set up for future env injection. Document the `NEXT_PUBLIC_*` and server-side env patterns.
   - The `.env` file is in `.dockerignore` so it never leaks into the image.

5. **Health check at Docker level, not in application code.**
   - Rationale: The app has no health-check route yet. A Docker HEALTHCHECK using `curl` against the app's root route (`http://localhost:3000`) is sufficient for container orchestration awareness. Adding an application-level health check is deferred to a future change that adds monitoring.

6. **Root package.json scripts for Docker convenience.**
   - Rationale: Current scripts (`pnpm dev`, `pnpm build`, etc.) are host-side. Adding `pnpm docker:build` and `pnpm docker:run` gives a consistent interface for both host and container workflows.

## Dockerfile Strategy

```dockerfile
# Stage 1: Install dependencies
ARG NODE_IMAGE=public.ecr.aws/docker/library/node:24-alpine

FROM ${NODE_IMAGE} AS deps
RUN corepack enable && corepack prepare pnpm@11.2.2 --activate
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/web/package.json ./apps/web/
RUN pnpm install --frozen-lockfile

# Stage 2: Build
FROM ${NODE_IMAGE} AS builder
RUN corepack enable && corepack prepare pnpm@11.2.2 --activate
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

# Stage 3: Production runner
FROM ${NODE_IMAGE} AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1
CMD ["node", "apps/web/server.js"]
```

Note: Next.js output must be configured as `"output": "standalone"` in `next.config.ts` to produce a self-contained server bundle. This is an existing config change needed in the Next.js configuration.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | No | Defaults to `production` in runner stage |
| `PORT` | No | Defaults to `3000` |
| `HOSTNAME` | No | Defaults to `0.0.0.0` |

Future auth, database, and AI provider variables will be added by their respective changes.

## Risks / Trade-offs

- **Next.js standalone output**: The `next.config.ts` must set `output: "standalone"` for the Dockerfile to work. This is a minor config change but affects the local build output structure. Verified during implementation.
- **Image size**: The base `node:24-alpine` image is small (~120 MB). The multi-stage build ensures dev tooling is not in the final image. Future changes with database drivers or AI SDKs may increase size.
- **pnpm lockfile at root**: The Dockerfile assumes `pnpm-lock.yaml` is at the repository root, which matches the current structure. If a future change adds packages, the Dockerfile must be updated.
- **No production readiness yet**: This change makes the app runnable in a container but does not add reverse proxy, SSL, secrets management, orchestration, or monitoring. Those are deferred to a deployment change.

## Migration Plan

1. Modify `apps/web/next.config.ts` to enable `output: "standalone"`.
2. Create `.dockerignore` at repository root.
3. Create `Dockerfile` at repository root.
4. Create `docker-compose.yml` at repository root.
5. Add Docker convenience scripts to root `package.json`.
6. Update `apps/web/README.md` with Docker usage.
7. Verify: build the Docker image, run the container, check the app responds on port 3000.
8. Verify: `pnpm docker:build` and `pnpm docker:run` work from root.

Rollback: Delete the new files, revert `next.config.ts` and `package.json` changes. No application source code is affected.
