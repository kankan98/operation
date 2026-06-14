import { OpenAPIRegistry, OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import {
  createProductSchema,
  productResponseSchema,
  updateProductSchema,
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
registry.register('ChatSession', chatSessionResponseSchema);
registry.register('CreateChatSession', createChatSessionSchema);
registry.register('UpdateChatSession', updateChatSessionSchema);
registry.register('ChatMessage', chatMessageResponseSchema);
registry.register('SendMessage', sendMessageSchema);

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
  method: 'post',
  path: '/api/scraper/product/{productId}',
  summary: '手动爬取单个产品',
  tags: ['Scraper'],
  request: { params: z.object({ productId: z.string() }) },
  responses: {
    200: { description: '爬取成功', content: { 'application/json': { schema: scrapeResultSchema } } },
    500: { description: '爬取失败' },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/scraper/all',
  summary: '手动爬取所有监控产品',
  tags: ['Scraper'],
  responses: {
    200: { description: '批量爬取完成', content: { 'application/json': { schema: scrapeAllResultsSchema } } },
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
      { name: 'Analysis', description: '价格分析统计接口 - 价格趋势和统计数据' },
      { name: 'Chat', description: 'AI 对话接口 - 智能助手会话管理' },
    ],
  });
}

export { registry };
