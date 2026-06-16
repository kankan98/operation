## ADDED Requirements

### Requirement: Auto-scroll during streaming
The chat interface SHALL automatically scroll to the bottom when new message content is being streamed from the AI assistant.

#### Scenario: Streaming starts after user sends message
- **WHEN** user sends a message and streaming begins
- **THEN** viewport SHALL automatically scroll to show the latest streaming content

#### Scenario: New content arrives while near bottom
- **WHEN** new streaming content arrives and user is within 200px of the bottom
- **THEN** viewport SHALL smoothly scroll to maintain visibility of new content

### Requirement: Preserve user intent to view history
The system SHALL NOT auto-scroll when the user has intentionally scrolled up to view message history.

#### Scenario: User scrolls up during streaming
- **WHEN** streaming is active and user manually scrolls up more than 200px from bottom
- **THEN** auto-scroll SHALL be suspended until user manually scrolls back near bottom

#### Scenario: User scrolls back to bottom
- **WHEN** user scrolls within 120px of the bottom after manually scrolling up
- **THEN** auto-scroll SHALL resume for subsequent streaming content

#### Scenario: User clicks scroll-to-bottom button
- **WHEN** user clicks the scroll-to-bottom button during streaming
- **THEN** viewport SHALL scroll to bottom and auto-scroll SHALL resume

### Requirement: Smooth scroll animation
Auto-scroll behavior SHALL use smooth scrolling animation consistent with the design system.

#### Scenario: Auto-scroll transition
- **WHEN** auto-scroll is triggered
- **THEN** scroll animation SHALL use `behavior: 'smooth'` with ease-out timing

#### Scenario: Performance optimization
- **WHEN** scroll events are triggered
- **THEN** scroll handler SHALL be throttled using requestAnimationFrame to prevent performance degradation

### Requirement: Mobile keyboard adaptation
The system SHALL adjust scroll behavior when mobile keyboard is visible to ensure input field remains accessible.

#### Scenario: Keyboard appears on mobile
- **WHEN** user focuses on chat input field on mobile device
- **THEN** viewport SHALL adjust to keep input field visible above keyboard

#### Scenario: Keyboard dismissal
- **WHEN** mobile keyboard is dismissed after sending message
- **THEN** viewport SHALL restore normal auto-scroll behavior
