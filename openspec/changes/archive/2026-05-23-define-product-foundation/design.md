## Context

The repository is currently a governance-first scaffold. It contains OpenSpec rules and one accepted governance spec, but it has no application source code, package manager, framework, database, deployment target, authentication provider, or AI integration.

The product direction is a web-based AI operations tool for badminton racket live-commerce teams. Operators need to record live selling material, review what happened, improve product explanations, handle customer questions, and prepare the next session. The tool will handle sensitive business data such as transcripts, customer comments, GMV notes, pricing strategy, product plans, prompts, and AI outputs.

Official documentation checked during exploration:

- Next.js App Router and authentication guidance.
- React form and deferred input guidance via the UI/UX stack recommendations.
- Vercel AI SDK documentation for model abstraction, structured output, and tool-oriented AI features.
- Vercel Storage and Supabase server-side auth documentation as reference points for storage/auth trade-offs.
- Auth.js and Drizzle ORM documentation as reference points for portable auth and typed SQL data access.

Public industry sources checked during exploration:

- Yonex USA ASTROX 100ZZ product page (`https://us.yonex.com/products/astrox-100zz`): confirms that official racket pages expose structured selling attributes such as weight/grip, player type, stringing advice, balance, shaft flex, product tier, string pattern, material, series, and technology tags.
- VICTOR global product snippets: confirm that another major brand exposes weight/grip size, frame material, shaft material, string tension limits, and stiffness scale. Some direct pages redirected during browsing, so VICTOR data must be rechecked through official accessible pages during ingestion.
- Li-Ning public catalog and distributor pages: confirm relevant fields such as series, material, weight class, length, grip size, shaft feel, string tension, and balance point. Treat distributor claims as lower-trust reference data unless confirmed by an official Li-Ning catalog or product page.
- BWF Laws of Badminton, Section 4.1 (`https://corporate.bwfbadminton.com/statutes/`): confirms racket regulation constraints such as maximum overall length and width, and the legal distinction between handle, head, shaft, throat, and stringed area.
- Douyin E-commerce Learning Center (`https://school.jinritemai.com/doudian/wap/?btm_ppre=a0.b0.c0.d0`): confirms platform education categories that matter to this product, including product operations, live operations, short-video operations, data recap, search operations, marketing tools, customer service, orders, evaluation, and logistics.
- TikTok Ads Manager live shopping metrics (`https://ads.tiktok.com/help/article/key-reporting-metrics-for-live-shopping-ads`): confirms operational metrics commonly used around live commerce, including live views, live product clicks, product page views, checkout initiation, add-to-cart, purchases, gross revenue, ROAS, follows, and profile visits.
- Live-commerce research from Frontiers, PLOS ONE, Nature, and PMC: supports prioritizing product presentation quality, real-time question answering, streamer expertise, trust, perceived product value, interaction, and continued watching/purchase intention.

Technical reference URLs checked during exploration:

- Next.js Server Actions and mutations: `https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations`
- Next.js Route Handlers: `https://nextjs.org/docs/app/api-reference/file-conventions/route`
- Vercel AI SDK structured data: `https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data`
- Drizzle migrations: `https://orm.drizzle.team/docs/migrations`
- Auth.js installation and setup: `https://authjs.dev/getting-started/installation`

## Goals / Non-Goals

**Goals:**

- Define the first product direction and MVP workflow before introducing application code.
- Establish the long-term North Star: keep improving the system by learning from source-backed professional public data, curated team knowledge, and operator feedback so AI analysis becomes more useful for live-commerce operations over time.
- Choose a concrete but portable technical foundation for later implementation.
- Preserve badminton racket and live-commerce domain language in requirements and data boundaries.
- Keep AI output editable, auditable, and clearly separated from human-entered facts.
- Define implementation waves so later changes can be small, reviewable, and verifiable.
- Keep the architecture deployable to common Node.js hosting, with Vercel as a convenient preview option but not a hard production dependency.
- Capture the development route, architecture decisions, and milestone indicators in OpenSpec so future work has a durable reference outside the chat history.
- Build the initial domain knowledge from public sources gathered by the agent, while making every seeded item source-backed, reviewable, editable, and refreshable.

