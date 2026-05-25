## ADDED Requirements

### Requirement: Verified trial continue action navigates reliably
The public trial entry SHALL reliably navigate an evaluator to a known workspace
route after the trial session has been verified.

#### Scenario: Continue to requested workbench succeeds
- **WHEN** `/trial` has a verified trial session and a safe known `next` path
- **THEN** the continue action SHALL navigate to that workbench path without
  requiring the evaluator to manually edit the URL

#### Scenario: Continue target becomes unavailable
- **WHEN** the requested `next` path is missing, unsupported, unsafe, or blocked
  by route protection after verification
- **THEN** the trial entry SHALL fall back to the recommended first workbench
  path and show safe operator-facing recovery copy without exposing route guard,
  cookie, database, or session internals

#### Scenario: Continue action remains bounded
- **WHEN** the trial entry builds a continue link or performs client navigation
- **THEN** it SHALL use only the known workspace route allowlist and SHALL NOT
  navigate to absolute URLs, protocol-relative URLs, API routes, static assets,
  unknown routes, malformed paths, or external destinations
