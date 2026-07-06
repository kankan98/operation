import { ClaudeToolDefinition } from '../types/chat';
import { ProductService } from './productService';
import { AlertService } from './alertService';
import { AlertRuleService } from './alertRuleService';
import { PriceAnalysisService } from './priceAnalysisService';
import { ScraperService } from './scraperService';
import {
  MarketSignalProviderHealthResult,
  MarketSignalSnapshot,
  OpportunityListFilters,
  ProductOpportunity,
  ScrapeAttempt,
  Product,
} from '../types';
import { OpportunityScoringService } from './opportunityScoringService';
import { MarketSignalHealthService } from './marketSignalHealthService';
import { MarketSignalSnapshotService } from './marketSignalSnapshotService';
import { logger } from '../utils/logger';
import {
  sanitizeProviderDiagnostics,
  sanitizeUrl,
} from '../utils/providerDiagnostics';
import { ACQUISITION_QUEUE_CAVEAT } from '@shared/schemas';
import { getCachedProducts, setCachedProducts } from './productCache';
import { createProductSchema } from '../schemas/product.schema';

const productService = new ProductService();
const alertService = new AlertService();
const alertRuleService = new AlertRuleService();
const priceAnalysisService = new PriceAnalysisService();
const scraperService = new ScraperService();
const opportunityScoringService = new OpportunityScoringService();
const marketSignalSnapshotService = new MarketSignalSnapshotService();
const marketSignalHealthService = new MarketSignalHealthService();
const MARKET_SIGNAL_CAVEAT =
  'Keepa market signals are historical trend and proxy evidence, not verified sales, demand, margin, ROI, or profitability facts.';
const SUPPORTED_PRODUCT_PLATFORMS = ['amazon', 'walmart', 'aliexpress', 'ebay', 'other'] as const;

function parseSupportedPlatform(value: unknown, required = false) {
  if (typeof value !== 'string' || value.trim() === '') {
    if (required) {
      throw new Error(
        `Unsupported platform. Supported platforms: ${SUPPORTED_PRODUCT_PLATFORMS.join(', ')}`
      );
    }
    return undefined;
  }

  const normalized = value.trim().toLowerCase();
  if (!SUPPORTED_PRODUCT_PLATFORMS.includes(normalized as typeof SUPPORTED_PRODUCT_PLATFORMS[number])) {
    throw new Error(
      `Unsupported platform "${value}". Supported platforms: ${SUPPORTED_PRODUCT_PLATFORMS.join(', ')}`
    );
  }

  return normalized as typeof SUPPORTED_PRODUCT_PLATFORMS[number];
}

/**
 * Fetch all products through the paginated service API.
 * Tools filter/aggregate client-side, so we pull a large page in one call.
 * Task 3.4: 添加 JSDoc 类型注解说明字段要求
 * @returns Promise<Product[]> - 完整的产品对象数组，包含所有必需字段
 */
async function getAllProducts(): Promise<Product[]> {
  // 缓存键置于 products: 命名空间下，使 productService 变更时的
  // invalidateByPattern('products:*') 能正确失效本缓存（Task 4.4）
  const cacheKey = 'products:all';

  // Check cache first
  const cached = getCachedProducts(cacheKey);
  if (cached) {
    return cached as Product[];
  }

  // Task 3.1: 扩展 fields 数组以包含所有被访问的字段
  // 代码中访问：updatedAt (排序/时间过滤), asin (竞品查找), productUrl (去重检测)
  const { data } = await productService.listProducts({
    limit: 100,
    fields: [
      'id',
      'title',
      'platform',
      'currentPrice',
      'currency',
      'brand',
      'category',
      'isMonitoring',
      'updatedAt',  // Task 3.1: 用于排序和时间过滤
      'asin',       // Task 3.1: 用于竞品查找
      'productUrl', // Task 3.1: 用于重复检测
      'imageUrl',   // 用于展示
      'metadata',   // 用于业务假设
    ]
  });

  // Cache the result
  setCachedProducts(cacheKey, data);

  return data;
}

/**
 * Tool Definitions for Claude Agent
 * Following Anthropic's tool use format
 */

