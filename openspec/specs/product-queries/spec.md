# product-queries Specification

## Purpose
TBD - created by archiving change code-review-critical-fixes. Update Purpose after archive.
## Requirements
### Requirement: Product queries SHALL return complete type-safe objects
Product query functions SHALL return objects that match the declared Product type contract, with all accessed fields present.

#### Scenario: getAllProducts returns complete Product objects
- **WHEN** getAllProducts() is called
- **THEN** every returned object includes all Product fields: id, title, platform, currentPrice, currency, brand, category, isMonitoring, asin, productUrl, imageUrl, updatedAt, createdAt, metadata

#### Scenario: Field projection queries declare partial types
- **WHEN** query uses fields parameter for performance optimization
- **THEN** return type explicitly indicates Partial<Product> or specific subset type (not Product[])

#### Scenario: Commonly accessed fields are always included
- **WHEN** query selects specific fields for performance
- **THEN** fields array includes all fields accessed by callers: id, title, platform, currentPrice, updatedAt, asin, productUrl

### Requirement: Product queries SHALL validate field access patterns
Product service SHALL ensure selected fields match actual usage patterns in callers.

#### Scenario: Field selection matches caller needs
- **WHEN** agentTools accesses product.updatedAt for sorting
- **THEN** getAllProducts fields array includes 'updatedAt'

#### Scenario: Field selection matches duplicate detection
- **WHEN** agentTools accesses product.productUrl for deduplication
- **THEN** getAllProducts fields array includes 'productUrl'

#### Scenario: Field selection matches competitor analysis
- **WHEN** agentTools accesses product.asin for competitor search
- **THEN** getAllProducts fields array includes 'asin'

### Requirement: Product cache SHALL store query-specific results
Product caching SHALL use keys based on query parameters to avoid returning stale or incomplete data.

#### Scenario: Cache key includes field selection
- **WHEN** query requests specific fields subset
- **THEN** cache key includes sorted field list (e.g., `products:fields=asin,id,title`)

#### Scenario: Different field selections use different cache entries
- **WHEN** two queries request different field subsets
- **THEN** each is cached separately to avoid type mismatches

#### Scenario: Full query bypasses field-filtered cache
- **WHEN** query requests all fields (no fields parameter)
- **THEN** result is not served from field-filtered cache entries

### Requirement: Product mutations SHALL invalidate affected cache entries
Product create/update/delete operations SHALL invalidate only related cache keys, not entire cache.

#### Scenario: Update invalidates platform-specific cache
- **WHEN** product with platform=amazon is updated
- **THEN** cache entries with key pattern `products:*amazon*` are invalidated

#### Scenario: Delete invalidates product-specific cache
- **WHEN** product is deleted
- **THEN** cache entries containing that product ID are invalidated

#### Scenario: Create invalidates count and list caches
- **WHEN** new product is created
- **THEN** cache entries for product lists and counts are invalidated
- **AND** detail caches for other products remain valid

