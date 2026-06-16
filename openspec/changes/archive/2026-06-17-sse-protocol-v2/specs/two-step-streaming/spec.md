## ADDED Requirements

### Requirement: Stream creation endpoint
The system SHALL provide a REST API endpoint to create a streaming session.

#### Scenario: Create stream with existing session
- **WHEN** client sends POST /api/chat/stream with valid sessionId and content
- **THEN** system SHALL return 202 Accepted with streamId, messageId, and sessionId

#### Scenario: Create stream without session
- **WHEN** client sends POST /api/chat/stream with only content (no sessionId)
- **THEN** system SHALL create a new session and return 202 Accepted with streamId, messageId, and new sessionId

#### Scenario: Invalid request without content
- **WHEN** client sends POST /api/chat/stream without content field
- **THEN** system SHALL return 400 Bad Request with error code INVALID_REQUEST

#### Scenario: Session not found
- **WHEN** client sends POST /api/chat/stream with non-existent sessionId
- **THEN** system SHALL return 404 Not Found with error code SESSION_NOT_FOUND

### Requirement: SSE connection endpoint
The system SHALL provide a Server-Sent Events endpoint for receiving streaming events.

#### Scenario: Establish SSE connection
- **WHEN** client sends GET /api/chat/streams/:streamId with Accept: text/event-stream
- **THEN** system SHALL return 200 OK with Content-Type: text/event-stream and start streaming events

#### Scenario: Stream not found
- **WHEN** client sends GET /api/chat/streams/:streamId with invalid or expired streamId
- **THEN** system SHALL return 404 Not Found with error code STREAM_NOT_FOUND

#### Scenario: Connection headers
- **WHEN** SSE connection is established
- **THEN** system SHALL set headers: Cache-Control: no-cache, Connection: keep-alive, X-Accel-Buffering: no

### Requirement: Request body structure
The system SHALL accept streaming requests with specific JSON structure.

#### Scenario: Required fields
- **WHEN** POST /api/chat/stream is called
- **THEN** request body MUST contain "content" field as string

#### Scenario: Optional session field
- **WHEN** POST /api/chat/stream is called
- **THEN** request body MAY contain optional "sessionId" field as string

### Requirement: Response structure
The system SHALL return streaming session metadata in a specific JSON structure.

#### Scenario: Success response fields
- **WHEN** POST /api/chat/stream succeeds
- **THEN** response SHALL contain "streamId" (string), "messageId" (string), and "sessionId" (string)

#### Scenario: Response status code
- **WHEN** POST /api/chat/stream succeeds
- **THEN** response SHALL return HTTP 202 Accepted status code
