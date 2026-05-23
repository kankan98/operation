## 1. Next.js Standalone Output Config

- [x] 1.1 Enable `output: "standalone"` in `apps/web/next.config.ts` so the production build produces a self-contained server bundle
- [x] 1.2 Verify the standalone build output includes `server.js` and `.next/standalone` artifacts locally

## 2. Docker Build Context

- [x] 2.1 Create `.dockerignore` at repository root excluding `node_modules/`, `.next/`, `.git/`, `.env*`, `*.md` (non-essential), and other non-essential directories and files

## 3. Dockerfile

- [x] 3.1 Create multi-stage `Dockerfile` at repository root with `deps`, `builder`, and `runner` stages using `node:24-alpine`
- [x] 3.2 Configure `deps` stage to install pnpm via corepack and install dependencies with frozen lockfile
- [x] 3.3 Configure `builder` stage to copy source and run `pnpm build`
- [x] 3.4 Configure `runner` stage with production node_modules, standalone server, static assets, HEALTHCHECK, and CMD
- [x] 3.5 Verify Docker build succeeds and the image serves the app correctly

## 4. Docker Compose

- [x] 4.1 Create `docker-compose.yml` at repository root with a `web` service for local development using Turbopack with source bind-mount and hot-reload
- [x] 4.2 Add a production service profile or instructions for production compose usage

## 5. Root Package Scripts

- [x] 5.1 Add `docker:build` script to root `package.json`
- [x] 5.2 Add `docker:run` script to root `package.json`

## 6. Documentation

- [x] 6.1 Update `apps/web/README.md` with Docker build, production run, development compose, environment variable configuration, and health check sections

## 7. Verification

- [x] 7.1 Run `pnpm lint` and `pnpm typecheck` to confirm no regressions from `next.config.ts` change
- [x] 7.2 Run `pnpm build` to verify standalone output works
- [x] 7.3 Run `pnpm docker:build` and verify image creation
- [x] 7.4 Start a production container and verify the root route returns 200
- [x] 7.5 Start dev compose and verify hot-reload works
- [x] 7.6 Stop all containers and clean up
