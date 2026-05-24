## MODIFIED Requirements

### Requirement: Execution service updates durable project records
The AI review execution service SHALL update project contracts, roadmap,
README, and OpenSpec records so future work starts from the current runtime
boundary.

#### Scenario: Future agent reads project status
- **WHEN** a future agent reads the AI review contract, architecture roadmap,
  autonomous roadmap, README, or accepted specs
- **THEN** it can identify that the local server-only AI review execution
  service exists and may be reached through the local-only protected AI review
  API runtime, while Server Action, UI save flow, RAG, queue, and production AI
  release remain out of scope
