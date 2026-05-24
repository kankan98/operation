## ADDED Requirements

### Requirement: Workspace layout density is globally governed
The workspace theme and shell SHALL support full-width operational layouts
without page-local maximum-width wrappers around the entire application.

#### Scenario: Shell layout is changed
- **WHEN** the workspace shell defines desktop width behavior
- **THEN** width constraints are applied intentionally to content sections or
  text blocks, not to the whole application shell
