## 1. Contract Planning

- [x] 1.1 Add `docs/contracts/README.md` with contract scope, required sections, template, and priority contracts
- [x] 1.2 Update the roadmap with the static UI to contract to backend/AI implementation sequence
- [x] 1.3 Add OpenSpec requirements for interface contracts before backend, database, AI, RAG, or integration implementation

## 2. Agent Architecture

- [x] 2.1 Add `docs/architecture/agent-architecture.md` with LLM, RAG, provider adapter, orchestration, feedback, and evaluation decisions
- [x] 2.2 Set first implementation defaults for OpenAI Responses API behind `AiProviderPort` and PostgreSQL + pgvector behind `RetrievalPort`
- [x] 2.3 Add OpenSpec requirements for Agent ports, deterministic state machine, reviewed knowledge snapshots, and evaluation gates

## 3. Verification

- [x] 3.1 Run `openspec validate define-interface-contract-planning`
- [x] 3.2 Run documentation placeholder and stale-reference checks
- [x] 3.3 Run `openspec validate --all`
