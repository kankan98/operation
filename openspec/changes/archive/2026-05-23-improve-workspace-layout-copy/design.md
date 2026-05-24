## Context

Rendered measurement on `/rackets` showed the current shell at 1920px viewport
uses a centered 1440px app container with 240px gutters on both sides. At 2560px,
gutters grow to 560px. This is acceptable for text-heavy websites, but it feels
wrong for a workbench/dashboard where operators expect the sidebar and content
surface to use the available display.

UI/UX guidance for this product class points toward a data-dense dashboard:
maximize useful data visibility, use stable grids, and constrain only long text
blocks for readability.

## Goals / Non-Goals

**Goals:**

- Convert the application shell from centered max-width to full-width.
- Preserve the 248px desktop sidebar and sticky header.
- Keep page-level padding modest and text content constrained where needed.
- Replace development-facing UI copy with operator-facing copy.
- Verify desktop wide and mobile behavior with Playwright.

**Non-Goals:**

- No redesign of the visual theme.
- No new navigation structure.
- No data persistence, auth, backend, AI, or real loading states.
- No new dependency.

## Decisions

1. **Full-width shell, constrained content where useful.**
   - Decision: Remove `mx-auto max-w-[1440px]` from the shell grid.
   - Rationale: Operational dashboards should use available width, while
     paragraphs can keep `max-w-*` inside panels.
   - Alternative considered: Increase max width to 1728px. Rejected because it
     only delays the same problem on wider screens.

2. **Operator copy replaces developer narration.**
   - Decision: Rewrite normal UI copy around tasks, states, and next steps.
   - Rationale: Operators do not need OpenSpec, backend, database, or
     implementation-boundary explanations in the product UI.
   - Alternative considered: Keep development notes until backend exists.
     Rejected because it trains the product toward internal-facing copy.

3. **Low cognitive load is the copy baseline.**
   - Decision: Keep interface copy short, concrete, and action-oriented.
   - Rationale: Operators should understand what to do without learning product
     architecture or abstract workflow concepts.
   - Alternative considered: Explain the learning loop and future system states
     on each page. Rejected because it increases user effort without improving
     immediate operation.

4. **Docs remain the place for implementation boundaries.**
   - Decision: Keep detailed non-goals in README, contracts, roadmap, and specs.
   - Rationale: The boundary is still important for development, but not for
     normal user screens.

## Risks / Trade-offs

- Very wide rows become sparse -> Mitigation: existing pages use fixed side
  columns, grids, and max-width text blocks; follow-up can add table density
  when real data exists.
- Removing implementation copy hides current limitations -> Mitigation: keep
  concise product statuses such as "暂不能保存" and preserve full detail in docs.
- Mobile regression -> Mitigation: verify 390px mobile viewport.
