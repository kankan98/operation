## 1. Contract And Root-Cause Capture

- [x] 1.1 Record current public preview failure evidence and database/network root cause in the OpenSpec proposal/design.
- [x] 1.2 Add delta specs for Docker preview database connectivity and database-backed V0 preview verification.
- [x] 1.3 Validate the active OpenSpec change.

## 2. Deployment Script And Documentation

- [x] 2.1 Update root Docker preview script to attach the web preview to the database network and pass a container-reachable `DATABASE_URL` with an override variable.
- [x] 2.2 Update root README, app README, and technical roadmap preview instructions with DB startup, migration, network, override, and sensitive-data boundaries.
- [x] 2.3 Keep the `unless-stopped` restart policy in the documented and scripted preview command.

## 3. Verification And Deployment

- [x] 3.1 Run relevant local verification: OpenSpec validation, lint, typecheck, build, migration, auth/operator V0 checks, and affected route checks.
- [x] 3.2 Run Playwright in the pre-archive test stage for at least one V0 browser path.
- [x] 3.3 Archive the completed change and ensure accepted specs include the new requirements.
- [x] 3.4 Commit with a Conventional Commit prefix and push to the git remote.
- [x] 3.5 Rebuild/redeploy Docker preview, verify restart policy, static public routes, V0 bootstrap, and one public browser flow.
