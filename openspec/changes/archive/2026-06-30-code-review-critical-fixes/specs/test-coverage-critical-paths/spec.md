## ADDED Requirements

### Requirement: SSE streaming SHALL have E2E reliability tests
The test suite SHALL include Playwright E2E tests covering SSE connection lifecycle, message streaming, and error handling.

#### Scenario: Normal message streaming flow
- **WHEN** E2E test sends message and waits for completion
- **THEN** test verifies: connection established, message_start received, content_delta events streamed, message_complete received

#### Scenario: Long-running stream with heartbeat
- **WHEN** E2E test triggers tool execution lasting 60+ seconds
- **THEN** test verifies heartbeat events received during execution, connection stays alive, final result delivered

#### Scenario: Connection interruption recovery
- **WHEN** E2E test simulates network disconnection mid-stream
- **THEN** test verifies connection closes gracefully, backend cleans up resources

### Requirement: Product query tests SHALL verify type contracts
Unit tests SHALL verify that product queries return complete objects matching the Product type.

#### Scenario: getAllProducts returns complete Product objects
- **WHEN** test calls getAllProducts()
- **THEN** every returned object has all required Product fields (id, title, platform, currentPrice, updatedAt, asin, productUrl, etc.)

#### Scenario: Partial field queries clearly documented
- **WHEN** query uses fields parameter for performance
- **THEN** return type explicitly indicates partial object (not Product[])

#### Scenario: Field access validation
- **WHEN** test accesses commonly used fields (updatedAt, asin, productUrl)
- **THEN** fields exist and have correct types (no undefined)

### Requirement: Chat double-click SHALL be prevented in E2E tests
E2E tests SHALL verify that rapid double-submission is blocked.

#### Scenario: Double-click send button
- **WHEN** E2E test double-clicks send button within 100ms
- **THEN** only one message is created, second click has no effect

#### Scenario: Rapid Enter keypresses
- **WHEN** E2E test presses Enter twice within 200ms
- **THEN** only one message submission occurs

#### Scenario: Button disabled during streaming
- **WHEN** message is actively streaming
- **THEN** send button is disabled and click events ignored

### Requirement: Memory leak tests SHALL verify cleanup
Unit and E2E tests SHALL verify that resources are properly cleaned up after component unmount or stream completion.

#### Scenario: RAF timer cleanup verification
- **WHEN** test mounts then unmounts chat component during active streaming
- **THEN** pending requestAnimationFrame callbacks are cancelled

#### Scenario: SSE connection cleanup
- **WHEN** test closes chat page during active stream
- **THEN** EventSource connection is closed and backend generator is aborted

#### Scenario: Cache memory bounds
- **WHEN** test runs cache operations for extended period
- **THEN** cache memory usage stays within configured limits (TTL cleanup working)

### Requirement: Smoke tests SHALL validate critical paths
Automated smoke tests SHALL verify critical user journeys work end-to-end.

#### Scenario: Send message and receive response
- **WHEN** smoke test sends simple question
- **THEN** receives complete AI response within 30 seconds

#### Scenario: Tool execution flow
- **WHEN** smoke test triggers product search tool
- **THEN** tool executes successfully and results appear in chat

#### Scenario: Session persistence
- **WHEN** smoke test creates conversation and refreshes page
- **THEN** conversation history loads correctly

### Requirement: Performance regression tests SHALL track metrics
Tests SHALL measure and track performance metrics to detect regressions.

#### Scenario: Product query performance baseline
- **WHEN** test runs getAllProducts() 100 times
- **THEN** 95th percentile latency stays under 100ms

#### Scenario: SSE latency tracking
- **WHEN** test measures time from send to first content_delta
- **THEN** median latency stays under 2 seconds

#### Scenario: Cache hit rate monitoring
- **WHEN** test runs mixed read/write workload
- **THEN** cache hit rate exceeds 80%