export const AGENT_TOOLS: ClaudeToolDefinition[] = [
  // 1. searchProducts
  {
    name: 'searchProducts',
    description: 'Search for products in the monitoring system by keyword, platform, or price range. Returns a list of matching products.',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search keyword to match against product title or brand',
        },
        platform: {
          type: 'string',
          enum: ['amazon', 'walmart', 'aliexpress', 'ebay', 'other'],
          description: 'Filter by specific platform',
        },
        maxPrice: {
          type: 'number',
          description: 'Maximum price filter (inclusive)',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results to return (default: 10)',
        },
      },
      required: ['query'],
    },
  },

  // 2. getProductDetails
  {
    name: 'getProductDetails',
    description: 'Get detailed information about a specific product including current price, monitoring status, and optionally price history.',
    input_schema: {
      type: 'object',
      properties: {
        productId: {
          type: 'string',
          description: 'The unique ID of the product',
        },
        includeHistory: {
          type: 'boolean',
          description: 'Whether to include last 30 price snapshots (default: false)',
        },
      },
      required: ['productId'],
    },
  },

  // 3. analyzePriceTrend
  {
    name: 'analyzePriceTrend',
    description: 'Analyze price trends for a product. Returns statistics including current, highest, lowest, average price, and price change percentage.',
    input_schema: {
      type: 'object',
      properties: {
        productId: {
          type: 'string',
          description: 'The unique ID of the product to analyze',
        },
      },
      required: ['productId'],
    },
  },

  // 4. createAlert
  {
    name: 'createAlert',
    description: 'Create a price alert rule for a product. The rule will automatically trigger alerts when conditions are met.',
    input_schema: {
      type: 'object',
      properties: {
        productId: {
          type: 'string',
          description: 'The unique ID of the product to monitor',
        },
        ruleType: {
          type: 'string',
          enum: ['price_threshold', 'price_change_percent', 'stock_change'],
          description: 'Type of alert rule',
        },
        condition: {
          type: 'string',
          enum: ['below', 'above', 'increase', 'decrease'],
          description: 'Condition to trigger the alert',
        },
        threshold: {
          type: 'number',
          description: 'Threshold value (price for price_threshold, percentage for price_change_percent)',
        },
        severity: {
          type: 'string',
          enum: ['info', 'warning', 'critical'],
          description: 'Severity level of the alert (default: info)',
        },
      },
      required: ['productId', 'ruleType', 'condition', 'threshold'],
    },
  },

  // 5. getAlertsList
  {
    name: 'getAlertsList',
    description: 'Get list of recent alerts with optional filters for severity and read status.',
    input_schema: {
      type: 'object',
      properties: {
        unreadOnly: {
          type: 'boolean',
          description: 'Only return unread alerts (default: false)',
        },
        severity: {
          type: 'string',
          enum: ['info', 'warning', 'critical'],
          description: 'Filter by severity level',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of alerts to return (default: 20)',
        },
      },
    },
  },

  // 6. addProductMonitoring
  {
    name: 'addProductMonitoring',
    description: 'Add a new product to the monitoring system by providing its URL and platform.',
    input_schema: {
      type: 'object',
      properties: {
        platform: {
          type: 'string',
          enum: ['amazon', 'walmart', 'aliexpress', 'ebay', 'other'],
          description: 'E-commerce platform',
        },
        productUrl: {
          type: 'string',
          description: 'Full URL of the product page',
        },
        title: {
          type: 'string',
          description: 'Product title',
        },
        asin: {
          type: 'string',
          description: 'ASIN or product identifier. Required for non-Amazon products.',
        },
        productIdentifier: {
          type: 'string',
          description: 'Alias for ASIN/Product ID. Required for non-Amazon products.',
        },
        checkInterval: {
          type: 'number',
          description: 'Check interval in hours (default: 24)',
        },
      },
      required: ['platform', 'productUrl', 'title'],
    },
  },

  // 7. getCompetitorAnalysis
  {
    name: 'getCompetitorAnalysis',
    description: 'Compare the same product across different platforms using ASIN or product identifier.',
    input_schema: {
      type: 'object',
      properties: {
        asin: {
          type: 'string',
          description: 'Amazon ASIN or product identifier to find across platforms',
        },
      },
      required: ['asin'],
    },
  },

  // 8. getMarketInsights
  {
    name: 'getMarketInsights',
    description: 'Get market-level insights including platform distribution, average prices, and recent price drop trends.',
    input_schema: {
      type: 'object',
      properties: {},
    },
  },

  // 9. queryDatabase
  {
    name: 'queryDatabase',
    description: 'Query the database for specific information like product counts, monitoring status, or recent activity.',
    input_schema: {
      type: 'object',
      properties: {
        queryType: {
          type: 'string',
          enum: ['count_by_status', 'recent_updates', 'monitoring_summary'],
          description: 'Type of database query to perform',
        },
        timeRange: {
          type: 'number',
          description: 'Time range in hours for recent_updates query (default: 24)',
        },
      },
      required: ['queryType'],
    },
  },

  // 10. generateReport
  {
    name: 'generateReport',
    description: 'Generate a summary report for daily activity or detailed product analysis.',
    input_schema: {
      type: 'object',
      properties: {
        reportType: {
          type: 'string',
          enum: ['daily', 'product'],
          description: 'Type of report to generate',
        },
        productId: {
          type: 'string',
          description: 'Product ID (required for product report)',
        },
      },
      required: ['reportType'],
    },
  },

  // 11. getProductAcquisitionStatus
  {
    name: 'getProductAcquisitionStatus',
    description:
      'Explain the latest product data acquisition status using scrape attempts, job state, and Keepa market-signal status when available. This is read-only and does not trigger a new acquisition.',
    input_schema: {
      type: 'object',
      properties: {
        productId: {
          type: 'string',
          description: 'The unique ID of the product',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of recent attempts to include (default: 5)',
        },
      },
      required: ['productId'],
    },
  },

  // 12. getAcquisitionQueueHealth
  {
    name: 'getAcquisitionQueueHealth',
    description:
      'Read-only explanation of acquisition queue health, worker heartbeat, backlog, stale leases, provider gates, and remediation. This does not retry, cancel, reprioritize, or enqueue jobs, and queue health is not opportunity, demand, sales, margin, ROI, or profitability evidence.',
    input_schema: {
      type: 'object',
      properties: {
        platform: {
          type: 'string',
          enum: ['amazon', 'walmart', 'aliexpress', 'ebay', 'other'],
          description: 'Optional platform filter',
        },
        provider: {
          type: 'string',
          description: 'Optional provider filter such as rainforest, amazon-browser, or ebay-browse',
        },
      },
    },
  },

  // 13. getProductJobDiagnostics
  {
    name: 'getProductJobDiagnostics',
    description:
      'Read-only diagnosis for why a product acquisition job is pending, delayed, retrying, failed, cancelled, rate-limited, or blocked by worker/provider state. This does not trigger a hidden refresh or mutate queue jobs.',
    input_schema: {
      type: 'object',
      properties: {
        productId: {
          type: 'string',
          description: 'The unique ID of the product',
        },
      },
      required: ['productId'],
    },
  },

  // 14. checkProductNow
  {
    name: 'checkProductNow',
    description:
      'Explicitly trigger product data acquisition now and return the resulting job, attempt, provider, and status.',
    input_schema: {
      type: 'object',
      properties: {
        productId: {
          type: 'string',
          description: 'The unique ID of the product to check now',
        },
      },
      required: ['productId'],
    },
  },

  // 15. getProductOpportunities
  {
    name: 'getProductOpportunities',
    description:
      'Rank monitored products by opportunity score using available price history, acquisition health, Keepa market trend proxy signals, review proxy, availability, monitoring, and merchant-provided business assumptions. Includes caveats when profit, sales volume, or demand cannot be verified.',
    input_schema: {
      type: 'object',
      properties: {
        platform: {
          type: 'string',
          enum: ['amazon', 'walmart', 'ebay', 'aliexpress', 'other'],
          description: 'Filter by platform',
        },
        category: {
          type: 'string',
          description: 'Filter by exact product category',
        },
        monitoring: {
          type: 'boolean',
          description: 'Filter by monitoring status',
        },
        minScore: {
          type: 'number',
          description: 'Minimum opportunity score from 0 to 100',
        },
        minRoi: {
          type: 'number',
          description:
            'Minimum assumption-based ROI. Only products with complete business metrics can match.',
        },
        businessReadiness: {
          type: 'string',
          enum: ['any', 'none', 'partial', 'complete'],
          description: 'Filter by business assumption completeness',
        },
        recommendation: {
          type: 'string',
          enum: ['watch', 'investigate', 'check_data', 'ignore'],
          description: 'Filter by recommended action',
        },
        sortBy: {
          type: 'string',
          enum: ['score', 'confidence'],
          description: 'Sort field (default: score)',
        },
        sortOrder: {
          type: 'string',
          enum: ['asc', 'desc'],
          description: 'Sort direction (default: desc)',
        },
        page: {
          type: 'number',
          description: 'Page number (default: 1)',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of opportunities to return (default: 10)',
        },
      },
    },
  },

  // 16. explainProductOpportunity
  {
    name: 'explainProductOpportunity',
    description:
      'Explain one product opportunity score with confidence, recommendation, factor breakdown, missing signals, acquisition health, Keepa market trend proxy signals, and assumption-based business metrics.',
    input_schema: {
      type: 'object',
      properties: {
        productId: {
          type: 'string',
          description: 'The unique ID of the product',
        },
      },
      required: ['productId'],
    },
  },

  // 17. getOpportunityResearchStatus
  {
    name: 'getOpportunityResearchStatus',
    description:
      'Read one product opportunity research workspace status, priority, tags, notes summary, score, recommendation, and caveats. This is read-only and must not save, tag, archive, or mutate research state.',
    input_schema: {
      type: 'object',
      properties: {
        productId: {
          type: 'string',
          description: 'The unique ID of the product',
        },
      },
      required: ['productId'],
    },
  },

  // 18. listShortlistedOpportunities
  {
    name: 'listShortlistedOpportunities',
    description:
      'List non-archived shortlisted opportunity candidates with score, recommendation, research status, priority, tags, key caveats, and optional status/tag filters. This is read-only.',
    input_schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['researching', 'watching', 'ready', 'rejected'],
          description: 'Filter shortlist by research status',
        },
        tag: {
          type: 'string',
          description: 'Filter shortlist by normalized research tag',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of shortlisted opportunities to return (default: 10)',
        },
      },
    },
  },
];

