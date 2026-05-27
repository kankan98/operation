## Why

Internal V0 is close to usable, but evaluators still need one compact release
judgment that answers whether the current demo can safely expand to more
internal trial users, what evidence supports that call, and which blockers must
stay out of production scope. This matters now because the project should move
from feature accumulation to a usable V0 freeze before starting larger V1
investments.

## What Changes

- Add a deterministic V0 trial acceptance package that summarizes release
  decision, evidence strength, blocker focus, next action, and production gates.
- Surface the acceptance package in the existing `/trial` and overview internal
  trial cockpit after the evaluator has a verified trial session.
- Base the package only on existing scoped workflow readiness, scoped trial run
  evidence, scoped feedback evidence, and known production gate boundaries.
- Keep the package operator-facing, concise, responsive, and separate from
  production readiness. It must not introduce production login, RAG, public
  source discovery, analytics, external integrations, or new providers.

## Capabilities

### New Capabilities
- `v0-trial-acceptance-package`: Deterministic internal V0 release judgment and
  evidence package for trial evaluators and team leads.

### Modified Capabilities
- `v0-usable-trial-workflow`: The existing trial cockpit will render the
  acceptance package when verified trial evidence is available.

## Impact

- Affected code: `apps/web/src/lib/v0-trial-readiness-cockpit.ts`,
  `apps/web/src/lib/v0-trial-readiness-cockpit-check.ts`, and
  `apps/web/src/components/internal-trial-access.tsx`.
- Affected specs: new `v0-trial-acceptance-package` capability and delta for
  `v0-usable-trial-workflow`.
- Affected docs: roadmap or goal notes may be updated if implementation changes
  V0 progress or next-wave sequencing.
- No new dependencies, database tables, migrations, API routes, AI provider
  calls, RAG, auth provider, analytics SDK, queue, storage, or external service.
