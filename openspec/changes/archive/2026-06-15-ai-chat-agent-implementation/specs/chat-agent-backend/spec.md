## ADDED Requirements

### Requirement: Integrate with Claude API
The system SHALL integrate with Anthropic Claude API for natural language processing and tool use.

#### Scenario: Successful API call
- **WHEN** backend sends a message to Claude API with valid API key
- **THEN** system SHALL receive a response within 30 seconds

#### Scenario: Invalid API key
- **WHEN** backend sends a message with invalid ANTHROPIC_API_KEY
- **THEN** system SHALL return error "Invalid API key" with 401 status code

#### Scenario: API timeout
- **WHEN** Claude API does not respond within 30 seconds
- **THEN** system SHALL return timeout error and log the incident

### Requirement: Stream responses to client
The system SHALL stream Claude responses in real-time using Server-Sent Events (SSE).

#### Scenario: Stream text chunks
- **WHEN** Claude API returns streaming response
- **THEN** system SHALL send each text chunk as SSE event with type "text_delta"

#### Scenario: Stream tool calls
- **WHEN** Claude requests tool execution during streaming
- **THEN** system SHALL send tool call event with name and parameters

#### Scenario: Stream completion
- **WHEN** Claude finishes generating response
- **THEN** system SHALL send "done" event and close SSE connection

#### Scenario: Stream interruption
- **WHEN** client disconnects during streaming
- **THEN** system SHALL cancel Claude API request and clean up resources

### Requirement: Persist conversation to database
The system SHALL store all messages and tool calls in chat_sessions and chat_messages tables.

#### Scenario: Create new session
- **WHEN** user starts a new chat
- **THEN** system SHALL create new record in chat_sessions with generated ID and current timestamp

#### Scenario: Store user message
- **WHEN** user sends a message
- **THEN** system SHALL insert record in chat_messages with role "user" and message text

#### Scenario: Store assistant message
- **WHEN** Claude completes response
- **THEN** system SHALL insert record in chat_messages with role "assistant", message text, and token count

#### Scenario: Store tool calls and results
- **WHEN** Claude uses tools during response
- **THEN** system SHALL store tool calls and results as JSON in tool_calls and tool_results columns

### Requirement: Manage conversation context
The system SHALL include recent message history in Claude API calls for context continuity.

#### Scenario: Include last 20 messages
- **WHEN** sending message to Claude
- **THEN** system SHALL include up to 20 most recent messages from current session

#### Scenario: Format messages for Claude
- **WHEN** building context for Claude API
- **THEN** system SHALL format messages as array with role and content fields

#### Scenario: Include tool results in context
- **WHEN** previous messages included tool calls
- **THEN** system SHALL include tool results in conversation history

### Requirement: Handle errors gracefully
The system SHALL handle API errors without crashing and provide meaningful error messages.

#### Scenario: Rate limit exceeded
- **WHEN** Claude API returns 429 rate limit error
- **THEN** system SHALL wait and retry with exponential backoff up to 3 times

#### Scenario: Invalid request format
- **WHEN** Claude API returns 400 bad request
- **THEN** system SHALL log error details and return user-friendly message "Unable to process request"

#### Scenario: Service unavailable
- **WHEN** Claude API returns 503 service unavailable
- **THEN** system SHALL return error "AI service temporarily unavailable" and suggest retry

### Requirement: Log token usage
The system SHALL track and log token consumption for cost monitoring.

#### Scenario: Record tokens per message
- **WHEN** Claude API completes response
- **THEN** system SHALL store input_tokens and output_tokens in chat_messages table

#### Scenario: Calculate session token usage
- **WHEN** retrieving session details
- **THEN** system SHALL sum total tokens used across all messages in session

### Requirement: Apply system prompt
The system SHALL inject system prompt defining agent behavior and output format.

#### Scenario: Include system prompt in API call
- **WHEN** sending message to Claude
- **THEN** system SHALL include system prompt with e-commerce domain expertise and structured output format

#### Scenario: System prompt defines tool usage
- **WHEN** Claude receives system prompt
- **THEN** system SHALL have access to all 10 defined tools for product operations

### Requirement: Support multiple concurrent sessions
The system SHALL handle multiple active chat sessions without interference.

#### Scenario: Parallel session requests
- **WHEN** two users send messages to different sessions simultaneously
- **THEN** system SHALL process both requests independently without race conditions

#### Scenario: Session isolation
- **WHEN** retrieving messages for a session
- **THEN** system SHALL return only messages belonging to that session ID
