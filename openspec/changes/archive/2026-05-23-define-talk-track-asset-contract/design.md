## Context

The current web app has a `/talk-tracks` placeholder page, while the AI review
contract already models `talk_track_candidate` sections and downstream
artifacts. Product, session, knowledge, auth/team/tenant, and data foundation
contracts now exist, so the next missing boundary is how approved talk-track
suggestions become reusable team assets.

Talk tracks are not generic notes. In this product, they must connect product
facts, player fit, objection patterns, source versions, session examples, AI
review decisions, and human edits. They are also business-sensitive: a bad or
unsupported claim can mislead a buyer, create inconsistent host language, or
turn an AI suggestion into an unreviewed sales promise.

Research and skill exploration affected the design:

- TikTok Shop LIVE and shoppable-content guidance reinforced the need for
  product-focused speaking structure: product intro, feature/benefit,
  demonstration, interaction, and short-video reuse.
- TikTok quality guidance reinforced that talk tracks need claim control and
  should avoid unsupported or irrelevant selling points.
- Salesforce sales playbook guidance reinforced versioned playbooks, personas,
  objection handling, owners, review, usage metrics, and periodic updates.
- `roadmap-planning` keeps this contract sequenced before AI review runtime
  downstream publishing, because future AI suggestions need a safe asset
  destination.
- `user-story` framed the core acceptance: a host/operator should find approved
  wording for a product, scene, and objection quickly, with enough source and
  review context to trust it.

## Goals / Non-Goals

**Goals:**

- Define the future talk-track asset boundary before persistence or UI work.
- Define talk-track assets, versions, segments, scenarios, objection replies,
  source grounding, review decisions, usage feedback, and downstream links.
- Preserve the distinction between human-authored facts, reviewed knowledge,
  AI-generated suggestions, and approved reusable wording.
- Define lifecycle states so teams can draft, review, publish, revise,
  deprecate, archive, and restore talk tracks safely.
- Define authorization, sensitive data, audit metadata, and verification
  requirements for future runtime work.

**Non-Goals:**

- No database schema, repository, API, Server Action, AI provider call, RAG
  retrieval, UI redesign, dependency, or Docker deployment is added.
- No actual sales script content is authored.
- No claim is made that `/talk-tracks` can save, publish, or search real assets
  yet.
- No automatic AI publishing: AI review can propose candidates later, but human
  review remains required before a talk track becomes reusable.

## Decisions

### Decision 1: Talk tracks are versioned assets, not free-form snippets

Each asset has one or more versions. Published versions remain auditable even
after later edits. Future users can see status, owner, review decision, source
links, intended scenes, and usage constraints.

Alternatives considered:

- Store only latest text: simpler, but loses why a phrase was approved, what it
  replaced, and which sessions used it.
- Treat every phrase as a standalone note: flexible, but hard to search, review,
  reuse, or deprecate consistently.

### Decision 2: Scenario fit is first-class

Talk tracks must identify product, player level, play style, price band, live
scene, funnel stage, objection type, and host role where relevant. This prevents
generic phrases from being reused in the wrong context.

Alternatives considered:

- Use tags only: easy to implement but too loose for later AI/RAG matching and
  review.
- Make one rigid script template for all cases: too restrictive for live hosts
  and short-video reuse.

### Decision 3: AI suggestions require human review before reuse

AI review output may create a draft candidate with references to run, section,
source versions, and reviewer edits. It cannot become a published talk-track
version without review.

Alternatives considered:

- Auto-publish high-confidence AI suggestions: faster, but unsafe because
  confidence is not proof of product truth, platform suitability, or host tone.
- Keep AI suggestions outside the asset model: safer short-term but breaks the
  feedback loop and loses useful provenance.

### Decision 4: Talk tracks can feed Q&A and feedback, but only as reviewed knowledge

Published talk-track versions may be referenced by Q&A and AI review as team
experience, while rejected or draft versions remain excluded unless a future
OpenSpec explicitly allows internal reviewer-only use.

Alternatives considered:

- Let Q&A retrieve all talk-track drafts: would leak unapproved language.
- Forbid talk tracks from grounding Q&A: too limiting, because approved
  objection replies are a valuable operator knowledge source.

## Risks / Trade-offs

- Contract-first work does not change the placeholder UI -> Mitigation: it
  prevents future AI/runtime work from publishing unsafe script text.
- Scenario metadata may feel heavy -> Mitigation: mark only core fields as
  required and allow progressive enrichment.
- Talk tracks may duplicate knowledge records -> Mitigation: knowledge records
  own facts and sources; talk tracks own reusable expression and usage context.
- Review workflow can slow reuse -> Mitigation: allow draft/internal states,
  but require review for published reusable versions.
- Sales-platform rules may change -> Mitigation: store source/version and
  review metadata, and require stale/deprecated states.

## Migration Plan

1. Add OpenSpec requirements for `talk-track-asset-contract` and roadmap gates.
2. Add `docs/contracts/talk-track-asset.md`.
3. Update contract index, goal, autonomous roadmap, and technical roadmap.
4. Validate the change and markdown hygiene.
5. Archive the change and validate all accepted specs.

Rollback is documentation-only: revert the contract and spec updates. No data,
dependency, runtime behavior, Docker image, or public preview changes.

## Open Questions

- Which first talk-track category should become runtime UI: product intro,
  objection reply, comparison, closing prompt, or short-video hook.
- Whether talk-track review should be owned by product owner, reviewer, or team
  lead for the first real team.
- Whether published talk tracks need scheduled review based on source freshness
  or only when linked product/knowledge versions change.
- How strongly future Q&A should quote talk-track wording versus summarize it
  as team experience.
