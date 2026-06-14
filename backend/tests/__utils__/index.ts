/**
 * Centralized exports for all test utilities.
 * Import from here to access fixtures, mocks, and helpers.
 *
 * Usage:
 *   import { createMockProduct, createMockAmazonHtml, createTestDb } from '../__utils__';
 */

// Fixture factories
export {
  createMockProduct,
  createMockPriceSnapshot,
  createMockAlert,
  createMockAlertRule,
  createMockProducts,
  createMockPriceSnapshots,
  type MockProduct,
  type MockPriceSnapshot,
  type MockAlert,
  type MockAlertRule,
} from './fixtures';

// Amazon HTML mocks
export {
  createMockAmazonHtml,
  createMockAmazonHtmlNoPriceElement,
  createMockAmazonHtmlOutOfStock,
  createMockAmazonHtmlLowStock,
  createMockAmazonHtmlMinimal,
  createInvalidHtml,
  createMockAmazonErrorPage,
  createMockAmazonRobotCheck,
} from './mockAmazonHtml';

// Test helpers
export {
  createTestDb,
  cleanupTestDb,
  sleep,
  createMockRequest,
  createMockResponse,
  createMockNext,
  assertDefined,
  daysAgo,
  hoursAgo,
} from './testHelpers';
