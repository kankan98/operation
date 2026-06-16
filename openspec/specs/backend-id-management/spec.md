# Backend ID Management

## Purpose

规定所有 ID（messageId、sessionId、streamId、toolId）均由后端生成，前端不生成任何临时 ID，确保 ID 的唯一性和一致性。

## Requirements

### Requirement: Backend generates message ID
The system SHALL generate messageId on the backend before streaming begins.

#### Scenario: Message ID generation
- **WHEN** POST /api/chat/stream is called
- **THEN** backend SHALL generate a unique messageId using UUID v4

#### Scenario: Message ID in response
- **WHEN** POST /api/chat/stream succeeds
- **THEN** response SHALL include the generated messageId

#### Scenario: Message ID in first event
- **WHEN** SSE streaming begins
- **THEN** message_start event SHALL include the same messageId

### Requirement: Backend generates session ID
The system SHALL generate sessionId on the backend when not provided.

#### Scenario: Session ID auto-creation
- **WHEN** POST /api/chat/stream is called without sessionId
- **THEN** backend SHALL generate a new sessionId using UUID v4

#### Scenario: Session ID reuse
- **WHEN** POST /api/chat/stream is called with existing sessionId
- **THEN** backend SHALL use the provided sessionId

#### Scenario: Session ID in response
- **WHEN** POST /api/chat/stream succeeds
- **THEN** response SHALL include the sessionId (new or existing)

### Requirement: Backend generates stream ID
The system SHALL generate streamId to track each streaming session.

#### Scenario: Stream ID generation
- **WHEN** POST /api/chat/stream is called
- **THEN** backend SHALL generate a unique streamId using UUID v4

#### Scenario: Stream ID in response
- **WHEN** POST /api/chat/stream succeeds
- **THEN** response SHALL include the generated streamId

#### Scenario: Stream ID in events
- **WHEN** message_start event is emitted
- **THEN** event SHALL include the streamId for tracking

### Requirement: Backend generates tool call ID
The system SHALL generate tool call IDs for each tool execution.

#### Scenario: Tool ID generation
- **WHEN** tool execution begins
- **THEN** backend SHALL generate a unique tool call ID

#### Scenario: Tool ID consistency
- **WHEN** tool_start and tool_complete events are emitted for the same tool
- **THEN** both events SHALL reference the same tool call ID

### Requirement: Frontend uses backend IDs
The frontend SHALL NOT generate any temporary IDs.

#### Scenario: No frontend message ID
- **WHEN** frontend initiates a message
- **THEN** frontend SHALL wait for message_start event to receive messageId

#### Scenario: No frontend session ID
- **WHEN** frontend creates a new conversation
- **THEN** frontend SHALL wait for POST /api/chat/stream response to receive sessionId
