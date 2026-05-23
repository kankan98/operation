## Why

The repository has governance rules but no accepted product, technical, or delivery baseline for the badminton racket live-commerce operations tool. Before application code is introduced, the project needs a shared direction for the MVP, architecture, data boundaries, AI behavior, and implementation sequence.

## What Changes

- Define the target product as a web-based Chinese operator workspace for badminton racket live-commerce teams.
- Define the product North Star: continuously learn from source-backed professional public data and operator feedback so the knowledge base, AI understanding, and operational analysis quality improve over time.
- Establish the first-phase scope around manual live-session recording, racket product knowledge, AI-assisted review, talk-track improvement, short-video ideas, and next-session tasks.
- Establish a public-source seed knowledge base for racket specifications, selling points, live-commerce operating patterns, and compliance notes, with recurring refresh and human review instead of a one-time static document.
- Choose a pragmatic web application stack and architecture boundaries for future implementation.
- Define sensitive-data, tenant, AI-output, and verification requirements that future feature changes must follow.
- Break the product into implementation waves so later OpenSpec changes can be scoped and validated independently.
- Use this foundation as the roadmap and progress reference for later implementation changes.
- No production application code is introduced by this planning change.

## Capabilities

### New Capabilities

- `product-strategy-foundation`: Defines users, MVP workflows, product scope, roadmap waves, and non-goals for the live-commerce operations product.
- `technical-architecture-foundation`: Defines the initial technical stack, runtime boundaries, data architecture, AI architecture, security posture, and verification baseline for future implementation changes.
- `industry-knowledge-foundation`: Defines public-source knowledge ingestion, source trust levels, recurring refresh, human review, versioning, and operator-facing use of seed knowledge.

### Modified Capabilities

- None.

## Impact

- Adds planning specifications under `openspec/changes/define-product-foundation/specs/`.
- Adds a design document that future feature changes will use as the architecture baseline.
- Captures the long-term knowledge and AI improvement loop as a product objective future changes must preserve.
- Adds source-backed public research findings and a dynamic knowledge-base lifecycle that future implementation waves must preserve.
- Does not add runtime dependencies, application directories, database schema, external integrations, deployment configuration, or production code.
