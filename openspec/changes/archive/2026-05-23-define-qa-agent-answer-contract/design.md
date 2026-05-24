## Context

The project is still in Stage 1 of the staged technical roadmap: contract and
domain model definition. The current product direction calls for a future Q&A
Agent that helps badminton racket live-commerce teams answer product and
operations questions, but the accepted roadmap also says the Agent must be
delivered in stages:

1. answer only from reviewed knowledge,
2. capture feedback,
3. identify missing or stale knowledge,
4. create web discovery findings only as review-only drafts,
5. let approved knowledge lifecycle versions ground future answers.

The existing contracts provide upstream inputs:

- `racket-product-library`: reviewed racket specs, aliases, selling points,
  audience, price band, and downstream AI/RAG readiness.
- `session-capture`: customer questions, objections, live notes, and session
  context.
- `knowledge-lifecycle`: source, claim, review, version, conflict, refresh, and
  AI-ready snapshot boundaries.
- `ai-review-run`: AI run, structured output, validation, feedback, and
  downstream handoff patterns.

Research and skill exploration affected the design:

- OpenAI official docs support planning for structured model output, but the
  contract stays behind `AiProviderPort` and does not require provider code now.
- pgvector official docs support the existing PostgreSQL + pgvector RAG MVP
  direction, but the contract only names `RetrievalPort` behavior.
- OWASP LLM Top 10 influenced prompt injection, sensitive data, untrusted
  context, over-agency, and output handling controls.
- NIST AI RMF influenced answer transparency, uncertainty, reliability, human
  oversight, and auditability.
- W3C PROV-O influenced provenance metadata for questions, retrieval snapshots,
  evidence, answer generation, validation, feedback, and review-only findings.
- `context-engineering-advisor` pushed the design toward intent-based retrieval
  snapshots rather than raw context stuffing.
- `recommendation-canvas` kept the scope tied to practical operator outcomes:
  faster preparation, consistent product explanations, safer customer Q&A, and
  reviewable knowledge improvement.
- `roadmap-planning` confirmed this belongs before auth/data/AI/RAG runtime
  stages to reduce future rework.

## Goals / Non-Goals

**Goals:**

- Define the future Q&A answer-run boundary before runtime implementation.
- Preserve badminton racket live-commerce domain language: racket model, alias,
  weight class, balance point, shaft stiffness, string tension, player level,
  play style, price band, selling point, objection, talk track, session theme,
  and customer question.
- Define operator question, intent classification, retrieval snapshot, answer
  output, citation, uncertainty, validation, feedback, and missing-knowledge
  shapes.
- Ensure first-stage answers are grounded only in reviewed, tenant-scoped,
  non-stale, non-conflicting knowledge snapshots.
- Define web discovery as a future review-only finding path, not an autonomous
  knowledge update path.
- Make answer quality auditable through run status, prompt version, provider
  metadata, retrieved evidence, validation checks, user feedback, and reviewer
  decisions.
- Keep the contract compatible with `AiProviderPort`, `RetrievalPort`,
  `SourceDiscoveryPort`, knowledge lifecycle, and future evaluation.

**Non-Goals:**

- No API route, Server Action, database table, migration, repository, vector
  index, prompt template, provider SDK, source-search adapter, or model call.
- No UI changes and no public preview behavior change.
- No auth provider, database provider, AI provider, queue, object storage,
  search, analytics, deployment, or observability selection.
- No automatic writing to authoritative knowledge based on an answer, feedback,
  or web finding.
- No full Q&A evaluation dataset implementation.

## Decisions

### Decision 1: Answer runs use reviewed retrieval snapshots

`QaAnswerRun` will reference a `QaRetrievalSnapshot` made of reviewed,
tenant/team-authorized evidence. Retrieval context must include source/version
IDs, freshness, review state, trust level, conflict status, and minimum answer
fields rather than raw pages or broad dumps.

Alternatives considered:

- Send all related product and session data to the model: quicker initially but
  increases cost, leakage risk, context noise, and hallucination risk.
