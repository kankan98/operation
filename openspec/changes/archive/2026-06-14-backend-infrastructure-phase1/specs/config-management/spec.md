## ADDED Requirements

### Requirement: Load configuration from environment
The system SHALL load configuration values from environment variables.

#### Scenario: Load all configuration values
- **WHEN** application starts
- **THEN** system SHALL load nodeEnv, port, databasePath, logLevel, and corsOrigin from environment variables

#### Scenario: Use default values for optional config
- **WHEN** optional environment variables are not set
- **THEN** system SHALL use default values (port: 3001, nodeEnv: development, logLevel: info, corsOrigin: http://localhost:3000)

### Requirement: Validate required configuration
The system SHALL validate that required configuration values are present.

#### Scenario: Missing required configuration
- **WHEN** required environment variable DATABASE_PATH is not set
- **THEN** system SHALL throw error listing missing required variables

#### Scenario: Valid configuration
- **WHEN** all required environment variables are set
- **THEN** validation SHALL pass without errors

### Requirement: Provide typed configuration access
The system SHALL provide a typed configuration object accessible throughout the application.

#### Scenario: Access configuration values
- **WHEN** importing config from config module
- **THEN** system SHALL provide strongly-typed access to all configuration values

#### Scenario: Configuration is read-only
- **WHEN** configuration object is accessed
- **THEN** values SHALL be immutable (const assertion)