/**
 * Tool Execution Functions
 */

export async function executeToolWithParams(
  toolName: string,
  params: Record<string, unknown>
): Promise<unknown> {
  const startTime = Date.now();

  try {
    logger.info({ toolName, params }, 'Executing tool');

    let result: unknown;

    switch (toolName) {
      case 'searchProducts':
        result = await executeSearchProducts(params);
        break;
      case 'getProductDetails':
        result = await executeGetProductDetails(params);
        break;
      case 'analyzePriceTrend':
        result = await executeAnalyzePriceTrend(params);
        break;
      case 'createAlert':
        result = await executeCreateAlert(params);
        break;
      case 'getAlertsList':
        result = await executeGetAlertsList(params);
        break;
      case 'addProductMonitoring':
        result = await executeAddProductMonitoring(params);
        break;
      case 'getCompetitorAnalysis':
        result = await executeGetCompetitorAnalysis(params);
        break;
      case 'getMarketInsights':
        logger.info('Executing getMarketInsights...');
        result = await executeGetMarketInsights(params);
        logger.info({ result }, 'getMarketInsights completed');
        break;
      case 'queryDatabase':
        logger.info('Executing queryDatabase...');
        result = await executeQueryDatabase(params);
        logger.info({ result }, 'queryDatabase completed');
        break;
      case 'generateReport':
        result = await executeGenerateReport(params);
        break;
      case 'getProductAcquisitionStatus':
        result = await executeGetProductAcquisitionStatus(params);
        break;
      case 'getAcquisitionQueueHealth':
        result = await executeGetAcquisitionQueueHealth(params);
        break;
      case 'getProductJobDiagnostics':
        result = await executeGetProductJobDiagnostics(params);
        break;
      case 'checkProductNow':
        result = await executeCheckProductNow(params);
        break;
      case 'getProductOpportunities':
        result = await executeGetProductOpportunities(params);
        break;
      case 'explainProductOpportunity':
        result = await executeExplainProductOpportunity(params);
        break;
      case 'getOpportunityResearchStatus':
        result = await executeGetOpportunityResearchStatus(params);
        break;
      case 'listShortlistedOpportunities':
        result = await executeListShortlistedOpportunities(params);
        break;
      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }

    const duration = Date.now() - startTime;
    logger.info({ toolName, duration, resultSize: JSON.stringify(result).length }, 'Tool execution successful');

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error({ toolName, params, error, duration }, 'Tool execution failed');
    throw error;
  }
}

