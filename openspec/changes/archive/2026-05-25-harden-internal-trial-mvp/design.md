## Context

The application now has real V0 workflows across sessions, rackets, knowledge,
AI review, talk tracks, and next actions. It also has a public trial entry,
route-level protection, internal V0 bootstrap, app-owned session runtime,
PostgreSQL persistence, Docker preview, and a gated live AI review mode.

The remaining MVP gap is not another provider or isolated endpoint. It is the
reliability and clarity of the evaluation journey. A reviewer should be able to
open the public preview, enter the trial team, continue into the intended
workbench, move across the implemented loop, and understand recoverable failures
without seeing implementation details.

This design remains inside the accepted technical roadmap:

- UI stays in App Router pages/components and shared client helpers.
- Existing Route Handlers remain the reusable HTTP boundary.
- Auth/session/team scope stays server-owned and app-owned.
- Database-backed V0 demo data remains deterministic and scoped.
- Docker preview remains an internal/demo evaluation surface, not production.

## Goals / Non-Goals

**Goals:**

- Turn the current V0 surfaces into a coherent internal trial MVP path.
- Make `/trial` continue behavior reliable after session readiness is verified.
- Improve overview/trial cockpit guidance so evaluators can see the next
  operator step and route availability.
- Normalize loading, empty, error, retry, disabled, and ready states where the
  current workbenches expose confusing gaps.
- Add a focused verifier for the trial MVP path across route gate, session
  readiness, all implemented workbench routes, safe copy, and redaction.
- Require Playwright checks for representative desktop/mobile trial flows before
  archive and public preview smoke after archive.

**Non-Goals:**

- No production auth provider, public login, team invitation, or team switching.
- No real customer/order/private-message data entry policy change.
- No RAG/Q&A implementation, external source discovery, or platform integration.
- No new persistence model unless a discovered bug requires a small migration.
- No broad visual redesign, marketing landing page, or decorative experience.
- No new npm dependency unless implementation evidence shows an existing
  framework tool cannot solve the problem safely.

## Decisions

### Decision 1: Harden the existing trial path instead of building new product areas

The next wave will improve the existing entry and cross-workbench journey:

```text
/trial -> /sessions -> /rackets -> /knowledge -> /ai-review
       -> /talk-tracks -> /next-actions
```

Alternatives considered:

- Build Q&A/RAG next. Rejected for this wave because evaluators first need a
  dependable trial loop to judge existing value.
- Add production auth next. Deferred because MVP evaluation can continue with
  the explicitly bounded internal trial preview, while production auth needs a
  larger provider/domain/HTTPS decision.
- Improve one workbench only. Rejected because the user's current concern is
  delivery speed and a usable version, which requires cross-route continuity.

### Decision 2: Keep trial state simple and server-authoritative

Client code may store only safe display scope. All protected data still depends
on the `HttpOnly` app-owned session cookie plus explicit tenant/team scope.
Trial readiness should be verified through existing safe session APIs before
workbenches claim protected data is available.

Alternatives considered:

- Store richer session state in local storage. Rejected because it increases
  leak risk and duplicates server-owned truth.
- Add a feature flag provider or tenant admin flag. Deferred because the project
  lacks a production tenant admin surface.

### Decision 3: Fix continue/navigation as a first-class MVP requirement

The `/trial` ready state must reliably continue to a known workspace route. If a
target is unsafe, stale, or unsupported, the UI uses the existing safe fallback
instead of trapping evaluators on the trial page.

Alternatives considered:

- Tell users to manually open routes. Rejected because this makes the preview
  feel unfinished and hides route-gate defects.
- Auto-open the first route immediately after bootstrap. Rejected as the only
  behavior because evaluators still need a visible ready state and recovery
  surface.

### Decision 4: Add focused MVP verification instead of expanding every test suite

Add or extend one focused command, likely `trial-mvp:check`, that verifies:

- route-gate decisions and safe next fallback;
- bootstrap/session/logout boundaries;
- all six protected workbench routes can load under a valid V0 session;
- unsafe failures remain redacted;
- public-preview-sensitive flags remain explicit.

This complements existing domain checks without replacing them.

Alternatives considered:

- Rely only on browser Playwright. Rejected because route/session/redaction
  invariants are cheaper and more precise in local verifier code.
- Re-run every domain verifier on each iteration. Deferred to archive gates
  because it slows development without adding targeted confidence.

### Decision 5: Keep the UI dense and operational

The trial cockpit should use existing workspace layout, badges, compact panels,
and Chinese operator-facing copy. It should not become a landing page. The UI
improvements should focus on status, next action, recovery, and safe boundaries.

Alternatives considered:

- Adopt a more vibrant/marketing visual system. Rejected because this is an
  operations tool and would reduce scanability.
- Add large explanatory text. Rejected because implementation boundaries belong
  in docs, not normal operator UI.

## Risks / Trade-offs

- Trial hardening may touch several pages -> Keep the shared helper changes
  small, use accepted specs, and verify all affected routes.
- Public HTTP preview can be mistaken for production -> Preserve explicit copy
  that demo/脱敏 data only is allowed and docs that HTTPS/production auth remain
  future work.
- Continue navigation can regress route safety -> Keep the existing known-route
  allowlist and verify unsafe next values.
- More status UI can clutter workbenches -> Add compact state affordances and
  avoid extra instructional panels where existing copy is sufficient.
- Verifier may become too broad -> Scope it to MVP entry and route readiness,
  leaving domain business rules to existing focused checks.

## Migration Plan

1. Audit current trial entry, overview, and six workbenches for MVP readiness
   gaps: continue behavior, loading/error/empty states, copy, mobile overflow,
   and console errors.
2. Implement shared helper or UI fixes needed for reliable trial continuation
   and safe recovery.
3. Add the focused trial MVP verifier and wire it into root/package scripts.
4. Update docs and roadmap with the internal trial MVP state and remaining
   production gaps.
5. Run OpenSpec validation, focused verifier, affected domain checks, lint,
   typecheck, build, and Playwright before archive.
6. After archive, commit, push, redeploy Docker preview, and run public preview
   smoke verification.

Rollback path: revert this change or disable the internal V0 bootstrap/public
preview flags. Existing workbenches and domain APIs should continue to work
through their current route-level and server-side guards.

## Open Questions

- Whether this wave should include a demo-data reset action depends on the audit
  result. It should only be added if the current deterministic demo data becomes
  confusing during repeated trials.
- Whether to add thin Server Actions for trial entry should be decided during
  implementation. If current Route Handler client calls remain simpler and safe,
  do not add Server Actions just for pattern purity.

## Audit Findings

- `/trial` has the right safe next allowlist and route-gate contract, but public
  preview Playwright showed that the ready-state continue CTA can leave the user
  on `/trial` until the route is opened directly. Treat the CTA as the first
  implementation fix and preserve the existing allowlist.
- The overview and trial access card already expose entry, ready, refresh,
  logout, and links. The MVP gap is clearer cockpit framing and route readiness,
  not a new navigation model.
- The six implemented workbenches already have scoped loading/error patterns
  and domain-specific checks. Do not refactor every workbench; only touch copy or
  recovery states that are shown to be confusing during implementation.
- Existing `internal-trial:check` and `public-trial-auth:check` cover important
  auth boundaries, but no single verifier proves the usable trial MVP path across
  all six protected workbench routes. Add a focused verifier instead of
  expanding every domain check.
- No demo-data reset is included in this wave unless repeated verifier/browser
  runs prove deterministic demo records become misleading.
