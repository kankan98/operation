## Context

The repository currently contains OpenSpec scaffolding for Codex but no project-local development rules. Future work will likely combine spec-driven development, AI-assisted implementation, and fast product iteration for a web product with AI analysis features. The rule set must be useful to Codex and other agents without becoming a long, ignored style guide.

## Goals / Non-Goals

**Goals:**

- Create a concise `.codex/rules/` rule set that future AI agents can load and follow.
- Make OpenSpec the default workflow for non-trivial changes.
- Allow vibe-coding style exploration only when it is bounded by scope, review, and verification.
- Capture engineering, testing, security, data, and frontend expectations in repository-local files.
- Keep each rule file focused so agents can read only what they need.

**Non-Goals:**

- Do not define product requirements for the Douyin operations app.
- Do not create application code, framework scaffolding, or runtime dependencies.
- Do not replace OpenSpec artifacts; rules should complement OpenSpec.
- Do not create tool-specific copies for every AI IDE in this change.

## Decisions

1. **Use `.codex/rules/` as the canonical rule directory.**
   - Rationale: The user explicitly requested rules under `.codex`, and OpenSpec already initialized Codex support there.
   - Alternative considered: Root-level `AGENTS.md` or `.github/copilot-instructions.md`. Those are useful for cross-tool support but are outside this requested scope.

2. **Split rules by workflow concern instead of one long file.**
   - Rationale: Current AI instruction guidance favors short, focused, repository-specific instructions. Smaller files reduce context bloat and make rule lookup easier.
   - Alternative considered: A single monolithic `rules.md`. It is simpler but easier for agents to skim past or partially ignore.

3. **Make OpenSpec mandatory for non-trivial changes, with an explicit exception for tiny maintenance work.**
   - Rationale: Spec-driven development prevents vague prompts from turning into untraceable implementation. Small typo/config fixes should not require excessive ceremony.
   - Alternative considered: Require OpenSpec for every change. That would slow down minor documentation and housekeeping tasks.

4. **Treat vibe coding as a prototyping mode, not a production merge standard.**
   - Rationale: Fast AI exploration is useful for discovery, but production changes need explicit acceptance criteria, tests, and human-readable rationale.
   - Alternative considered: Ban vibe coding. That would lose useful speed during early product exploration.

5. **Include security and data handling from day one.**
   - Rationale: The planned product may process live commerce notes, user comments, transcripts, product data, and AI prompts. Rules must prevent secrets leakage and careless retention before integrations are added.

## Risks / Trade-offs

- Rule files may not be automatically loaded by every tool -> Mitigation: add an index that states the required read order and usage rules.
- Rules may become stale as the stack becomes concrete -> Mitigation: require updating rules when new frameworks, data stores, or deployment targets are introduced.
- Excess process could slow early development -> Mitigation: define lightweight exceptions for small, low-risk changes.
- AI agents may follow rules inconsistently -> Mitigation: require final responses to report which rules were relevant and what verification was run.