// Tool execution implementations (to be continued in next chunk)
async function executeSearchProducts(params: Record<string, unknown>) {
  const query = typeof params.query === 'string' ? params.query : undefined;
  const platform = parseSupportedPlatform(params.platform);
  const maxPrice = typeof params.maxPrice === 'number' ? params.maxPrice : undefined;
  const limit = typeof params.limit === 'number' ? params.limit : 10;

  const allProducts = await getAllProducts();

  let filtered = allProducts.filter(p => {
    const matchesQuery = query
      ? p.title.toLowerCase().includes(query.toLowerCase()) ||
        (p.brand && p.brand.toLowerCase().includes(query.toLowerCase()))
      : true;

    const matchesPlatform = platform ? p.platform === platform : true;
    const matchesPrice = maxPrice ? (p.currentPrice || 0) <= maxPrice : true;

    return matchesQuery && matchesPlatform && matchesPrice;
  });

  // Sort by most recently updated
  filtered.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

  // Limit results
  filtered = filtered.slice(0, limit);

  return {
    count: filtered.length,
    products: filtered.map(p => ({
      id: p.id,
      title: p.title,
      platform: p.platform,
      currentPrice: p.currentPrice,
      currency: p.currency,
      isMonitoring: p.isMonitoring,
      lastCheckedAt: p.lastCheckedAt,
    })),
  };
}

async function executeGetProductDetails(params: Record<string, unknown>) {
  const productId = typeof params.productId === 'string' ? params.productId : '';
  const includeHistory = params.includeHistory === true;

  const product = await productService.getProductById(productId);
  if (!product) {
    throw new Error(`Product not found: ${productId}`);
  }

  const result: { product: typeof product; priceHistory?: unknown } = { product };

  if (includeHistory) {
    const history = await priceAnalysisService.getPriceHistory(productId, 30);
    result.priceHistory = history;
  }

  return result;
}

async function executeAnalyzePriceTrend(params: Record<string, unknown>) {
  const productId = typeof params.productId === 'string' ? params.productId : '';

  const stats = await priceAnalysisService.getPriceStats(productId);
  if (!stats) {
    throw new Error(`Insufficient price data for product: ${productId}`);
  }

  // Determine trend direction
  const trend = stats.priceChangePercent < -5 ? 'falling' :
                stats.priceChangePercent > 5 ? 'rising' : 'stable';

  return {
    ...stats,
    trend,
  };
}

async function executeCreateAlert(params: Record<string, unknown>) {
  const productId = typeof params.productId === 'string' ? params.productId : '';
  const ruleType = typeof params.ruleType === 'string' ? params.ruleType as 'price_threshold' | 'price_change_percent' | 'stock_change' : 'price_threshold';
  const condition = typeof params.condition === 'string' ? params.condition as 'below' | 'above' | 'increase' | 'decrease' : 'below';
  const threshold = typeof params.threshold === 'number' ? params.threshold : 0;
  const severity = typeof params.severity === 'string' ? params.severity as 'info' | 'warning' | 'critical' : 'info';

  // Verify product exists
  const product = await productService.getProductById(productId);
  if (!product) {
    throw new Error(`Product not found: ${productId}`);
  }

  const rule = await alertRuleService.createRule({
    productId,
    ruleType,
    condition,
    threshold,
    severity,
  });

  return {
    success: true,
    ruleId: rule.id,
    message: `Alert rule created successfully for product: ${product.title}`,
  };
}

async function executeGetAlertsList(params: Record<string, unknown>) {
  const unreadOnly = params.unreadOnly === true;
  const severity = typeof params.severity === 'string' ? params.severity : undefined;
  const limit = typeof params.limit === 'number' ? params.limit : 20;

  const { data: limited } = await alertService.listAlerts({
    unreadOnly: unreadOnly || undefined,
    severity,
    limit,
  });

  return {
    count: limited.length,
    alerts: limited,
  };
}

async function executeAddProductMonitoring(params: Record<string, unknown>) {
  const platform = parseSupportedPlatform(params.platform, true);
  const productUrl = typeof params.productUrl === 'string' ? params.productUrl.trim() : '';
  const title = typeof params.title === 'string' ? params.title.trim() : '';
  const checkInterval = typeof params.checkInterval === 'number' ? params.checkInterval : 24;
  const explicitIdentifier =
    typeof params.asin === 'string' && params.asin.trim()
      ? params.asin.trim()
      : typeof params.productIdentifier === 'string' && params.productIdentifier.trim()
        ? params.productIdentifier.trim()
        : '';

  // Validate URL format (basic check)
  try {
    new URL(productUrl);
  } catch {
    throw new Error('Invalid product URL format for specified platform');
  }

  // Extract ASIN from Amazon URLs when Chat does not pass it explicitly.
  const amazonIdentifier =
    platform === 'amazon'
      ? productUrl.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})/i)?.[1]?.toUpperCase() ?? ''
      : '';
  const asin = explicitIdentifier || amazonIdentifier;
  if (!asin) {
    throw new Error('ASIN/Product ID is required for product monitoring');
  }

  const parsedProduct = createProductSchema.safeParse({
    platform,
    productUrl,
    asin,
    title,
    currency: 'USD',
    isMonitoring: true,
    checkInterval,
  });
  if (!parsedProduct.success) {
    const details = parsedProduct.error.issues
      .map((issue) => `${issue.path.join('.') || 'product'}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid product monitoring data: ${details}`);
  }

  // Check for duplicates
  const existing = await getAllProducts();
  const duplicate = existing.find(p => p.productUrl === productUrl);
  if (duplicate) {
    throw new Error('Product already being monitored');
  }

  const product = await productService.createProduct(parsedProduct.data);

  return {
    success: true,
    productId: product.id,
    message: `Product added to monitoring: ${title}`,
  };
}

async function executeGetCompetitorAnalysis(params: Record<string, unknown>) {
  const asin = typeof params.asin === 'string' ? params.asin : '';

  const allProducts = await getAllProducts();
  const competitors = allProducts.filter(p => p.asin === asin);

  if (competitors.length === 0) {
    return {
      message: `No competitors found for ASIN: ${asin}`,
      competitors: [],
    };
  }

  // Sort by price
  competitors.sort((a, b) => (a.currentPrice || 0) - (b.currentPrice || 0));

  const cheapest = competitors[0];
  const mostExpensive = competitors[competitors.length - 1];
  const priceDiff = (mostExpensive.currentPrice || 0) - (cheapest.currentPrice || 0);

  return {
    asin,
    competitorCount: competitors.length,
    cheapestPlatform: cheapest.platform,
    cheapestPrice: cheapest.currentPrice,
    mostExpensivePlatform: mostExpensive.platform,
    mostExpensivePrice: mostExpensive.currentPrice,
    priceDifference: priceDiff,
    competitors: competitors.map(c => ({
      platform: c.platform,
      price: c.currentPrice,
      currency: c.currency,
      url: c.productUrl,
    })),
  };
}

