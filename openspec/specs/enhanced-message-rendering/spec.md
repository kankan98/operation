# Enhanced Message Rendering

## Purpose

This capability provides rich rendering of assistant messages with syntax highlighting, markdown formatting, smooth animations, and enhanced visual presentation of code and structured content.

## Requirements

### Requirement: Syntax highlight code blocks in assistant messages
The system SHALL apply language-specific syntax highlighting to code blocks.

#### Scenario: Detect language from code fence
- **WHEN** assistant message contains code block with language identifier (e.g., ```typescript)
- **THEN** system applies syntax highlighting for that language using react-syntax-highlighter

#### Scenario: Default styling for code blocks
- **WHEN** rendering highlighted code block
- **THEN** system uses oneDark theme with 8px border radius and 13px font size

#### Scenario: Inline code formatting
- **WHEN** assistant message contains inline code (single backtick)
- **THEN** system renders with subtle background, 1.5px padding, and monospace font without syntax highlighting

#### Scenario: Unsupported language fallback
- **WHEN** code block language is not recognized by highlighter
- **THEN** system renders as plain monospace code block without colors

### Requirement: Tool card expand/collapse animation
The system SHALL smoothly animate tool card content visibility.

#### Scenario: Expand animation
- **WHEN** user clicks to expand collapsed tool card
- **THEN** system animates max-height from 0 to 384px and opacity from 0 to 1 over 200ms

#### Scenario: Collapse animation
- **WHEN** user clicks to collapse expanded tool card
- **THEN** system animates max-height from 384px to 0 and opacity from 1 to 0 over 200ms

#### Scenario: Animation easing
- **WHEN** tool card expand/collapse animation runs
- **THEN** system uses ease-out-soft cubic-bezier timing function

### Requirement: Markdown rendering with GFM support
The system SHALL render assistant messages with full GitHub Flavored Markdown support.

#### Scenario: Tables rendering
- **WHEN** assistant message contains markdown table
- **THEN** system renders bordered table with header styling and cell padding

#### Scenario: Task lists rendering
- **WHEN** assistant message contains task list (- [ ] / - [x])
- **THEN** system renders checkboxes with proper checked/unchecked state

#### Scenario: Strikethrough text
- **WHEN** assistant message contains ~~strikethrough~~
- **THEN** system renders text with line-through decoration

### Requirement: Smooth scroll animations
The system SHALL use smooth scrolling for all auto-scroll operations.

#### Scenario: Scroll to bottom animation
- **WHEN** system auto-scrolls to show new content
- **THEN** scroll animation uses smooth behavior over 300-500ms

#### Scenario: Manual scroll to bottom
- **WHEN** user clicks scroll-to-bottom button
- **THEN** system scrolls to bottom with smooth animation
