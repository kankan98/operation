## ADDED Requirements

### Requirement: Resolve production chat API URLs safely
The production chat UI SHALL resolve chat REST, task REST, and direct SSE API URLs to a reachable public or same-origin backend, and SHALL NOT use browser-visible loopback API origins from a non-local page origin.

#### Scenario: Public origin ignores localhost API configuration
- **WHEN** the chat UI is loaded from a non-local origin such as `http://203.195.161.93`
- **AND** the configured API base URL points to `http://localhost:3001/api`, `http://127.0.0.1:3001/api`, or `http://[::1]:3001/api`
- **THEN** chat REST, task REST, and direct SSE URLs SHALL use same-origin `/api`
- **AND** the browser SHALL NOT request `localhost`, `127.0.0.1`, or `[::1]`

#### Scenario: Local development keeps localhost API configuration
- **WHEN** the chat UI is loaded from `localhost`, `127.0.0.1`, or `[::1]`
- **AND** the configured API base URL points to a loopback API origin
- **THEN** chat REST, task REST, and direct SSE URLs SHALL preserve that configured loopback API origin

#### Scenario: Public API configuration is preserved
- **WHEN** the configured API base URL points to a non-loopback public origin
- **THEN** chat REST, task REST, and direct SSE URLs SHALL preserve the configured public API origin