**Non-Goals:**

- Do not build production app code in this change.
- Do not integrate directly with Douyin, commerce platforms, payment systems, or analytics in the first wave.
- Do not build public marketing pages, public customer-facing commerce flows, or payment checkout.
- Do not store raw customer transcripts, prompts, or AI outputs without explicit retention and access-control rules.
- Do not commit to a China production hosting provider until operations, ICP, latency, and compliance constraints are confirmed.
- Do not treat public marketing claims, distributor pages, community reviews, or AI summaries as authoritative product truth without source trust metadata and human review.
- Do not scrape or automate platform access in ways that violate terms or create account risk.

## Decisions

1. **Product shape: internal Chinese operator workspace, not a landing page.**
   - Rationale: The repository rules and product direction point to repeated operational work. Operators need dense lists, forms, review panels, and task views more than marketing-style presentation.
   - Alternatives considered: A public SaaS landing page first; rejected because it does not validate the core workflow.

2. **MVP input model: manual capture before platform integrations.**
   - Rationale: Manual paste/upload of live notes, customer questions, product order, and session metrics lets the team validate analysis value without Douyin API, scraping, or account-risk complexity.
   - Alternatives considered: Direct Douyin live integration first; deferred because external API terms, permissions, latency, and data availability must be verified separately.

3. **Initial stack: Next.js App Router + TypeScript + React + Tailwind/shadcn + lucide icons.**
   - Rationale: The product needs a web dashboard, forms, tables, server-rendered views, authenticated workflows, and AI-backed server operations. Next.js supports a compact full-stack implementation with App Router, Server Components, Server Actions for mutations, and Route Handlers for streaming/webhooks/uploads.
   - Alternatives considered:
     - Plain React SPA plus separate API: more deployment parts and weaker server-side data boundaries for this early stage.
     - Backend-first framework plus separate frontend: stronger separation but slower MVP and more boilerplate.
     - Vue/Svelte: viable, but the available guidance and plugin support are strongest for React/Next.js in this environment.

4. **Package and validation baseline: pnpm, Drizzle ORM, and Zod.**
   - Rationale: pnpm gives deterministic installs and workspace support without forcing a large monorepo. Drizzle keeps database access close to SQL while preserving TypeScript types and migration control. Zod gives explicit runtime validation for forms, imports, and AI outputs.
   - Alternatives considered: npm is simpler but weaker for future workspace growth. Prisma is mature but adds a heavier generation/runtime layer. Ad hoc validation is rejected for persisted and AI-produced data.

5. **Repository layout: `apps/web` as the first application, with root-level governance retained.**
   - Rationale: The root already holds OpenSpec and agent governance. Keeping app code in `apps/web` prevents source code from crowding the planning layer while avoiding premature multi-package complexity.
   - Alternatives considered: App at repository root; simpler initially but muddles governance files, OpenSpec files, and app files. Full monorepo packages from day one; deferred until shared code proves necessary.

6. **Data foundation: PostgreSQL with typed schema and explicit domain models.**
   - Rationale: The product has relational concepts: team, member, racket model, aliases, live session, product order, questions, objections, AI analysis runs, talk tracks, and next-session actions. PostgreSQL supports relational integrity, filtering, reporting, and later analytics.
   - ORM decision: prefer Drizzle ORM for typed SQL and migration control when implementation starts.
   - Alternatives considered:
     - SQLite: useful for local prototypes but weaker for multi-user tenant data and future reporting.
     - Document database: flexible but risks losing domain constraints and query clarity.
     - Supabase-first: attractive for auth/storage/RLS speed, but it couples several decisions at once. Keep Supabase as a possible provider, not the architectural boundary.

7. **Authentication: provider-backed auth via Auth.js/OIDC-compatible provider, not custom password auth.**
   - Rationale: The first product is internal/team-oriented and must enforce tenant access. Auth.js gives portable Next.js integration while allowing different identity providers later. Password storage and account recovery should not be custom-built in the MVP.
   - Alternatives considered:
     - Clerk: excellent for fast Vercel-hosted SaaS, but more vendor-specific.
     - Supabase Auth: good when choosing Supabase as the whole backend, but less neutral as a foundation decision.

