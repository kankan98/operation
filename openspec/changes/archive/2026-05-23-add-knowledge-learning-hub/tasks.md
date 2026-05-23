## 1. Metadata

- [x] 1.1 Add typed public source registry metadata for the knowledge learning hub
- [x] 1.2 Add typed lifecycle stages and AI feedback signal metadata

## 2. Knowledge Route UI

- [x] 2.1 Create a motion-enabled `KnowledgeLearningHub` component
- [x] 2.2 Update `/knowledge` to render the custom hub instead of the generic placeholder
- [x] 2.3 Preserve visible frontend-only boundaries for fetching, persistence, review, and AI calls

## 3. Documentation

- [x] 3.1 Update app README with the knowledge learning hub boundary and next implementation step

## 4. Verification

- [x] 4.1 Run `openspec validate add-knowledge-learning-hub`
- [x] 4.2 Run `pnpm lint`, `pnpm typecheck`, and `pnpm build`
- [x] 4.3 Run desktop and mobile browser checks for `/knowledge`
- [x] 4.4 Run `pnpm docker:build` and keep the public container updated
