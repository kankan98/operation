## 1. Decision Form Implementation

- [x] 1.1 Add status-specific static decision evidence frames in the opportunity detail decision form.
- [x] 1.2 Add a fill control near the decision reason input that fills only an empty reason and disables when reason text exists.
- [x] 1.3 Preserve the existing explicit save behavior, payload shape, text length guidance, and decision snapshot handling.

## 2. Test Coverage

- [x] 2.1 Cover filling the selected status frame from an empty decision reason.
- [x] 2.2 Cover switching decision status before filling, overwrite protection, and no automatic save.

## 3. Specs, Docs, and Validation

- [x] 3.1 Sync the accepted requirement into the main opportunity research workspace spec and update development/roadmap/current-change documentation.
- [x] 3.2 Run focused Opportunities tests, frontend build, OpenSpec validation, active-change check, and diff whitespace validation.
