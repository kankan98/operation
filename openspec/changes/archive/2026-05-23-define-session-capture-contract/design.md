## Context

The session capture workbench at `/sessions` currently renders static examples
for live theme, host roles, product order, customer questions, objections,
draft state, and downstream readiness. Future work will need draft recovery,
long-note handling, transcript import, structured question grouping, AI review
input, talk-track extraction, and next-session tasks.

The project rules require a contract before adding backend persistence, database
schema, Server Actions, upload parsing, AI provider calls, or integrations. This
change creates that contract for session capture only.

## Goals / Non-Goals

**Goals:**

- Define `docs/contracts/session-capture.md`.
- Preserve live-commerce and badminton racket domain language.
- Specify future commands, queries, request/response shapes, lifecycle states,
  long-input handling, error cases, authorization, sensitive data, audit
  metadata, and verification requirements.
- Update the contract index and roadmap notes so later session persistence,
  transcript import, and AI review input must start from this contract.

**Non-Goals:**

- No route handler, server action, repository, database schema, migration, mock
  API, upload parser, transcript processing, AI call, or persistence.
- No UI changes to `/sessions`.
- No external platform integration, order import, private-message import, queue,
  object storage, or analytics.
- No dependency additions.

## Decisions

1. **Session capture gets its own contract instead of reusing product records.**
   - Decision: Model session facts, product order, live notes, customer
     questions, objections, and downstream readiness separately from racket
     products.
   - Rationale: Product records describe reusable product knowledge; session
     capture describes what happened in one live session and what needs to feed
     review, talk tracks, and tasks.
   - Alternative considered: Add session fields to racket product data.
     Rejected because it would mix reusable product facts with time-bound live
     operations.

2. **Draft and saved states are explicit.**
   - Decision: The contract distinguishes `draft`, `autosaved`, `submitted`,
     `review_ready`, `processing`, `failed`, `archived`, and related states.
   - Rationale: Operators may refresh or close the page mid-flow, and later
     analysis must know whether input is complete enough to process.
   - Alternative considered: Simple boolean `saved`. Rejected because it cannot
     express partial drafts, import failures, or review readiness.

3. **Long notes and transcript input are bounded before parsing.**
   - Decision: The contract defines long-input limits, chunking expectations,
     and explicit failure states without implementing parsing.
   - Rationale: Live notes and transcripts can be long and sensitive. Future AI
     or upload work needs predictable input boundaries.
   - Alternative considered: Let future AI review define transcript shape.
     Rejected because AI review depends on session input quality and should not
     own session capture persistence.

4. **Customer data is sensitive by default.**
   - Decision: Customer questions and objections can be stored as operational
     signals, but names, phone numbers, addresses, order IDs, and private
     messages are out of scope unless a later sensitive-data change defines
     protected handling.
   - Rationale: Live-commerce notes can contain personal and business-sensitive
     data.

## Risks / Trade-offs

- Contract is detailed before implementation -> Mitigation: mark status as
  `draft` and keep open questions for later database/auth/upload decisions.
- Future AI review input diverges from session capture -> Mitigation: require
  AI review changes to use this contract as source context and update it when
  input assumptions change.
- Operators need mobile drafting behavior -> Mitigation: verification
  requirements include mobile draft and long-text display checks for future
  runtime work.
- Transcript import scope grows too large -> Mitigation: this contract defines
  import boundaries and failure states but leaves storage, parser, and queue
  choices to later OpenSpec changes.
