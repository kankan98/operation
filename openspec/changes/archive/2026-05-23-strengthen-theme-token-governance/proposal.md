## Why

The workspace now has multiple custom workbench pages. To keep future style
changes fast and consistent, visual decisions must be governed by global tokens
and documented theme rules instead of scattered component-level hardcoding.

## What Changes

- Strengthen the accepted workspace theme requirements with theme governance:
  global style planning, token layers, component usage rules, and future theme
  replacement expectations.
- Add CSS variables for layout density, panel anatomy, status surfaces, focus,
  and common workbench dimensions so future style updates can be made centrally.
- Document which values should remain global tokens and which layout utilities
  may stay local.
- Refactor current workbench components to use token-backed utility aliases for
  repeated panel, row, and icon-surface patterns where useful.
- Keep no new runtime dependencies and preserve the current modern operational
  style.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `workspace-theme`: Adds explicit theme governance, token layering, component
  usage rules, and future theme replacement requirements.

## Impact

- Affected code: `apps/web/src/app/globals.css`, selected workspace components.
- Affected docs: `apps/web/README.md`.
- APIs/dependencies: none.
- Data/security: no runtime data changes.