async function executeGetMarketInsights(_params: Record<string, unknown>) {
  const allProducts = await getAllProducts();

  // Platform distribution
  const platformCounts: Record<string, number> = {};
  const platformPrices: Record<string, number[]> = {};

  allProducts.forEach(p => {
    platformCounts[p.platform] = (platformCounts[p.platform] || 0) + 1;
    if (p.currentPrice) {
      if (!platformPrices[p.platform]) platformPrices[p.platform] = [];
      platformPrices[p.platform].push(p.currentPrice);
    }
  });

  // Calculate average prices by platform
  const avgPricesByPlatform: Record<string, number> = {};
  for (const [platform, prices] of Object.entries(platformPrices)) {
    const avg = prices.reduce((sum, p) => sum + p, 0) / prices.length;
    avgPricesByPlatform[platform] = Math.round(avg * 100) / 100;
  }

  // Find recent price drops (>10%)
  // ✅ 限制只分析前 20 个产品，避免超时
  const recentDrops = [];
  const productsToAnalyze = allProducts.slice(0, 20);

  logger.info({
    totalProducts: allProducts.length,
    analyzing: productsToAnalyze.length
  }, 'executeGetMarketInsights: analyzing subset for price drops');

  for (const product of productsToAnalyze) {
    try {
      const stats = await priceAnalysisService.getPriceStats(product.id);
      if (stats && stats.priceChangePercent < -10) {
        recentDrops.push({
          productId: product.id,
          title: product.title,
          platform: product.platform,
          priceChange: stats.priceChangePercent,
        });
      }
    } catch {
      // Skip products with insufficient data
    }
  }

  return {
    totalProducts: allProducts.length,
    platformDistribution: platformCounts,
    averagePriceByPlatform: avgPricesByPlatform,
    recentPriceDrops: recentDrops.slice(0, 10),
    note: `Analyzed ${productsToAnalyze.length} of ${allProducts.length} products for price drops`,
  };
}

async function executeQueryDatabase(params: Record<string, unknown>) {
  const queryType = typeof params.queryType === 'string' ? params.queryType : 'count_by_status';
  const timeRange = typeof params.timeRange === 'number' ? params.timeRange : 24;

  const allProducts = await getAllProducts();

  switch (queryType) {
    case 'count_by_status': {
      const monitoring = allProducts.filter(p => p.isMonitoring).length;
      const inactive = allProducts.filter(p => !p.isMonitoring).length;
      return {
        total: allProducts.length,
        monitoring,
        inactive,
      };
    }

    case 'recent_updates': {
      const cutoff = Date.now() - (timeRange * 60 * 60 * 1000);
      const recent = allProducts.filter(p => (p.updatedAt || 0) > cutoff);
      return {
        timeRange: `${timeRange} hours`,
        count: recent.length,
        products: recent.map(p => ({
          id: p.id,
          title: p.title,
          updatedAt: p.updatedAt,
        })),
      };
    }

    case 'monitoring_summary': {
      const monitoring = allProducts.filter(p => p.isMonitoring);
      const byPlatform: Record<string, number> = {};
      monitoring.forEach(p => {
        byPlatform[p.platform] = (byPlatform[p.platform] || 0) + 1;
      });
      return {
        totalMonitoring: monitoring.length,
        byPlatform,
      };
    }

    default:
      throw new Error(`Unknown query type: ${queryType}`);
  }
}

async function executeGenerateReport(params: Record<string, unknown>) {
  const reportType = typeof params.reportType === 'string' ? params.reportType : 'daily';
  const productId = typeof params.productId === 'string' ? params.productId : undefined;

  if (reportType === 'daily') {
    const cutoff = Date.now() - (24 * 60 * 60 * 1000);
    const allProducts = await getAllProducts();
    const recentUpdates = allProducts.filter(p => (p.updatedAt || 0) > cutoff);

    const { data: alerts } = await alertService.listAlerts({ limit: 1000 });
    const recentAlerts = alerts.filter(a => a.createdAt > cutoff);

    const monitoring = allProducts.filter(p => p.isMonitoring).length;

    return {
      reportType: 'daily',
      date: new Date().toISOString().split('T')[0],
      summary: {
        totalProducts: allProducts.length,
        activeMonitoring: monitoring,
        productsUpdated: recentUpdates.length,
        alertsTriggered: recentAlerts.length,
      },
      recentAlerts: recentAlerts.slice(0, 10).map(a => ({
        title: a.title,
        severity: a.severity,
        createdAt: a.createdAt,
      })),
    };
  }

  if (reportType === 'product') {
    if (!productId) {
      throw new Error('productId is required for product report');
    }

    const product = await productService.getProductById(productId);
    if (!product) {
      throw new Error(`Product not found: ${productId}`);
    }

    const stats = await priceAnalysisService.getPriceStats(productId);
    const history = await priceAnalysisService.getPriceHistory(productId, 30);

    return {
      reportType: 'product',
      product: {
        id: product.id,
        title: product.title,
        platform: product.platform,
        currentPrice: product.currentPrice,
        currency: product.currency,
      },
      priceStats: stats,
      priceHistoryDays: 30,
      priceHistoryPoints: history.length,
      chartData: history.map(h => ({
        timestamp: h.timestamp,
        price: h.price,
      })),
    };
  }

  throw new Error(`Unknown report type: ${reportType}`);
}

