## ADDED Requirements

### Requirement: Cache SHALL use query-specific keys
The product cache SHALL store results with keys based on query parameters (platform, monitoring status, pagination).

#### Scenario: Different filters use different cache keys
- **WHEN** two queries have different filter parameters (e.g., platform=amazon vs platform=ebay)
- **THEN** each query result is cached under separate key (e.g., `products:amazon`, `products:ebay`)

#### Scenario: Pagination included in cache key
- **WHEN** query includes page number and limit
- **THEN** cache key includes pagination params (e.g., `products:amazon:page=2:limit=20`)

#### Scenario: Field projection included in cache key
- **WHEN** query requests specific fields subset
- **THEN** cache key includes field list hash (e.g., `products:fields=abc123`)

### Requirement: Cache invalidation SHALL target affected keys only
Product write operations SHALL invalidate only cache keys affected by the change.

#### Scenario: Single product update invalidates relevant queries
- **WHEN** product with platform=amazon is updated
- **THEN** cache keys containing amazon products are invalidated (e.g., `products:amazon:*`)
- **AND** cache keys for other platforms remain valid (e.g., `products:ebay:*` not touched)

#### Scenario: Product deletion removes from cache
- **WHEN** product is deleted
- **THEN** only cache keys containing that product are invalidated by platform filter

#### Scenario: New product creation invalidates platform queries
- **WHEN** new product with platform=walmart is created
- **THEN** cache keys for walmart queries are invalidated
- **AND** total product count caches are invalidated

### Requirement: Cache entries SHALL have TTL expiration
Each cache entry SHALL have a Time-To-Live (TTL) and auto-expire after configured duration.

#### Scenario: Cache entry expires after TTL
- **WHEN** cache entry is created with 5-minute TTL
- **THEN** entry is automatically removed after 5 minutes

#### Scenario: Cache hit refreshes TTL
- **WHEN** cache entry is accessed before expiration
- **THEN** TTL is reset to configured duration (sliding expiration)

#### Scenario: Expired entries are cleaned up
- **WHEN** cache access detects expired entry
- **THEN** expired entry is removed and cache miss is reported

### Requirement: Cache SHALL track invalidation statistics
The cache system SHALL track hit rate, miss rate, and invalidation counts for monitoring.

#### Scenario: Cache metrics exposed
- **WHEN** monitoring endpoint is queried
- **THEN** cache statistics include: hit count, miss count, invalidation count, total keys

#### Scenario: Per-key invalidation tracked
- **WHEN** cache key is invalidated
- **THEN** invalidation event is logged with key pattern and reason

### Requirement: Cache invalidation SHALL support wildcard patterns
Cache invalidation operations SHALL support wildcard patterns to clear multiple related keys.

#### Scenario: Wildcard invalidation by platform
- **WHEN** invalidation specifies pattern `products:amazon:*`
- **THEN** all cache keys starting with `products:amazon:` are cleared

#### Scenario: Exact key invalidation
- **WHEN** invalidation specifies exact key without wildcard
- **THEN** only that specific key is cleared
