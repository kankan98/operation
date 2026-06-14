# Development Standards

## Purpose

This capability defines the code-level standards that all contributions must follow — backend and frontend code conventions, TypeScript usage, naming, file organization, error handling, comment/documentation standards, and import/module organization — so that the codebase remains consistent, readable, and maintainable.

## Requirements

### Requirement: Backend Code Conventions
The system SHALL define code style guidelines for backend TypeScript development including formatting, naming, and structural patterns.

#### Scenario: Code formatting is consistent
- **WHEN** writing backend code
- **THEN** code MUST use 2-space indentation, single quotes for strings, semicolons at statement ends, and trailing commas in multi-line objects/arrays

#### Scenario: File structure follows conventions
- **WHEN** organizing backend code
- **THEN** route files MUST export Express routers, service files MUST export class instances or function collections, and test files MUST be co-located with source files or in tests/ directory

### Requirement: Frontend Code Conventions
The system SHALL define code style guidelines for frontend React/TypeScript development including component patterns and file organization.

#### Scenario: Component structure is consistent
- **WHEN** creating React components
- **THEN** functional components with hooks MUST be used (not class components), components MUST have TypeScript prop interfaces, and component files MUST export a single default component

#### Scenario: Hooks usage follows patterns
- **WHEN** using React hooks
- **THEN** custom hooks MUST start with "use" prefix, hooks MUST be called at the top level (not in conditions/loops), and useState/useEffect dependencies MUST be correctly specified

### Requirement: TypeScript Usage Guidelines
The system SHALL enforce strict TypeScript usage including type safety, avoiding any types, and proper interface definitions.

#### Scenario: Types are properly defined
- **WHEN** writing TypeScript code
- **THEN** function parameters and return types MUST be explicitly typed, interface names MUST start with capital letters, and type aliases MUST use PascalCase

#### Scenario: Any type is avoided
- **WHEN** dealing with unknown types
- **THEN** explicit types MUST be used instead of any, unknown type MUST be used for truly unknown data, and type guards MUST be used to narrow unknown types

#### Scenario: Strict mode is enabled
- **WHEN** configuring TypeScript
- **THEN** tsconfig.json MUST have strict: true, noImplicitAny: true, and strictNullChecks: true

### Requirement: Naming Conventions
The system SHALL define naming patterns for variables, functions, classes, files, and constants across the codebase.

#### Scenario: Variable naming is clear
- **WHEN** naming variables
- **THEN** camelCase MUST be used for variables and functions, PascalCase for classes and interfaces, UPPER_SNAKE_CASE for constants, and kebab-case for file names

#### Scenario: Function names are descriptive
- **WHEN** naming functions
- **THEN** function names MUST be verbs or verb phrases (e.g., getProducts, createAlert), boolean-returning functions SHOULD start with is/has/can, and event handlers SHOULD start with handle/on

#### Scenario: File naming is consistent
- **WHEN** creating files
- **THEN** React component files MUST use PascalCase (e.g., ProductCard.tsx), service/utility files MUST use camelCase (e.g., productService.ts), and test files MUST match source file name with .test.ts suffix

### Requirement: File Organization Guidelines
The system SHALL define where different types of files should be placed and how directories should be structured.

#### Scenario: Backend files are organized by layer
- **WHEN** adding backend code
- **THEN** routes MUST go in src/routes/, services in src/services/, database schemas in src/db/, types in src/types/, utilities in src/utils/, and middleware in src/middleware/

#### Scenario: Frontend files are organized by function
- **WHEN** adding frontend code
- **THEN** reusable components MUST go in src/components/, page components in src/pages/, custom hooks in src/hooks/, API clients in src/services/, state stores in src/stores/, and shared types in src/types/

#### Scenario: File size is reasonable
- **WHEN** writing code files
- **THEN** files SHOULD be under 300 lines, files over 500 lines MUST be refactored, and large files SHOULD be split by responsibility

### Requirement: Error Handling Standards
The system SHALL define how errors should be caught, logged, and communicated to users.

#### Scenario: Backend errors are handled consistently
- **WHEN** an error occurs in backend code
- **THEN** errors MUST be caught with try/catch blocks, errors MUST be logged with appropriate severity levels, and error responses MUST follow standard format with status code, message, and optional details

#### Scenario: Frontend errors are handled gracefully
- **WHEN** an error occurs in frontend code
- **THEN** async operations MUST use try/catch or .catch(), error boundaries MUST be used for React component errors, and users MUST see meaningful error messages (not technical stack traces)

#### Scenario: Error messages are helpful
- **WHEN** communicating errors
- **THEN** error messages MUST describe what went wrong, error messages SHOULD suggest how to fix the issue, and sensitive information MUST NOT be exposed in error messages

### Requirement: Comment and Documentation Standards
The system SHALL define when and how to write code comments, JSDoc annotations, and inline documentation.

#### Scenario: Complex logic is commented
- **WHEN** writing non-obvious code
- **THEN** complex algorithms MUST have explanatory comments, business logic SHOULD have comments explaining the "why", and performance-critical code MUST document optimization rationale

#### Scenario: Functions have JSDoc comments
- **WHEN** creating public functions/methods
- **THEN** JSDoc comments MUST include description, @param for each parameter with type and description, @returns for return value, and @throws for exceptions if applicable

#### Scenario: Code is self-documenting
- **WHEN** writing code
- **THEN** variable and function names SHOULD be descriptive enough to minimize need for comments, obvious code SHOULD NOT have redundant comments, and commented-out code SHOULD be removed (use version control instead)

### Requirement: Import and Module Organization
The system SHALL define how imports should be ordered and organized in files.

#### Scenario: Imports are organized
- **WHEN** adding imports to a file
- **THEN** imports MUST be grouped in order: external packages first, then internal modules, then relative imports, and groups MUST be separated by blank lines

#### Scenario: Barrel exports are used appropriately
- **WHEN** exporting multiple items from a directory
- **THEN** index.ts files MAY be used for barrel exports, barrel exports SHOULD be used for public API surfaces, but excessive barrel exports (deep re-exporting) SHOULD be avoided for build performance
