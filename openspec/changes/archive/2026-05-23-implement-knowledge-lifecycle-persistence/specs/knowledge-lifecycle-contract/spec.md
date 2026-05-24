## MODIFIED Requirements

### Requirement: Knowledge lifecycle contract exists
The project SHALL provide a knowledge lifecycle contract document before any backend, database, API, Server Action, source import, web discovery, RAG indexing, AI grounding, refresh job, or persistence implementation for the knowledge system is introduced, and the contract SHALL stay current as partial local runtime slices are added.

#### Scenario: Contributor plans knowledge persistence
- **WHEN** a future change proposes saving, importing, reviewing, refreshing, publishing, retrieving, indexing, or grounding knowledge
- **THEN** it uses `docs/contracts/knowledge-lifecycle.md` as required context and updates the contract when the runtime boundary changes

#### Scenario: Contract is read
- **WHEN** a contributor opens the contract
- **THEN** it clearly states which local repository persistence behavior exists and which API, browser save flow, crawler, web discovery, RAG, AI, scheduled job, production provider, or external integration behavior remains unimplemented
