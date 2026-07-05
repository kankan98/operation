## ADDED Requirements

### Requirement: Critical local quality gates stay green
The project SHALL keep the critical backend and frontend local quality gates passing before a release-ready change is considered complete.

#### Scenario: Backend critical checks pass
- **WHEN** backend code or shared backend-facing schemas are changed
- **THEN** backend TypeScript build, backend lint, and backend tests SHALL pass

#### Scenario: Frontend critical checks pass
- **WHEN** frontend code or shared frontend-facing schemas are changed
- **THEN** frontend TypeScript/build, frontend lint, and frontend tests SHALL pass

#### Scenario: OpenSpec and whitespace checks pass
- **WHEN** OpenSpec-backed code changes are completed
- **THEN** OpenSpec validation and diff whitespace checks SHALL pass
