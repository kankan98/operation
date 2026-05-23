## Context

The workspace already has static but domain-shaped workbenches for session
capture, knowledge learning, and AI review. `/rackets` still renders the shared
placeholder page even though racket product knowledge is required before AI can
make useful product explanations or answer operator questions.

The UI/UX search recommended a data-dense dashboard pattern with row highlighting
and efficient scanning. The suggested red/gold palette is not adopted because
the accepted workspace theme already defines a calm operational palette; this
change should use global tokens instead of introducing a separate style.

## Goals / Non-Goals

**Goals:**

- Upgrade `/rackets` to a static, Chinese operator-facing product library
  workbench.
- Preserve badminton-specific fields: model, aliases, weight class, balance,
  shaft stiffness, tension, player level, play style, price band, selling points,
  source freshness, review state, and comparison needs.
- Show how product records support session capture, AI review, talk tracks, and
  future Q&A without implying those downstream capabilities are live.
- Use global theme/motion utilities and keep layout responsive.
- Keep all state as typed static data.

**Non-Goals:**

- Do not add database tables, forms, persistence, search, import, scraping,
  source refresh, AI calls, upload, auth, or team permissions.
- Do not add new npm dependencies or a separate theme.
- Do not use real customer data, real business metrics, or unreviewed public
  source claims.

## Decisions

1. **Use a dedicated static workbench component and data file.**
   - Rationale: This matches the existing session/knowledge/AI review slices and
     keeps domain data out of route files.
   - Alternative considered: extend the generic placeholder metadata. Rejected
     because the product-library workflow needs richer tables, specs, review
     states, and downstream relationships.

2. **Use semantic workbench utilities instead of new local colors.**
   - Rationale: Theme replacement must remain globally controlled.
   - Alternative considered: adopt the UI search red/gold palette. Rejected
     because it would break accepted theme consistency.

3. **Show review/source states as static previews.**
   - Rationale: Operators need to understand which specs are official,
     team-edited, stale, or missing before AI uses them.
   - Alternative considered: hide review states until persistence exists.
     Rejected because review boundaries are core to future knowledge grounding.

## Risks / Trade-offs

- Static product examples may be mistaken for real saved records -> Mitigation:
  label the page as preview/static and keep primary actions disabled.
- Data-dense UI may overflow on mobile -> Mitigation: use stable grid tracks,
  wrapping badges, and browser checks for `/rackets`.
- Product records could imply authoritative racket specs -> Mitigation: use
  illustrative examples with review/status labels and avoid claims sourced from
  unverified public data.

## Migration Plan

1. Add typed static racket product data.
2. Add `RacketProductWorkbench` with hero, metrics, product rows, spec coverage,
   review states, comparison gaps, and downstream readiness.
3. Replace `/rackets` placeholder with the workbench.
4. Update docs to mark `/rackets` as a static product-library workbench.
5. Run OpenSpec validation, lint/type/build, browser smoke checks, Docker build,
   and public preview checks.
