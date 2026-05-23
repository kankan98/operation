## ADDED Requirements

### Requirement: Agent architecture uses replaceable ports
The future Q&A and analysis Agent SHALL use replaceable provider, retrieval,
source discovery, evaluation, and persistence ports rather than direct calls from
UI components.

#### Scenario: Agent calls an LLM
- **WHEN** a future Agent run needs model generation, structured output,
  streaming, tool use, or safety handling
- **THEN** the call goes through a project-owned `AiProviderPort` adapter that
  records provider, model, prompt version, run status, token/cost metadata where
  available, and error state

#### Scenario: Agent retrieves knowledge
- **WHEN** the Agent needs product, live-commerce, talk-track, source, or team
  knowledge
- **THEN** retrieval goes through a `RetrievalPort` that returns reviewed
  knowledge snapshot references, source metadata, freshness, trust level, and
  tenant/team scope

#### Scenario: Agent discovers public sources
- **WHEN** reviewed knowledge is insufficient and web discovery is allowed by a
  future change
- **THEN** public source lookup goes through a `SourceDiscoveryPort` and returns
  cited, review-only findings rather than directly publishing new knowledge

### Requirement: First Agent implementation has a preferred stack
The project SHALL use a preferred first implementation stack for Agent planning
while preserving provider replacement boundaries.

#### Scenario: LLM provider is selected for the first implementation
- **WHEN** the first real Q&A or analysis Agent implementation is proposed
- **THEN** OpenAI Responses API is the preferred first LLM target behind
  `AiProviderPort`, unless the active OpenSpec change documents a stronger
  alternative with migration and verification evidence

#### Scenario: RAG storage is selected for the first implementation
- **WHEN** the first real retrieval-backed Agent implementation is proposed
- **THEN** PostgreSQL with pgvector is the preferred MVP vector store, combined
  with metadata filters and text search, unless measured recall, latency,
  volume, or operations constraints justify an external vector database

#### Scenario: AI SDK is considered
- **WHEN** a future implementation evaluates Vercel AI SDK or another model
  orchestration library
- **THEN** the library is used only behind project adapter boundaries or thin UI
  streaming wrappers, and direct provider calls from route components remain
  prohibited

### Requirement: Agent runs follow a deterministic state machine
The Agent SHALL use an explicit state machine for operator-facing answers and
analysis rather than open-ended self-modifying behavior.

#### Scenario: Agent answers a question
- **WHEN** an operator asks a product, session, talk-track, or operations
  question
- **THEN** the Agent classifies intent, retrieves reviewed knowledge, checks
  freshness and uncertainty, composes a structured answer with citations,
  labels AI inference, and records answer metadata for review and feedback

#### Scenario: Agent cannot answer confidently
- **WHEN** reviewed knowledge is missing, stale, conflicting, or outside allowed
  scope
- **THEN** the Agent reports uncertainty, suggests what source or review is
  needed, and only performs public web discovery if a future stage explicitly
  enables it

#### Scenario: Feedback is captured
- **WHEN** an operator gives thumbs-up, thumbs-down, edit, regenerate, or reason
  feedback
- **THEN** the feedback becomes an auditable quality signal linked to answer,
  retrieval snapshot, prompt version, provider/model, and reviewer context where
  persistence exists

### Requirement: RAG uses reviewed knowledge snapshots
The Agent SHALL ground reusable answers in reviewed knowledge snapshots rather
than raw pages, unreviewed search results, or hidden prompt context.

#### Scenario: RAG context is assembled
- **WHEN** retrieval context is built for an Agent run
- **THEN** the context includes only the minimum necessary fields, source IDs,
  review state, freshness, trust level, and tenant/team ownership required to
  answer the question

#### Scenario: Web-found fact should become reusable
- **WHEN** public source discovery finds a useful fact for future answers
- **THEN** the fact enters the knowledge review lifecycle with source metadata,
  retrieval time, trust level, reviewer decision, versioning, and refresh policy
  before it can ground future answers

### Requirement: Agent quality is evaluated before release
Agent behavior SHALL be verified against representative operator questions and
failure cases before it changes production answer behavior.

#### Scenario: Agent prompt or retrieval rule changes
- **WHEN** prompt, output schema, retrieval filters, ranking, model, provider,
  or answer policy changes
- **THEN** verification covers representative product questions, insufficient
  knowledge, stale sources, conflicting facts, long inputs, malformed model
  output, provider failure, citation correctness, and feedback capture
