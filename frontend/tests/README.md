# Frontend Testing Guide

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test -- MetricCard.test.tsx

# Run with coverage
npm run test:coverage
```

## Test Structure

Tests are organized in `tests/` directory:

```
tests/
├── __utils__/                    # Shared test utilities
│   ├── fixtures.ts               # Mock data factories
│   ├── renderWithProviders.tsx   # Custom render with providers
│   └── index.ts                  # Exports
├── components/                   # Component tests
│   ├── MetricCard.test.tsx
│   ├── ProductCard.test.tsx
│   └── ...
├── pages/                        # Page tests
│   ├── Dashboard.test.tsx
│   └── ...
└── setup.ts                      # Test setup
```

## Using Test Utilities

### Mock Data Factories

```typescript
import { createMockProduct, createMockAlerts } from '../__utils__';

// Create single mock
const product = createMockProduct();

// Override fields
const product = createMockProduct({
  title: 'Custom Product',
  currentPrice: 99.99,
});

// Create multiple
const alerts = createMockAlerts(5);
```

### Rendering Components

```typescript
import { render, screen } from '../__utils__';

test('renders component', () => {
  render(<MyComponent />);
  expect(screen.getByText('Hello')).toBeInTheDocument();
});
```

The custom `render` function automatically wraps components with:
- React Query Provider
- React Router (BrowserRouter)

### User Interactions

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

test('handles button click', async () => {
  const user = userEvent.setup();
  const handleClick = vi.fn();
  
  render(<Button onClick={handleClick}>Click me</Button>);
  
  await user.click(screen.getByRole('button'));
  
  expect(handleClick).toHaveBeenCalledTimes(1);
});
```

## Testing Patterns

### Component Tests

Test user-facing behavior, not implementation:

```typescript
// ✅ Good - tests what user sees
test('displays product title', () => {
  render(<ProductCard product={mockProduct} />);
  expect(screen.getByText('Apple AirPods Pro')).toBeInTheDocument();
});

// ❌ Bad - tests implementation
test('calls setTitle with correct value', () => {
  const setTitle = vi.fn();
  render(<ProductCard product={mockProduct} setTitle={setTitle} />);
  // ...
});
```

### Async Tests

```typescript
test('loads data', async () => {
  render(<Dashboard />);
  
  // Wait for loading to finish
  await waitFor(() => {
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });
  
  // Check data is displayed
  expect(screen.getByText('Products: 10')).toBeInTheDocument();
});
```

### Form Tests

```typescript
test('submits form with valid data', async () => {
  const user = userEvent.setup();
  const onSubmit = vi.fn();
  
  render(<ProductForm onSubmit={onSubmit} />);
  
  await user.type(screen.getByLabelText('Title'), 'New Product');
  await user.type(screen.getByLabelText('URL'), 'https://amazon.com/dp/TEST');
  await user.click(screen.getByRole('button', { name: 'Submit' }));
  
  expect(onSubmit).toHaveBeenCalledWith({
    title: 'New Product',
    productUrl: 'https://amazon.com/dp/TEST',
    // ...
  });
});
```

## Coverage

Coverage thresholds:
- Statements: 80%
- Branches: 70%
- Functions: 80%
- Lines: 80%

View HTML report: Open `coverage/index.html` after `npm run test:coverage`.

## Best Practices

1. **Use accessible queries** - Prefer `getByRole`, `getByLabelText` over `getByTestId`
2. **Test user behavior** - What users see and do, not implementation
3. **Avoid snapshot tests** - They're brittle and don't catch real bugs
4. **Mock API calls** - Don't make real HTTP requests in tests
5. **Fast tests** - Component tests should be instant (<1ms each)
6. **One concept per test** - Test one user action or one rendering scenario

## Common Issues

### "Not wrapped in act(...)" warning

This usually means an async update wasn't awaited:

```typescript
// ✅ Good
await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument();
});

// ❌ Bad
expect(screen.getByText('Loaded')).toBeInTheDocument(); // Might not be rendered yet
```

### "Unable to find element" error

Element might not be rendered yet. Use `findBy*` queries or `waitFor`:

```typescript
// ✅ Good
const button = await screen.findByRole('button');

// ❌ Bad
const button = screen.getByRole('button'); // Might not exist yet
```
