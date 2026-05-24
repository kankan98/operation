## 1. Layout

- [x] 1.1 Remove the global shell max-width cap and keep the desktop sidebar fixed at the viewport edge
- [x] 1.2 Verify content text remains locally constrained and responsive after shell expansion

## 2. UI Copy

- [x] 2.1 Replace generic workspace development copy with operator-facing task, state, and next-action language
- [x] 2.2 Replace workbench boundary copy that mentions static implementation, OpenSpec, backend, database, AI, or future architecture with concise product statuses

## 3. Verification

- [x] 3.1 Run `openspec validate improve-workspace-layout-copy`
- [x] 3.2 Run `openspec validate --all`
- [x] 3.3 Run `pnpm lint`, `pnpm typecheck`, and `pnpm build`
- [x] 3.4 Use Playwright to verify `/`, `/rackets`, `/sessions`, `/knowledge`, and `/ai-review` on desktop wide and mobile, including console health and overflow
- [x] 3.5 Rebuild and restart the Docker public preview, then verify key public routes return 200
