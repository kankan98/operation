# Architecture Documentation

## Purpose

This capability defines the standards for documenting the system architecture — the overall component diagram and data flow, backend layered architecture, frontend architecture, database schema, API design principles, technology decision records (ADRs), feature addition guides, and external integration points — so that contributors can understand and extend the system confidently.

## Requirements

### Requirement: System Architecture Overview
The system SHALL provide a comprehensive architecture diagram showing all major components, their relationships, and data flows.

#### Scenario: Architecture diagram is complete
- **WHEN** reviewing system architecture documentation
- **THEN** the diagram MUST show frontend (React), backend (Express), database (SQLite), and external services (DeepSeek, Claude, Amazon)

#### Scenario: Data flow is documented
- **WHEN** tracing a user request
- **THEN** the documentation MUST show the complete flow from user interaction through React components, API requests, backend services, to database operations and back

### Requirement: Backend Layered Architecture
The system SHALL document the three-tier backend architecture: routes (HTTP layer), services (business logic), and database (data access).

#### Scenario: Routes layer responsibilities are clear
- **WHEN** adding a new API endpoint
- **THEN** the routes layer MUST handle HTTP requests/responses, parameter validation, and service invocation, and MUST NOT contain business logic or direct database access

#### Scenario: Services layer responsibilities are clear
- **WHEN** implementing business logic
- **THEN** the services layer MUST contain business rules, data processing, and database calls, and MUST NOT handle HTTP details or return HTTP responses directly

#### Scenario: Database layer responsibilities are clear
- **WHEN** accessing data
- **THEN** the database layer MUST handle schema definitions and ORM queries, and MUST NOT contain business logic

### Requirement: Frontend Architecture
The system SHALL document the frontend architecture including component structure, state management strategy, and data fetching patterns.

#### Scenario: Component organization is defined
- **WHEN** creating frontend components
- **THEN** the documentation MUST specify the structure: src/components/ for reusable components, src/pages/ for route-level pages, src/hooks/ for custom hooks, src/stores/ for Zustand stores, and src/services/ for API clients

#### Scenario: State management pattern is documented
- **WHEN** managing application state
- **THEN** the documentation MUST explain when to use Zustand (global state), React Query (server state), and local component state

### Requirement: Database Schema Documentation
The system SHALL provide ER diagrams and table relationship documentation for all database entities.

#### Scenario: Database tables are documented
- **WHEN** reviewing database design
- **THEN** each table MUST have its schema documented including columns, types, constraints, and indexes

#### Scenario: Relationships are visualized
- **WHEN** understanding data relationships
- **THEN** ER diagrams MUST show foreign key relationships, cardinality (1:1, 1:N, N:N), and cascading behaviors

### Requirement: API Design Principles
The system SHALL document RESTful API design principles, naming conventions, error handling patterns, and response formats.

#### Scenario: REST conventions are followed
- **WHEN** designing API endpoints
- **THEN** the documentation MUST specify: use plural nouns for resources (/products not /product), use HTTP verbs correctly (GET/POST/PUT/PATCH/DELETE), use nested routes for relationships (/products/:id/snapshots), and use query parameters for filtering/pagination

#### Scenario: Response format is standardized
- **WHEN** returning API responses
- **THEN** success responses MUST have consistent structure, error responses MUST include error code and message, and pagination responses MUST include metadata (page, limit, total)

### Requirement: Technology Stack Decisions (ADR)
The system SHALL maintain Architecture Decision Records (ADR) documenting why specific technologies were chosen.

#### Scenario: Major technology choices are recorded
- **WHEN** a significant technology decision is made
- **THEN** an ADR MUST be created documenting: context (what problem needed solving), decision (what was chosen), alternatives considered, consequences (trade-offs and implications), and status (proposed/accepted/deprecated)

#### Scenario: ADRs are discoverable
- **WHEN** understanding why a technology was chosen
- **THEN** ADRs MUST be indexed in the architecture documentation with links to individual decision documents

### Requirement: Feature Addition Guidelines
The system SHALL provide step-by-step guides for adding new features to both backend and frontend.

#### Scenario: Backend feature addition is documented
- **WHEN** adding a new backend API endpoint
- **THEN** the guide MUST specify: define schema in db/schema.ts, create service in services/, define routes in routes/, register routes in app.ts, and write tests

#### Scenario: Frontend feature addition is documented
- **WHEN** adding a new frontend page or feature
- **THEN** the guide MUST specify: create component in components/ or pages/, define types in types/, create API client in services/, add route in App.tsx (if applicable), and write tests

#### Scenario: File location is clear
- **WHEN** creating new files
- **THEN** the documentation MUST clearly state which directory each file type belongs in, with examples of existing similar files

### Requirement: Integration Points Documentation
The system SHALL document all external integrations including AI providers, scraper services, and third-party APIs.

#### Scenario: AI Provider integration is documented
- **WHEN** integrating AI services
- **THEN** the documentation MUST cover: supported providers (Anthropic/OpenAI protocols), configuration requirements, environment variables, and usage patterns

#### Scenario: External service dependencies are tracked
- **WHEN** adding new external service dependencies
- **THEN** the documentation MUST list: service purpose, authentication method, rate limits, and fallback strategies
