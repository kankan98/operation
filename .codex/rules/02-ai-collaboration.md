# AI Collaboration Rules

## Context Handling

- Read local specs, tasks, docs, package files, and nearby code before proposing architecture.
- Prefer `rg` and focused file reads over broad scanning.
- Summarize long context instead of copying it into new files.
- Do not assume current external facts, API behavior, pricing, legal rules, or platform policies are still true. Verify unstable facts from primary sources.

## Assumptions

- Make reasonable low-risk assumptions to keep work moving.
- State assumptions when they affect product behavior, data shape, security, cost, or user experience.
- Ask the user only when a decision is irreversible, high-risk, unavailable from local context, or changes business meaning.

## Vibe Coding Boundaries

Vibe coding is allowed for quick exploration, prototypes, and design discovery. It is not the completion standard.

Before exploratory code becomes production code, the agent MUST:

- Name the intent and expected behavior.
- Remove throwaway scaffolding, dead code, and speculative dependencies.
- Align with OpenSpec artifacts if the change is non-trivial.
- Add or update tests when risk justifies it.
- Run relevant verification.
- Explain trade-offs and remaining risk.

## AI Output Discipline

- Treat AI-generated code as a draft that requires review.
- Prefer small, reviewable edits over large generated rewrites.
- Do not rewrite unrelated files to match a preferred style.
- Do not hide uncertainty behind confident language.
- Do not claim a command passed unless its output was observed.

## User Communication

- Keep progress updates short and concrete.
- Explain what context was gathered and what it implies.
- Report blockers with options, not vague failure messages.
- Final responses should include changed files, verification, and any unresolved risks.
