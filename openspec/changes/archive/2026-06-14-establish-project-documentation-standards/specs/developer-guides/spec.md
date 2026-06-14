## ADDED Requirements

### Requirement: Quick Start Guide
The system SHALL provide a streamlined getting started guide for new developers to set up the project in under 30 minutes.

#### Scenario: Prerequisites are clearly listed
- **WHEN** a new developer starts setup
- **THEN** the guide MUST list: Node.js 18+, npm or pnpm, Git, and any platform-specific requirements (e.g., Windows users need Git Bash)

#### Scenario: Setup steps are sequential and complete
- **WHEN** following the quick start guide
- **THEN** steps MUST be numbered and in order: clone repository, install backend dependencies, create .env file, run database migrations, start backend server, install frontend dependencies, start frontend server, and verify everything works

#### Scenario: First-time setup succeeds
- **WHEN** completing the quick start guide
- **THEN** the developer MUST be able to access the running application at http://localhost:3000, make a test API call successfully, and run the test suite without errors

### Requirement: Local Development Environment
The system SHALL document how to configure and use the local development environment including hot reload, debugging, and common tooling.

#### Scenario: Development servers are configured
- **WHEN** setting up local development
- **THEN** documentation MUST explain: backend runs on port 3001 with tsx watch for hot reload, frontend runs on port 3000 with Vite dev server, and how to change ports if needed

#### Scenario: Environment variables are documented
- **WHEN** configuring environment settings
- **THEN** the guide MUST list all required environment variables, provide .env.example template, explain the purpose of each variable, and document environment variable priority (project .env > system environment variables)

#### Scenario: Database setup is clear
- **WHEN** setting up the database
- **THEN** the guide MUST explain: how to run migrations (npm run db:migrate), how to reset database if needed, and where the SQLite file is located

### Requirement: Debugging Guide
The system SHALL provide instructions for debugging both backend and frontend code using appropriate tools.

#### Scenario: Backend debugging is documented
- **WHEN** debugging backend code
- **THEN** the guide MUST cover: using console.log with pino logger, attaching debugger in VS Code/other IDEs, inspecting API requests with curl or Postman, and checking database state with SQLite browser

#### Scenario: Frontend debugging is documented
- **WHEN** debugging frontend code
- **THEN** the guide MUST cover: using React DevTools, inspecting network requests in browser DevTools, debugging state with Zustand DevTools, and using source maps for TypeScript debugging

#### Scenario: Common debugging scenarios are covered
- **WHEN** encountering common issues
- **THEN** the guide MUST include: debugging 404 API errors, troubleshooting CORS issues, inspecting SSE stream data, and debugging failing tests

### Requirement: Troubleshooting Manual
The system SHALL maintain a comprehensive troubleshooting guide based on real issues encountered during development.

#### Scenario: Environment variable conflicts are addressed
- **WHEN** environment variables aren't loading correctly
- **THEN** the guide MUST explain: checking .env file exists and is in correct location, verifying environment variable priority (why system vars might override .env), and how to debug config loading (check config/index.ts logs)

#### Scenario: Port conflicts are resolved
- **WHEN** backend or frontend fails to start due to port conflict
- **THEN** the guide MUST explain: how to find process using the port, how to kill the conflicting process, and how to change default ports in configuration

#### Scenario: Dependency installation issues are covered
- **WHEN** npm install fails
- **THEN** the guide MUST explain: clearing node_modules and package-lock.json, using correct Node.js version, checking for permission errors, and platform-specific issues (Windows vs Mac vs Linux)

#### Scenario: Database migration issues are addressed
- **WHEN** database migrations fail or schema is out of sync
- **THEN** the guide MUST explain: how to check current migration status, how to rollback migrations, how to reset database from scratch, and how to regenerate migrations from schema changes

#### Scenario: Test failures are debugged
- **WHEN** tests fail unexpectedly
- **THEN** the guide MUST explain: running tests in watch mode for faster iteration, isolating failing test with .only(), checking test database state, and common test environment issues

### Requirement: Common Tasks Guide
The system SHALL document step-by-step instructions for frequently performed development tasks.

#### Scenario: Adding a new API endpoint is documented
- **WHEN** creating a new API endpoint
- **THEN** the guide MUST provide: complete example code for routes/services/database layers, explanation of each step, testing example, and reference to similar existing endpoints

#### Scenario: Adding a new React component is documented
- **WHEN** creating a new UI component
- **THEN** the guide MUST provide: component structure template, prop interface example, state management guidance, styling pattern, and testing example

#### Scenario: Database schema changes are documented
- **WHEN** modifying the database schema
- **THEN** the guide MUST explain: how to update schema.ts, how to generate migration (npm run db:generate), how to apply migration (npm run db:migrate), and how to update TypeScript types

#### Scenario: Integrating external APIs is documented
- **WHEN** adding a new external API integration
- **THEN** the guide MUST explain: where to store API credentials, how to create service wrapper, error handling patterns, and rate limiting considerations

### Requirement: IDE Configuration
The system SHALL provide recommended IDE settings and extensions for optimal development experience.

#### Scenario: VS Code setup is documented
- **WHEN** using VS Code for development
- **THEN** the guide SHOULD recommend: ESLint and Prettier extensions, TypeScript and React extensions, recommended settings.json configuration, and debugging launch configurations

#### Scenario: Keyboard shortcuts are listed
- **WHEN** working efficiently in the IDE
- **THEN** the guide SHOULD list: common shortcuts for running tests, starting dev servers, formatting code, and navigating codebase

### Requirement: Performance Profiling Guide
The system SHALL document how to profile and optimize performance issues in both backend and frontend.

#### Scenario: Backend performance profiling
- **WHEN** investigating slow API endpoints
- **THEN** the guide MUST explain: adding timing logs, using Node.js profiler, analyzing database query performance, and identifying N+1 query problems

#### Scenario: Frontend performance profiling
- **WHEN** investigating slow UI rendering
- **THEN** the guide MUST explain: using React Profiler, analyzing bundle size, identifying unnecessary re-renders, and optimizing large lists with virtualization
