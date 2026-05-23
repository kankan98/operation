## Why

The foundation change defined the product direction and selected a web stack, but the repository still has no application code, package manager, or verification scripts. This change creates the minimal app baseline needed for later product waves without introducing badminton-specific business logic too early.

## What Changes

- Add the first web application under `apps/web` using Next.js App Router, TypeScript, React, Tailwind CSS, shadcn/ui-compatible structure, and lucide icons.
- Add root package metadata and pnpm workspace configuration while preserving root-level OpenSpec and agent governance files.
- Add baseline scripts for install, development, linting, type checking, formatting where applicable, and production build.
- Add a Chinese internal-operations shell as the first screen with stable navigation placeholders for sessions, racket products, knowledge base, AI reviews, talk tracks, and next-session tasks.
- Add baseline loading, error, not-found, and empty-state surfaces appropriate for a data-dense operational tool.
- Add minimal project documentation for local setup and verification commands.
- Do not add authentication, database schema, AI provider calls, public-source ingestion, Douyin integration, payments, or production deployment configuration in this change.

## Capabilities

### New Capabilities

- `web-application-bootstrap`: Defines the initial web app scaffold, package manager, baseline shell UI, routing conventions, toolchain scripts, and verification baseline.

### Modified Capabilities

- None.

## Impact

- Affected areas: repository root package metadata, pnpm workspace configuration, `apps/web` application source, baseline Next.js/Tailwind/shadcn configuration, and developer setup documentation.
- New dependencies: Next.js, React, TypeScript, Tailwind CSS, shadcn/ui-compatible primitives, lucide-react, lint/type/build toolchain packages, and related framework dependencies.
- No database, auth provider, AI provider, queue, storage provider, external API, or deployment provider is introduced.
- Follow-up changes will layer auth/team access, racket product library, dynamic seed knowledge base, live-session capture, and AI analysis on top of this baseline.
