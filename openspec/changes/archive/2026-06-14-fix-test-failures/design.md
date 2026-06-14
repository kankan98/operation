## Context

The project has 115 backend tests with 53 failing (46% failure rate) and 8 missing frontend component tests. The main cause is Amazon scraper tests making real HTTP requests that fail due to anti-bot protection. Additional issues include missing test infrastructure, no coverage reporting, and incomplete frontend test suite.

Current test setup:
- Backend: Vitest with 115 tests across 16 test files
- Frontend: Vitest with minimal tests, missing component coverage
- No shared test utilities or mock infrastructure
- Tests run against real external services (failing)
- No coverage thresholds or reporting

Stakeholders need 100% passing tests to:
- Enable production deployment
- Set up CI/CD pipelines
- Provide confidence for refactoring
- Meet quality gates

## Goals / Non-Goals

**Goals:**
- All 115 backend tests passing with <2 second execution time
- 8 new frontend component tests with >80% coverage
- Comprehensive mock infrastructure for Amazon scraper
- Coverage reporting for both frontend and backend with 80% thresholds
- Documentation of testing patterns and best practices
- Zero real network calls or browser launches during test runs

**Non-Goals:**
- E2E tests with real browsers (out of scope)
- Integration with third-party testing services
- Visual regression testing
- Performance/load testing
- Fixing real Amazon anti-bot issues (mocking is the solution)

## Decisions

### Decision 1: Mock at the HTTP/Browser layer, not service layer

**Choice:** Intercept HTTP requests and Playwright browser calls at the lowest level using Vitest mocks.

**Rationale:** 
- Tests the actual scraper logic without network dependency
- Allows testing error scenarios (timeout, invalid HTML, missing elements)
- Faster test execution (<2s vs 30s+ with real requests)
- No service code changes required

**Alternatives considered:**
- Service-layer mocking: Would bypass scraper logic entirely
- Real API with rate limiting: Still fails due to anti-bot, slow, brittle
- Recording real responses: Hard to maintain, doesn't test error paths

### Decision 2: Shared test utilities in separate directories

**Choice:** Create `backend/tests/__utils__/` and `frontend/tests/__utils__/` for fixtures, mocks, and helpers.

**Rationale:**
- Centralized location for reusable test code
- Easy to import: `import { mockProduct } from '../__utils__/fixtures'`
- Follows Jest/Vitest conventions
- Excluded from coverage by default with `__` prefix

**Alternatives considered:**
- Co-located with source files: Harder to share across test files
- Separate package: Overkill for single-repo project

### Decision 3: Factory functions for test data

**Choice:** Use factory functions like `createMockProduct()`, `createMockAlert()` with optional overrides.

**Rationale:**
- Flexible: `createMockProduct({ price: 99.99 })` allows targeted test data
- DRY: Reduces duplicate test data across files
- Type-safe: Returns fully typed objects
- Realistic defaults: Tests use valid data by default

**Example:**
```typescript
function createMockProduct(overrides?: Partial<Product>): Product {
  return {
    id: 'test-id',
    platform: 'amazon',
    asin: 'B08N5WRWNW',
    price: 249.99,
    ...overrides
  }
}
```

### Decision 4: Coverage thresholds at 80%

**Choice:** Set Vitest coverage thresholds to 80% for statements, branches, functions, and lines.

**Rationale:**
- 80% is industry standard for good coverage
- Achievable without excessive effort
- Leaves room for edge cases and exploratory code
- Higher than current ~50% frontend coverage

**Alternatives considered:**
- 100%: Too strict, diminishing returns
- 70%: Too low for production-ready code
- No threshold: Risks coverage regression

### Decision 5: Mock Amazon HTML responses with realistic selectors

**Choice:** Create mock HTML snippets with actual Amazon DOM structure (e.g., `<span id="priceblock_ourprice">$249.99</span>`).

**Rationale:**
- Tests verify selector logic is correct
- Easy to add new scenarios (out of stock, missing price)
- Breaks if Amazon changes selectors (good - alerts us to fix)
- More realistic than mock objects

**Example mock response:**
```typescript
const mockAmazonHTML = `
  <html>
    <span id="priceblock_ourprice">$249.99</span>
    <span id="productTitle">Apple AirPods Pro</span>
    <span id="availability">In Stock</span>
  </html>
`;
```

### Decision 6: React Testing Library for frontend tests

**Choice:** Use React Testing Library with user-centric queries (`getByRole`, `getByLabelText`).

