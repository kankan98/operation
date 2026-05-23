## Why

The project now has several accepted slices, but the long-running objective still
needs one durable roadmap that tells future agents how to keep improving the
system without drifting away from operator usefulness, OpenSpec governance, or
verified public preview quality.

This change turns the user's autonomous-iteration goal into an accepted product
and development contract: keep learning, research unclear areas, expand the
knowledge base safely, improve the AI workflow, and update the roadmap as new
gaps are found.

## What Changes

- Add a continuous improvement roadmap capability that defines the autonomous
  iteration loop, Now/Next/Later development sequence, self-check routine,
  user-experience checkpoints, and documentation update expectations.
- Make the product strategy explicitly optimize for Chinese live-commerce
  operators who need practical preparation, review, Q&A, talk-track, and
  next-session workflows rather than generic AI demos.
- Strengthen AI development governance so agents may search the web, use or
  install skills, and add dependencies only when justified by an OpenSpec
  artifact, source quality, security/data handling, and verification.
- Record the future Q&A agent as a sequenced roadmap item: answer from reviewed
  knowledge first, capture thumbs feedback, search permitted public sources
  when knowledge is missing, and route reusable findings through review before
  grounding future answers.
- Add a project roadmap document that consolidates current routes, standards,
  documentation, deployment checks, and next implementation waves.

## Capabilities

### New Capabilities

- `continuous-improvement-roadmap`: Defines the autonomous iteration operating
  model, roadmap waves, self-review loop, research policy, UX checkpoints, and
  route/documentation governance for ongoing development.

### Modified Capabilities

- `product-strategy-foundation`: Adds explicit operator-usefulness, roadmap
  learning, and Q&A agent sequencing requirements.
- `ai-development-governance`: Adds bounded autonomy rules for web research,
  skill usage, dependency installation, documentation updates, and verification.

## Impact

- Affected docs: new roadmap documentation plus selected app/project docs.
- Affected specs: `continuous-improvement-roadmap`,
  `product-strategy-foundation`, and `ai-development-governance`.
- Affected code: none expected in this change.
- APIs/dependencies: none introduced by this change.
- Data/security: no runtime data changes; the change adds stronger governance
  for future research, knowledge ingestion, AI behavior, and dependency choices.
