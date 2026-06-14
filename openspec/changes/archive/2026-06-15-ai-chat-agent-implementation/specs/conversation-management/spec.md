## ADDED Requirements

### Requirement: Create chat session
The system SHALL provide API to create new chat sessions with auto-generated IDs.

#### Scenario: Create session with default values
- **WHEN** user creates new chat session
- **THEN** system SHALL generate unique session ID and set createdAt to current timestamp

#### Scenario: Create session with custom title
- **WHEN** user creates session with title parameter
- **THEN** system SHALL create session with provided title

#### Scenario: Return session object
- **WHEN** session creation succeeds
- **THEN** system SHALL return session object with id, title, userId, createdAt, and updatedAt fields

### Requirement: Retrieve session list
The system SHALL provide API to retrieve all chat sessions for a user.

#### Scenario: Get all sessions
- **WHEN** user requests session list
- **THEN** system SHALL return all sessions ordered by updatedAt descending

#### Scenario: Filter by date range
- **WHEN** user requests sessions with date filters
- **THEN** system SHALL return only sessions created within specified date range

#### Scenario: Pagination support
- **WHEN** user requests sessions with page and limit parameters
- **THEN** system SHALL return paginated results with total count

#### Scenario: Include message count
- **WHEN** returning session list
- **THEN** system SHALL include message count for each session

### Requirement: Update session metadata
The system SHALL provide API to update session title and other metadata.

#### Scenario: Update session title
- **WHEN** user updates session title
- **THEN** system SHALL update title field and set updatedAt to current timestamp

#### Scenario: Auto-generate title
- **WHEN** session reaches 3 messages and has no custom title
- **THEN** system SHALL generate title based on conversation content using Claude

#### Scenario: Update context summary
- **WHEN** session exceeds 20 messages
- **THEN** system SHALL update contextSummary field with condensed conversation history

### Requirement: Delete chat session
The system SHALL provide API to delete chat sessions and associated messages.

#### Scenario: Delete session with messages
- **WHEN** user deletes a session
- **THEN** system SHALL delete session record and all associated messages from chat_messages table

#### Scenario: Soft delete option
- **WHEN** user deletes session with softDelete parameter true
- **THEN** system SHALL mark session as deleted without removing from database

#### Scenario: Prevent deletion of non-owned sessions
- **WHEN** user attempts to delete session they do not own
- **THEN** system SHALL return 403 Forbidden error

### Requirement: Store and retrieve messages
The system SHALL persist all chat messages with full metadata including tool calls and token usage.

#### Scenario: Store user message
- **WHEN** user sends message
- **THEN** system SHALL insert record with role "user", content text, and timestamp

#### Scenario: Store assistant message
- **WHEN** assistant completes response
- **THEN** system SHALL insert record with role "assistant", content text, token counts, and timestamp

#### Scenario: Store tool call metadata
- **WHEN** assistant uses tools
- **THEN** system SHALL store tool_calls JSON array with tool names and parameters

#### Scenario: Store tool results
- **WHEN** tool execution completes
- **THEN** system SHALL store tool_results JSON array with results for each tool call

#### Scenario: Retrieve messages by session
- **WHEN** user requests messages for a session
- **THEN** system SHALL return all messages ordered by timestamp ascending

#### Scenario: Retrieve messages with pagination
- **WHEN** user requests messages with limit parameter
- **THEN** system SHALL return specified number of most recent messages

### Requirement: Maintain conversation context
The system SHALL manage message history to provide relevant context for AI interactions.

#### Scenario: Get recent context
- **WHEN** preparing to send message to Claude
- **THEN** system SHALL retrieve last 20 messages from session

#### Scenario: Format context for API
- **WHEN** building context array
- **THEN** system SHALL format each message with role and content fields according to Claude API specification

#### Scenario: Include system message
- **WHEN** sending context to Claude
- **THEN** system SHALL prepend system prompt as first message

#### Scenario: Include tool results in context
- **WHEN** previous messages contain tool calls
- **THEN** system SHALL include corresponding tool results in message history

### Requirement: Track token usage
The system SHALL record token consumption for each message to enable cost monitoring.

#### Scenario: Store input tokens
- **WHEN** sending message to Claude
- **THEN** system SHALL record input_tokens from API response in chat_messages table

#### Scenario: Store output tokens
- **WHEN** receiving response from Claude
- **THEN** system SHALL record output_tokens from API response in chat_messages table

#### Scenario: Calculate session total
- **WHEN** retrieving session details
- **THEN** system SHALL calculate total tokens used by summing all message token counts

#### Scenario: Calculate cost estimate
- **WHEN** displaying token usage
- **THEN** system SHALL multiply token counts by current pricing rates to estimate cost

### Requirement: Handle concurrent access
The system SHALL safely handle simultaneous message creation in the same session.

#### Scenario: Prevent race conditions
- **WHEN** multiple messages are sent to same session simultaneously
- **THEN** system SHALL ensure messages are inserted with correct sequential timestamps

#### Scenario: Lock session during streaming
- **WHEN** assistant is generating response for a session
- **THEN** system SHALL reject new user messages for that session until response completes

### Requirement: Implement session search
The system SHALL provide search capability across session titles and message content.

#### Scenario: Search by session title
- **WHEN** user searches with query string
- **THEN** system SHALL return sessions where title contains query (case-insensitive)

#### Scenario: Search message content
- **WHEN** user searches with fullTextSearch parameter true
- **THEN** system SHALL return sessions containing messages that match query

#### Scenario: Highlight search matches
- **WHEN** returning search results
- **THEN** system SHALL include matched text snippets with query terms highlighted

### Requirement: Export conversation history
The system SHALL allow users to export chat sessions in multiple formats.

#### Scenario: Export as JSON
- **WHEN** user requests session export in JSON format
- **THEN** system SHALL return complete session data including all messages and metadata

#### Scenario: Export as Markdown
- **WHEN** user requests session export in Markdown format
- **THEN** system SHALL format messages as readable markdown document with timestamps

#### Scenario: Export as PDF
- **WHEN** user requests session export in PDF format
- **THEN** system SHALL generate PDF document with formatted conversation thread

### Requirement: Maintain data consistency
The system SHALL ensure referential integrity between sessions and messages.

#### Scenario: Foreign key constraint
- **WHEN** inserting message
- **THEN** system SHALL verify session_id exists in chat_sessions table

#### Scenario: Cascade delete
- **WHEN** session is deleted
- **THEN** system SHALL automatically delete all messages with that session_id

#### Scenario: Validate message order
- **WHEN** retrieving messages
- **THEN** system SHALL ensure messages are returned in chronological order without gaps

### Requirement: Implement session archival
The system SHALL support archiving old sessions to maintain performance.

#### Scenario: Auto-archive old sessions
- **WHEN** session has not been accessed for 90 days
- **THEN** system SHALL mark session as archived

#### Scenario: Exclude archived from default list
- **WHEN** retrieving session list without includeArchived parameter
- **THEN** system SHALL return only non-archived sessions

#### Scenario: Restore archived session
- **WHEN** user accesses archived session
- **THEN** system SHALL unarchive session and update lastAccessedAt timestamp
