## 1. Metadata

- [x] 1.1 Add typed static session facts, product order, question, objection, draft state, and downstream readiness metadata
- [x] 1.2 Ensure metadata excludes real transcripts, customer data, orders, GMV, pricing strategy, and private messages

## 2. Sessions Route UI

- [x] 2.1 Create a motion-enabled `SessionCaptureWorkbench` component
- [x] 2.2 Update `/sessions` to render the custom workbench instead of the generic placeholder
- [x] 2.3 Preserve visible frontend-only boundaries for saving, draft recovery, uploads, AI analysis, auth, and platform integrations
- [x] 2.4 Verify responsive layout text wrapping, stable rows, accessible labels, and disabled future controls

## 3. Documentation

- [x] 3.1 Update app README with the session capture workbench boundary and next implementation step

## 4. Verification

- [x] 4.1 Run `openspec validate add-session-capture-workbench`
- [x] 4.2 Run `pnpm lint`, `pnpm typecheck`, and `pnpm build`
- [x] 4.3 Run desktop and mobile browser checks for `/sessions`
- [x] 4.4 Run `pnpm docker:build` and keep the public container updated