**Rationale:**
- Already installed and configured
- Encourages accessible component design
- Tests behavior, not implementation details
- Industry standard for React testing

**Alternatives considered:**
- Enzyme: Deprecated, no React 18 support
- Plain Vitest: No component rendering utilities

### Decision 7: Mock Zustand stores in frontend tests

**Choice:** Create mock store factory that returns store with controllable state.

**Rationale:**
- Tests components in isolation from global state
- Allows testing different state scenarios easily
- No need for full store setup in each test

**Example:**
```typescript
function createMockStore(initialState?: Partial<State>) {
  return create<State>(() => ({
    products: [],
    alerts: [],
    ...initialState
  }))
}
```

## Risks / Trade-offs

### Risk: Mock responses diverge from real Amazon HTML
**Mitigation:** 
- Document the source of each selector in mock comments
- Periodic manual verification that selectors still work
- Add E2E tests in future phase that hit real (non-prod) endpoints

### Risk: 80% coverage threshold too strict initially
**Mitigation:**
- Start with 70% threshold, increase to 80% over 2-3 commits
- Use `/* istanbul ignore */` for genuinely untestable edge cases
- Focus coverage on business logic, not boilerplate

### Risk: Test execution time increases with more tests
**Mitigation:**
- Mocked tests should complete in <2s total
- Use `test.concurrent` for independent tests
- Monitor test duration in CI, investigate if >5s

### Risk: Developers bypass tests with `test.skip`
**Mitigation:**
- CI fails on skipped tests
- Code review policy: no skipped tests merged
- Clear documentation on how to write passing tests

### Trade-off: Mocking adds maintenance burden
- Tests must be updated if scraper implementation changes
- Benefit: Fast, reliable tests outweigh maintenance cost
- Mitigation: Centralize mocks in `__utils__/`, update once

### Trade-off: Not testing real anti-bot handling
- Real Amazon scraping still needs separate solution (proxy, API)
- Benefit: Tests don't depend on external service reliability
- Note: This is expected - unit tests verify logic, not external integrations

## Migration Plan

### Phase 1: Backend infrastructure (Day 1)
1. Create `backend/tests/__utils__/` directory
2. Add `fixtures.ts` with factory functions
3. Add `mockAmazonHtml.ts` with response builders
4. Add `testHelpers.ts` with database and API utilities

### Phase 2: Backend scraper test fixes (Day 1-2)
1. Update `amazonScraper.test.ts` to use mock HTTP responses
2. Add Playwright mock for browser automation
3. Verify all 53 failing tests now pass
4. Add new test cases for error scenarios

### Phase 3: Backend other test fixes (Day 2)
1. Review remaining failing tests
2. Fix any database isolation issues
3. Ensure all 115 tests pass

### Phase 4: Frontend infrastructure (Day 2-3)
1. Create `frontend/tests/__utils__/` directory
2. Add `fixtures.ts` with mock data factories
3. Add `mockStore.ts` with Zustand mock utilities
4. Add `renderWithProviders.ts` for component test setup

### Phase 5: Frontend component tests (Day 3-4)
1. Add `MetricCard.test.tsx`
2. Add `ProductCard.test.tsx`
3. Add `ProductForm.test.tsx`
4. Add `AlertItem.test.tsx`
5. Add page integration tests (Dashboard, ProductsList, ProductDetail, AlertsCenter)

### Phase 6: Coverage reporting (Day 4)
1. Update `vitest.config.ts` in both frontend and backend
2. Add coverage thresholds (80%)
3. Update npm scripts: `npm run test:coverage`
4. Generate HTML reports
5. Update README with coverage badges

### Phase 7: Documentation (Day 4)
1. Add `backend/tests/README.md` with testing guide
2. Add `frontend/tests/README.md` with component test examples
3. Update root README with test execution instructions

### Rollback strategy
- If tests still fail: Revert changes, investigate mocking approach
- If coverage threshold blocks merges: Temporarily lower to 70%
- Changes are isolated to test files - no production code risk

## Open Questions

1. **Should we add integration tests that hit real Amazon URLs periodically (e.g., nightly)?**
   - Pro: Alerts us when selectors break
   - Con: Unreliable due to anti-bot
   - Decision: Defer to Phase 7, use manual verification for now

2. **Should frontend coverage include page components or just UI components?**
   - Decision: Include both, pages are critical to user experience

3. **Do we need snapshot tests for React components?**
   - Decision: No, focus on behavior tests; snapshots are brittle and low value
