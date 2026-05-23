# Verification and Review Rules

## Evidence Before Completion

Do not claim work is complete, fixed, or passing until relevant verification has run and the output has been observed.

Use the smallest verification set that gives meaningful confidence:

- Static checks: formatting, linting, type checking.
- Unit tests for isolated logic.
- Integration tests for API, database, authentication, or workflow behavior.
- Build checks for framework or deployment compatibility.
- Browser checks for frontend behavior, responsiveness, console errors, and visual regressions.
- Manual checks when automation does not exist yet.

## Frontend Verification

For web UI changes:

- Start the dev server when required by the framework.
- Check at least one desktop and one mobile viewport for layout issues.
- Verify text does not overflow or overlap.
- Check browser console errors.
- Verify loading, empty, error, and success states when relevant.
- When a change affects the public preview or documentation claims that the
  preview is updated, run the Docker build/restart flow and confirm the public
  URL responds successfully.

## Public Preview Verification

The current public preview is expected at `http://203.195.161.93:3000/` when
the `operation-web-preview` container is running on port 3000.

For preview-impacting changes, verify:

- `pnpm docker:build` completes.
- `operation-web-preview` is restarted from `operation-web:latest`.
- `docker ps --filter name=operation-web-preview` reports a healthy container.
- Key public routes such as `/`, `/sessions`, `/knowledge`, and `/ai-review`
  return HTTP 200 when relevant to the change.

## AI Feature Verification

For AI analysis features:

- Test with realistic sample input, not only happy-path placeholders.
- Verify output schema parsing and validation.
- Check empty, ambiguous, malformed, and long input behavior.
- Confirm generated recommendations are labeled as AI output when users may rely on them.
- Avoid treating a single good generation as proof of quality.

## Review Stance

When reviewing code:

- Lead with bugs, regressions, security risks, missing tests, and unclear requirements.
- Cite file and line references when possible.
- Distinguish blocking issues from suggestions.
- Do not approve code only because it compiles.

## Final Report

Every implementation final response MUST include:

- What changed.
- Files or areas touched.
- Verification commands run and their result.
- Any skipped verification and why.
- Remaining risks or follow-up work if relevant.
- Public preview URL and health status when the task changed frontend behavior
  or deployment state.
