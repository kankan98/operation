## 1. Route Metadata And Shell

- [x] 1.1 Define shared workspace route metadata for the overview and six workflow routes
- [x] 1.2 Extract the common operator shell from the root page into reusable components
- [x] 1.3 Update desktop and mobile navigation to use real paths and active route state

## 2. Global Theme Tokens

- [x] 2.1 Analyze UI/UX guidance for a modern dense operator dashboard visual system
- [x] 2.2 Define global light and dark semantic tokens in `apps/web/src/app/globals.css`
- [x] 2.3 Add product-specific surface, status, and chart tokens without new dependencies

## 3. Workspace Route Pages

- [x] 3.1 Rebuild `/` as the workspace overview route using the shared shell
- [x] 3.2 Add `/sessions` page with static live-session placeholder content
- [x] 3.3 Add `/rackets` page with static racket-product placeholder content
- [x] 3.4 Add `/knowledge` page with static seed-knowledge placeholder content
- [x] 3.5 Add `/ai-review` page with static AI-review placeholder content
- [x] 3.6 Add `/talk-tracks` page with static talk-track placeholder content
- [x] 3.7 Add `/next-actions` page with static next-session-action placeholder content

## 4. Documentation And Verification

- [x] 4.1 Update app documentation to list the workspace routes, theme token approach, and scope boundaries
- [x] 4.2 Run `openspec validate add-workspace-routes`
- [x] 4.3 Run `pnpm lint`, `pnpm typecheck`, and `pnpm build`
- [x] 4.4 Run browser checks for `/`, `/sessions`, `/rackets`, `/knowledge`, `/ai-review`, `/talk-tracks`, and `/next-actions` on desktop and mobile
- [x] 4.5 Run `pnpm docker:build` to confirm container build readiness
