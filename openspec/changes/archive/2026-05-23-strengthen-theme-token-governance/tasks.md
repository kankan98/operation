## 1. Theme Tokens

- [x] 1.1 Add global token layers for workbench panel anatomy, density, icon surfaces, focus, and status surfaces
- [x] 1.2 Add token-backed utility aliases for repeated workbench panel, row, and icon-surface patterns

## 2. Component Alignment

- [x] 2.1 Refactor current workbench components to use shared utility aliases where scoped and low-risk
- [x] 2.2 Verify components still use semantic theme classes and avoid hardcoded palette utilities

## 3. Documentation

- [x] 3.1 Update app README with theme-governance rules, allowed local layout utilities, and future theme replacement path

## 4. Verification

- [x] 4.1 Run `openspec validate strengthen-theme-token-governance`
- [x] 4.2 Run `pnpm lint`, `pnpm typecheck`, and `pnpm build`
- [x] 4.3 Run browser smoke checks for `/sessions`, `/knowledge`, and `/ai-review`
- [x] 4.4 Run `pnpm docker:build` and keep the public container updated
