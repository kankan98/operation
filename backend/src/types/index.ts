// Platform types
export type Platform = 'amazon' | 'walmart' | 'aliexpress' | 'ebay' | 'lazada' | 'other';

// Monitor types
export type MonitorType = 'own' | 'competitor';

// Product availability
export type Availability = 'in_stock' | 'low_stock' | 'out_of_stock';

// Alert types
export type AlertType =
  | 'price_drop'
  | 'price_surge'
  | 'out_of_stock'
  | 'rank_improvement'
  | 'rank_decline';

// Alert severity
export type Severity = 'info' | 'warning' | 'critical';

// Task types
export type TaskType =
  | 'product_check'
  | 'batch_check'
  | 'report_generation'
  | 'data_cleanup';

// Product interface
export interface Product {
  id: string;
  platform: Platform;
  productUrl: string;
  asin: string;
  title: string;
  brand?: string;
  category?: string;
  imageUrl?: string;
  currentPrice?: number;
  currency: string;
  isMonitoring: boolean;
  monitorType?: MonitorType;
  checkInterval: number;
  userId?: string;
  createdAt: number;
  updatedAt?: number;
  lastCheckedAt?: number;
  metadata?: string;
}

// Price snapshot interface
export interface PriceSnapshot {
  id: string;
  productId: string;
  price: number;
  currency: string;
  availability: string;
  rating?: number;
  reviewCount?: number;
  salesRank?: number;
  shippingCost?: number;
  seller?: string;
  condition?: string;
  timestamp: number;
  metadata?: string;
}

// Create price snapshot data
export interface CreatePriceSnapshotData {
  productId: string;
  price: number;
  currency: string;
  availability: string;
  rating?: number;
  reviewCount?: number;
  salesRank?: number;
  shippingCost?: number;
  seller?: string;
  condition?: string;
  metadata?: string;
}

// Alert interface
export interface Alert {
  id: string;
  ruleId?: string;
  productId: string;
  alertType: AlertType;
  severity: Severity;
  title: string;
  message?: string;
  dataSnapshot?: string;
  isRead: boolean;
  isArchived: boolean;
  notifiedAt?: number;
  createdAt: number;
}

// Alert rule interface
export interface AlertRule {
  id: string;
  productId: string;
  ruleType: 'price_threshold' | 'price_change_percent' | 'stock_change';
  condition: 'below' | 'above' | 'increase' | 'decrease';
  threshold: number;
  enabled: boolean;
  severity: Severity;
  createdAt: number;
  updatedAt?: number;
}

// Price statistics interface
export interface PriceStats {
  productId: string;
  currentPrice: number;
  highestPrice: number;
  lowestPrice: number;
  averagePrice: number;
  priceChange: number;
  priceChangePercent: number;
  dataPoints: number;
  firstRecordedAt: number;
  lastRecordedAt: number;
}

// Scraper types
export interface ScrapedProductData {
  price: number;
  currency: string;
  availability: string;
  title?: string;
  rating?: number;
  reviewCount?: number;
  imageUrl?: string;
}

export interface ScrapeResult {
  success: boolean;
  data?: ScrapedProductData;
  error?: string;
  timestamp: number;
}
