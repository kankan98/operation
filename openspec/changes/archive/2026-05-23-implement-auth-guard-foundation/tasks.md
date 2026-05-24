## 1. Auth Module Foundation

- [x] 1.1 Add server-only auth module structure under `apps/web/src/server/auth`.
- [x] 1.2 Define auth roles, permissions, request, context, decision, and safe view types with Zod validation where runtime input crosses a boundary.
- [x] 1.3 Define structured auth errors and redaction helpers that avoid leaking provider/session/customer/prompt data.
- [x] 1.4 Define a single role-permission policy module for `viewer`, `host`, `operator`, `product_owner`, `reviewer`, and `admin`.

## 2. Resolver And Guard

- [x] 2.1 Implement provider-neutral auth context resolution from existing tenant, team, user, tenant membership, and team membership records.
- [x] 2.2 Implement authorization guard helpers for required permission, allowed role, active membership, and tenant/team target scope.
- [x] 2.3 Implement conversion from authorized auth context to the existing data access context.
- [x] 2.4 Ensure static public pages and builds do not require auth provider or database session configuration.

## 3. Verification Script

- [x] 3.1 Add a local auth guard verification script that runs inside a rollback transaction against local PostgreSQL.
- [x] 3.2 Verify allowed access succeeds for an active member with required permission.
- [x] 3.3 Verify missing permission, inactive membership, and cross-team target access are denied without repository context.
- [x] 3.4 Add root/app package scripts for the auth guard check.

## 4. Documentation And Roadmap

- [x] 4.1 Update `docs/contracts/auth-team-tenant.md` to mark provider-neutral local guard runtime as partially implemented while keeping provider/login runtime out of scope.
- [x] 4.2 Update `docs/architecture/technical-implementation-roadmap.md` with implemented stage-2 guard pieces and remaining provider gates.
- [x] 4.3 Update `docs/roadmap/ai-continuous-development-goal.md` and `docs/roadmap/autonomous-development-roadmap.md` with the new current state and next candidate wave.
- [x] 4.4 Update root/app README documentation with local auth guard verification commands and non-goals.

## 5. Verification

- [x] 5.1 Run `openspec validate implement-auth-guard-foundation`.
- [x] 5.2 Run `pnpm lint`, `pnpm typecheck`, and `pnpm build`.
- [x] 5.3 Run local PostgreSQL checks: `pnpm db:migrate`, `pnpm db:check`, and the new auth guard check when PostgreSQL is available.
- [x] 5.4 Run targeted whitespace, placeholder, and sensitive-output checks for changed files.

## 6. Archive

- [x] 6.1 Archive the completed OpenSpec change after implementation and verification pass.
- [x] 6.2 Run `openspec validate --all` after archive.
