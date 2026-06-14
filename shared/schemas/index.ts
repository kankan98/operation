// Product schemas and types
export {
  platformEnum,
  monitorTypeEnum,
  createProductSchema,
  productResponseSchema,
  updateProductSchema,
  type Platform,
  type MonitorType,
  type CreateProduct,
  type Product,
  type UpdateProduct,
} from './product.schema';

// Alert schemas and types
export {
  alertTypeEnum,
  severityEnum,
  createAlertSchema,
  alertResponseSchema,
  type AlertType,
  type Severity,
  type CreateAlert,
  type Alert,
} from './alert.schema';

// AlertRule schemas and types
export {
  ruleTypeEnum,
  conditionEnum,
  createAlertRuleSchema,
  alertRuleResponseSchema,
  updateAlertRuleSchema,
  type RuleType,
  type Condition,
  type CreateAlertRule,
  type AlertRule,
  type UpdateAlertRule,
} from './alertRule.schema';

// PriceSnapshot schemas and types
export {
  availabilityEnum,
  createPriceSnapshotSchema,
  priceSnapshotResponseSchema,
  type Availability,
  type CreatePriceSnapshot,
  type PriceSnapshot,
} from './priceSnapshot.schema';

// Analysis schemas and types
export {
  priceStatsResponseSchema,
  type PriceStats,
} from './analysis.schema';

// Scraper schemas and types
export {
  scrapeResultSchema,
  scrapeAllResultsSchema,
  type ScrapeResult,
  type ScrapeAllResults,
} from './scraper.schema';

// Chat schemas and types
export {
  createChatSessionSchema,
  chatSessionResponseSchema,
  updateChatSessionSchema,
  chatMessageResponseSchema,
  sendMessageSchema,
  type CreateChatSession,
  type ChatSession,
  type UpdateChatSession,
  type ChatMessage,
  type SendMessage,
} from './chat.schema';

