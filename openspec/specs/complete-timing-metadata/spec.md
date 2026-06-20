# Complete Timing Metadata

## Purpose

规定所有时间计算（工具执行时长、开始时间、结束时间等）均由后端完成并包含在事件中，确保流式工具事件自带完整、可信的计时信息，前端无需维护额外时间状态或自行计算持续时间。

## Requirements

### Requirement: Backend calculates tool timing
The system SHALL calculate all tool execution timing on the backend.

#### Scenario: Start time capture
- **WHEN** tool execution begins
- **THEN** backend SHALL capture startTime as Unix timestamp in milliseconds

#### Scenario: End time capture
- **WHEN** tool execution completes
- **THEN** backend SHALL capture endTime as Unix timestamp in milliseconds

#### Scenario: Duration calculation
- **WHEN** tool execution completes
- **THEN** backend SHALL calculate durationMs as (endTime - startTime)

### Requirement: Tool start includes timestamp
The system SHALL include timestamp in tool_start events.

#### Scenario: Tool start timestamp
- **WHEN** tool_start event is emitted
- **THEN** event SHALL include timestamp field with tool start time

### Requirement: Tool complete includes full timing
The system SHALL include complete timing information in tool_complete events.

#### Scenario: Timing object structure
- **WHEN** tool_complete event is emitted
- **THEN** event SHALL include timing object with startTime, endTime, and durationMs fields

#### Scenario: Self-contained timing
- **WHEN** tool_complete event is emitted
- **THEN** timing object SHALL contain complete information without requiring previous events

### Requirement: Frontend uses backend timing
The frontend SHALL NOT calculate tool execution duration.

#### Scenario: Direct timing display
- **WHEN** frontend receives tool_complete event
- **THEN** frontend SHALL use timing.durationMs directly for display

#### Scenario: No timing state management
- **WHEN** frontend processes tool events
- **THEN** frontend SHALL NOT maintain state maps for tool start times
