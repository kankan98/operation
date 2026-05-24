## ADDED Requirements

### Requirement: V0 reference-data workflow verifies racket review interactions
The V0 reference-data workflow SHALL verify that `/rackets` can use the local V0 team context to create a product, register source metadata, submit it for review, approve source/product records, publish the product, and reload scoped queue/product state without production login, AI, RAG, or external source discovery.

#### Scenario: Local reference-data workflow check covers racket review
- **WHEN** local PostgreSQL is available and `pnpm reference-data:v0-check` runs
- **THEN** it SHALL verify V0 auth/scope blocking, CSRF blocking, product creation/listing, source registration, review queue listing, source approval, product approval, publish, safe redaction, and rollback or deterministic cleanup

#### Scenario: Browser verification covers racket review workbench
- **WHEN** this change is ready to archive
- **THEN** Playwright SHALL verify `/rackets` authenticated local workflow state, source/review/publish controls, absence of console errors, and no incoherent text overflow or overlap on desktop and mobile where internal V0 cookie behavior allows it
