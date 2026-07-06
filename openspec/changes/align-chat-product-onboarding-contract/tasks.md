## 1. Contract Alignment

- [x] 1.1 Update Chat system prompt so product URL, ASIN/product ID, and product title are described as required fields.
- [x] 1.2 Update `addProductMonitoring` tool schema descriptions and required properties to match execution validation.

## 2. Regression Coverage

- [x] 2.1 Update backend Chat/tool tests for prompt wording and tool schema required fields.
- [x] 2.2 Update product monitoring tool tests to cover missing identifiers and successful ASIN submission.
- [x] 2.3 Add or update Playwright cold-start onboarding coverage for required-field wording.

## 3. Verification

- [x] 3.1 Run OpenSpec validation for this change.
- [x] 3.2 Run targeted backend tests.
- [x] 3.3 Run targeted frontend Playwright tests.
- [x] 3.4 Run build/lint checks affected by the change.