async function executeGetProductAcquisitionStatus(
  params: Record<string, unknown>
) {
  const productId = typeof params.productId === 'string' ? params.productId : '';
  const limit = typeof params.limit === 'number' ? params.limit : 5;

  const product = await productService.getProductById(productId);
  if (!product) {
    throw new Error(`Product not found: ${productId}`);
  }

  const attempts = await scraperService.getAttemptsByProduct(productId, {
    limit,
  });
  const latestAttempt = attempts[0];
  const latestJob = latestAttempt?.jobId
    ? await scraperService.getJobById(latestAttempt.jobId)
    : null;

  const providerHealth = await scraperService.getProviderHealth(product.platform, {
    productId,
    windowHours: 24,
    latestLimit: limit,
  });
  const marketSignalSnapshot =
    product.platform === 'amazon'
      ? await marketSignalSnapshotService.getLatestSnapshot(productId)
      : null;
  const marketSignalHealth =
    product.platform === 'amazon'
      ? await marketSignalHealthService.getKeepaHealth({
          productId,
          windowHours: 24,
        })
      : null;
  const productJobDiagnostics =
    await scraperService.getProductJobDiagnostics(productId);
  const queueHealth = await scraperService.getQueueHealth({
    platform: product.platform,
  });

  return {
    product: {
      id: product.id,
      title: product.title,
      platform: product.platform,
      currentPrice: product.currentPrice,
      lastCheckedAt: product.lastCheckedAt,
    },
    triggeredAcquisition: false,
    latestJob,
    latestAttempt: latestAttempt
      ? formatAcquisitionAttempt(latestAttempt)
      : null,
    attempts: attempts.map(formatAcquisitionAttempt),
    explanation: explainAcquisitionStatus(latestAttempt),
    providerHealth,
    providerHealthCaveat:
      providerHealth == null
        ? null
        : `Provider health explains ${product.platform} data-source reliability and fallback usage. It is not evidence of sales volume, demand, or profit margin.`,
    platformDataCaveat: createPlatformDataCaveat(product.platform),
    queueOperations: {
      queueHealth,
      productJobDiagnostics,
      caveat: ACQUISITION_QUEUE_CAVEAT,
      readOnly: true,
      mutationPolicy:
        'Chat can explain acquisition queue state but cannot retry, cancel, reprioritize, or enqueue jobs in this workflow. Use the operations UI/API for bounded job controls.',
      scoreSeparation:
        'Queue health is operational data-source reliability only. It must not be treated as sales, demand, margin, ROI, profitability, market-signal, or opportunity-score evidence.',
    },
    marketSignalStatus: formatMarketSignalStatus(
      product.platform,
      marketSignalSnapshot,
      marketSignalHealth
    ),
  };
}

async function executeGetAcquisitionQueueHealth(
  params: Record<string, unknown>
) {
  const platform = parseSupportedPlatform(params.platform);
  const provider = typeof params.provider === 'string'
    ? params.provider
    : undefined;
  const queueHealth = await scraperService.getQueueHealth({
    platform,
    provider,
  });
  const providerStatus = await scraperService.getProviderQueueStatus({
    platform,
    provider,
  });

  return {
    queueHealth,
    providerStatus,
    readOnly: true,
    caveat: ACQUISITION_QUEUE_CAVEAT,
    mutationPolicy:
      'This Chat tool is read-only. It cannot retry, cancel, reprioritize, or enqueue acquisition jobs.',
    scoreSeparation:
      'Queue/worker/provider operational state explains data-source reliability only and does not change opportunity score, market signals, business assumptions, demand, sales, margin, ROI, or profitability.',
  };
}

async function executeGetProductJobDiagnostics(
  params: Record<string, unknown>
) {
  const productId = typeof params.productId === 'string' ? params.productId : '';
  const product = await productService.getProductById(productId);
  if (!product) {
    throw new Error(`Product not found: ${productId}`);
  }

  const diagnostics = await scraperService.getProductJobDiagnostics(productId);
  const queueHealth = await scraperService.getQueueHealth({
    platform: product.platform,
  });

  return {
    product: {
      id: product.id,
      title: product.title,
      platform: product.platform,
      lastCheckedAt: product.lastCheckedAt,
    },
    diagnostics,
    queueHealth,
    readOnly: true,
    caveat: ACQUISITION_QUEUE_CAVEAT,
    mutationPolicy:
      'This Chat tool diagnoses queue state only. It does not start a hidden refresh and cannot retry, cancel, reprioritize, or enqueue acquisition jobs.',
    scoreSeparation:
      'A delayed or failed acquisition job is operational context. It must not be interpreted as demand, sales, margin, ROI, profitability, or opportunity-score evidence.',
  };
}

async function executeCheckProductNow(params: Record<string, unknown>) {
  const productId = typeof params.productId === 'string' ? params.productId : '';
  const product = await productService.getProductById(productId);
  if (!product) {
    throw new Error(`Product not found: ${productId}`);
  }

  const result = await scraperService.scrapeProduct(productId);
  const degraded =
    result.provider === 'amazon-browser' ||
    result.source === 'browser' ||
    result.provider === 'cache' ||
    result.source === 'cache';
  return {
    triggeredAcquisition: true,
    result,
    explanation: result.success
      ? `Product data was acquired from ${result.provider || 'unknown provider'}${
          degraded
            ? ', but this used a degraded browser/cache fallback path rather than a healthy primary API provider.'
            : '.'
        }`
      : explainFailureReason(result.failureReason, result.provider),
  };
}

