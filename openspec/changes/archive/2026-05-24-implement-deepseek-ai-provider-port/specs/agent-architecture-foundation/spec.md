## MODIFIED Requirements

### Requirement: First Agent implementation has a preferred stack
The project SHALL use a preferred first implementation stack for Agent planning
while preserving provider replacement boundaries.

#### Scenario: LLM provider is selected for the first implementation
- **WHEN** the first real Q&A or analysis Agent implementation is proposed
- **THEN** the user-selected DeepSeek API is the preferred first LLM target behind
  `AiProviderPort`, with OpenAI Responses API retained as a researched reference
  direction, unless a future active OpenSpec change documents a stronger
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
