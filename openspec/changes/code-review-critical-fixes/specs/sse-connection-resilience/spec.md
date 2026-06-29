## ADDED Requirements

### Requirement: SSE connection SHALL detect client disconnection
The backend SSE endpoint SHALL monitor the client connection and immediately abort stream processing when the client disconnects.

#### Scenario: Client disconnects during stream
- **WHEN** client closes browser tab or loses network connection during active SSE stream
- **THEN** backend detects disconnection via `req.on('close')` event and aborts the generator

#### Scenario: Generator cleanup after abort
- **WHEN** connection abort is detected
- **THEN** generator stops executing and releases all resources (memory, database connections, API clients)

### Requirement: SSE connection SHALL send periodic heartbeats
The backend SSE endpoint SHALL send heartbeat events every 15 seconds to keep connection alive through proxies and load balancers.

#### Scenario: Heartbeat prevents proxy timeout
- **WHEN** SSE stream is active but no data events for 30+ seconds (long-running tool execution)
- **THEN** heartbeat events (`: heartbeat\n\n`) sent every 15 seconds prevent proxy idle timeout

#### Scenario: Heartbeat cleanup on stream end
- **WHEN** stream completes or errors
- **THEN** heartbeat interval timer is cleared to prevent memory leaks

### Requirement: SSE stream SHALL have automatic expiration timeout
The backend SSE endpoint SHALL abort streams that exceed maximum duration to prevent infinite resource consumption.

#### Scenario: Stream timeout after maximum duration
- **WHEN** SSE stream runs longer than 10 minutes
- **THEN** stream is automatically aborted with timeout error event

#### Scenario: Timeout cleared on natural completion
- **WHEN** stream completes naturally before timeout
- **THEN** timeout timer is cleared to prevent false abort

### Requirement: SSE response headers SHALL disable buffering
The backend SSE endpoint SHALL set appropriate headers to disable buffering in proxies and browsers.

#### Scenario: Headers prevent buffering
- **WHEN** SSE connection is established
- **THEN** response includes headers: `Cache-Control: no-cache, no-transform`, `Connection: keep-alive`, `X-Accel-Buffering: no`

#### Scenario: Initial connection acknowledgment
- **WHEN** SSE connection is established
- **THEN** server sends initial `:ok\n\n` comment before starting stream to confirm connection
