import { ClaudeToolDefinition } from '../types/chat';
import { ProductService } from './productService';
import { AlertService } from './alertService';
import { AlertRuleService } from './alertRuleService';
import { PriceAnalysisService } from './priceAnalysisService';
import { logger } from '../utils/logger';

const productService = new ProductService();
const alertService = new AlertService();
const alertRuleService = new AlertRuleService();
const priceAnalysisService = new PriceAnalysisService();

/**
 * Fetch all products through the paginated service API.
 * Tools filter/aggregate client-side, so we pull a large page in one call.
 */
async function getAllProducts() {
  const { data } = await productService.listProducts({ limit: 1000 });
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
          enum: ['amazon', 'walmart', 'ebay', 'aliexpress', 'lazada'],
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
          enum: ['amazon', 'walmart', 'ebay', 'aliexpress', 'lazada'],
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
];

/**
 * Tool Execution Functions
 */

export async function executeToolWithParams(
  toolName: string,
  params: Record<string, any>
): Promise<any> {
  const startTime = Date.now();

  try {
    logger.info({ toolName, params }, 'Executing tool');

    let result: any;

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
        result = await executeGetMarketInsights(params);
        break;
      case 'queryDatabase':
        result = await executeQueryDatabase(params);
        break;
      case 'generateReport':
        result = await executeGenerateReport(params);
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
async function executeSearchProducts(params: any) {
  const { query, platform, maxPrice, limit = 10 } = params;

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

async function executeGetProductDetails(params: any) {
  const { productId, includeHistory = false } = params;

  const product = await productService.getProductById(productId);
  if (!product) {
    throw new Error(`Product not found: ${productId}`);
  }

  const result: any = { product };

  if (includeHistory) {
    const history = await priceAnalysisService.getPriceHistory(productId, 30);
    result.priceHistory = history;
  }

  return result;
}

async function executeAnalyzePriceTrend(params: any) {
  const { productId } = params;

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

async function executeCreateAlert(params: any) {
  const { productId, ruleType, condition, threshold, severity = 'info' } = params;

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
    enabled: true,
  });

  return {
    success: true,
    ruleId: rule.id,
    message: `Alert rule created successfully for product: ${product.title}`,
  };
}

async function executeGetAlertsList(params: any) {
  const { unreadOnly = false, severity, limit = 20 } = params;

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

async function executeAddProductMonitoring(params: any) {
  const { platform, productUrl, title, checkInterval = 24 } = params;

  // Validate URL format (basic check)
  try {
    new URL(productUrl);
  } catch {
    throw new Error('Invalid product URL format');
  }

  // Check for duplicates
  const existing = await getAllProducts();
  const duplicate = existing.find(p => p.productUrl === productUrl);
  if (duplicate) {
    throw new Error('Product already being monitored');
  }

  // Extract ASIN from Amazon URLs
  let asin = '';
  if (platform === 'amazon') {
    const asinMatch = productUrl.match(/\/dp\/([A-Z0-9]{10})/);
    if (asinMatch) asin = asinMatch[1];
  }

  const product = await productService.createProduct({
    platform,
    productUrl,
    asin,
    title,
    currency: 'USD',
    isMonitoring: true,
    checkInterval,
  });

  return {
    success: true,
    productId: product.id,
    message: `Product added to monitoring: ${title}`,
  };
}

async function executeGetCompetitorAnalysis(params: any) {
  const { asin } = params;

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

async function executeGetMarketInsights(params: any) {
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
  const recentDrops = [];
  for (const product of allProducts) {
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
  };
}

async function executeQueryDatabase(params: any) {
  const { queryType = 'count_by_status', timeRange = 24 } = params;

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

async function executeGenerateReport(params: any) {
  const { reportType, productId } = params;

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
