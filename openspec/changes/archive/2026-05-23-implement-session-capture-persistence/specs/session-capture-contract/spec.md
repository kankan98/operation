## MODIFIED Requirements

### Requirement: Session capture contract exists
The project SHALL provide a session capture contract document before any backend, database, API, Server Action, transcript import, AI review input, or persistence implementation for live-session capture is introduced, and the contract SHALL stay current as partial local runtime slices are added.

#### Scenario: Contributor plans session persistence
- **WHEN** a future change proposes saving, editing, restoring, importing, retrieving, analyzing, or exporting live-session capture records
- **THEN** it uses `docs/contracts/session-capture.md` as required context and updates the contract when the runtime boundary changes

#### Scenario: Contract is read
- **WHEN** a contributor opens the contract
- **THEN** it clearly states which local repository persistence behavior exists and which API, database-provider, upload, transcript parsing, AI, UI, or external-platform behavior remains unimplemented
