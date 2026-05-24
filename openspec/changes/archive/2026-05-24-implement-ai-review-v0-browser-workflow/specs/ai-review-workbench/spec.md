## MODIFIED Requirements

### Requirement: AI review route shows a workbench
The `/ai-review` route SHALL render an AI review workbench that can operate in
the authenticated local V0 team context and connect review-ready session
captures to AI review run preparation, V0 fake-provider execution, output
inspection, and human review decisions.

#### Scenario: Operator opens AI review route
- **WHEN** an operator opens `/ai-review`
- **THEN** the page shows Chinese sections for V0 team entry, review-ready session selection, session input quality, review context, structured analysis output, human review actions, validation states, and downstream draft affordances

#### Scenario: V0 boundary is visible
- **WHEN** the AI review workbench renders
- **THEN** it clearly uses operator-facing language to distinguish local V0 fake-provider review from production AI provider execution, RAG, public source discovery, automatic task creation, and authoritative knowledge publishing

#### Scenario: Authenticated context enables actions
- **WHEN** the operator has a valid local V0 auth session and team scope
- **THEN** the page enables loading scoped sessions and AI review runs while keeping prepare, execute, and review actions disabled until their prerequisites are met

## ADDED Requirements

### Requirement: AI review workbench uses protected V0 runtime safely
The AI review workbench SHALL use existing protected API routes and the local V0 fake-provider route for browser actions, preserving auth, explicit scope, CSRF, no-store, and safe error boundaries.

#### Scenario: Browser calls protected APIs with scope
- **WHEN** the page loads sessions, lists AI review runs, prepares a run, executes V0 review, or records a decision
- **THEN** each request SHALL include explicit tenant/team scope and required CSRF headers for mutation routes

#### Scenario: Loading and error states are operator-facing
- **WHEN** an API request is pending or fails
- **THEN** the page SHALL show concise loading or error states in Chinese without exposing raw cookies, auth references, provider keys, prompts, provider payloads, database URLs, or protected cross-team data

#### Scenario: Mobile and desktop remain usable
- **WHEN** `/ai-review` renders on desktop and mobile viewports
- **THEN** primary controls, session lists, generated sections, validation messages, and review actions SHALL remain readable without text overflow, layout overlap, or controls resizing unpredictably

## REMOVED Requirements

### Requirement: AI review workbench remains frontend-only
**Reason**: `/ai-review` now needs to become a usable V0 workflow and can safely reuse the already accepted protected AI review API runtime plus a gated local fake-provider execution path.

**Migration**: Static preview-only behavior is replaced by authenticated local V0 workflow behavior. Production AI provider calls, RAG, review queues, external fetching, automatic downstream task creation, analytics, and new dependencies remain out of scope unless separate OpenSpec changes introduce them.
