## Why

The current workspace shell centers the whole application in a 1440px container, which creates large side gutters on common 1920px and wider operator displays. The UI also contains development-facing copy such as static boundaries, OpenSpec references, and implementation notes that normal operators do not need to understand.

## What Changes

- Make the desktop workspace shell full-width while preserving a fixed sidebar and responsive content.
- Keep long explanatory text constrained inside panels so readability does not regress.
- Replace user-facing development notes with concise operator-facing task, status, and next-action copy.
- Preserve documentation-only implementation boundaries in README/OpenSpec/contracts instead of normal product UI.
- Add browser verification for desktop wide layout and mobile layout.

## Capabilities

### New Capabilities

- `workspace-layout-copy`: Defines full-width operational workspace layout and operator-facing copy expectations for the current web app.

### Modified Capabilities

- `workspace-theme`: Confirms layout density and shell width should be governed globally rather than by page-local caps.

## Impact

- Affected code: `apps/web/src/components/workspace-shell.tsx`, shared workspace pages, static workbench copy, and route metadata strings.
- Affected docs/specs: OpenSpec accepted specs after archive.
- No backend, database, AI provider, RAG, auth, or package dependency change.
