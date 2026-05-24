## ADDED Requirements

### Requirement: Racket product API exposes local review workflow endpoints
The racket product API runtime SHALL expose local-only protected endpoints for product source registration, review queue listing, review decisions, review submission, and publish while preserving the existing create/list route contract.

#### Scenario: Existing create list behavior is preserved
- **WHEN** `GET /api/rackets/products` or `POST /api/rackets/products` is used by the V0 browser workflow
- **THEN** the existing scoped list/create behavior, CSRF behavior, safe errors, no-store headers, and repository business rules SHALL remain intact

#### Scenario: Product path parameter is authoritative
- **WHEN** a client posts to a product-scoped source, submit, or publish route and also includes a different `productId` in JSON
- **THEN** the route SHALL use the path product ID as the target and SHALL NOT trust client-supplied ownership or conflicting target fields

#### Scenario: Mutation routes require CSRF before database access
- **WHEN** any racket source, submit, review-decision, or publish mutation route receives no valid `x-operation-csrf: racket-products` header
- **THEN** the route SHALL return a safe forbidden response without opening the database or mutating records

### Requirement: Racket product API returns safe workflow view models
The racket product API runtime SHALL return safe view models for products, sources, and review queue items rather than database records or auth/session internals.

#### Scenario: Source registration returns source view
- **WHEN** a source is registered successfully
- **THEN** the response SHALL include source ID, product ID, source type, title, URL when non-sensitive, retrieved time, trust level, refresh policy, review state, and timestamps

#### Scenario: Review queue returns source summary
- **WHEN** review queue listing succeeds
- **THEN** the response SHALL include product view, safe source views, and source summary counts for total, approved, pending, rejected, and stale sources

#### Scenario: Review decision target response is typed
- **WHEN** a review decision updates a source or product
- **THEN** the response SHALL indicate whether the returned target is a source or product so the browser can update the right local state without guessing
