## ADDED Requirements

### Requirement: Next-session task API supports V0 browser downstream creation
The existing next-session task API runtime SHALL support V0 browser creation of manual and AI-review-sourced tasks without requiring new database tables or external providers.

#### Scenario: Browser creates AI-review-sourced task
- **WHEN** an authenticated V0 operator calls the task create route with explicit scope, CSRF, AI review source metadata, accepted-section summary, task type, priority, owner where available, and checklist items
- **THEN** the route SHALL create a scoped source-linked task through the existing repository and return safe no-store JSON with the task view

#### Scenario: Browser creates manual task
- **WHEN** an authenticated V0 operator calls the task create route with explicit scope, CSRF, manual task title, summary, and manual source metadata
- **THEN** the route SHALL create a scoped manual follow-up task and SHALL NOT require AI run metadata

#### Scenario: Unsafe task creation is rejected safely
- **WHEN** the browser sends sensitive, duplicate, malformed, invalid assignee, invalid source, or unsupported task data
- **THEN** the route SHALL return the existing safe route error without exposing raw cookies, auth references, database URLs, prompts, provider payloads, raw customer messages, or cross-team records
