import fs from 'fs';
import path from 'path';

// Load .env file and parse it manually to ensure .env values take precedence
const envPath = path.resolve(process.cwd(), '.env');
const envConfig: Record<string, string> = {};

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    // Skip comments and empty lines
    if (!trimmed || trimmed.startsWith('#')) return;

    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      envConfig[key] = value;
    }
  });
}

// Helper function: prioritize .env file over process.env
const getEnv = (key: string, defaultValue: string = ''): string => {
  return envConfig[key] || process.env[key] || defaultValue;
};

const getBooleanEnv = (key: string, defaultValue: boolean): boolean => {
  const value = getEnv(key);
  if (!value) return defaultValue;
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
};

const getNumberEnv = (key: string, defaultValue: number): number => {
  const value = getEnv(key);
  if (!value) return defaultValue;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : defaultValue;
};

const getListEnv = (key: string, defaultValue: string[]): string[] => {
  const value = getEnv(key);
  if (!value) return defaultValue;
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

export const config = {
  nodeEnv: getEnv('NODE_ENV', 'development'),
  port: parseInt(getEnv('PORT', '3001'), 10),
  databasePath: getEnv('DATABASE_PATH', './data/ecommerce.db'),
  logLevel: getEnv('LOG_LEVEL', 'info'),
  corsOrigin: getEnv('CORS_ORIGIN', 'http://localhost:3000,http://localhost:3003'),

  // AI Provider Configuration (使用 APP_ 前缀避免与系统环境变量冲突)
  aiProvider: (getEnv('APP_AI_PROVIDER', 'anthropic')) as 'anthropic' | 'openai',

  // Anthropic Protocol (Claude, DeepSeek-Anthropic)
  anthropic: {
    apiKey: getEnv('APP_ANTHROPIC_API_KEY') || getEnv('APP_ANTHROPIC_AUTH_TOKEN'),
    baseURL: getEnv('APP_ANTHROPIC_BASE_URL') || undefined,
    model: getEnv('APP_ANTHROPIC_MODEL', 'claude-opus-4-8'),
  },

  // OpenAI Protocol (OpenAI, DeepSeek-OpenAI)
  openai: {
    apiKey: getEnv('APP_OPENAI_API_KEY'),
    baseURL: getEnv('APP_OPENAI_BASE_URL') || undefined,
    model: getEnv('APP_OPENAI_MODEL', 'gpt-4'),
  },

  acquisition: {
    providerOrder: getListEnv('ACQUISITION_PROVIDER_ORDER', [
      'rainforest',
      'amazon-browser',
      'ebay-browse',
    ]),
    browserFallbackEnabled: getBooleanEnv('ACQUISITION_BROWSER_FALLBACK_ENABLED', true),
    maxAttempts: getNumberEnv('ACQUISITION_MAX_ATTEMPTS', 3),
    baseBackoffMs: getNumberEnv('ACQUISITION_BASE_BACKOFF_MS', 5 * 60 * 1000),
    maxBackoffMs: getNumberEnv('ACQUISITION_MAX_BACKOFF_MS', 60 * 60 * 1000),
    leaseMs: getNumberEnv('ACQUISITION_JOB_LEASE_MS', 5 * 60 * 1000),
    cacheFreshnessMs: getNumberEnv('ACQUISITION_CACHE_FRESHNESS_MS', 6 * 60 * 60 * 1000),
    captureDiagnostics: getBooleanEnv('ACQUISITION_CAPTURE_DIAGNOSTICS', true),
    processLimit: getNumberEnv('ACQUISITION_PROCESS_LIMIT', 10),
    queue: {
      // 手动优先模式仅保留本地 SQLite 队列；已移除 BullMQ/Redis 分布式后端
      backend: 'sqlite' as const,
      workerConcurrency: getNumberEnv('ACQUISITION_WORKER_CONCURRENCY', 4),
      heartbeatIntervalMs: getNumberEnv(
        'ACQUISITION_WORKER_HEARTBEAT_INTERVAL_MS',
        30 * 1000
      ),
      staleWorkerThresholdMs: getNumberEnv(
        'ACQUISITION_STALE_WORKER_THRESHOLD_MS',
        2 * 60 * 1000
      ),
      manualRefreshThrottleMs: getNumberEnv(
        'ACQUISITION_MANUAL_REFRESH_THROTTLE_MS',
        5 * 60 * 1000
      ),
      defaultProviderConcurrency: getNumberEnv(
        'ACQUISITION_PROVIDER_DEFAULT_CONCURRENCY',
        2
      ),
      browserFallbackConcurrency: getNumberEnv(
        'ACQUISITION_BROWSER_FALLBACK_CONCURRENCY',
        1
      ),
      defaultRateLimitResetMs: getNumberEnv(
        'ACQUISITION_PROVIDER_RATE_LIMIT_RESET_MS',
        15 * 60 * 1000
      ),
      degradedBacklogThreshold: getNumberEnv(
        'ACQUISITION_DEGRADED_BACKLOG_THRESHOLD',
        50
      ),
    },
    rainforest: {
      apiKey: getEnv('RAINFOREST_API_KEY'),
      marketplace: getEnv('RAINFOREST_MARKETPLACE', 'amazon.com'),
      timeoutMs: getNumberEnv('RAINFOREST_TIMEOUT_MS', 30 * 1000),
      captureDiagnostics: getBooleanEnv(
        'RAINFOREST_CAPTURE_DIAGNOSTICS',
        getBooleanEnv('ACQUISITION_CAPTURE_DIAGNOSTICS', true)
      ),
    },
    ebay: {
      clientId: getEnv('EBAY_CLIENT_ID'),
      clientSecret: getEnv('EBAY_CLIENT_SECRET'),
      marketplace: getEnv('EBAY_MARKETPLACE', 'EBAY_US'),
      apiBaseUrl: getEnv('EBAY_API_BASE_URL', 'https://api.ebay.com'),
      oauthBaseUrl: getEnv('EBAY_OAUTH_BASE_URL', 'https://api.ebay.com'),
      timeoutMs: getNumberEnv('EBAY_TIMEOUT_MS', 30 * 1000),
      captureDiagnostics: getBooleanEnv(
        'EBAY_CAPTURE_DIAGNOSTICS',
        getBooleanEnv('ACQUISITION_CAPTURE_DIAGNOSTICS', true)
      ),
    },
  },
  marketSignals: {
    providerOrder: getListEnv('MARKET_SIGNAL_PROVIDER_ORDER', ['keepa']),
    refreshWindowDays: getNumberEnv('MARKET_SIGNAL_REFRESH_WINDOW_DAYS', 90),
    freshnessMs: getNumberEnv('MARKET_SIGNAL_FRESHNESS_MS', 7 * 24 * 60 * 60 * 1000),
    captureDiagnostics: getBooleanEnv('MARKET_SIGNAL_CAPTURE_DIAGNOSTICS', true),
    keepa: {
      enabled: getBooleanEnv('KEEPA_ENABLED', true),
      apiKey: getEnv('KEEPA_API_KEY'),
      apiBaseUrl: getEnv('KEEPA_API_BASE_URL', 'https://api.keepa.com'),
      domain: getNumberEnv('KEEPA_DOMAIN', 1),
      marketplace: getEnv('KEEPA_MARKETPLACE', 'amazon.com'),
      timeoutMs: getNumberEnv('KEEPA_TIMEOUT_MS', 30 * 1000),
      captureDiagnostics: getBooleanEnv(
        'KEEPA_CAPTURE_DIAGNOSTICS',
        getBooleanEnv('MARKET_SIGNAL_CAPTURE_DIAGNOSTICS', true)
      ),
    },
  },
} as const;

export function validateConfig() {
  const required = ['DATABASE_PATH'];
  const missing = required.filter(key => !envConfig[key] && !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Validate AI provider configuration (only if APP_AI_PROVIDER is set)
  const aiProvider = getEnv('APP_AI_PROVIDER');
  if (aiProvider) {
    if (config.aiProvider === 'anthropic' && !config.anthropic.apiKey) {
      throw new Error('APP_ANTHROPIC_API_KEY is required when APP_AI_PROVIDER=anthropic');
    }

    if (config.aiProvider === 'openai' && !config.openai.apiKey) {
      throw new Error('APP_OPENAI_API_KEY is required when APP_AI_PROVIDER=openai');
    }
  }

}
