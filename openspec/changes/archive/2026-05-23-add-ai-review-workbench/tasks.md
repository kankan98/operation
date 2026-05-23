## 1. Metadata

- [x] 1.1 Add typed static AI review input, grounding, analysis, validation, and feedback metadata
- [x] 1.2 Ensure metadata excludes real customer, transcript, pricing, prompt, model output, and metric data

## 2. AI Review Route UI

- [x] 2.1 Create a motion-enabled `AiReviewWorkbench` component
- [x] 2.2 Update `/ai-review` to render the custom workbench instead of the generic placeholder
- [x] 2.3 Preserve visible frontend-only boundaries for AI calls, prompts, persistence, review queues, task creation, and external fetching
- [x] 2.4 Verify responsive layout text wrapping, stable cards, accessible labels, and reduced-motion-compatible choreography

## 3. Documentation

- [x] 3.1 Update app README with the AI review workbench boundary and next implementation step
- [x] 3.2 Document the future Q&A agent learning route and required governance boundaries

## 4. Verification

- [x] 4.1 Run `openspec validate add-ai-review-workbench`
- [x] 4.2 Run `pnpm lint`, `pnpm typecheck`, and `pnpm build`
- [x] 4.3 Run desktop and mobile browser checks for `/ai-review`
- [x] 4.4 Run `pnpm docker:build` and keep the public container updated
