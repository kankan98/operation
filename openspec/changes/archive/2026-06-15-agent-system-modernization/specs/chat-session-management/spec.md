## ADDED Requirements

### Requirement: Delete specific messages
The system SHALL support deleting individual messages by ID.

#### Scenario: Delete assistant message
- **WHEN** DELETE request sent to /api/chat/sessions/:id/messages/:messageId for assistant message
- **THEN** system removes message from database and returns 204 No Content

#### Scenario: Delete with cascading tool data
- **WHEN** deleting assistant message with tool calls and results
- **THEN** system removes message including all embedded tool call and result data

#### Scenario: Delete non-existent message
- **WHEN** DELETE request sent for message ID that doesn't exist
- **THEN** system returns 404 Not Found error

### Requirement: Regenerate assistant message endpoint
The system SHALL provide dedicated endpoint to regenerate last assistant response.

#### Scenario: Regenerate request
- **WHEN** POST request sent to /api/chat/sessions/:id/messages/:messageId/regenerate
- **THEN** system deletes the assistant message, retrieves original user message content, and returns stream URL

#### Scenario: Regenerate non-assistant message
- **WHEN** POST regenerate request sent for user message
- **THEN** system returns 400 Bad Request error

#### Scenario: Regenerate without prior user message
- **WHEN** POST regenerate request sent but no user message exists before target message
- **THEN** system returns 400 Bad Request error
