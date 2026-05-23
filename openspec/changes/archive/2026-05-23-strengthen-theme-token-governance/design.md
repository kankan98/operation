## Context

The app already exposes shadcn-compatible semantic variables and product tokens,
but new workbench pages repeat local values for panel radius, card padding,
minimum heights, icon surfaces, and status treatments. Some repetition is
normal for layout, but theme-defining values should be globally controlled.

The goal is not to build a design-system package. The goal is a practical token
contract that lets future style changes happen mostly in `globals.css` and app
docs.

## Goals / Non-Goals

**Goals:**

- Define a theme-governance rule in OpenSpec and README.
- Add global CSS variables for workbench panel anatomy, density, icon surfaces,
  focus, and status surfaces.
- Add small global utility classes for repeated workbench panel/row/icon surface
  patterns.
- Keep components on semantic tokens (`bg-card`, `text-primary`, `border-border`,
  `text-muted-foreground`) and avoid hardcoded palette utilities.
- Preserve current responsive layout behavior.

**Non-Goals:**

- Do not replace Tailwind utility layout with a full custom CSS framework.
- Do not eliminate every local spacing/grid class; page-specific composition can
  remain local.
- Do not introduce CSS-in-JS, theme packages, font packages, or new dependencies.
- Do not redesign the visual style in this change.

## Decisions

1. **Use layered CSS variables in `globals.css`.**
   - Rationale: shadcn and Tailwind v4 already resolve semantic classes through
     CSS variables, so the least risky solution is to extend that model.
   - Alternative considered: separate theme JSON. Deferred until there is a real
     theme editor or multiple brand themes.

2. **Create utility aliases only for repeated theme anatomy.**
   - Rationale: `workbench-panel`, `workbench-row`, and `workbench-icon-surface`
     reduce visual duplication without hiding all layout intent.
   - Alternative considered: large wrapper components. Rejected because current
     pages are still static and server-rendered.

3. **Document allowed local utilities.**
   - Rationale: Some grid tracks, responsive columns, and one-off min heights
     are layout decisions, not theme decisions. The governance should prevent
     color/style hardcoding without forcing awkward abstractions.

## Risks / Trade-offs

- Too many utilities can obscure layout -> Mitigation: keep only a few repeated
  visual anatomy utilities.
- Theme variables can become unused clutter -> Mitigation: document the token
  layers and use the core utilities in current workbench pages.
- Refactoring can create visual regressions -> Mitigation: run lint, typecheck,
  build, and browser smoke checks.

## Migration Plan

1. Add the workspace-theme delta spec.
2. Extend `globals.css` with theme governance tokens and utility aliases.
3. Update README with token-governance rules and future theme replacement path.
4. Refactor repeated panel/row/icon-surface classes in current workbench pages
   where scoped and low-risk.
5. Run validation and public deployment checks.
