## Context

The project intentionally starts with static workbench slices. That is still the
right order because it validates operator workflows before committing to a
database, auth, or AI provider. The missing piece is a lightweight contract layer
that records how each static workflow will later cross the UI/domain/data/API/AI
boundaries.

The contract layer must not create fake confidence. A draft contract is not an
implemented endpoint, and it should not force a backend technology beyond the
accepted architecture decisions.

The Agent layer also needs an architecture decision now because provider, RAG,
feedback, evaluation, and safety boundaries affect every future knowledge and AI
feature. The decision should be strong enough to guide implementation but still
portable enough to swap providers or retrieval infrastructure later.

## Goals / Non-Goals

**Goals:**

- Add a contract-first planning rule before backend/API/database/AI work.
- Create a standard location and template for future interface contract drafts.
- Define the planned Agent architecture and first implementation choices without
  adding runtime dependencies.
- Update the roadmap so static UI -> contract draft -> persistence/API is the
  expected sequence.
- Make future workbench slices preserve domain shapes, status machines, errors,
  authorization boundaries, and verification assumptions.

**Non-Goals:**

- Do not implement API routes, server actions, Drizzle schemas, migrations,
  mock servers, OpenAPI generation, or client SDKs now.
- Do not choose auth, deployment, external search, or storage providers.
- Do not call an LLM, create embeddings, index documents, or build a live Agent
  in this change.
- Do not treat draft contracts as final; they remain design artifacts until an
  implementation change verifies them.

## Decisions

1. **Use Markdown contract drafts first.**
   - Rationale: The project does not yet have backend routes or schemas, so a
     human-readable contract captures intent without creating fake runtime
     guarantees.
   - Alternative considered: generate OpenAPI now. Rejected because there are no
     accepted endpoints, auth model, or transport details yet.

2. **Make contracts domain-first, not endpoint-first.**
   - Rationale: The domain model must preserve racket, session, knowledge, AI
     run, feedback, and task language before choosing exact URLs.
   - Alternative considered: write REST endpoints immediately. Deferred until
     persistence and auth boundaries are selected.

3. **Require contract coverage for high-risk states.**
   - Rationale: The future bugs are likely to come from missing auth, stale
     knowledge, conflicting AI output, long input, draft recovery, pagination,
     and review states, not from the happy path.

4. **Use a ports-and-adapters Agent architecture.**
   - Rationale: LLM providers, model names, tool APIs, embedding models, and
     vector stores change faster than the product domain. The project should
     isolate provider calls behind `AiProviderPort`, retrieval behind
     `RetrievalPort`, and web discovery behind `SourceDiscoveryPort`.
   - Alternative considered: call provider SDKs directly from route handlers or
     UI components. Rejected because it would spread provider assumptions across
     the codebase.

5. **Set the first LLM implementation target to OpenAI Responses API behind an adapter.**
   - Rationale: The future Agent needs structured output, tool use, web/file
     search options, and citation-friendly reasoning boundaries. OpenAI
     Responses API is the first planned provider because it supports those
     primitives, while the project adapter keeps replacement possible.
   - Alternative considered: make Vercel AI SDK the hard provider boundary.
     Deferred because native provider tools may be needed; AI SDK can still be
     evaluated inside the adapter or streaming UI layer during implementation.

6. **Use PostgreSQL plus pgvector as the default RAG store for MVP.**
   - Rationale: Accepted architecture already makes PostgreSQL authoritative.
     Keeping embeddings, chunks, source versions, review state, and tenant
     ownership together reduces early operational complexity. Full-text search
     plus vector search can support hybrid retrieval before an external vector
     database is justified.
   - Alternative considered: adopt a managed vector database immediately.
     Deferred until retrieval volume, latency, recall, or operations evidence
     proves PostgreSQL is insufficient.

7. **Use a deterministic Agent state machine, not open-ended autonomy.**
   - Rationale: The product must help operators reliably. Agent runs should move
     through explicit states: classify, retrieve reviewed knowledge, identify
     uncertainty, optionally discover public sources when allowed, compose a
     structured answer, cite sources, capture feedback, and route reusable
     findings to review.

## Risks / Trade-offs

- Contracts can become stale -> Mitigation: implementation changes must update
  contract drafts or explain why the contract changed.
- Too much contract detail can slow UI learning -> Mitigation: only require
  contracts for workflows that will later persist, call AI/backend, or integrate
  externally.
- Draft contracts can be mistaken for implemented APIs -> Mitigation: contract
  docs must mark implementation status and avoid executable examples that imply
  live endpoints.
- Agent architecture can overfit one provider -> Mitigation: provider-specific
  calls remain behind `AiProviderPort`, and model/provider selection is verified
  through representative operator questions before production use.
- RAG quality may be weak with only vector similarity -> Mitigation: use
  reviewed snapshots, metadata filters, hybrid retrieval, citation checks, and
  feedback/evaluation before answers affect future behavior.

## Migration Plan

1. Add `docs/contracts/README.md` with the contract standard and template.
2. Add `docs/architecture/agent-architecture.md` with the planned Agent stack.
3. Update the roadmap to insert contract and Agent architecture planning stages.
4. Update accepted architecture specs through this OpenSpec change.
5. Validate OpenSpec and check docs for placeholders.
