## 1. Tests First

- [x] 1.1 Add a Modal component regression test proving long modal bodies use a shrinkable internal scroll region.
- [x] 1.2 Add ProductForm tests proving validation/submission error messages render and valid values are preserved.
- [x] 1.3 Add a ProductsList test proving create-product backend failures remain visible in the add dialog.
- [x] 1.4 Run the new targeted tests and confirm they fail for the current implementation.

## 2. Implementation

- [x] 2.1 Fix Modal body flex sizing so long content scrolls inside the dialog instead of clipping.
- [x] 2.2 Remove ProductForm action overlap and add an accessible submission error region.
- [x] 2.3 Surface create/edit mutation failures from ProductsList into ProductForm without closing the dialog.
- [x] 2.4 Run targeted tests and confirm they pass.

## 3. Verification

- [x] 3.1 Run frontend tests covering the changed components/pages.
- [x] 3.2 Run frontend build and lint.
- [x] 3.3 Validate the OpenSpec change with `openspec validate fix-product-onboarding-modal-flow --strict`.
- [x] 3.4 Use Playwright to verify the add-product dialog on desktop and mobile viewports.

## 4. Delivery

- [ ] 4.1 Commit the OpenSpec and code changes.
- [ ] 4.2 Push the commit to `origin/main`.
- [ ] 4.3 Deploy the new release to the production server.
- [ ] 4.4 Run production health checks and a Playwright smoke test against the deployed product onboarding dialog.