8. **File storage: S3-compatible object storage abstraction.**
   - Rationale: Session transcripts, imports, screenshots, and exports may become large. An S3-compatible boundary keeps deployment portable across AWS S3, Cloudflare R2, Aliyun OSS, Tencent COS, or Vercel Blob-style storage adapters.
   - Alternatives considered: Database blobs; rejected for large transcript/media growth and backup complexity.

9. **AI layer: adapter boundary with structured output validation.**
   - Rationale: AI behavior is central but provider choice may change. The app should separate prompt templates, model calls, schema validation, retries, persistence, and UI rendering. Vercel AI SDK can be used behind the adapter when it fits, but product code should not depend on raw provider response shapes.
   - Alternatives considered: Direct provider calls from UI actions; rejected because it mixes prompts, rendering, persistence, and secrets.

10. **Human facts and AI suggestions are separate records.**
   - Rationale: Operators must know what came from a human-entered session note versus what was inferred by AI. AI outputs can be edited, accepted, rejected, or regenerated, but they are not authoritative product or business truth without human action.

11. **Continuous knowledge and AI improvement loop.**
    - Rationale: The product should become more useful as it gathers public professional sources, reviewed internal knowledge, session outcomes, accepted/rejected AI suggestions, and operator corrections. This is a controlled learning loop, not unreviewed self-modifying behavior.
    - Loop:
      - collect allowed public sources and operator-provided materials;
      - normalize them into source-backed knowledge records;
      - require review, confidence, freshness, and version metadata;
      - ground AI analysis on selected knowledge snapshots and live-session input;
      - capture operator edits, accepts, rejects, and regeneration reasons;
      - use feedback to improve source priorities, prompt versions, evaluation cases, and future analysis rules.
    - Guardrail: AI suggestions and web-sourced claims never become authoritative sales truth without source metadata and human review.

12. **Implementation waves.**
    - Wave 0: repository/app scaffold, package manager, lint/type/build verification, CI baseline.
    - Wave 1: auth, tenant/team model, protected shell, Chinese operational navigation.
    - Wave 2: racket product library with domain fields and aliases.
    - Wave 3: seed knowledge base with public-source registry, ingestion workflow, review queue, versioning, and refresh status.
    - Wave 4: live session capture with product order, notes/transcript, questions, objections, and draft saving.
    - Wave 5: AI analysis runs producing recap, explanation diagnosis, question clusters, talk-track improvements, short-video ideas, and next-session tasks.
    - Wave 6: exports, import helpers, dashboard metrics, and optional external integrations after official API validation.

## Public Research Findings

The initial product direction should use public data to seed a practical badminton live-commerce knowledge base, but the seed knowledge base is a living product asset. It must be updated, reviewed, and versioned instead of preserved as a static markdown document.

Initial domain taxonomy from public racket pages and rules:

- Racket identity: brand, series, model, SKU/item code, aliases, launch/season when available, colorways, source region.
- Physical/spec fields: weight class, average weight, grip size, length, balance or balance point, shaft flex/stiffness, frame material, shaft material, string pattern, stringing advice or max tension, recommended strings, legal/regulatory dimensions where relevant.
- Selling fields: product tier, player level, play style, performance orientation such as power/control/speed, technology tags, selling points, caution notes, and comparison positioning against similar rackets.
- Commerce fields: price band, source URL, source type, source date, confidence level, review status, last verified time, next refresh due time.

Initial live-commerce operating taxonomy from platform and research sources:

- Session inputs: live theme, host, product order, product card timing, customer questions, objections, repeated comments, offer or promotion notes, short-video/livehead traffic source, and manual performance notes.
- Diagnostic metrics: live views, product clicks, product page views, add-to-cart, checkout initiation, purchases, gross revenue, ROAS where available, follows, profile visits, watch-time or effective-view signals, and operator-defined conversion notes.
- Content quality signals: whether the host explained player level, play style, balance/stiffness/tension trade-offs, comparison products, use cases, objections, and after-sale risk clearly enough for buyers.
- Trust signals: source-backed claims, avoidance of unsupported performance guarantees, clear separation between official specs, operator experience, customer feedback, and AI suggestions.

