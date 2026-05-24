## 1. OpenSpec Baseline

- [x] 1.1 Create `technical-blueprint` requirements covering stage decisions, reserved boundaries, source/skill evidence, and future compliance.
- [x] 1.2 Update `technical-architecture-foundation` requirements for decision classification, reserved ports, and stage gate evidence.
- [x] 1.3 Update `continuous-improvement-roadmap` requirements so future runtime waves follow the blueprint.
- [x] 1.4 Update `docker-deployment` requirements for long-lived public preview restart policy.

## 2. Technical Blueprint Documentation

- [x] 2.1 Expand `docs/architecture/technical-implementation-roadmap.md` with decision status, stage gates, boundary map, reserved ports/adapters, provider gates, and verification expectations.
- [x] 2.2 Update `docs/engineering/code-architecture-standards.md` so implementation work must classify its stage and provider decision state before coding.
- [x] 2.3 Update `docs/roadmap/ai-continuous-development-goal.md` so the blueprint is a durable prerequisite for runtime work.
- [x] 2.4 Update `docs/roadmap/autonomous-development-roadmap.md` so data foundation remains next but follows the new blueprint gate.

## 3. Docker Preview Resilience

- [x] 3.1 Update root Docker scripts or documentation with a long-lived public preview command that uses a named container and restart policy.
- [x] 3.2 Update `apps/web/README.md` with the distinction between disposable local runs and restartable public preview runs.

## 4. Verification And Archival

- [x] 4.1 Validate the change with `openspec validate define-technical-blueprint`.
- [x] 4.2 Check changed markdown and package metadata for placeholders, formatting issues, JSON validity, and obvious broken references.
- [x] 4.3 Archive the completed change and re-run `openspec validate --all`.
