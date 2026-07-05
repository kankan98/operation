## ADDED Requirements

### Requirement: Fresh runtime migrations bootstrap the backend database
The backend runtime migration path SHALL create every table and column used by the current backend Drizzle schema when applied to an empty SQLite database.

#### Scenario: Empty database migrates successfully
- **WHEN** the configured backend Drizzle migrator runs against an empty SQLite database
- **THEN** migration SHALL complete successfully and SHALL create the products, product business signals, opportunity research, acquisition queue, market signal, scraping, alert, chat, and task tables used by runtime code

#### Scenario: Runtime research columns are deployable
- **WHEN** backend code reads or writes opportunity research decision and action outcome columns
- **THEN** the runtime Drizzle migration path SHALL create or add those columns before the application starts serving requests

### Requirement: Runtime configuration honors deployment environment precedence
The backend configuration loader SHALL prefer process environment variables over local `.env` file values in production-like deployments.

#### Scenario: Process environment overrides local env file
- **WHEN** the same configuration key exists in both `process.env` and a local `.env` file
- **THEN** the backend SHALL use the `process.env` value

### Requirement: Logs do not expose API key fragments
The backend SHALL avoid logging API key values or partial API key fragments.

#### Scenario: AI provider initialization is logged
- **WHEN** an AI provider is initialized or a stream request is started
- **THEN** structured logs SHALL include provider, model, and endpoint context without API key substrings
