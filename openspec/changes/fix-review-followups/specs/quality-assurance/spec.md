## ADDED Requirements

### Requirement: Fresh runtime migration is covered by tests
The backend test suite SHALL include coverage that applies the configured runtime migration path to an empty SQLite database.

#### Scenario: Migration bootstrap test runs
- **WHEN** backend tests are executed
- **THEN** a test SHALL verify that the configured Drizzle migration folder can bootstrap an empty database

### Requirement: Local pre-commit checks include backend staged code
The local pre-commit quality gate SHALL run lint-staged checks for backend staged code as well as frontend staged code.

#### Scenario: Backend source file is staged
- **WHEN** a backend source TypeScript file is staged for commit
- **THEN** the pre-commit hook SHALL run the backend lint-staged command for that file

#### Scenario: Frontend source file is staged
- **WHEN** a frontend TypeScript or TSX file is staged for commit
- **THEN** the pre-commit hook SHALL run the frontend lint-staged command for that file
