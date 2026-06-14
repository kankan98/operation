// Re-export types from shared schemas
export type {
  Platform,
  MonitorType,
  CreateProduct,
  Product,
  UpdateProduct,
  AlertType,
  Severity,
  CreateAlert,
  Alert,
  RuleType,
  Condition,
  CreateAlertRule,
  AlertRule,
  UpdateAlertRule,
  Availability,
  PriceSnapshot,
  PriceStats,
} from '@shared/schemas';

// Frontend-only types
export interface DashboardStats {
  totalProducts: number;
  monitoringProducts: number;
  unreadAlerts: number;
  totalAlerts: number;
}
