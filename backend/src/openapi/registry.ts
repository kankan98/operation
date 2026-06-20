import './zodExtension';
import { OpenAPIRegistry, OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import {
  createProductSchema,
  productResponseSchema,
  updateProductSchema,
  productBusinessSignalUpsertSchema,
  productBusinessSignalResponseSchema,
  createAlertSchema,
  alertResponseSchema,
  createAlertRuleSchema,
  alertRuleResponseSchema,
  updateAlertRuleSchema,
  createPriceSnapshotSchema,
  priceSnapshotResponseSchema,
  priceStatsResponseSchema,
  scrapeResultSchema,
  scrapeAllResultsSchema,
  scrapeAttemptSchema,
  scrapeJobSchema,
  providerHealthResponseSchema,
  ACQUISITION_QUEUE_CAVEAT,
  acquisitionQueueHealthQuerySchema,
  acquisitionQueueHealthSchema,
  acquisitionWorkerHealthQuerySchema,
  acquisitionWorkerHealthSchema,
  acquisitionProductJobDiagnosticsSchema,
  acquisitionProviderQueueStatusSchema,
  acquisitionJobRetryRequestSchema,
  acquisitionJobCancelRequestSchema,
  acquisitionJobControlResponseSchema,
  marketSignalSnapshotSchema,
  marketSignalRefreshResultSchema,
  marketSignalProviderHealthSchema,
  opportunityListQuerySchema,
  opportunityListResponseSchema,
  productOpportunityResponseSchema,
  opportunityResearchEntrySchema,
  opportunityResearchMetadataSchema,
  opportunityResearchUpsertSchema,
  opportunityResearchUpdateSchema,
  opportunityResearchListQuerySchema,
  opportunityResearchComparisonRequestSchema,
  opportunityResearchComparisonResponseSchema,
  opportunityResearchExportRequestSchema,
  opportunityResearchExportResponseSchema,
  createChatSessionSchema,
  chatSessionResponseSchema,
  updateChatSessionSchema,
  chatMessageResponseSchema,
  sendMessageSchema,
} from '@shared/schemas';

// Initialize the OpenAPI registry
const registry = new OpenAPIRegistry();

// Common error response schemas
const errorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
});

const commonErrorResponses = {
  400: {
    description: '请求参数错误',
    content: { 'application/json': { schema: errorResponseSchema } }
  },
  401: {
    description: '未授权',
    content: { 'application/json': { schema: errorResponseSchema } }
  },
  404: {
    description: '资源未找到',
    content: { 'application/json': { schema: errorResponseSchema } }
  },
  500: {
    description: '服务器内部错误',
    content: { 'application/json': { schema: errorResponseSchema } }
  },
};

// Register schemas
registry.register('Product', productResponseSchema);
registry.register('CreateProduct', createProductSchema);
registry.register('UpdateProduct', updateProductSchema);
registry.register('ProductBusinessSignalUpsert', productBusinessSignalUpsertSchema);
registry.register('ProductBusinessSignalResponse', productBusinessSignalResponseSchema);
registry.register('Alert', alertResponseSchema);
registry.register('CreateAlert', createAlertSchema);
registry.register('AlertRule', alertRuleResponseSchema);
registry.register('CreateAlertRule', createAlertRuleSchema);
registry.register('UpdateAlertRule', updateAlertRuleSchema);
registry.register('PriceSnapshot', priceSnapshotResponseSchema);
registry.register('CreatePriceSnapshot', createPriceSnapshotSchema);
registry.register('PriceStats', priceStatsResponseSchema);
registry.register('ScrapeResult', scrapeResultSchema);
registry.register('ScrapeAllResults', scrapeAllResultsSchema);
registry.register('ScrapeAttempt', scrapeAttemptSchema);
registry.register('ScrapeJob', scrapeJobSchema);
registry.register('ProviderHealth', providerHealthResponseSchema);
registry.register('AcquisitionQueueHealth', acquisitionQueueHealthSchema);
registry.register('AcquisitionWorkerHealth', acquisitionWorkerHealthSchema);
registry.register(
  'AcquisitionProductJobDiagnostics',
  acquisitionProductJobDiagnosticsSchema
);
registry.register(
  'AcquisitionProviderQueueStatus',
  acquisitionProviderQueueStatusSchema
);
registry.register(
  'AcquisitionJobControlResponse',
  acquisitionJobControlResponseSchema
);
registry.register('MarketSignalSnapshot', marketSignalSnapshotSchema);
registry.register('MarketSignalRefreshResult', marketSignalRefreshResultSchema);
registry.register('MarketSignalProviderHealth', marketSignalProviderHealthSchema);
registry.register('OpportunityList', opportunityListResponseSchema);
registry.register('ProductOpportunity', productOpportunityResponseSchema);
registry.register('OpportunityResearchEntry', opportunityResearchEntrySchema);
registry.register('OpportunityResearchMetadata', opportunityResearchMetadataSchema);
registry.register('OpportunityResearchUpsert', opportunityResearchUpsertSchema);
registry.register('OpportunityResearchUpdate', opportunityResearchUpdateSchema);
registry.register(
  'OpportunityResearchComparisonRequest',
  opportunityResearchComparisonRequestSchema
);
registry.register(
  'OpportunityResearchComparisonResponse',
  opportunityResearchComparisonResponseSchema
);
registry.register(
  'OpportunityResearchExportRequest',
  opportunityResearchExportRequestSchema
);
registry.register(
  'OpportunityResearchExportResponse',
  opportunityResearchExportResponseSchema
);
registry.register('ChatSession', chatSessionResponseSchema);
registry.register('CreateChatSession', createChatSessionSchema);
registry.register('UpdateChatSession', updateChatSessionSchema);
registry.register('ChatMessage', chatMessageResponseSchema);
registry.register('SendMessage', sendMessageSchema);

const marketSignalCaveat =
  'Keepa market signals are historical trend and proxy evidence, not verified sales, demand, margin, ROI, or profitability facts.';
const opportunityResearchScoreCaveat =
  'Research status, tags, notes, and priority do not change opportunity score or factor contributions.';

const marketSignalLatestResponseSchema = z.object({
  data: marketSignalSnapshotSchema.nullable(),
  status: z.enum(['fresh', 'missing']),
  missingSignals: z.array(z.string()),
  caveat: z.string(),
});

const marketSignalHistoryResponseSchema = z.object({
  data: z.array(marketSignalSnapshotSchema),
});

const marketSignalSnapshotExample = {
  id: 'market-signal-snapshot-1',
  productId: 'product-1',
  platform: 'amazon',
  provider: 'keepa',
  source: 'third_party',
  asin: 'B08N5WRWNW',
  marketplace: 'amazon.com',
  windowDays: 90,
  confidence: 0.82,
  freshnessMs: 3600000,
  priceTrend: {
    current: 44.99,
    average: 49.99,
    lowest: 39.99,
    highest: 59.99,
    changePercent: -8.4,
    volatility: 0.12,
    direction: 'down',
    dataPoints: 42,
    firstObservedAt: 1760000000000,
    lastObservedAt: 1760086400000,
  },
  salesRankTrend: {
    current: 1300,
    average: 1800,
    lowest: 1100,
    highest: 2600,
    changePercent: -27.8,
    volatility: 0.18,
    direction: 'down',
    dataPoints: 36,
    firstObservedAt: 1760000000000,
    lastObservedAt: 1760086400000,
  },
  reviewVelocity: 1.8,
  ratingMovement: 0.1,
  missingSignals: [],
  metadata: { tokensLeft: 42, windowDays: 90 },
  createdAt: 1760086400000,
};

// Register POST /api/products
registry.registerPath({
  method: 'post',
  path: '/api/products',
  summary: '创建产品',
  description: '添加新产品到监控系统',
  tags: ['Products'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: createProductSchema,
          example: {
            platform: 'amazon',
            productUrl: 'https://amazon.com/dp/B08N5WRWNW',
            asin: 'B08N5WRWNW',
            title: 'Echo Dot (4th Gen)',
            brand: 'Amazon',
            currentPrice: 49.99,
            currency: 'USD',
            isMonitoring: true,
            checkInterval: 24,
          },
        },
      },
    },
  },
  responses: {
    201: {
      description: '产品创建成功',
      content: {
        'application/json': {
          schema: productResponseSchema,
        },
      },
    },
    400: commonErrorResponses[400],
    500: commonErrorResponses[500],
  },
});

