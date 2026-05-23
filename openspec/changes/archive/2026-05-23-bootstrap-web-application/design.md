## Context

`define-product-foundation` established the first implementation wave as application bootstrap: create `apps/web`, choose pnpm, Next.js App Router, TypeScript, React, Tailwind CSS, shadcn/ui-compatible primitives, lucide icons, and baseline verification. The repository still contains only governance and OpenSpec files, so this change must introduce the web app carefully without leaking future product features into the scaffold.

Relevant current guidance checked during exploration:

- Next.js Server and Client Components docs, last updated March 31, 2026: layouts and pages are Server Components by default; Client Components should be used only where interactivity or browser APIs are needed.
- Next.js mutating-data docs: Server Functions are for server-side mutations and use `POST`; future forms should authenticate server-side before mutation.
- shadcn/ui Next.js and Tailwind v4 docs: new projects can initialize with Tailwind v4 and React 19; shadcn code is owned by the application rather than hidden behind a runtime UI dependency.
- `vercel:nextjs` skill guidance: use App Router, avoid broad Client Component trees, keep service SDK/database initialization lazy in future changes, and pass non-interactive scaffold flags to avoid hanging shells.
- `ui-ux-pro-max` recommendation: use a data-dense dashboard pattern adapted to a calm Chinese operations workspace.

## Goals / Non-Goals

**Goals:**

- Create the first application under `apps/web` while preserving root-level OpenSpec and agent governance.
- Establish a repeatable pnpm workspace and scripts that later agents can run from the root.
- Build a minimal Chinese operator shell as the first screen, with navigation placeholders for later waves.
- Set up app-level route conventions and UI state files so future feature changes have a clear place to extend.
- Verify the scaffold with install, lint, type checking, production build, and browser smoke checks.

**Non-Goals:**

- Do not add authentication, team access, database schema, Drizzle migrations, AI provider calls, public-source ingestion, file storage, Douyin integration, analytics, payments, or deployment configuration.
- Do not persist sensitive business data or include real customer/live-commerce examples.
- Do not create public marketing pages or commerce storefront behavior.
- Do not implement product-specific workflows beyond non-functional navigation placeholders and empty states.

## Decisions

1. **Use `apps/web/src/app` for the Next.js App Router.**
   - Rationale: `apps/web` keeps application code separate from repository governance. `src/app` keeps route code and source modules away from config files and static assets.
   - Alternatives considered: app at repository root; rejected because root is the governance/OpenSpec layer. `apps/web/app` without `src`; viable, but `src` gives clearer source boundaries before the app grows.

2. **Use pnpm workspace from the root.**
   - Rationale: Later waves may add shared packages or tooling. A root workspace lets future agents run consistent commands without moving into app subdirectories.
   - Alternatives considered: package metadata only inside `apps/web`; simpler at first but weaker for OpenSpec-driven multi-wave work.

3. **Initialize with Next.js App Router, TypeScript, Tailwind v4, ESLint, Turbopack dev, and import alias `@/*`.**
   - Rationale: Matches the foundation decision and current Next/shadcn guidance. TypeScript and aliasing are needed before shared UI/domain modules appear.
   - Alternatives considered: Vite SPA; rejected by foundation because the product needs server-side boundaries and future authenticated server operations.

4. **Use Server Components by default and keep Client Components narrow.**
   - Rationale: The bootstrap shell is mostly static navigation and placeholders. Keeping it server-first avoids unnecessary client JavaScript and aligns with Next.js guidance.
   - Alternatives considered: marking the whole shell as a Client Component; rejected because it would set the wrong pattern for later data and auth work.

5. **Set up shadcn-compatible UI primitives but keep the first component set minimal.**
   - Rationale: The app needs consistent buttons, badges, separators, sheets, tables, and forms later, but this wave only needs enough primitives for the shell and states.
   - Alternatives considered: hand-rolled Tailwind-only controls; faster but likely to diverge from accessibility and visual consistency requirements.

6. **Make the first screen an internal operations shell, not a landing page.**
   - Rationale: The product is an operator tool. The scaffold should show dense but calm working surfaces: session overview, product library, seed knowledge, AI review, talk tracks, and next-session tasks.
   - Alternatives considered: public hero/marketing page; explicitly excluded by the foundation.

7. **Use placeholders that reveal future wave boundaries without faking working features.**
   - Rationale: Operators and future agents need to see the product route, but empty placeholders must not imply that auth, product data, AI, or knowledge refresh is implemented.
   - Alternatives considered: mock realistic data; rejected in bootstrap because it can become confused with seed knowledge or customer data.

8. **Document verification as part of the scaffold.**
   - Rationale: This repository requires evidence before completion. The first app must introduce scripts and commands that later changes can reuse.
   - Alternatives considered: manual browser check only; rejected because future waves need lint/type/build confidence from the start.

## Risks / Trade-offs

- Next.js, Tailwind, and shadcn CLI defaults may change between runs -> Mitigation: implementation must inspect generated files, fix known Tailwind/Geist issues, and verify build output instead of trusting scaffolder defaults.
- Scaffold can become too decorative -> Mitigation: keep first screen operational, Chinese, data-dense, and restrained; no marketing hero.
- Future auth/database work may need route restructuring -> Mitigation: keep shell routes shallow and avoid hard-coded assumptions about protected route groups until `add-auth-and-team-access`.
- Adding UI libraries too early can bloat dependencies -> Mitigation: install only the minimal shadcn primitives needed for the shell and defer charts/tables beyond baseline until feature waves need them.
- Browser checks may fail if no dev server is running -> Mitigation: tasks explicitly include starting the dev server, capturing desktop/mobile snapshots, checking console errors, and closing sessions.

## Migration Plan

1. Implement this change in an isolated OpenSpec apply phase.
2. Add root package metadata and pnpm workspace files.
3. Scaffold `apps/web` with non-interactive Next.js App Router settings.
4. Initialize Tailwind/shadcn-compatible styling and minimal UI primitives.
5. Replace scaffold content with the Chinese operations shell and state surfaces.
6. Add local setup and verification documentation.
7. Run install, lint, type check, build, dev server, and Playwright browser smoke checks.

Rollback path: because this wave only adds scaffold files, rollback is removing `apps/web` and root package/workspace files created by this change. Later feature waves must not be mixed into this rollback scope.

## Open Questions

- Exact pnpm version should be pinned during implementation based on the environment and Corepack availability.
- The first shadcn component set should stay minimal; likely `button`, `badge`, `separator`, `sheet`, and possibly `card` only if the shell needs repeated summary panels.
- Whether to include CI in this wave or keep it as a follow-up depends on repository hosting assumptions; this design treats local scripts as required and CI as optional unless implementation confirms a provider.
