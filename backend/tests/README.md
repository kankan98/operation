# Backend Testing Guide

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test -- amazonScraper.test.ts

# Run with coverage
npm run test:coverage
```

## Test Structure

Tests are organized in `tests/` directory:

```
tests/
├── __utils__/           # Shared test utilities
│   ├── fixtures.ts      # Mock data factories
│   ├── mockAmazonHtml.ts # Amazon HTML mocks
│   ├── testHelpers.ts   # Database and API helpers
│   └── index.ts         # Exports
├── *.test.ts            # Test files
└── setup.ts             # Test setup
```

## Using Test Utilities

### Mock Data Factories

```typescript
import { createMockProduct, createMockAlert } from './__utils__';

// Create single mock with defaults
const product = createMockProduct();

// Override specific fields
const product = createMockProduct({
  title: 'Custom Product',
  currentPrice: 99.99,
});

// Create multiple mocks
const products = createMockProducts(5);
```

### Database Helpers

```typescript
import { createTestDb, cleanupTestDb } from './__utils__';

let db;

beforeEach(() => {
  db = createTestDb(); // In-memory SQLite
});

afterEach(() => {
  cleanupTestDb(db);
});
```

### Amazon HTML Mocks

```typescript
import { createMockAmazonHtml, createMockAmazonHtmlNoPriceElement } from './__utils__';

// Full product page
const html = createMockAmazonHtml({
  price: '$249.99',
  title: 'Test Product',
});

// Missing price scenario
const html = createMockAmazonHtmlNoPriceElement();
```

## Mocking Playwright

Tests that use Playwright (like Amazon scraper) are mocked to avoid real browser launches:

```typescript
vi.mock('playwright', () => {
  const mockPage = {
    goto: vi.fn(),
    $: vi.fn(),
    $eval: vi.fn(),
  };
  
  return {
    chromium: {
      launch: vi.fn().mockResolvedValue({
        newPage: vi.fn().mockResolvedValue(mockPage),
      }),
    },
  };
});
```

## Coverage

Coverage thresholds:
- Statements: 80%
- Branches: 70%
- Functions: 80%
- Lines: 80%

View HTML report: Open `coverage/index.html` in browser after running `npm run test:coverage`.

## Best Practices

1. **Use factories** - Always use `createMock*()` functions instead of manual objects
2. **Isolated tests** - Each test should have its own database instance
3. **No real network calls** - Mock all external services (Playwright, HTTP)
4. **Fast tests** - All tests should complete in <30 seconds total
5. **Descriptive names** - Use `should ...` format for test names
6. **One assertion concept** - Test one thing per test case

## Skipped Tests

Some tests are skipped because they require real Amazon access:
- `scraperService.test.ts` - Real scraping tests
- `scraper.api.test.ts` - API endpoint tests with real scraper

These are integration tests that would fail due to Amazon's anti-bot protection. Unit tests with mocks provide sufficient coverage.
