## 1. Motion Dependency And Standards

- [x] 1.1 Add the `motion` package to `apps/web`
- [x] 1.2 Add global duration, easing, transition, keyframe, and reduced-motion tokens in `globals.css`
- [x] 1.3 Document the motion library decision and usage boundaries
- [x] 1.4 Configure project package installs to use the npmmirror registry for faster mainland China builds

## 2. Motion Primitives

- [x] 2.1 Create client-side workspace motion primitives using `motion/react`
- [x] 2.2 Add a motion provider that respects user reduced-motion preferences
- [x] 2.3 Keep animation wrappers narrow so static page content remains server-rendered

## 3. Workspace Application

- [x] 3.1 Apply page entry motion to the shared workspace shell content
- [x] 3.2 Apply panel/list entry motion to overview and workflow pages
- [x] 3.3 Add consistent hover/press transitions to route cards, nav rows, and operational panels
- [x] 3.4 Ensure placeholder pages do not imply data loading, saving, AI generation, or live integration

## 4. Verification

- [x] 4.1 Run `openspec validate add-workspace-motion-system`
- [x] 4.2 Run `pnpm lint`, `pnpm typecheck`, and `pnpm build`
- [x] 4.3 Run browser checks for desktop and mobile workspace routes, including console errors and overflow
- [x] 4.4 Run `pnpm docker:build`
