## ADDED Requirements

### Requirement: Internal preview verifies unified trial access
The internal V0 public preview SHALL verify the unified trial access path in addition to static route health whenever this workflow is archived and deployed.

#### Scenario: Public preview trial access smoke passes
- **WHEN** the Docker public preview is deployed with explicit V0 preview flags and a reachable preview database
- **THEN** verification SHALL include bootstrap with the custom CSRF header, scoped session or protected V0 API access, and safe non-secret output

#### Scenario: Public preview trial access remains demo-only
- **WHEN** the unified trial access UI appears on the HTTP public preview
- **THEN** it SHALL communicate internal/demo team entry in concise operator language and SHALL NOT invite real customer private messages, order data, supplier data, pricing strategy, or full raw transcripts

#### Scenario: Preview flags are missing
- **WHEN** the internal preview bootstrap or access path is disabled by environment flags
- **THEN** the unified trial access surface SHALL fail safely with a re-enter or unavailable state and SHALL NOT issue a session cookie silently
