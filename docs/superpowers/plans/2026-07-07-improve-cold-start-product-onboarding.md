# Improve Cold-Start Product Onboarding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Repair the first merchant operations loop so a cold-start user can add a product, collect data, and receive accurate UI/Chat guidance.

**Architecture:** Keep the work within existing React pages/components and backend Chat tools. Frontend surfaces share no new state; they use existing product/alert/opportunity hooks and route links. Backend Chat validation reuses the product schema contract before calling `ProductService`.

**Tech Stack:** React 19, React Router, React Hook Form, Zod, TanStack Query, Vitest, Playwright, Express, Drizzle, OpenSpec.

---

## File Structure

- `frontend/src/components/products/ProductForm.tsx`: normalize optional strings, add field IDs, fix interval copy usage.
- `frontend/src/i18n/locales/zh.json` and `frontend/src/i18n/locales/en.json`: hour-based interval and cold-start copy.
- `frontend/src/pages/Dashboard.tsx`: zero-product onboarding call-to-action.
- `frontend/src/pages/AlertsCenter.tsx`: product-aware empty states.
- `frontend/src/pages/Opportunities.tsx`: product-aware empty state and missing-data guidance.
- `backend/src/services/agentTools.ts`: supported platform enums and product creation validation.
- `backend/src/services/chatService.ts`: system prompt UI contract.
- `frontend/tests/components/*.test.tsx`: form and empty-state regression tests.
- `backend/tests/chatService.test.ts`: Chat tool and prompt contract regression tests.
- `frontend/e2e/cold-start-product-onboarding.spec.ts`: browser workflow regression.

### Task 1: Product Form Reliability

- [ ] **Step 1: Write failing tests**

Add tests that render `ProductForm` with a product whose `imageUrl` is `null`, locate fields by label, submit a title update, and expect the submitted payload not to contain an invalid blank `imageUrl`.

Run: `pnpm -C frontend exec vitest run tests/components/ProductForm.test.tsx`
Expected before implementation: fail because labels are not associated or blank optional URL blocks submit.

- [ ] **Step 2: Implement form fix**

Update `ProductForm.tsx` so optional URL/string values are accepted as blank UI values and transformed before validation/submission. Add stable `id` values and `htmlFor` labels for each field. Keep `checkInterval` min 1 max 168.

- [ ] **Step 3: Verify product form tests**

Run: `pnpm -C frontend exec vitest run tests/components/ProductForm.test.tsx`
Expected after implementation: pass.

### Task 2: Cold-Start UI Guidance

- [ ] **Step 1: Write failing page tests**

Add or extend component tests for Dashboard, AlertsCenter, and Opportunities to assert no-product guidance and Products links/actions.

Run: `pnpm -C frontend exec vitest run tests/components/Dashboard.test.tsx tests/components/AlertsCenter.test.tsx tests/pages/Opportunities.operations.test.ts`
Expected before implementation: fail where guidance is absent.

- [ ] **Step 2: Implement page guidance**

Use existing hooks and `Link` from React Router. For zero products, show compact guidance and a button/link to `/products`. For products with no alerts/opportunities, preserve normal empty-state semantics and explain missing monitoring/data signals.

- [ ] **Step 3: Verify page tests**

Run the same Vitest command and confirm the new assertions pass.

### Task 3: Chat Agent Contract Alignment

- [ ] **Step 1: Write failing backend tests**

Add tests in `backend/tests/chatService.test.ts` that assert `AGENT_TOOLS` excludes `lazada`, `addProductMonitoring` rejects unsupported platforms, rejects non-Amazon products without an identifier, and the system prompt contains real UI names such as `商品` and `添加商品`.

Run: `pnpm -C backend exec vitest run tests/chatService.test.ts`
Expected before implementation: fail on tool enum/prompt/validation.

- [ ] **Step 2: Implement backend contract**

Update Chat tool schemas to supported product platforms. Add validation before `productService.createProduct`, reusing shared or backend product schema semantics. Update the system prompt with current UI routes/actions and unsupported-entry guardrails.

- [ ] **Step 3: Verify backend tests**

Run: `pnpm -C backend exec vitest run tests/chatService.test.ts`
Expected after implementation: pass.

### Task 4: End-to-End Regression

- [ ] **Step 1: Write Playwright regression**

Create `frontend/e2e/cold-start-product-onboarding.spec.ts` covering dashboard/alerts/opportunities no-product guidance, product add/edit/manual-reading/delete loop, and no console warnings.

Run: `pnpm -C frontend exec playwright test e2e/cold-start-product-onboarding.spec.ts --project=chromium`
Expected before implementation: fail on existing form/guidance issues.

- [ ] **Step 2: Run full verification**

Run:

```powershell
openspec validate improve-cold-start-product-onboarding --strict
pnpm -C frontend lint
pnpm -C frontend exec vitest run
pnpm -C backend exec vitest run tests/chatService.test.ts
pnpm -C frontend build
pnpm -C frontend exec playwright test e2e/cold-start-product-onboarding.spec.ts --project=chromium
```

Expected: every command exits 0 before marking the change complete.
