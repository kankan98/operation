## ADDED Requirements

### Requirement: Internal trial access remains bounded after public trial entry is introduced
The existing internal V0 trial access workflow SHALL remain available only as the app-owned bootstrap/session mechanism behind public trial entry and internal preview evaluation, not as a claim of production login.

#### Scenario: Public trial entry uses existing internal bootstrap
- **WHEN** the public trial entry starts a controlled trial session
- **THEN** it MAY reuse the existing `POST /api/auth/operator-v0-session`, `GET /api/auth/session`, and `POST /api/auth/logout` runtime while presenting the workflow as trial access rather than production authentication

#### Scenario: Internal preview language is reviewed
- **WHEN** docs, specs, or UI describe the internal V0 HTTP preview path
- **THEN** they SHALL keep the boundary clear that internal preview cookies and deterministic V0 teams are for demo/evaluation data only and do not authorize real customer, order, private message, supplier, pricing, or full raw transcript data

#### Scenario: Future provider login replaces trial bootstrap for production
- **WHEN** a future production auth provider is implemented
- **THEN** the internal bootstrap path SHALL remain gated for demo/internal evaluation or be retired through a separate OpenSpec change with migration and verification
