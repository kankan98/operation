## Why

The project is starting with AI-assisted development, so the repository needs clear rules before product implementation begins. Without repository-local guidance, agents can drift between ad hoc vibe coding, unmanaged implementation, and incomplete spec-driven work.

## What Changes

- Add a `.codex/rules/` rule set for AI-assisted development.
- Define a required OpenSpec-first workflow for non-trivial product changes.
- Define practical vibe coding boundaries: fast exploration is allowed, but changes must still have intent, traceability, and verification.
- Define coding, testing, security, frontend, data, and review expectations for AI agents working in this repository.
- Add an index file so future agents know which rule files to read and in what order.

## Capabilities

### New Capabilities

- `ai-development-governance`: Repository-local rules that govern how AI agents plan, implement, verify, and report development work.

### Modified Capabilities

- None.

## Impact

- Adds documentation under `.codex/rules/`.
- Adds OpenSpec artifacts under `openspec/changes/add-ai-development-rules/`.
- Does not introduce runtime dependencies, application code, API changes, or build-system changes.
