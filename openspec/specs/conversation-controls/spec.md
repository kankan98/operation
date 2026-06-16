# Conversation Controls

## Purpose

This capability provides user interaction controls for managing streaming responses, including abort, regenerate, and scroll management with auto-scroll behavior.

## Requirements

### Requirement: User can abort streaming response
The system SHALL allow users to stop an in-progress streaming response.

#### Scenario: Abort during text streaming
- **WHEN** user clicks stop button while assistant is streaming text
- **THEN** system closes EventSource connection and marks streaming as stopped

#### Scenario: Abort during tool execution
- **WHEN** user clicks stop button while tools are executing
- **THEN** system closes connection immediately without waiting for tool completion

#### Scenario: UI state after abort
- **WHEN** streaming is aborted
- **THEN** system re-enables input field and hides stop button

### Requirement: User can regenerate assistant response
The system SHALL allow users to retry the last assistant response with the same user message.

#### Scenario: Regenerate button visibility
- **WHEN** user hovers over assistant message
- **THEN** system displays regenerate button in message actions

#### Scenario: Regenerate execution
- **WHEN** user clicks regenerate on assistant message
- **THEN** system deletes the assistant message, retrieves original user message content, and re-triggers streaming

#### Scenario: Regenerate with tool calls
- **WHEN** regenerating an assistant message that used tools
- **THEN** system executes fresh tool calls (not cached results)

### Requirement: Scroll to bottom with new message indicator
The system SHALL provide a button to scroll to bottom when user is scrolled up and new content arrives.

#### Scenario: Show scroll button when scrolled up
- **WHEN** user scrolls more than 200px from bottom
- **THEN** system displays floating scroll-to-bottom button

#### Scenario: Hide scroll button when at bottom
- **WHEN** user is within 120px of bottom
- **THEN** system hides scroll-to-bottom button

#### Scenario: New message indicator
- **WHEN** new assistant content arrives while user is scrolled up
- **THEN** system shows red dot indicator on scroll-to-bottom button

#### Scenario: Smooth scroll on button click
- **WHEN** user clicks scroll-to-bottom button
- **THEN** system smoothly scrolls to bottom and clears new message indicator

### Requirement: Auto-scroll behavior
The system SHALL automatically scroll to bottom only when user is already near bottom.

#### Scenario: Auto-scroll when near bottom
- **WHEN** new content arrives and user is within 120px of bottom
- **THEN** system automatically scrolls to show new content

#### Scenario: No auto-scroll when scrolled up
- **WHEN** new content arrives and user is more than 120px from bottom
- **THEN** system does not auto-scroll (preserves user's reading position)