// Register GET /api/products
registry.registerPath({
  method: 'get',
  path: '/api/products',
  summary: '获取产品列表',
  tags: ['Products'],
  request: {
    query: z.object({
      platform: z.string().optional(),
      monitoring: z.enum(['true', 'false']).optional(),
      page: z.string().optional(),
      limit: z.string().optional(),
    }),
  },
  responses: {
    200: {
      description: '产品列表',
      content: {
        'application/json': {
          schema: z.object({
            data: z.array(productResponseSchema),
            total: z.number().optional(),
            page: z.number().optional(),
            limit: z.number().optional(),
          }),
        },
      },
    },
  },
});

// Register GET /api/products/:id
registry.registerPath({
  method: 'get',
  path: '/api/products/{id}',
  summary: '获取产品详情',
  tags: ['Products'],
  request: {
    params: z.object({
      id: z.string(),
    }),
  },
  responses: {
    200: {
      description: '产品详情',
      content: {
        'application/json': {
          schema: productResponseSchema,
        },
      },
    },
    404: commonErrorResponses[404],
    500: commonErrorResponses[500],
  },
});

// Register PATCH /api/products/:id
registry.registerPath({
  method: 'patch',
  path: '/api/products/{id}',
  summary: '更新产品',
  tags: ['Products'],
  request: {
    params: z.object({
      id: z.string(),
    }),
    body: {
      content: {
        'application/json': {
          schema: updateProductSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: '产品更新成功',
      content: {
        'application/json': {
          schema: productResponseSchema,
        },
      },
    },
    400: commonErrorResponses[400],
    404: commonErrorResponses[404],
    500: commonErrorResponses[500],
  },
});

// Register DELETE /api/products/:id
registry.registerPath({
  method: 'delete',
  path: '/api/products/{id}',
  summary: '删除产品',
  tags: ['Products'],
  request: {
    params: z.object({
      id: z.string(),
    }),
  },
  responses: {
    204: {
      description: '产品删除成功',
    },
    404: commonErrorResponses[404],
    500: commonErrorResponses[500],
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/products/{id}/business-signals',
  summary: '获取产品业务选品假设和财务指标',
  description:
    'Returns merchant-provided business assumptions and assumption-based margin, ROI, breakeven, and contribution metrics.',
  tags: ['Products'],
  request: {
    params: z.object({
      id: z.string(),
    }),
  },
  responses: {
    200: {
      description: '产品业务选品假设和派生指标',
      content: {
        'application/json': {
          schema: productBusinessSignalResponseSchema,
        },
      },
    },
    404: commonErrorResponses[404],
    500: commonErrorResponses[500],
  },
});

registry.registerPath({
  method: 'put',
  path: '/api/products/{id}/business-signals',
  summary: '创建或更新产品业务选品假设',
  description:
    'Saves merchant assumptions used for assumption-based margin, ROI, breakeven, and contribution calculations.',
  tags: ['Products'],
  request: {
    params: z.object({
      id: z.string(),
    }),
    body: {
      content: {
        'application/json': {
          schema: productBusinessSignalUpsertSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: '产品业务选品假设保存成功',
      content: {
        'application/json': {
          schema: productBusinessSignalResponseSchema,
        },
      },
    },
    400: commonErrorResponses[400],
    404: commonErrorResponses[404],
    500: commonErrorResponses[500],
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/products/{id}/market-signals/refresh',
  summary: '刷新产品市场趋势信号',
  description:
    'Refreshes Keepa-backed Amazon market signals using deterministic ASIN identifiers. Returned rank and review signals are proxy trend evidence, not verified sales, demand, margin, ROI, or profitability facts.',
  tags: ['Market Signals'],
  request: {
    params: z.object({
      id: z.string(),
    }),
  },
  responses: {
    200: {
      description: '市场趋势信号刷新结果',
      content: {
        'application/json': {
          schema: marketSignalRefreshResultSchema,
          examples: {
            success: {
              value: {
                success: true,
                productId: 'product-1',
                provider: 'keepa',
                source: 'third_party',
                snapshotId: 'market-signal-snapshot-1',
                confidence: 0.82,
                timestamp: 1760086400000,
                durationMs: 420,
              },
            },
            providerUnavailable: {
              value: {
                success: false,
                productId: 'product-1',
                provider: 'keepa',
                source: 'third_party',
                failureReason: 'provider_unavailable',
                rootCause: 'missing_credentials',
                error: 'Keepa API key is not configured',
                diagnostics: {
                  rootCause: 'missing_credentials',
                  providerErrorCode: 'missing_credentials',
                  marketplace: 'amazon.com',
                },
                timestamp: 1760086400000,
                durationMs: 0,
              },
            },
            quotaExhausted: {
              value: {
                success: false,
                productId: 'product-1',
                provider: 'keepa',
                source: 'third_party',
                failureReason: 'provider_unavailable',
                rootCause: 'quota_exhausted',
                error: 'Keepa token quota exhausted',
                diagnostics: {
                  rootCause: 'quota_exhausted',
                  providerErrorCode: 'quota_exhausted',
                  marketplace: 'amazon.com',
                  keepaAsin: 'B08N5WRWNW',
                  tokensLeft: 0,
                  refillIn: 3600,
                },
                timestamp: 1760086400000,
                durationMs: 260,
              },
            },
            unsupportedProduct: {
              value: {
                success: false,
                productId: 'product-1',
                provider: 'keepa',
                source: 'third_party',
                failureReason: 'unsupported_product',
                rootCause: 'unsupported_product',
                error: 'Amazon ASIN could not be resolved for Keepa market signals',
                diagnostics: {
                  rootCause: 'unsupported_product',
                  providerErrorCode: 'unsupported_product',
                  marketplace: 'amazon.com',
                },
                timestamp: 1760086400000,
                durationMs: 0,
              },
            },
            insufficientHistory: {
              value: {
                success: false,
                productId: 'product-1',
                provider: 'keepa',
                source: 'third_party',
                failureReason: 'unknown',
                rootCause: 'insufficient_history',
                error:
                  'Keepa response did not include enough history to build market signals',
                diagnostics: {
                  rootCause: 'insufficient_history',
                  providerErrorCode: 'insufficient_history',
                  marketplace: 'amazon.com',
                  keepaAsin: 'B08N5WRWNW',
                },
                timestamp: 1760086400000,
                durationMs: 180,
              },
            },
          },
        },
      },
    },
    404: commonErrorResponses[404],
    500: commonErrorResponses[500],
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/products/{id}/market-signals/latest',
  summary: '获取产品最新市场趋势信号',
  description:
    'Returns the latest persisted market signal snapshot or an explicit missing state. Keepa rank and review signals are proxy trend evidence only.',
  tags: ['Market Signals'],
  request: {
    params: z.object({
      id: z.string(),
    }),
  },
  responses: {
    200: {
      description: '产品最新市场趋势信号',
      content: {
        'application/json': {
          schema: marketSignalLatestResponseSchema,
          examples: {
            fresh: {
              value: {
                data: marketSignalSnapshotExample,
                status: 'fresh',
                missingSignals: [],
                caveat: marketSignalCaveat,
              },
            },
            missing: {
              value: {
                data: null,
                status: 'missing',
                missingSignals: ['market_history'],
                caveat: marketSignalCaveat,
              },
            },
          },
        },
      },
    },
    404: commonErrorResponses[404],
    500: commonErrorResponses[500],
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/products/{id}/market-signals/history',
  summary: '获取产品市场趋势信号历史',
  description:
    'Returns bounded market signal snapshots ordered by newest first. Use the limit query parameter to cap history size.',
  tags: ['Market Signals'],
  request: {
    params: z.object({
      id: z.string(),
    }),
    query: z.object({
      limit: z.coerce.number().int().min(1).max(100).default(20),
    }),
  },
  responses: {
    200: {
      description: '产品市场趋势信号历史',
      content: {
        'application/json': {
          schema: marketSignalHistoryResponseSchema,
          examples: {
            history: {
              value: {
                data: [marketSignalSnapshotExample],
              },
            },
          },
        },
      },
    },
    400: commonErrorResponses[400],
    404: commonErrorResponses[404],
    500: commonErrorResponses[500],
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/market-signals/providers/keepa/health',
  summary: '获取 Keepa 市场趋势信号 provider 健康摘要',
  description:
    'Aggregates recent Keepa market signal refresh attempts separately from listing acquisition provider health. Diagnostics are bounded and redacted.',
  tags: ['Market Signals'],
  request: {
    query: z.object({
      windowHours: z.coerce.number().int().min(1).max(24 * 30).default(24),
      productId: z.string().optional(),
    }),
  },
  responses: {
    200: {
      description: 'Keepa 市场趋势信号 provider 健康摘要',
      content: {
        'application/json': {
          schema: marketSignalProviderHealthSchema,
          examples: {
            healthy: {
              value: {
                provider: 'keepa',
                source: 'third_party',
                platform: 'amazon',
                status: 'healthy',
                window: {
                  windowHours: 24,
                  since: 1760000000000,
                  until: 1760086400000,
                },
                attemptCount: 3,
                successCount: 3,
                failureCount: 0,
                successRate: 1,
                averageDurationMs: 360,
                latestSuccessTimestamp: 1760086000000,
                latestFailureReason: null,
                failureReasons: {},
                rootCauses: {},
                recommendations: [],
              },
            },
            degraded: {
              value: {
                provider: 'keepa',
                source: 'third_party',
                platform: 'amazon',
                status: 'degraded',
                window: {
                  windowHours: 24,
                  since: 1760000000000,
                  until: 1760086400000,
                },
                attemptCount: 4,
                successCount: 1,
                failureCount: 3,
                successRate: 0.25,
                averageDurationMs: 280,
                latestSuccessTimestamp: 1760080000000,
                latestFailureReason: 'provider_unavailable',
                failureReasons: {
                  provider_unavailable: 2,
                  unsupported_product: 1,
                },
                rootCauses: {
                  quota_exhausted: 1,
                  auth_failed: 1,
                  unsupported_product: 1,
                },
                recommendations: [
                  {
                    code: 'check_keepa_quota',
                    severity: 'warning',
                    message:
                      'Keepa returned quota or rate-limit failures. Check token quota and reduce refresh frequency before retrying.',
                  },
                  {
                    code: 'check_market_signal_identifier',
                    severity: 'warning',
                    message:
                      'Keepa market signals require a deterministic Amazon ASIN. Check product ASIN or safe metadata before retrying.',
                  },
                ],
              },
            },
            insufficientHistory: {
              value: {
                provider: 'keepa',
                source: 'third_party',
                platform: 'amazon',
                status: 'insufficient_history',
                window: {
                  windowHours: 24,
                  since: 1760000000000,
                  until: 1760086400000,
                },
                attemptCount: 0,
                successCount: 0,
                failureCount: 0,
                successRate: 0,
                averageDurationMs: null,
                latestSuccessTimestamp: null,
                latestFailureReason: null,
                failureReasons: {},
                rootCauses: {},
                recommendations: [
                  {
                    code: 'refresh_market_signals',
                    severity: 'info',
                    message:
                      'No Keepa market signal attempts were found in this window. Refresh market signals to collect trend evidence.',
                  },
                ],
              },
            },
          },
        },
      },
    },
    400: commonErrorResponses[400],
    500: commonErrorResponses[500],
  },
});

// === Alert Routes ===
registry.registerPath({
  method: 'post',
  path: '/api/alerts',
  summary: '创建告警',
  tags: ['Alerts'],
  request: { body: { content: { 'application/json': { schema: createAlertSchema } } } },
  responses: {
    201: { description: '告警创建成功', content: { 'application/json': { schema: alertResponseSchema } } },
    400: { description: '验证失败', content: { 'application/json': { schema: errorResponseSchema } } },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/alerts',
  summary: '获取告警列表',
  tags: ['Alerts'],
  request: {
    query: z.object({
      productId: z.string().optional(),
      severity: z.string().optional(),
      unreadOnly: z.enum(['true', 'false']).optional(),
      page: z.string().optional(),
      limit: z.string().optional(),
    }),
  },
  responses: {
    200: { description: '告警列表', content: { 'application/json': { schema: z.object({ data: z.array(alertResponseSchema) }) } } },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/alerts/{id}',
  summary: '获取告警详情',
  tags: ['Alerts'],
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: { description: '告警详情', content: { 'application/json': { schema: alertResponseSchema } } },
    404: { description: '告警未找到' },
  },
});

registry.registerPath({
  method: 'patch',
  path: '/api/alerts/{id}/read',
  summary: '标记告警为已读',
  tags: ['Alerts'],
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: { description: '标记成功', content: { 'application/json': { schema: alertResponseSchema } } },
  },
});

registry.registerPath({
  method: 'patch',
  path: '/api/alerts/{id}/archive',
  summary: '归档告警',
  tags: ['Alerts'],
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: { description: '归档成功', content: { 'application/json': { schema: alertResponseSchema } } },
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/alerts/{id}',
  summary: '删除告警',
  tags: ['Alerts'],
  request: { params: z.object({ id: z.string() }) },
  responses: { 204: { description: '删除成功' } },
});

// === AlertRule Routes ===
registry.registerPath({
  method: 'post',
  path: '/api/alert-rules',
  summary: '创建告警规则',
  tags: ['Alert Rules'],
  request: { body: { content: { 'application/json': { schema: createAlertRuleSchema } } } },
  responses: {
    201: { description: '规则创建成功', content: { 'application/json': { schema: alertRuleResponseSchema } } },
    400: { description: '验证失败' },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/alert-rules',
  summary: '获取告警规则列表',
  tags: ['Alert Rules'],
  request: { query: z.object({ productId: z.string().optional() }) },
  responses: {
    200: { description: '规则列表', content: { 'application/json': { schema: z.object({ data: z.array(alertRuleResponseSchema) }) } } },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/alert-rules/{id}',
  summary: '获取告警规则详情',
  tags: ['Alert Rules'],
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: { description: '规则详情', content: { 'application/json': { schema: alertRuleResponseSchema } } },
    404: { description: '规则未找到' },
  },
});

registry.registerPath({
  method: 'patch',
  path: '/api/alert-rules/{id}',
  summary: '更新告警规则',
  tags: ['Alert Rules'],
  request: {
    params: z.object({ id: z.string() }),
    body: { content: { 'application/json': { schema: updateAlertRuleSchema } } },
  },
  responses: {
    200: { description: '更新成功', content: { 'application/json': { schema: alertRuleResponseSchema } } },
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/alert-rules/{id}',
  summary: '删除告警规则',
  tags: ['Alert Rules'],
  request: { params: z.object({ id: z.string() }) },
  responses: { 204: { description: '删除成功' } },
});

// === PriceSnapshot Routes ===
// POST /api/price-snapshots
registry.registerPath({
  method: 'post',
  path: '/api/price-snapshots',
  summary: '创建价格快照',
  tags: ['Price Snapshots'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: createPriceSnapshotSchema,
          example: {
            productId: '123',
            price: 49.99,
            currency: 'USD',
            availability: 'in_stock',
            rating: 4.5,
            reviewCount: 1234,
          }
        }
      }
    }
  },
  responses: {
    201: { description: '快照创建成功', content: { 'application/json': { schema: priceSnapshotResponseSchema } } },
    400: commonErrorResponses[400],
    500: commonErrorResponses[500],
  },
});

// GET /api/price-snapshots/product/:productId
registry.registerPath({
  method: 'get',
  path: '/api/price-snapshots/product/{productId}',
  summary: '获取产品价格快照列表',
  tags: ['Price Snapshots'],
  request: {
    params: z.object({
      productId: z.string(),
    }),
    query: z.object({
      limit: z.string().optional(),
    }),
  },
  responses: {
    200: { description: '快照列表', content: { 'application/json': { schema: z.object({ data: z.array(priceSnapshotResponseSchema) }) } } },
    500: commonErrorResponses[500],
  },
});

// GET /api/price-snapshots/product/:productId/latest
registry.registerPath({
  method: 'get',
  path: '/api/price-snapshots/product/{productId}/latest',
  summary: '获取产品最新价格快照',
  tags: ['Price Snapshots'],
  request: {
    params: z.object({
      productId: z.string(),
    }),
  },
  responses: {
    200: { description: '最新快照', content: { 'application/json': { schema: priceSnapshotResponseSchema } } },
    404: commonErrorResponses[404],
    500: commonErrorResponses[500],
  },
});

// === Scraper Routes ===
registry.registerPath({
  method: 'get',
  path: '/api/scraper/queue/health',
  summary: '获取采集队列运营健康摘要',
  description:
    'Returns acquisition queue backend, backlog, worker, provider gate, and remediation state. Queue health is operational metadata only and does not change opportunity score, market signals, demand, sales, margin, ROI, or profitability evidence.',
  tags: ['Scraper'],
  request: {
    query: acquisitionQueueHealthQuerySchema,
  },
  responses: {
    200: {
      description: '采集队列运营健康摘要',
      content: {
        'application/json': {
          schema: acquisitionQueueHealthSchema,
          examples: {
            healthy: {
              value: {
                backend: 'sqlite',
                status: 'healthy',
                scope: {},
                counts: {
                  backlog: 0,
                  pending: 1,
                  running: 0,
                  retryScheduled: 0,
                  failed: 0,
                  cancelled: 0,
                  staleLeases: 0,
                },
                workerSummary: {
                  total: 1,
                  healthy: 1,
                  stale: 0,
                  busy: 0,
                  idle: 1,
                  capacity: 4,
                  activeJobCount: 0,
                },
                providerGates: [],
                recommendations: [
                  {
                    code: 'queue_operational',
                    severity: 'info',
                    message:
                      'Acquisition queue operations are within configured thresholds.',
                  },
                ],
                caveat: ACQUISITION_QUEUE_CAVEAT,
                generatedAt: 1760086400000,
              },
            },
            degradedProviderGate: {
              value: {
                backend: 'bullmq',
                status: 'degraded',
                scope: { platform: 'amazon', provider: 'rainforest' },
                counts: {
                  backlog: 12,
                  pending: 8,
                  running: 2,
                  retryScheduled: 4,
                  failed: 1,
                  cancelled: 0,
                  staleLeases: 1,
                },
                workerSummary: {
                  total: 2,
                  healthy: 1,
                  stale: 1,
                  busy: 1,
                  idle: 0,
                  capacity: 8,
                  activeJobCount: 2,
                },
                providerGates: [
                  {
                    platform: 'amazon',
                    provider: 'rainforest',
                    status: 'rate_limited',
                    resetAt: 1760087300000,
                    currentConcurrency: 0,
                    maxConcurrency: 2,
                    activeCount: 0,
                    recentRootCauses: ['rate_limited'],
                    recommendations: [
                      {
                        code: 'provider_rate_limited',
                        severity: 'warning',
                        message:
                          'rainforest reported rate_limited. Check quota, credentials, reset time, or reduce concurrency before retrying.',
                      },
                    ],
                    updatedAt: 1760086400000,
                  },
                ],
                recommendations: [
                  {
                    code: 'check_workers',
                    severity: 'warning',
                    message:
                      'One or more workers or leases are stale. Restart workers or wait for leases to expire before retrying.',
                  },
                ],
                caveat: ACQUISITION_QUEUE_CAVEAT,
                generatedAt: 1760086400000,
              },
            },
          },
        },
      },
    },
    400: commonErrorResponses[400],
    500: commonErrorResponses[500],
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/scraper/queue/workers',
  summary: '获取采集 worker heartbeat 状态',
  description:
    'Returns bounded worker heartbeat entries. Metadata examples omit Redis credentials, API keys, authorization headers, cookies, raw provider payloads, and raw HTML.',
  tags: ['Scraper'],
  request: {
    query: acquisitionWorkerHealthQuerySchema,
  },
  responses: {
    200: {
      description: '采集 worker 状态',
      content: {
        'application/json': {
          schema: acquisitionWorkerHealthSchema,
          example: {
            workers: [
              {
                workerId: 'worker-local-1',
                backend: 'sqlite',
                status: 'idle',
                concurrency: 4,
                activeJobCount: 0,
                queues: ['acquisition'],
                startedAt: 1760080000000,
                lastHeartbeatAt: 1760086400000,
                stale: false,
                metadata: { hostname: 'worker-a' },
              },
            ],
            summary: {
              total: 1,
              healthy: 1,
              stale: 0,
              busy: 0,
              idle: 1,
              capacity: 4,
              activeJobCount: 0,
            },
            caveat: ACQUISITION_QUEUE_CAVEAT,
            generatedAt: 1760086400000,
          },
        },
      },
    },
    400: commonErrorResponses[400],
    500: commonErrorResponses[500],
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/scraper/queue/providers/status',
  summary: '获取 provider 队列 gate 状态',
  description:
    'Returns provider operational gates such as rate limits, quota exhaustion, unavailable providers, and concurrency state. These gates affect acquisition scheduling only.',
  tags: ['Scraper'],
  request: {
    query: acquisitionQueueHealthQuerySchema,
  },
  responses: {
    200: {
      description: 'provider 队列 gate 状态',
      content: {
        'application/json': {
          schema: acquisitionProviderQueueStatusSchema,
          example: {
            providerGates: [
              {
                platform: 'amazon',
                provider: 'rainforest',
                status: 'quota_exhausted',
                resetAt: 1760090000000,
                currentConcurrency: 0,
                maxConcurrency: 2,
                activeCount: 0,
                recentRootCauses: ['quota_exhausted'],
                recommendations: [
                  {
                    code: 'provider_quota_exhausted',
                    severity: 'critical',
                    message:
                      'rainforest reported quota_exhausted. Check quota, credentials, reset time, or reduce concurrency before retrying.',
                  },
                ],
                updatedAt: 1760086400000,
              },
            ],
            caveat: ACQUISITION_QUEUE_CAVEAT,
            generatedAt: 1760086400000,
          },
        },
      },
    },
    400: commonErrorResponses[400],
    500: commonErrorResponses[500],
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/scraper/product/{productId}/job-diagnostics',
  summary: '获取产品采集 job 诊断',
  description:
    'Returns product-scoped acquisition job state, latest safe attempt summary, provider gate context, retry timing, and queue caveat. Operational delay is not product demand or profitability evidence.',
  tags: ['Scraper'],
  request: {
    params: z.object({ productId: z.string() }),
  },
  responses: {
    200: {
      description: '产品采集 job 诊断',
      content: {
        'application/json': {
          schema: acquisitionProductJobDiagnosticsSchema,
          example: {
            productId: 'product-1',
            job: {
              id: 'job-1',
              productId: 'product-1',
              status: 'retry_scheduled',
              priority: 0,
              attemptCount: 1,
              maxAttempts: 3,
              nextRunAt: 1760087300000,
              leaseOwner: null,
              leaseExpiresAt: null,
              lastAttemptId: 'attempt-1',
              lastFailureReason: 'captcha',
              createdAt: 1760086000000,
              updatedAt: 1760086400000,
              completedAt: null,
              retryable: false,
              cancellable: true,
              delayReason: 'retry_backoff',
            },
            latestAttempt: {
              id: 'attempt-1',
              provider: 'amazon-browser',
              source: 'browser',
              status: 'failed',
              failureReason: 'captcha',
              durationMs: 1200,
              confidence: null,
              httpStatus: 503,
              timestamp: 1760086400000,
              diagnostics: { detectedState: 'captcha' },
            },
            providerGate: null,
            recommendations: [],
            caveat: ACQUISITION_QUEUE_CAVEAT,
            generatedAt: 1760086400000,
          },
        },
      },
    },
    404: commonErrorResponses[404],
    500: commonErrorResponses[500],
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/scraper/jobs/{jobId}/retry',
  summary: '重试失败或已取消的采集 job',
  description:
    'Moves a failed or cancelled acquisition job back to a claimable state while preserving durable attempt history.',
  tags: ['Scraper'],
  request: {
    params: z.object({ jobId: z.string() }),
    body: {
      content: {
        'application/json': {
          schema: acquisitionJobRetryRequestSchema.omit({ jobId: true }),
          example: { reason: 'provider_reset' },
        },
      },
    },
  },
  responses: {
    200: {
      description: '采集 job retry 结果',
      content: {
        'application/json': {
          schema: acquisitionJobControlResponseSchema,
        },
      },
    },
    400: commonErrorResponses[400],
    404: commonErrorResponses[404],
    500: commonErrorResponses[500],
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/scraper/jobs/{jobId}/cancel',
  summary: '取消 pending 或 retry-scheduled 采集 job',
  description:
    'Cancels pending or retry-scheduled jobs. Running jobs record a cancellation request and rely on cooperative completion or lease expiry.',
  tags: ['Scraper'],
  request: {
    params: z.object({ jobId: z.string() }),
    body: {
      content: {
        'application/json': {
          schema: acquisitionJobCancelRequestSchema.omit({ jobId: true }),
          example: { reason: 'operator_cancelled' },
        },
      },
    },
  },
  responses: {
    200: {
      description: '采集 job cancel 结果',
      content: {
        'application/json': {
          schema: acquisitionJobControlResponseSchema,
        },
      },
    },
    400: commonErrorResponses[400],
    404: commonErrorResponses[404],
    500: commonErrorResponses[500],
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/scraper/product/{productId}',
  summary: '手动爬取单个产品',
  tags: ['Scraper'],
  request: { params: z.object({ productId: z.string() }) },
  responses: {
    200: {
      description: '采集结果',
      content: {
        'application/json': {
          schema: scrapeResultSchema,
          examples: {
            amazonSuccess: {
              value: {
                success: true,
                productId: 'amazon-product-1',
                jobId: 'job-1',
                attemptId: 'attempt-1',
                snapshotId: 'snapshot-1',
                provider: 'rainforest',
                source: 'third_party',
                confidence: 0.9,
              },
            },
            ebaySuccess: {
              value: {
                success: true,
                productId: 'ebay-product-1',
                jobId: 'job-ebay-1',
                attemptId: 'attempt-ebay-1',
                snapshotId: 'snapshot-ebay-1',
                provider: 'ebay-browse',
                source: 'official_api',
                confidence: 0.95,
                data: {
                  price: 29.99,
                  currency: 'USD',
                  availability: 'IN_STOCK',
                  title: 'eBay Browse Item',
                  imageUrl: 'https://i.ebayimg.com/example.jpg',
                  seller: 'seller-one',
                  condition: 'New',
                },
              },
            },
            ebayProviderUnavailable: {
              value: {
                success: false,
                productId: 'ebay-product-1',
                jobId: 'job-ebay-1',
                attemptId: 'attempt-ebay-2',
                provider: 'ebay-browse',
                source: 'official_api',
                failureReason: 'provider_unavailable',
                error: 'eBay Browse API credentials are not configured',
                diagnostics: {
                  rootCause: 'missing_credentials',
                  providerErrorCode: 'missing_credentials',
                  marketplace: 'EBAY_US',
                },
              },
            },
            ebayNotFound: {
              value: {
                success: false,
                productId: 'ebay-product-2',
                jobId: 'job-ebay-2',
                attemptId: 'attempt-ebay-3',
                provider: 'ebay-browse',
                source: 'official_api',
                failureReason: 'not_found',
                error: 'Item not found',
                diagnostics: {
                  rootCause: 'not_found',
                  providerErrorCode: 'not_found',
                  marketplace: 'EBAY_US',
                  httpStatus: 404,
                  ebayItemId: '123456789012',
                },
              },
            },
          },
        },
      },
    },
    500: { description: '爬取失败' },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/scraper/all',
  summary: '手动爬取所有监控产品',
  tags: ['Scraper'],
  responses: {
    200: { description: '批量采集任务已入队', content: { 'application/json': { schema: scrapeAllResultsSchema } } },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/scraper/product/{productId}/attempts',
  summary: '获取产品采集尝试历史',
  tags: ['Scraper'],
  request: {
    params: z.object({ productId: z.string() }),
    query: z.object({ limit: z.coerce.number().optional() }),
  },
  responses: {
    200: {
      description: '采集尝试历史',
      content: {
        'application/json': {
          schema: z.object({ data: z.array(scrapeAttemptSchema) }),
        },
      },
    },
    500: commonErrorResponses[500],
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/scraper/providers/amazon/health',
  summary: '获取 Amazon provider 健康摘要',
  description:
    'Aggregates recent Amazon acquisition attempts, fallback usage, cache usage, failure distribution, safe diagnostics, and operator recommendations.',
  tags: ['Scraper'],
  request: {
    query: z.object({
      windowHours: z.string().optional(),
      productId: z.string().optional(),
      provider: z.string().optional(),
    }),
  },
  responses: {
    200: {
      description: 'Amazon provider 健康摘要',
      content: {
        'application/json': {
          schema: providerHealthResponseSchema,
          examples: {
            healthy: {
              value: {
                platform: 'amazon',
                status: 'healthy',
                window: {
                  windowHours: 24,
                  since: 1760000000000,
                  until: 1760086400000,
                },
                providerSummaries: [
                  {
                    provider: 'rainforest',
                    source: 'third_party',
                    attemptCount: 3,
                    successCount: 3,
                    failureCount: 0,
                    successRate: 1,
                    averageDurationMs: 420,
                    latestSuccessTimestamp: 1760086000000,
                    latestFailureReason: null,
                    latestConfidence: 0.9,
                    fallbackCount: 0,
                    cacheCount: 0,
                    failureReasons: {},
                    rootCauses: {},
                  },
                ],
                chainSummary: {
                  totalAttempts: 3,
                  liveSuccessCount: 3,
                  liveFailureCount: 0,
                  browserFallbackCount: 0,
                  cacheFallbackCount: 0,
                  primaryFailureCount: 0,
                  degradedPathCounts: { primary_live: 3 },
                  rootCauses: {},
                },
                latestAttempts: [
                  {
                    id: 'attempt-1',
                    productId: 'product-1',
                    provider: 'rainforest',
                    source: 'third_party',
                    status: 'success',
                    failureReason: null,
                    durationMs: 420,
                    confidence: 0.9,
                    rootCause: null,
                    marketplace: 'amazon.com',
                    httpStatus: 200,
                    fallbackType: 'primary_live',
                    sanitizedMessage: null,
                    timestamp: 1760086000000,
                  },
                ],
                recommendations: [],
              },
            },
            degraded: {
              value: {
                platform: 'amazon',
                status: 'degraded',
                window: {
                  windowHours: 24,
                  since: 1760000000000,
                  until: 1760086400000,
                },
                providerSummaries: [
                  {
                    provider: 'rainforest',
                    source: 'third_party',
                    attemptCount: 2,
                    successCount: 0,
                    failureCount: 2,
                    successRate: 0,
                    averageDurationMs: 380,
                    latestSuccessTimestamp: null,
                    latestFailureReason: 'provider_unavailable',
                    latestConfidence: null,
                    fallbackCount: 0,
                    cacheCount: 0,
                    failureReasons: { provider_unavailable: 2 },
                    rootCauses: { quota_exhausted: 1, rate_limited: 1 },
                  },
                  {
                    provider: 'amazon-browser',
                    source: 'browser',
                    attemptCount: 1,
                    successCount: 1,
                    failureCount: 0,
                    successRate: 1,
                    averageDurationMs: 2400,
                    latestSuccessTimestamp: 1760086200000,
                    latestFailureReason: null,
                    latestConfidence: 0.65,
                    fallbackCount: 1,
                    cacheCount: 0,
                    failureReasons: {},
                    rootCauses: {},
                  },
                ],
                chainSummary: {
                  totalAttempts: 1,
                  liveSuccessCount: 1,
                  liveFailureCount: 2,
                  browserFallbackCount: 1,
                  cacheFallbackCount: 0,
                  primaryFailureCount: 2,
                  degradedPathCounts: { browser_fallback: 1 },
                  rootCauses: { quota_exhausted: 1, rate_limited: 1 },
                },
                latestAttempts: [
                  {
                    id: 'attempt-browser-1',
                    productId: 'product-1',
                    provider: 'amazon-browser',
                    source: 'browser',
                    status: 'success',
                    failureReason: null,
                    durationMs: 2400,
                    confidence: 0.65,
                    rootCause: null,
                    marketplace: null,
                    httpStatus: null,
                    fallbackType: 'browser_fallback',
                    sanitizedMessage: null,
                    timestamp: 1760086200000,
                  },
                ],
                recommendations: [
                  {
                    code: 'check_quota',
                    severity: 'warning',
                    message:
                      'Rainforest returned authorization, quota, credit, or rate-limit failures. Check provider quota and reduce acquisition frequency before retrying.',
                  },
                  {
                    code: 'reduce_fallback_reliance',
                    severity: 'warning',
                    message:
                      'Amazon acquisition is relying on browser or cache fallback. Treat these as degraded diagnostics and restore the primary provider path.',
                  },
                ],
              },
            },
            cacheFallback: {
              value: {
                platform: 'amazon',
                status: 'degraded',
                window: {
                  windowHours: 24,
                  since: 1760000000000,
                  until: 1760086400000,
                },
                providerSummaries: [],
                chainSummary: {
                  totalAttempts: 1,
                  liveSuccessCount: 0,
                  liveFailureCount: 1,
                  browserFallbackCount: 0,
                  cacheFallbackCount: 1,
                  primaryFailureCount: 1,
                  degradedPathCounts: { cache_fallback: 1 },
                  rootCauses: { cache_only: 1, network_timeout: 1 },
                },
                latestAttempts: [
                  {
                    id: 'attempt-cache-1',
                    productId: 'product-1',
                    provider: 'cache',
                    source: 'cache',
                    status: 'success',
                    failureReason: null,
                    durationMs: 4,
                    confidence: 0.45,
                    rootCause: 'cache_only',
                    marketplace: null,
                    httpStatus: null,
                    fallbackType: 'cache_fallback',
                    sanitizedMessage: null,
                    timestamp: 1760086200000,
                  },
                ],
                recommendations: [
                  {
                    code: 'reduce_fallback_reliance',
                    severity: 'warning',
                    message:
                      'Amazon acquisition is relying on browser or cache fallback. Treat these as degraded diagnostics and restore the primary provider path.',
                  },
                ],
              },
            },
            insufficientHistory: {
              value: {
                platform: 'amazon',
                status: 'insufficient_history',
                window: {
                  windowHours: 24,
                  since: 1760000000000,
                  until: 1760086400000,
                },
                providerSummaries: [],
                chainSummary: {
                  totalAttempts: 0,
                  liveSuccessCount: 0,
                  liveFailureCount: 0,
                  browserFallbackCount: 0,
                  cacheFallbackCount: 0,
                  primaryFailureCount: 0,
                  degradedPathCounts: {},
                  rootCauses: {},
                },
                latestAttempts: [],
                recommendations: [
                  {
                    code: 'refresh_stale_data',
                    severity: 'info',
                    message:
                      'No Amazon acquisition attempts were found in this window. Run a manual check to collect provider health evidence.',
                  },
                ],
              },
            },
          },
        },
      },
    },
    400: commonErrorResponses[400],
    500: commonErrorResponses[500],
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/scraper/providers/{platform}/health',
  summary: '获取平台 provider 健康摘要',
  description:
    'Aggregates recent provider attempts for a platform such as ebay or amazon. eBay Browse examples use only redacted safe diagnostics and never expose OAuth credentials, access tokens, authorization headers, or raw provider payloads.',
  tags: ['Scraper'],
  request: {
    params: z.object({
      platform: z.enum(['amazon', 'ebay', 'walmart', 'aliexpress', 'lazada', 'other']),
    }),
    query: z.object({
      windowHours: z.string().optional(),
      productId: z.string().optional(),
      provider: z.string().optional(),
    }),
  },
  responses: {
    200: {
      description: '平台 provider 健康摘要',
      content: {
        'application/json': {
          schema: providerHealthResponseSchema,
          examples: {
            ebayHealthy: {
              value: {
                platform: 'ebay',
                status: 'healthy',
                window: {
                  windowHours: 24,
                  since: 1760000000000,
                  until: 1760086400000,
                },
                providerSummaries: [
                  {
                    provider: 'ebay-browse',
                    source: 'official_api',
                    attemptCount: 3,
                    successCount: 3,
                    failureCount: 0,
                    successRate: 1,
                    averageDurationMs: 360,
                    latestSuccessTimestamp: 1760086000000,
                    latestFailureReason: null,
                    latestConfidence: 0.95,
                    fallbackCount: 0,
                    cacheCount: 0,
                    failureReasons: {},
                    rootCauses: {},
                  },
                ],
                chainSummary: {
                  totalAttempts: 3,
                  liveSuccessCount: 3,
                  liveFailureCount: 0,
                  browserFallbackCount: 0,
                  cacheFallbackCount: 0,
                  primaryFailureCount: 0,
                  degradedPathCounts: { primary_live: 3 },
                  rootCauses: {},
                },
                latestAttempts: [
                  {
                    id: 'attempt-ebay-1',
                    productId: 'ebay-product-1',
                    provider: 'ebay-browse',
                    source: 'official_api',
                    status: 'success',
                    failureReason: null,
                    durationMs: 360,
                    confidence: 0.95,
                    rootCause: null,
                    marketplace: 'EBAY_US',
                    httpStatus: 200,
                    fallbackType: 'primary_live',
                    sanitizedMessage: null,
                    timestamp: 1760086000000,
                  },
                ],
                recommendations: [],
              },
            },
            ebayDegraded: {
              value: {
                platform: 'ebay',
                status: 'degraded',
                window: {
                  windowHours: 24,
                  since: 1760000000000,
                  until: 1760086400000,
                },
                providerSummaries: [
                  {
                    provider: 'ebay-browse',
                    source: 'official_api',
                    attemptCount: 2,
                    successCount: 0,
                    failureCount: 2,
                    successRate: 0,
                    averageDurationMs: 120,
                    latestSuccessTimestamp: null,
                    latestFailureReason: 'provider_unavailable',
                    latestConfidence: null,
                    fallbackCount: 0,
                    cacheCount: 0,
                    failureReasons: {
                      provider_unavailable: 1,
                      unsupported_url: 1,
                    },
                    rootCauses: {
                      missing_credentials: 1,
                      unsupported_url: 1,
                    },
                  },
                ],
                chainSummary: {
                  totalAttempts: 2,
                  liveSuccessCount: 0,
                  liveFailureCount: 2,
                  browserFallbackCount: 0,
                  cacheFallbackCount: 0,
                  primaryFailureCount: 0,
                  degradedPathCounts: {},
                  rootCauses: {
                    missing_credentials: 1,
                    unsupported_url: 1,
                  },
                },
                latestAttempts: [
                  {
                    id: 'attempt-ebay-2',
                    productId: 'ebay-product-1',
                    provider: 'ebay-browse',
                    source: 'official_api',
                    status: 'failed',
                    failureReason: 'provider_unavailable',
                    durationMs: 120,
                    confidence: null,
                    rootCause: 'missing_credentials',
                    marketplace: 'EBAY_US',
                    httpStatus: null,
                    fallbackType: null,
                    sanitizedMessage: 'eBay Browse provider credentials are missing.',
                    timestamp: 1760086200000,
                  },
                ],
                recommendations: [
                  {
                    code: 'configure_ebay',
                    severity: 'critical',
                    message:
                      'eBay Browse provider credentials are missing. Configure EBAY_CLIENT_ID and EBAY_CLIENT_SECRET before retrying.',
                  },
                  {
                    code: 'check_ebay_item_id',
                    severity: 'warning',
                    message:
                      'eBay acquisition requires a deterministic item ID. Use a supported /itm/<id> URL or store ebayItemId metadata for the product.',
                  },
                ],
              },
            },
            ebayInsufficientHistory: {
              value: {
                platform: 'ebay',
                status: 'insufficient_history',
                window: {
                  windowHours: 24,
                  since: 1760000000000,
                  until: 1760086400000,
                },
                providerSummaries: [],
                chainSummary: {
                  totalAttempts: 0,
                  liveSuccessCount: 0,
                  liveFailureCount: 0,
                  browserFallbackCount: 0,
                  cacheFallbackCount: 0,
                  primaryFailureCount: 0,
                  degradedPathCounts: {},
                  rootCauses: {},
                },
                latestAttempts: [],
                recommendations: [
                  {
                    code: 'refresh_stale_data',
                    severity: 'info',
                    message:
                      'No ebay acquisition attempts were found in this window. Run a manual check to collect provider health evidence.',
                  },
                ],
              },
            },
          },
        },
      },
    },
    400: commonErrorResponses[400],
    500: commonErrorResponses[500],
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/scraper/jobs/{jobId}',
  summary: '获取采集任务状态',
  tags: ['Scraper'],
  request: { params: z.object({ jobId: z.string() }) },
  responses: {
    200: {
      description: '采集任务状态',
      content: { 'application/json': { schema: scrapeJobSchema } },
    },
    404: commonErrorResponses[404],
    500: commonErrorResponses[500],
  },
});

// === Analysis Routes ===
registry.registerPath({
  method: 'get',
  path: '/api/analysis/price-stats/{productId}',
  summary: '获取产品价格统计',
  tags: ['Analysis'],
  request: { params: z.object({ productId: z.string() }) },
  responses: {
    200: { description: '价格统计', content: { 'application/json': { schema: priceStatsResponseSchema } } },
    404: commonErrorResponses[404],
    500: commonErrorResponses[500],
  },
});

// === Opportunities Routes ===
registry.registerPath({
  method: 'get',
  path: '/api/opportunities/products',
  summary: '获取选品机会排行',
  tags: ['Opportunities'],
  request: { query: opportunityListQuerySchema },
  responses: {
    200: {
      description: '选品机会排行',
      content: {
        'application/json': {
          schema: opportunityListResponseSchema,
        },
      },
    },
    400: commonErrorResponses[400],
    500: commonErrorResponses[500],
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/opportunities/products/{productId}',
  summary: '获取单个产品机会评分解释',
  tags: ['Opportunities'],
  request: { params: z.object({ productId: z.string() }) },
  responses: {
    200: {
      description: '产品机会评分解释',
      content: {
        'application/json': {
          schema: productOpportunityResponseSchema,
        },
      },
    },
    404: commonErrorResponses[404],
    500: commonErrorResponses[500],
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/opportunities/research',
  summary: '获取机会研究工作台条目',
  description:
    'Returns persisted shortlist research entries. Status, tags, notes, and priority are workflow metadata only and do not affect opportunity scores.',
  tags: ['Opportunity Research'],
  request: { query: opportunityResearchListQuerySchema },
  responses: {
    200: {
      description: '机会研究工作台条目',
      content: {
        'application/json': {
          schema: z.object({
            data: z.array(opportunityResearchMetadataSchema),
            total: z.number(),
            pagination: z.object({
              page: z.number(),
              limit: z.number(),
              totalPages: z.number(),
            }),
          }),
          examples: {
            activeShortlist: {
              value: {
                data: [
                  {
                    productId: 'product-1',
                    status: 'ready',
                    priority: 'high',
                    tags: ['launch', 'margin'],
                    notes: 'Ready for supplier review.',
                    notesSummary: 'Ready for supplier review.',
                    archived: false,
                    createdAt: 1760086400000,
                    updatedAt: 1760087400000,
                  },
                ],
                total: 1,
                pagination: { page: 1, limit: 20, totalPages: 1 },
              },
            },
          },
        },
      },
    },
    400: commonErrorResponses[400],
    500: commonErrorResponses[500],
  },
});

registry.registerPath({
  method: 'put',
  path: '/api/opportunities/products/{productId}/research',
  summary: '创建或更新产品机会研究条目',
  description:
    'Creates or updates product-scoped research metadata. Research metadata is workflow state only and does not change opportunity score or factor contributions.',
  tags: ['Opportunity Research'],
  request: {
    params: z.object({ productId: z.string() }),
    body: {
      content: {
        'application/json': {
          schema: opportunityResearchUpsertSchema,
          example: {
            status: 'researching',
            priority: 'high',
            tags: ['launch', 'margin'],
            notes: 'Check supplier MOQ before marking ready.',
          },
        },
      },
    },
  },
  responses: {
    200: {
      description: '机会研究条目已保存',
      content: {
        'application/json': {
          schema: z.object({ data: opportunityResearchMetadataSchema }),
        },
      },
    },
    400: commonErrorResponses[400],
    404: commonErrorResponses[404],
    500: commonErrorResponses[500],
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/opportunities/products/{productId}/research',
  summary: '获取产品机会研究条目',
  tags: ['Opportunity Research'],
  request: { params: z.object({ productId: z.string() }) },
  responses: {
    200: {
      description: '产品机会研究条目，未加入工作台时 data 为 null',
      content: {
        'application/json': {
          schema: z.object({ data: opportunityResearchMetadataSchema.nullable() }),
          examples: {
            missingResearch: {
              value: { data: null },
            },
          },
        },
      },
    },
    404: commonErrorResponses[404],
    500: commonErrorResponses[500],
  },
});

registry.registerPath({
  method: 'patch',
  path: '/api/opportunities/products/{productId}/research',
  summary: '更新产品机会研究元数据',
  tags: ['Opportunity Research'],
  request: {
    params: z.object({ productId: z.string() }),
    body: {
      content: {
        'application/json': {
          schema: opportunityResearchUpdateSchema,
          example: {
            status: 'ready',
            priority: 'high',
            tags: ['launch', 'supplier-call'],
            notes: 'Supplier review passed. Validate landed cost next.',
          },
        },
      },
    },
  },
  responses: {
    200: {
      description: '机会研究元数据已更新',
      content: {
        'application/json': {
          schema: z.object({ data: opportunityResearchMetadataSchema }),
        },
      },
    },
    400: commonErrorResponses[400],
    404: commonErrorResponses[404],
    500: commonErrorResponses[500],
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/opportunities/products/{productId}/research/archive',
  summary: '归档产品机会研究条目',
  tags: ['Opportunity Research'],
  request: { params: z.object({ productId: z.string() }) },
  responses: {
    200: {
      description: '机会研究条目已归档',
      content: {
        'application/json': {
          schema: z.object({ data: opportunityResearchMetadataSchema }),
        },
      },
    },
    404: commonErrorResponses[404],
    500: commonErrorResponses[500],
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/opportunities/products/{productId}/research',
  summary: '删除产品机会研究条目',
  tags: ['Opportunity Research'],
  request: { params: z.object({ productId: z.string() }) },
  responses: {
    204: { description: '机会研究条目已删除' },
    404: commonErrorResponses[404],
    500: commonErrorResponses[500],
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/opportunities/research/compare',
  summary: '对比选中的选品机会',
  description:
    'Returns current opportunity snapshots plus research metadata for selected products. Research metadata is included for workflow context but does not affect score calculations.',
  tags: ['Opportunity Research'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: opportunityResearchComparisonRequestSchema,
          example: {
            productIds: ['product-1', 'product-2'],
          },
        },
      },
    },
  },
  responses: {
    200: {
      description: '选品机会对比结果',
      content: {
        'application/json': {
          schema: opportunityResearchComparisonResponseSchema,
          examples: {
            comparison: {
              value: {
                data: [],
                selectedProductIds: ['product-1', 'product-2'],
                comparedAt: 1760087400000,
                caveats: {
                  marketSignals:
                    'Market trend, rank, and review signals are proxy evidence only, not verified sales or demand facts.',
                  businessSignals:
                    'Business metrics depend on merchant-entered assumptions and are not verified margin, ROI, or profitability facts.',
                  score: opportunityResearchScoreCaveat,
                },
              },
            },
          },
        },
      },
    },
    400: commonErrorResponses[400],
    404: commonErrorResponses[404],
    500: commonErrorResponses[500],
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/opportunities/research/export',
  summary: '导出机会研究候选',
  description:
    'Exports selected or filtered opportunities as CSV or JSON rows. Every row includes caveats for proxy market signals, merchant-entered business assumptions, and non-scoring research metadata.',
  tags: ['Opportunity Research'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: opportunityResearchExportRequestSchema,
          examples: {
            selectedCsv: {
              value: {
                format: 'csv',
                productIds: ['product-1', 'product-2'],
              },
            },
            filteredJson: {
              value: {
                format: 'json',
                filters: {
                  shortlisted: true,
                  researchStatus: 'ready',
                  researchTag: 'launch',
                },
                limit: 50,
              },
            },
          },
        },
      },
    },
  },
  responses: {
    200: {
      description: '机会研究导出结果',
      content: {
        'application/json': {
          schema: opportunityResearchExportResponseSchema,
          examples: {
            exportRows: {
              value: {
                format: 'csv',
                filename: 'opportunity-research-2026-06-20T08-00-00-000Z.csv',
                rows: [
                  {
                    productId: 'product-1',
                    title: 'Example Product',
                    platform: 'amazon',
                    category: 'electronics',
                    currentPrice: 49.99,
                    currency: 'USD',
                    score: 82.4,
                    confidence: 0.72,
                    recommendation: 'investigate',
                    researchStatus: 'ready',
                    researchPriority: 'high',
                    researchTags: ['launch'],
                    researchNotesSummary: 'Ready for supplier review.',
                    topReasons: ['Current price is below average.'],
                    missingSignals: ['sales_volume', 'demand'],
                    marketSignalCaveat:
                      'Keepa market signals are historical trend and proxy evidence, not verified sales, demand, margin, ROI, or profitability facts.',
                    businessSignalCaveat:
                      'Business metrics require merchant-provided assumptions and are not verified profitability facts.',
                    scoreCaveat: opportunityResearchScoreCaveat,
                  },
                ],
                csv: 'productId,title,platform\\n"product-1","Example Product","amazon"',
                caveat: opportunityResearchScoreCaveat,
              },
            },
          },
        },
      },
    },
    400: commonErrorResponses[400],
    404: commonErrorResponses[404],
    500: commonErrorResponses[500],
  },
});

// === Chat Routes ===
// POST /api/chat/sessions
registry.registerPath({
  method: 'post',
  path: '/api/chat/sessions',
  summary: '创建聊天会话',
  tags: ['Chat'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: createChatSessionSchema,
          example: {
            title: 'New Chat',
            userId: 'user123'
          }
        }
      }
    }
  },
  responses: {
    201: { description: '会话创建成功', content: { 'application/json': { schema: chatSessionResponseSchema } } },
    400: commonErrorResponses[400],
    500: commonErrorResponses[500],
  },
});

// GET /api/chat/sessions
registry.registerPath({
  method: 'get',
  path: '/api/chat/sessions',
  summary: '获取聊天会话列表',
  tags: ['Chat'],
  request: {
    query: z.object({
      page: z.string().optional(),
      limit: z.string().optional(),
    }),
  },
  responses: {
    200: {
      description: '会话列表',
      content: {
        'application/json': {
          schema: z.object({
            sessions: z.array(chatSessionResponseSchema),
            page: z.number(),
            limit: z.number(),
          })
        }
      }
    },
    500: commonErrorResponses[500],
  },
});

// GET /api/chat/sessions/:id
registry.registerPath({
  method: 'get',
  path: '/api/chat/sessions/{id}',
  summary: '获取聊天会话详情',
  tags: ['Chat'],
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: { description: '会话详情', content: { 'application/json': { schema: chatSessionResponseSchema } } },
    404: commonErrorResponses[404],
    500: commonErrorResponses[500],
  },
});

// PATCH /api/chat/sessions/:id
registry.registerPath({
  method: 'patch',
  path: '/api/chat/sessions/{id}',
  summary: '更新聊天会话',
  tags: ['Chat'],
  request: {
    params: z.object({ id: z.string() }),
    body: { content: { 'application/json': { schema: updateChatSessionSchema } } },
  },
  responses: {
    200: { description: '更新成功', content: { 'application/json': { schema: chatSessionResponseSchema } } },
    404: commonErrorResponses[404],
    500: commonErrorResponses[500],
  },
});

// DELETE /api/chat/sessions/:id
registry.registerPath({
  method: 'delete',
  path: '/api/chat/sessions/{id}',
  summary: '删除聊天会话',
  tags: ['Chat'],
  request: { params: z.object({ id: z.string() }) },
  responses: {
    204: { description: '删除成功' },
    404: commonErrorResponses[404],
    500: commonErrorResponses[500],
  },
});

// GET /api/chat/sessions/:id/messages
registry.registerPath({
  method: 'get',
  path: '/api/chat/sessions/{id}/messages',
  summary: '获取会话消息列表',
  tags: ['Chat'],
  request: {
    params: z.object({ id: z.string() }),
    query: z.object({
      limit: z.string().optional(),
    }),
  },
  responses: {
    200: {
      description: '消息列表',
      content: {
        'application/json': {
          schema: z.object({
            messages: z.array(chatMessageResponseSchema)
          })
        }
      }
    },
    404: commonErrorResponses[404],
    500: commonErrorResponses[500],
  },
});

// POST /api/chat/sessions/:id/messages
registry.registerPath({
  method: 'post',
  path: '/api/chat/sessions/{id}/messages',
  summary: '发送消息（非流式）',
  tags: ['Chat'],
  request: {
    params: z.object({ id: z.string() }),
    body: {
      content: {
        'application/json': {
          schema: sendMessageSchema,
          example: {
            content: 'Hello, how can you help me?'
          }
        }
      }
    },
  },
  responses: {
    200: { description: '消息发送成功', content: { 'application/json': { schema: chatMessageResponseSchema } } },
    400: commonErrorResponses[400],
    404: commonErrorResponses[404],
    500: commonErrorResponses[500],
  },
});

// POST /api/chat/sessions/:id/stream
registry.registerPath({
  method: 'post',
  path: '/api/chat/sessions/{id}/stream',
  summary: '发送消息（流式响应 SSE）',
  tags: ['Chat'],
  request: {
    params: z.object({ id: z.string() }),
    body: {
      content: {
        'application/json': {
          schema: sendMessageSchema
        }
      }
    },
  },
  responses: {
    200: {
      description: '流式响应 (Server-Sent Events)',
      content: {
        'text/event-stream': {
          schema: z.object({
            type: z.string(),
            content: z.string().optional(),
            error: z.string().optional(),
          })
        }
      }
    },
    400: commonErrorResponses[400],
    404: commonErrorResponses[404],
    500: commonErrorResponses[500],
  },
});

// Generate OpenAPI specification
export function generateOpenApiSpec() {
  const generator = new OpenApiGeneratorV3(registry.definitions);

  return generator.generateDocument({
    openapi: '3.0.0',
    info: {
      title: 'Price Monitor API',
      version: '1.0.0',
      description: `价格监控系统 API 文档

## 版本历史
- v1.0.0 (2026-06-14): 初始版本
  - 产品管理 (CRUD)
  - 告警系统 (告警和规则)
  - 价格快照记录
  - 价格分析统计
  - 爬虫功能
  - AI 对话功能

## 认证
当前版本暂未实现认证，所有接口均为公开访问。

## 错误码
- 400: 请求参数错误或验证失败
- 401: 未授权访问
- 404: 资源未找到
- 500: 服务器内部错误`,
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:3001',
        description: 'Development server',
      },
    ],
    tags: [
      { name: 'Products', description: '产品管理相关接口 - 添加、查询、更新、删除监控产品' },
      { name: 'Alerts', description: '告警通知相关接口 - 查看和管理价格告警' },
      { name: 'Alert Rules', description: '告警规则配置接口 - 配置价格监控规则' },
      { name: 'Price Snapshots', description: '价格快照记录接口 - 历史价格数据查询' },
      { name: 'Scraper', description: '价格爬取接口 - 手动触发价格更新' },
      { name: 'Market Signals', description: '市场趋势信号接口 - Keepa 历史趋势、刷新、历史和健康摘要' },
      { name: 'Analysis', description: '价格分析统计接口 - 价格趋势和统计数据' },
      { name: 'Opportunities', description: '选品机会评分接口 - 商品机会排行和评分解释' },
      { name: 'Opportunity Research', description: '机会研究工作台接口 - shortlist、状态、对比和导出' },
      { name: 'Chat', description: 'AI 对话接口 - 智能助手会话管理' },
    ],
  });
}

export { registry };
