## Context

`ManualReadingForm` is reused by product detail, product list quick entry, and the opportunity workspace. Its visible labels are currently Chinese, but the stock status select renders the backend enum values as option text. The same enum values are correct for API submission and storage, so the fix should be display-only.

## Goals / Non-Goals

**Goals:**

- Render the stock status choices as readable Chinese labels: `有货`, `库存偏低`, and `缺货`.
- Keep the option `value` attributes and submitted `availability` field unchanged.
- Cover the shared component so all surfaces using it inherit the fix.

**Non-Goals:**

- Do not change `Availability` enum names, backend validation, database values, or price snapshot API behavior.
- Do not refactor the whole manual reading form into full i18n in this change.
- Do not alter form reset, failure preservation, or cache invalidation behavior.

## Decisions

- Add a small local label map in `ManualReadingForm`.
  - Rationale: the form is already hardcoded in Chinese, and the task is a narrow display fix. This avoids introducing a broader i18n dependency path into a shared component mid-iteration.
  - Alternative considered: use `useTranslation('products')` and the existing `availability.*` keys. That would reduce label duplication, but it would mix one translated field into a mostly hardcoded form and create a wider testing surface.

- Preserve enum values in each `<option value="...">`.
  - Rationale: price snapshots, scoring, alerts, and historical tables already rely on the existing `Availability` values. Only the visible text is defective.

## Risks / Trade-offs

- Duplicate labels can drift from `products.availability` translations -> component tests assert the visible labels for the manual reading flow; a future full-i18n cleanup can consolidate these labels.
- The form remains partially hardcoded in Chinese -> acceptable for this scoped fix because the production UI is currently Chinese and the defect is raw internal values in a merchant-facing workflow.