- Let the model browse or decide what to retrieve: too much agency for the
  current stage and conflicts with reviewed-knowledge-first rules.

### Decision 2: Insufficient knowledge is a valid product result

The contract will allow `insufficient_knowledge`, `needs_review`, and
`web_discovery_candidate` outcomes. The Agent should explain what is missing,
which reviewed evidence was checked, and what source or review is needed.

Alternatives considered:

- Always answer with best effort: creates false confidence and weakens trust.
- Hide answers whenever confidence is low: safe but less useful; operators need
  to know what is missing so they can improve the knowledge base.

### Decision 3: Web discovery is review-only

Future public-source discovery will produce `QaSourceDiscoveryDraft` records
with source metadata, retrieval time, cited claims, source type, trust
suggestion, and review status. These findings cannot ground future answers until
they pass the knowledge lifecycle and become published knowledge versions.

Alternatives considered:

- Auto-ingest web facts into the answer store: high risk for stale, conflicting,
  unauthorized, or low-quality sources.
- Defer discovery forever: safe but weak for knowledge gaps; a review-only path
  preserves learning without weakening authority.

### Decision 4: Feedback is a quality signal, not knowledge truth

Thumbs-up, thumbs-down, edit reason, answer edit, regenerate request, and
missing-knowledge feedback will link to answer run, retrieval snapshot, prompt
version, provider metadata, and actor. Feedback routes to evaluation and review
priority, not direct knowledge mutation.

Alternatives considered:

- Let feedback update ranking or knowledge automatically: attractive for speed
  but unsafe before evaluation and review workflows exist.
- Store only aggregate rating counts: easier but loses diagnostic value for
  prompt, retrieval, and knowledge quality.

### Decision 5: Contract includes future runtime stage gates

The contract will explicitly say which later stages implement which runtime
parts:

- Stage 2: auth, tenant, team, role, and server-side protection.
- Stage 3: PostgreSQL, Drizzle migrations, Zod or equivalent schema validation,
  repository layer, and audit records.
- Stage 6: RAG and Q&A first-stage runtime using `RetrievalPort`,
  `AiProviderPort`, and reviewed snapshots.
- Stage 7: `SourceDiscoveryPort` and review-only public-source findings.
- Stage 8: feedback learning and evaluation runner.

Alternatives considered:

- Put all future technology choices directly in the contract as final: too
  rigid before provider/account/security decisions are ready.
- Leave stage mapping only in the roadmap: weaker for future agents reading the
  contract before implementation.

## Risks / Trade-offs

- Contract detail may drift before runtime work -> Keep status `draft`; future
  implementation must update contract and OpenSpec when assumptions change.
- First-stage reviewed-knowledge-only answers may feel limited -> Make
  uncertainty and missing-knowledge routing explicit so limited answers still
  create operator value.
- Retrieval snapshot design may change when data schema is real -> Keep field
  names domain-specific but implementation-neutral.
- Web discovery could be mistaken for authority -> Name findings as draft,
  review-only, and blocked from grounding until published through knowledge
  lifecycle.
- Feedback volume could create noise -> Store reasons and run context so later
  evaluation can distinguish bad retrieval, missing knowledge, wrong prompt, or
  user preference.

## Migration Plan

1. Add `docs/contracts/qa-agent-answer.md`.
2. Update `docs/contracts/README.md`.
3. Update technical roadmap and autonomous goal/roadmap notes so the Q&A
   contract is complete and future runtime stages start from it.
4. Validate OpenSpec and markdown hygiene.
5. Archive the completed change.

Rollback is documentation-only: revert the contract and spec additions. No
runtime data, package, Docker image, or deployed behavior changes.

## Open Questions

- Exact auth provider and role mapping for operator, host, reviewer, product
  owner, and team admin.
- Exact database schema and migration names for answer runs, retrieval
  snapshots, feedback, and discovery findings.
- Exact prompt version naming and evaluation dataset format.
- Whether first Q&A UI should be synchronous only or support streaming behind a
  thin adapter.
- Which public source allowlist is acceptable for racket product specs,
  platform rules, and professional badminton knowledge.
