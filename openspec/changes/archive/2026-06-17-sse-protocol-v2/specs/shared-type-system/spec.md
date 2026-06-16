## ADDED Requirements

### Requirement: Single type definition source
The system SHALL define SSE protocol types in a single shared location.

#### Scenario: Shared types file
- **WHEN** SSE protocol types are defined
- **THEN** all types SHALL be defined in shared/types/sse-protocol.ts

#### Scenario: Backend imports shared types
- **WHEN** backend code uses SSE types
- **THEN** backend SHALL import types from shared/types/sse-protocol.ts

#### Scenario: Frontend imports shared types
- **WHEN** frontend code uses SSE types
- **THEN** frontend SHALL import types from shared/types/sse-protocol.ts

### Requirement: Type safety across boundaries
The system SHALL ensure type safety between frontend and backend.

#### Scenario: Event type union
- **WHEN** SSE event is processed
- **THEN** event SHALL conform to SSEEvent union type

#### Scenario: Compile-time type checking
- **WHEN** code is compiled
- **THEN** TypeScript SHALL verify type compatibility across frontend/backend

### Requirement: Comprehensive type definitions
The system SHALL provide complete TypeScript type definitions for all SSE entities.

#### Scenario: Event types
- **WHEN** any SSE event is emitted
- **THEN** event SHALL have a corresponding TypeScript interface (e.g., MessageStartEvent, ContentDeltaEvent)

#### Scenario: Request types
- **WHEN** API request is made
- **THEN** request body SHALL conform to StartStreamRequest interface

#### Scenario: Response types
- **WHEN** API response is sent
- **THEN** response body SHALL conform to StartStreamResponse interface

#### Scenario: Error types
- **WHEN** error is emitted
- **THEN** error code SHALL conform to StreamErrorCode enum

### Requirement: Type documentation
The system SHALL document all types with JSDoc comments.

#### Scenario: Interface documentation
- **WHEN** type is defined
- **THEN** type SHALL include JSDoc comment explaining its purpose

#### Scenario: Field documentation
- **WHEN** interface field is defined
- **THEN** field SHALL include inline comment explaining its meaning

### Requirement: No duplicate type definitions
The system SHALL NOT define the same types in multiple locations.

#### Scenario: Remove backend-specific types
- **WHEN** shared types are adopted
- **THEN** backend/src/types/chat.ts types SHALL be removed or migrated

#### Scenario: Remove frontend-specific types
- **WHEN** shared types are adopted
- **THEN** frontend/src/types/chat.ts types SHALL be removed or migrated

#### Scenario: Deprecate legacy schemas
- **WHEN** unified types are in use
- **THEN** shared/schemas/chat-events.ts SHALL be removed or marked deprecated