async function executeGetProductOpportunities(params: Record<string, unknown>) {
  const filters: OpportunityListFilters = {
    platform: typeof params.platform === 'string' ? params.platform as OpportunityListFilters['platform'] : undefined,
    category: typeof params.category === 'string' ? params.category : undefined,
    monitoring: typeof params.monitoring === 'boolean' ? params.monitoring : undefined,
    minScore: typeof params.minScore === 'number' ? params.minScore : undefined,
    minRoi: typeof params.minRoi === 'number' ? params.minRoi : undefined,
    businessReadiness:
      params.businessReadiness === 'none' ||
      params.businessReadiness === 'partial' ||
      params.businessReadiness === 'complete' ||
      params.businessReadiness === 'any'
        ? params.businessReadiness
        : 'any',
    recommendation:
      typeof params.recommendation === 'string'
        ? params.recommendation as OpportunityListFilters['recommendation']
        : undefined,
    sortBy:
      params.sortBy === 'confidence' || params.sortBy === 'score'
        ? params.sortBy
        : 'score',
    sortOrder:
      params.sortOrder === 'asc' || params.sortOrder === 'desc'
        ? params.sortOrder
        : 'desc',
    page: typeof params.page === 'number' ? params.page : 1,
    limit: typeof params.limit === 'number' ? params.limit : 10,
  };

  const result = await opportunityScoringService.listOpportunities(filters);
  const unsupportedSignals = collectUnsupportedSignals(result.data);

  return {
    ...result,
    data: result.data.map(formatOpportunityForTool),
    unsupportedSignalCaveat: createUnsupportedSignalCaveat(unsupportedSignals),
    noMatchExplanation:
      result.data.length === 0
        ? 'No products matched the opportunity and business-signal filters. Try relaxing minimum ROI or business readiness.'
        : null,
  };
}

async function executeExplainProductOpportunity(
  params: Record<string, unknown>
) {
  const productId = typeof params.productId === 'string' ? params.productId : '';
  const opportunity = await opportunityScoringService.explainProduct(productId);
  const unsupportedSignals = collectUnsupportedSignals([opportunity]);

  return {
    data: formatOpportunityForTool(opportunity),
    unsupportedSignalCaveat: createUnsupportedSignalCaveat(unsupportedSignals),
  };
}

async function executeGetOpportunityResearchStatus(
  params: Record<string, unknown>
) {
  const productId = typeof params.productId === 'string' ? params.productId : '';
  const opportunity = await opportunityScoringService.explainProduct(productId);
  const formatted = formatOpportunityForTool(opportunity);

  return {
    data: formatted,
    research: formatted.research,
    readOnly: true,
    mutationPolicy:
      'Chat can summarize opportunity research state but cannot save, retag, change status, or archive entries. Use the opportunity research workspace UI for mutations until an explicit write workflow exists.',
    researchStateExplanation: opportunity.research
      ? `Product is shortlisted as ${opportunity.research.status} with ${opportunity.research.priority} priority.`
      : 'No shortlist or research metadata exists for this product.',
  };
}

async function executeListShortlistedOpportunities(
  params: Record<string, unknown>
) {
  const status =
    params.status === 'researching' ||
    params.status === 'watching' ||
    params.status === 'ready' ||
    params.status === 'rejected'
      ? params.status
      : undefined;
  const tag = typeof params.tag === 'string'
    ? params.tag.trim().toLowerCase()
    : undefined;
  const limit = typeof params.limit === 'number' ? params.limit : 10;
  const result = await opportunityScoringService.listOpportunities({
    shortlisted: true,
    researchStatus: status,
    researchTag: tag,
    sortBy: 'score',
    sortOrder: 'desc',
    page: 1,
    limit,
  });

  const unsupportedSignals = collectUnsupportedSignals(result.data);

  return {
    ...result,
    data: result.data.map(formatOpportunityForTool),
    readOnly: true,
    mutationPolicy:
      'This shortlist tool is read-only. Saving, retagging, status changes, and archiving must be done in the opportunity research workspace UI.',
    unsupportedSignalCaveat: createUnsupportedSignalCaveat(unsupportedSignals),
    noMatchExplanation:
      result.data.length === 0
        ? 'No non-archived shortlisted opportunities matched the research filters.'
        : null,
  };
}

function formatAcquisitionAttempt(attempt: ScrapeAttempt) {
  return {
    id: attempt.id,
    jobId: attempt.jobId,
    provider: attempt.provider,
    source: attempt.source,
    status: attempt.status,
    failureReason: attempt.failureReason,
    durationMs: attempt.durationMs,
    confidence: attempt.confidence,
    timestamp: attempt.timestamp,
    diagnostics: safeDiagnostics(attempt),
  };
}

function explainAcquisitionStatus(attempt?: ScrapeAttempt) {
  if (!attempt) {
    return 'No acquisition has run for this product yet. Run a manual check to collect the first attempt.';
  }

  if (attempt.status === 'success') {
    const degraded =
      attempt.provider === 'amazon-browser' ||
      attempt.source === 'browser' ||
      attempt.provider === 'cache' ||
      attempt.source === 'cache';
    return `Latest acquisition succeeded via ${attempt.provider} (${attempt.source}) with confidence ${Math.round((attempt.confidence ?? 0) * 100)}%.${
      degraded
        ? ' This is a degraded fallback data-source path, not proof that the primary live API provider is healthy.'
        : ''
    }`;
  }

  return explainFailureReason(attempt.failureReason, attempt.provider);
}

function explainFailureReason(
  failureReason?: string,
  provider?: string
): string {
  switch (failureReason) {
    case 'captcha':
    case 'blocked':
      return `Browser fallback was stopped by platform protection (${failureReason}). Configure or check an API provider before relying on browser collection.`;
    case 'provider_unavailable':
      return `${provider || 'The configured provider'} is unavailable or missing credentials. Check provider configuration, credentials, marketplace, quota, and fallback order.`;
    case 'unsupported_url':
      return `${provider || 'The configured provider'} cannot map this product URL to a deterministic item ID. Use a supported item URL or store provider item metadata before retrying.`;
    case 'selector_drift':
      return 'Browser fallback reached a page whose structure no longer matches known selectors. Update selectors or prefer an API provider.';
    case 'geo_restricted':
      return 'The marketplace page appears region restricted from the current collection environment.';
    case 'not_found':
      return 'The product could not be found by the acquisition provider.';
    case 'price_missing':
      return 'The provider found the product but did not return a usable price.';
    case 'network_timeout':
      return 'The acquisition provider timed out. Retry later or check provider/network health.';
    default:
      return `Latest acquisition failed${failureReason ? ` with ${failureReason}` : ''}. Check recent attempt diagnostics.`;
  }
}

