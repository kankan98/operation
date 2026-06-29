## ADDED Requirements

### Requirement: Frontend SHALL prevent duplicate concurrent requests
The frontend chat interface SHALL block duplicate message submissions during active streaming.

#### Scenario: Double-click prevention
- **WHEN** user double-clicks send button within 500ms
- **THEN** only first click triggers message submission, second click is ignored

#### Scenario: Button disabled during streaming
- **WHEN** message is being streamed (isStreaming = true)
- **THEN** send button is disabled and does not respond to clicks

#### Scenario: Keyboard shortcut protection
- **WHEN** user presses Enter twice rapidly while message is streaming
- **THEN** second Enter keypress is ignored (form submission blocked)

### Requirement: Backend SHALL reject duplicate content within time window
The backend chat endpoint SHALL detect and reject duplicate message content from the same session within a short time window.

#### Scenario: Duplicate content detection
- **WHEN** same sessionId sends identical content within 5 seconds
- **THEN** backend returns 429 Too Many Requests with "duplicate_request" error code

#### Scenario: Different content allowed
- **WHEN** same sessionId sends different content within 5 seconds
- **THEN** backend processes request normally (not a duplicate)

#### Scenario: Same content after window allowed
- **WHEN** same sessionId sends identical content after 5 seconds
- **THEN** backend processes request normally (legitimate retry)

### Requirement: Backend SHALL track in-flight requests per session
The backend chat endpoint SHALL maintain a registry of active streaming requests per session.

#### Scenario: Concurrent request rejection
- **WHEN** session already has an active SSE stream in progress
- **THEN** new SSE request for same session is rejected with 409 Conflict

#### Scenario: Registry cleanup on completion
- **WHEN** SSE stream completes or errors
- **THEN** session is removed from in-flight registry

#### Scenario: Registry cleanup on timeout
- **WHEN** in-flight entry exists but SSE connection is closed
- **THEN** stale entry is removed after 30 seconds

### Requirement: Deduplication SHALL use content hash for comparison
The system SHALL use SHA-256 hash of trimmed message content for duplicate detection.

#### Scenario: Content normalization
- **WHEN** comparing messages for deduplication
- **THEN** content is trimmed (leading/trailing whitespace removed) before hashing

#### Scenario: Hash collision handling
- **WHEN** hash collision occurs (extremely rare)
- **THEN** system performs full string comparison as fallback
