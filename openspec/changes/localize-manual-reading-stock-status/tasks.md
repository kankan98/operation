## 1. Manual Reading Coverage

- [x] 1.1 Add failing component coverage for readable stock status option labels and hidden raw enum option text.
- [x] 1.2 Add failing component coverage that selecting a readable stock label still submits the correct enum value.

## 2. Implementation

- [x] 2.1 Replace raw stock status option text in `ManualReadingForm` with merchant-facing labels while preserving option values.

## 3. Validation

- [x] 3.1 Run targeted `ManualReadingForm` tests.
- [x] 3.2 Run strict OpenSpec validation, frontend lint, frontend tests, and frontend build.
- [x] 3.3 Deploy, run production Playwright smoke coverage, and clean up temporary test data.