function formatOpportunityForTool(opportunity: ProductOpportunity) {
  return {
    product: {
      id: opportunity.product.id,
      title: opportunity.product.title,
      platform: opportunity.product.platform,
      category: opportunity.product.category,
      currentPrice: opportunity.product.currentPrice,
      currency: opportunity.product.currency,
      isMonitoring: opportunity.product.isMonitoring,
      lastCheckedAt: opportunity.product.lastCheckedAt,
    },
    score: opportunity.score,
    confidence: opportunity.confidence,
    recommendation: opportunity.recommendation,
    keyReasons: opportunity.keyReasons,
    missingSignals: opportunity.missingSignals,
    factors: opportunity.factors,
    acquisitionHealth: opportunity.acquisitionHealth,
    businessSignals: opportunity.businessSignals,
    marketSignals: opportunity.marketSignals,
    research: opportunity.research
      ? {
          status: opportunity.research.status,
          priority: opportunity.research.priority,
          tags: opportunity.research.tags,
          notesSummary: opportunity.research.notesSummary,
          decision: opportunity.research.decision
            ? {
                status: opportunity.research.decision.status,
                reason: opportunity.research.decision.reason,
                nextAction: opportunity.research.decision.nextAction,
                decidedAt: opportunity.research.decision.decidedAt,
                snapshotScore: opportunity.research.decision.snapshot.score,
                snapshotRecommendation:
                  opportunity.research.decision.snapshot.recommendation,
              }
            : null,
          archived: opportunity.research.archived,
          updatedAt: opportunity.research.updatedAt,
        }
      : null,
    researchStateExplanation: opportunity.research
      ? `Research workspace status is ${opportunity.research.status}; priority is ${opportunity.research.priority}.`
      : 'No shortlist or research metadata exists for this product.',
    businessSignalCaveat: opportunity.businessSignals.caveat,
    marketSignalCaveat: opportunity.marketSignals.caveat,
    platformDataCaveat: createPlatformDataCaveat(opportunity.product.platform),
  };
}

function formatMarketSignalStatus(
  platform: string,
  snapshot: MarketSignalSnapshot | null,
  health: MarketSignalProviderHealthResult | null
) {
  if (platform !== 'amazon') {
    return {
      status: 'missing',
      provider: 'keepa',
      source: 'third_party',
      latestSnapshot: null,
      providerHealth: null,
      remediation: [
        {
          code: 'check_market_signal_identifier',
          severity: 'info',
          message:
            'Keepa market signals are currently supported only for deterministic Amazon ASINs.',
        },
      ],
      caveat: MARKET_SIGNAL_CAVEAT,
    };
  }

  const failed =
    !snapshot &&
    health != null &&
    health.status === 'degraded' &&
    health.failureCount > 0;

  return {
    status: snapshot ? 'fresh' : failed ? 'failed' : 'missing',
    provider: snapshot?.provider ?? 'keepa',
    source: snapshot?.source ?? 'third_party',
    latestSnapshot: snapshot
      ? {
          id: snapshot.id,
          confidence: snapshot.confidence,
          freshnessMs: snapshot.freshnessMs,
          priceTrend: snapshot.priceTrend,
          salesRankTrend: snapshot.salesRankTrend,
          reviewVelocity: snapshot.reviewVelocity,
          ratingMovement: snapshot.ratingMovement,
          missingSignals: snapshot.missingSignals,
          createdAt: snapshot.createdAt,
        }
      : null,
    providerHealth: health,
    remediation: health?.recommendations ?? [
      {
        code: 'refresh_market_signals',
        severity: 'info',
        message:
          'No Keepa market signal snapshot is available. Refresh market signals or configure Keepa credentials.',
      },
    ],
    caveat: MARKET_SIGNAL_CAVEAT,
  };
}

function collectUnsupportedSignals(opportunities: ProductOpportunity[]) {
  const unsupported = new Set<string>();
  for (const opportunity of opportunities) {
    for (const signal of opportunity.missingSignals) {
      if (['profit_margin', 'sales_volume', 'demand'].includes(signal)) {
        unsupported.add(signal);
      }
    }
  }
  return Array.from(unsupported);
}

function createUnsupportedSignalCaveat(signals: string[]) {
  if (signals.length === 0) {
    return null;
  }

  return `Unsupported business signals are missing (${signals.join(', ')}). Do not claim verified profit margin, sales volume, or demand from this score alone.`;
}

function createPlatformDataCaveat(platform: string) {
  if (platform === 'ebay') {
    return 'eBay Browse data reflects current listing facts only. It does not prove demand, sales volume, verified profitability, ROI, or ad performance.';
  }
  return null;
}

function safeDiagnostics(attempt: ScrapeAttempt) {
  const diagnostics = sanitizeProviderDiagnostics(
    parseDiagnostics(attempt.diagnostics)
  ) ?? {};
  return {
    httpStatus: attempt.httpStatus,
    pageTitle: attempt.pageTitle,
    finalUrl: sanitizeUrl(attempt.finalUrl) ?? diagnostics.finalUrl,
    detectedState: diagnostics.detectedState,
    providerErrorCode: diagnostics.providerErrorCode,
    rootCause: diagnostics.rootCause,
    fallbackType: diagnostics.fallbackType,
    marketplace: diagnostics.marketplace,
    ebayItemId: diagnostics.ebayItemId,
    legacyItemId: diagnostics.legacyItemId,
    listingUrl: diagnostics.listingUrl,
    providerMessage: diagnostics.providerMessage,
    sanitizedMessage: diagnostics.sanitizedMessage,
    degraded: diagnostics.degraded,
    providerFailures: diagnostics.providerFailures,
    fallbackProviders: diagnostics.fallbackProviders,
  };
}

function parseDiagnostics(value?: string) {
  if (!value) return {} as Record<string, unknown>;
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    return parsed;
  } catch {
    return {};
  }
}