## Seed Knowledge Base Lifecycle

The knowledge base is not a one-time artifact. It should be implemented as records with lifecycle state:

```text
source registry
  -> fetch/import candidate
  -> normalize into racket, claim, tactic, or platform-rule record
  -> assign source trust and extraction confidence
  -> human review queue
  -> publish as usable seed knowledge
  -> periodic refresh / stale detection
  -> diff review and version history
```

Source trust levels:

- `official_brand`: brand product pages, official catalogs, and official safety/stringing guidance.
- `official_platform`: Douyin/TikTok commerce education, rules, help center, and official metric documentation.
- `official_sport_rule`: BWF rules and other recognized sport-governing material.
- `academic_research`: peer-reviewed or open-access research used for operating hypotheses, not product facts.
- `authorized_retailer`: retailer or distributor pages used as secondary references only.
- `community_market`: forums, reviews, and creator content used only for weak signals such as common questions or objections.
- `internal_operator`: human-entered team knowledge, treated as business-sensitive team data.

Refresh policy:

- Official brand product pages and catalogs: refresh monthly and on-demand when operators report a new model, discontinued model, price shift, or spec conflict.
- Official platform rules and metrics: refresh monthly and before any integration or compliance-related release.
- Academic and industry research: review quarterly to update heuristics, question taxonomies, and live-session diagnosis criteria.
- Internal operator knowledge: refresh continuously through accepted edits, rejected AI suggestions, and session recap feedback.

Review policy:

- New public seed records are `draft` until a human accepts them or marks them as reference-only.
- Official specs may prefill fields but still require review before being used in sales scripts.
- Marketing claims are stored as claims with source metadata; they are not merged into factual racket specs unless supported by official source fields.
- Conflicting source values create a `needs_review` state with side-by-side values, source URLs, retrieval dates, and proposed resolution.
- Every published record keeps version history so a later update can be rolled back.

Operator-facing behavior:

- Operators should see freshness and confidence, such as "official source, verified this month" or "retailer reference, needs confirmation".
- Operators can edit, accept, reject, or supersede seed knowledge for their own team.
- AI analysis may cite seed records, but suggestions must show which source-backed facts and which AI inferences were used.

## Progress Indicators

Future implementation should use this foundation as a progress reference:

- Wave readiness: each wave must have an OpenSpec change with proposal, design, specs, tasks, validation, and verification before it is considered ready.
- Architecture readiness: app scaffold, auth, data layer, AI adapter, storage adapter, and knowledge refresh jobs each need explicit tasks and verification.
- Knowledge readiness: seed source registry exists, first public sources are imported, review queue works, stale records are visible, and source conflicts can be resolved.
- Product readiness: operators can move from product library to session capture to AI review to talk-track updates to next-session tasks without relying on hidden manual steps.
- Learning readiness: public source refresh, reviewer decisions, operator corrections, accepted/rejected AI suggestions, and evaluation examples are captured as feedback signals for future knowledge and AI improvements.
- Quality readiness: lint/type/build checks, browser checks, data validation, tenant authorization, AI schema validation, and sensitive-data redaction are run for affected waves.

## Architecture Sketch

```text
apps/web
  UI layer
    - Chinese operator screens
    - forms, tables, review panels, task views
  Application/domain layer
    - live-session workflows
    - racket-product workflows
    - talk-track and next-session planning rules
  Data layer
    - PostgreSQL schema and repositories
    - migrations and tenant filters
    - source registry and knowledge record versions
  AI layer
    - prompt versions
    - model adapter
    - structured output schemas
    - retry/failure handling
  Integration layer
    - object storage
    - public-source fetch/import adapters
    - future Douyin/commerce adapters
```

Primary data flow:

