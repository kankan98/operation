# Stream Manager

## Purpose

管理 SSE 流的生命周期，包括流的创建、存储、检索和清理。提供内存中的流状态管理，无需持久化到数据库。

## Requirements

### Requirement: In-memory stream storage
The system SHALL manage active streams in memory.

#### Scenario: Stream map storage
- **WHEN** stream is created
- **THEN** StreamManager SHALL store mapping from streamId to AsyncGenerator in memory

#### Scenario: Stream retrieval
- **WHEN** SSE connection is requested with streamId
- **THEN** StreamManager SHALL retrieve the corresponding AsyncGenerator from memory

#### Scenario: Stream not found
- **WHEN** SSE connection is requested with non-existent streamId
- **THEN** StreamManager SHALL return undefined

### Requirement: Automatic stream cleanup
The system SHALL automatically clean up expired streams.

#### Scenario: Time-based expiration
- **WHEN** stream is created
- **THEN** StreamManager SHALL schedule automatic deletion after 5 minutes

#### Scenario: Completion cleanup
- **WHEN** message_complete event is emitted
- **THEN** StreamManager SHALL immediately delete the stream from memory

#### Scenario: Error cleanup
- **WHEN** error_occurred event is emitted
- **THEN** StreamManager SHALL immediately delete the stream from memory

### Requirement: Stream lifecycle management
The system SHALL manage the complete lifecycle of streaming sessions.

#### Scenario: Stream creation
- **WHEN** POST /api/chat/stream is called
- **THEN** StreamManager SHALL create new stream with unique streamId and store generator

#### Scenario: Stream consumption
- **WHEN** GET /api/chat/streams/:streamId is called
- **THEN** StreamManager SHALL retrieve and iterate through the AsyncGenerator

#### Scenario: Single consumption
- **WHEN** stream is consumed once
- **THEN** subsequent GET requests with same streamId SHALL fail (stream already consumed or expired)

### Requirement: Generator creation
The system SHALL create AsyncGenerator for each streaming session.

#### Scenario: Generator parameters
- **WHEN** stream is created
- **THEN** generator SHALL be initialized with sessionId, messageId, and content

#### Scenario: Event generation
- **WHEN** generator is iterated
- **THEN** generator SHALL yield SSEEvent objects in correct sequence

#### Scenario: Error handling
- **WHEN** error occurs during generation
- **THEN** generator SHALL yield error_occurred event and terminate

### Requirement: Heartbeat mechanism
The system SHALL send periodic heartbeats to keep connections alive.

#### Scenario: Heartbeat interval
- **WHEN** SSE connection is active with no events
- **THEN** system SHALL send heartbeat comment (": heartbeat") every 15 seconds

#### Scenario: Heartbeat format
- **WHEN** heartbeat is sent
- **THEN** system SHALL use SSE comment format (line starting with ":")

### Requirement: No stream persistence
The system SHALL NOT persist streams to database.

#### Scenario: Memory-only storage
- **WHEN** stream is created
- **THEN** stream state SHALL exist only in application memory

#### Scenario: No cross-process recovery
- **WHEN** application restarts
- **THEN** all active streams SHALL be lost (clients must reconnect)
