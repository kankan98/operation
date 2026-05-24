## Context

The knowledge learning hub at `/knowledge` currently renders static examples for
public sources, trust levels, review state, refresh cadence, feedback signals,
and future AI use. Future work will need source registration, claim extraction,
human review, versioned publication, refresh checks, conflict handling, feedback
learning, and AI/RAG-ready snapshots.

The project rules require a contract before adding backend persistence, source
discovery, web fetching, RAG indexing, AI provider calls, scheduled jobs, or
external integrations. This change creates that contract for the knowledge
lifecycle only.

## Research Notes

Before finalizing this proposal, I checked primary or specialist references to
ground the requirement analysis:

- [NIST AI RMF 1.0](https://www.nist.gov/itl/ai-risk-management-framework)
  frames trustworthy AI around validity, reliability,
  accountability, transparency, privacy, safety, and resilience. This supports
  making reviewed knowledge, audit metadata, and verification first-class rather
  than treating AI output as authority.
- [W3C PROV-O](https://www.w3.org/TR/prov-o/) models provenance through
  entities, activities, agents, derivation, attribution, and primary-source
  relationships. This supports separating sources, extracted claims, review
  decisions, and published knowledge versions.
- [OWASP GenAI / LLM Top 10](https://genai.owasp.org/llm-top-10/) identifies risks including sensitive information
  disclosure, data/model poisoning, prompt injection, and vector/embedding
  weaknesses in RAG systems. This supports review-only web discovery findings,
  sensitive-data redaction, source trust levels, and publication blocking for
  unreviewed or conflicting knowledge.

Product implication: operators should experience the feature as “trusted sources
become usable knowledge after review,” while the system preserves provenance and
blocks risky material from AI grounding until it is reviewed.

## Goals / Non-Goals

**Goals:**

- Define `docs/contracts/knowledge-lifecycle.md`.
- Preserve the distinction between public sources, team knowledge, extracted
  claims, review decisions, published knowledge versions, AI findings, and
  feedback signals.
- Specify future commands, queries, request/response shapes, lifecycle states,
  conflict/refresh behavior, error cases, authorization, sensitive data, audit
  metadata, and verification requirements.
- Update the contract index and roadmap notes so later knowledge persistence,
  source import, RAG, and Q&A work must start from this contract.

**Non-Goals:**

- No route handler, server action, repository, database schema, migration, mock
  API, crawler, source fetcher, embedding index, refresh scheduler, queue, or AI
  call.
- No UI changes to `/knowledge`.
- No new public source ingestion, web discovery runtime, RAG runtime, or
  knowledge publication workflow.
- No dependency additions.

## Decisions

1. **Knowledge is lifecycle-managed, not a flat content table.**
   - Decision: Model sources, extracted claims, review decisions, versions,
     conflicts, refresh jobs, and downstream snapshots as distinct entities.
   - Rationale: AI answers must only ground on reviewed/published knowledge and
     must preserve provenance and freshness.
   - Alternative considered: one flat `KnowledgeItem` record. Rejected because
     it blurs source authority, review state, and versioning.

2. **Web discovery findings are review-only until approved.**
   - Decision: The contract allows future source discovery findings, but they
     cannot become authoritative knowledge or AI grounding until reviewed and
     published.
   - Rationale: Public web content can be stale, promotional, conflicting, or
     wrong.
   - Alternative considered: automatically add fetched content to RAG. Rejected
     because it violates the project’s review-first AI policy.

3. **Feedback signals inform review priority, not truth.**
   - Decision: Likes, dislikes, edits, missing-knowledge reports, and rejected
     AI suggestions are modeled as quality signals that can create review tasks.
   - Rationale: Feedback is useful for prioritization but does not prove a fact.
   - Alternative considered: let accepted answers directly update knowledge.
     Rejected because it would let AI or operator edits overwrite reviewed
     sources without audit.

4. **Refresh and conflict states are first-class.**
   - Decision: The contract includes stale, conflict, superseded, and failed
     refresh states.
   - Rationale: Product specs, platform rules, and source pages change; future
     answers need freshness and conflict awareness.

## Risks / Trade-offs

- Contract is detailed before implementation -> Mitigation: mark status as
  `draft` and keep open questions for later database, job, RAG, and auth
  decisions.
- Review workflow becomes too heavy -> Mitigation: contract defines states and
  required metadata, but later UI can optimize batch review and prioritization.
- Source discovery scope expands too quickly -> Mitigation: web discovery is
  explicitly review-only and leaves provider/runtime choice to later OpenSpec
  changes.
- Feedback is mistaken for ground truth -> Mitigation: feedback creates
  auditable quality signals and review candidates, not published knowledge.