```text
operator input
  -> validate and save draft/session
  -> create analysis run from selected source snapshot
  -> send minimum necessary structured input to AI adapter
  -> validate AI output schema
  -> persist AI suggestions with source and prompt metadata
  -> operator edits/accepts/rejects
  -> next-session tasks and talk-track assets
```

Continuous improvement loop:

```text
allowed public sources + reviewed team knowledge + session source material
  -> source registry, normalization, review, versioning
  -> selected knowledge snapshot for AI analysis
  -> structured AI suggestions with citations and confidence
  -> operator edits / accepts / rejects / regeneration reasons
  -> evaluation examples, prompt-version notes, source-priority updates
  -> better future knowledge grounding and analysis behavior
```

Seed knowledge flow:

```text
public source URL or uploaded catalog
  -> source registry with trust level and allowed collection method
  -> fetch/import metadata and candidate content
  -> normalize into typed records
  -> compare with existing version
  -> human review and conflict resolution
  -> publish as team-usable seed knowledge
  -> scheduled refresh and stale alerts
```

## Risks / Trade-offs

- Broad initial scope could become an unreviewable mega-change -> Mitigation: implement through the wave sequence; each wave gets its own OpenSpec change.
- Mainland China deployment constraints may make some hosted services unsuitable -> Mitigation: keep production architecture Node/PostgreSQL/S3-compatible and choose region/provider in a separate deployment change.
- Direct Douyin integration may be unavailable or risky -> Mitigation: MVP uses manual input/import; integrations require official-doc validation and a separate integration spec.
- AI outputs may be wrong, malformed, or overconfident -> Mitigation: structured schemas, validation, refusal/timeout handling, human review states, and audit metadata.
- A feedback loop could reinforce bad assumptions if every AI suggestion is treated as learning signal -> Mitigation: distinguish accepted, rejected, edited, and ignored suggestions; require review before feedback changes knowledge, prompts, or evaluation baselines.
- Public seed knowledge may become stale or include conflicting claims -> Mitigation: source trust levels, retrieval timestamps, refresh cadence, stale alerts, conflict review, and version rollback.
- Public sources may be blocked, unavailable, or disallow automated access -> Mitigation: store source metadata, support manual import, avoid ToS-risky scraping, and prefer official APIs, feeds, catalogs, or operator-provided links where available.
- Live notes and customer comments may contain sensitive data -> Mitigation: tenant authorization, redacted logs, retention decisions, and minimum necessary AI input.
- Data-dense UI can overflow on mobile -> Mitigation: responsive table/card variants, stable dimensions, accessible labels, and Playwright viewport checks in frontend changes.

## Migration Plan

This planning change has no runtime migration. Future implementation changes should follow this order:

1. Create `bootstrap-web-application` to introduce `apps/web`, package manager, lint/type/build scripts, and baseline UI shell.
2. Create `add-auth-and-team-access` for authentication, tenant/team membership, protected routes, and server-side authorization.
3. Create feature changes per roadmap wave, starting with racket product library, then seed knowledge base lifecycle, then live-session capture.
4. Add AI analysis only after source input, persistence, seed knowledge source metadata, and human review states exist.
5. Add external integrations only after official API, terms, rate limits, and failure modes are documented.

Rollback path: because this change adds only OpenSpec planning artifacts, rollback is deleting or revising the change before archive. Future runtime changes must include their own rollback plans.

## Open Questions

- Production region/provider: Vercel, mainland China cloud, Hong Kong/Singapore cloud, or private deployment.
- Identity provider: company SSO/OIDC, email magic link, managed provider, or another internal auth source.
- Storage provider: S3-compatible object store selection and retention policy.
- AI provider and model policy: cost, latency, Chinese mixed-language quality, data-processing terms, and fallback behavior.
- Initial data import format: raw text paste, CSV/XLSX, transcript file upload, or all three.
- Initial seed source priority: Yonex, VICTOR, Li-Ning, BWF, Douyin E-commerce Learning Center, TikTok commerce metrics, and selected academic research are the proposed starting set.
- Knowledge refresh execution: hosted cron, background worker, manually triggered admin job, or a hybrid with manual approval.
