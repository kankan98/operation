import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';

const mockScraperService = vi.hoisted(() => ({
  scrapeProduct: vi.fn(),
  scrapeAllMonitoringProducts: vi.fn(),
  getAttemptsByProduct: vi.fn(),
  getJobById: vi.fn(),
  getAmazonProviderHealth: vi.fn(),
  getProviderHealth: vi.fn(),
  getQueueHealth: vi.fn(),
  getWorkerHealth: vi.fn(),
  getProductJobDiagnostics: vi.fn(),
  getProviderQueueStatus: vi.fn(),
  retryJob: vi.fn(),
  cancelJob: vi.fn(),
}));

vi.mock('../src/services/scraperService', () => ({
  ScraperService: vi.fn(function ScraperService() {
    return mockScraperService;
  }),
}));

import { createApp } from '../src/app';

describe('Scraper API', () => {
  const app = createApp();
  const queueCaveat =
    'Queue health describes acquisition operations only. It is not verified evidence of sales, demand, margin, ROI, or profitability.';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/scraper/product/:productId', () => {
    it('should return structured result for a successful single product scrape', async () => {
      mockScraperService.scrapeProduct.mockResolvedValue({
        success: true,
        productId: 'product-1',
        jobId: 'job-1',
        attemptId: 'attempt-1',
        snapshotId: 'snapshot-1',
        provider: 'amazon-browser',
        source: 'browser',
        confidence: 0.82,
      });

      const response = await request(app)
        .post('/api/scraper/product/product-1')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        productId: 'product-1',
        jobId: 'job-1',
        attemptId: 'attempt-1',
        snapshotId: 'snapshot-1',
        provider: 'amazon-browser',
        source: 'browser',
        confidence: 0.82,
      });
    });

    it('should return normalized eBay acquisition fields for a successful scrape', async () => {
      mockScraperService.scrapeProduct.mockResolvedValue({
        success: true,
        productId: 'ebay-product',
        jobId: 'job-ebay',
        attemptId: 'attempt-ebay',
        snapshotId: 'snapshot-ebay',
        provider: 'ebay-browse',
        source: 'official_api',
        confidence: 0.95,
        data: {
          price: 29.99,
          currency: 'USD',
          availability: 'IN_STOCK',
          title: 'eBay Item',
        },
      });

      const response = await request(app)
        .post('/api/scraper/product/ebay-product')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        productId: 'ebay-product',
        attemptId: 'attempt-ebay',
        snapshotId: 'snapshot-ebay',
        provider: 'ebay-browse',
        source: 'official_api',
        confidence: 0.95,
        data: {
          price: 29.99,
          currency: 'USD',
          availability: 'IN_STOCK',
        },
      });
    });

    it('should return structured acquisition failure for a valid product', async () => {
      mockScraperService.scrapeProduct.mockResolvedValue({
        success: false,
        productId: 'product-1',
        jobId: 'job-1',
        attemptId: 'attempt-1',
        provider: 'amazon-browser',
        source: 'browser',
        failureReason: 'captcha',
        error: 'Robot check detected',
        diagnostics: {
          detectedState: 'captcha',
        },
      });

      const response = await request(app)
        .post('/api/scraper/product/product-1')
        .expect(200);

      expect(response.body.success).toBe(false);
      expect(response.body.failureReason).toBe('captcha');
      expect(response.body.diagnostics.detectedState).toBe('captcha');
    });

    it('should return structured eBay acquisition failure for a valid product', async () => {
      mockScraperService.scrapeProduct.mockResolvedValue({
        success: false,
        productId: 'ebay-product',
        jobId: 'job-ebay',
        attemptId: 'attempt-ebay',
        provider: 'ebay-browse',
        source: 'official_api',
        failureReason: 'unsupported_url',
        error: 'Unsupported eBay URL',
        diagnostics: {
          rootCause: 'unsupported_url',
          marketplace: 'EBAY_US',
        },
      });

      const response = await request(app)
        .post('/api/scraper/product/ebay-product')
        .expect(200);

      expect(response.body).toMatchObject({
        success: false,
        provider: 'ebay-browse',
        source: 'official_api',
        failureReason: 'unsupported_url',
        diagnostics: {
          rootCause: 'unsupported_url',
          marketplace: 'EBAY_US',
        },
      });
    });

    it('should return error for non-existent product', async () => {
      mockScraperService.scrapeProduct.mockResolvedValue({
        success: false,
        productId: 'missing',
        error: 'Product not found',
      });

      await request(app).post('/api/scraper/product/missing').expect(500);
    });
  });

  describe('POST /api/scraper/all', () => {
    it('should enqueue all monitoring products and return summary', async () => {
      mockScraperService.scrapeAllMonitoringProducts.mockResolvedValue({
        total: 2,
        queued: 1,
        skipped: 1,
        jobs: [
          {
            jobId: 'job-1',
            productId: 'product-1',
            status: 'pending',
            created: true,
          },
          {
            jobId: 'job-2',
            productId: 'product-2',
            status: 'pending',
            created: false,
          },
        ],
      });

      const response = await request(app).post('/api/scraper/all').expect(200);

      expect(response.body.total).toBe(2);
      expect(response.body.queued).toBe(1);
      expect(response.body.skipped).toBe(1);
      expect(response.body.jobs).toHaveLength(2);
    });
  });

  describe('GET /api/scraper/product/:productId/attempts', () => {
    it('should return recent attempt history for a product', async () => {
      mockScraperService.getAttemptsByProduct.mockResolvedValue([
        {
          id: 'attempt-1',
          jobId: 'job-1',
          productId: 'product-1',
          provider: 'amazon-browser',
          source: 'browser',
          status: 'failed',
          failureReason: 'captcha',
          durationMs: 1000,
          timestamp: 123,
        },
      ]);

      const response = await request(app)
        .get('/api/scraper/product/product-1/attempts?limit=1')
        .expect(200);

      expect(mockScraperService.getAttemptsByProduct).toHaveBeenCalledWith(
        'product-1',
        { limit: 1 }
      );
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].failureReason).toBe('captcha');
    });
  });

  describe('Acquisition queue operations APIs', () => {
    it('should return queue health with platform/provider filters', async () => {
      mockScraperService.getQueueHealth.mockResolvedValue({
        backend: 'sqlite',
        status: 'degraded',
        scope: { platform: 'amazon', provider: 'rainforest' },
        counts: {
          backlog: 4,
          pending: 4,
          running: 1,
          retryScheduled: 0,
          failed: 1,
          cancelled: 0,
          staleLeases: 1,
        },
        workerSummary: {
          total: 1,
          healthy: 0,
          stale: 1,
          busy: 0,
          idle: 0,
          capacity: 4,
          activeJobCount: 1,
        },
        providerGates: [],
        recommendations: [
          {
            code: 'check_workers',
            severity: 'warning',
            message: 'Check stale workers.',
          },
        ],
        caveat: queueCaveat,
        generatedAt: 123,
      });

      const response = await request(app)
        .get('/api/scraper/queue/health?platform=amazon&provider=rainforest')
        .expect(200);

      expect(mockScraperService.getQueueHealth).toHaveBeenCalledWith({
        platform: 'amazon',
        provider: 'rainforest',
      });
      expect(response.body.status).toBe('degraded');
      expect(response.body.caveat).toBe(queueCaveat);
    });

    it('should return insufficient-history queue health state', async () => {
      mockScraperService.getQueueHealth.mockResolvedValue({
        backend: 'sqlite',
        status: 'insufficient_history',
        scope: {},
        counts: {
          backlog: 0,
          pending: 0,
          running: 0,
          retryScheduled: 0,
          failed: 0,
          cancelled: 0,
          staleLeases: 0,
        },
        workerSummary: {
          total: 0,
          healthy: 0,
          stale: 0,
          busy: 0,
          idle: 0,
          capacity: 0,
          activeJobCount: 0,
        },
        providerGates: [],
        recommendations: [],
        caveat: queueCaveat,
        generatedAt: 123,
      });

      const response = await request(app)
        .get('/api/scraper/queue/health')
        .expect(200);

      expect(response.body.status).toBe('insufficient_history');
    });

    it('should return worker health without unsafe metadata', async () => {
      mockScraperService.getWorkerHealth.mockResolvedValue({
        workers: [
          {
            workerId: 'worker-1',
            backend: 'sqlite',
            status: 'stale',
            concurrency: 4,
            activeJobCount: 1,
            queues: ['acquisition'],
            startedAt: 100,
            lastHeartbeatAt: 200,
            stale: true,
            metadata: { hostname: 'local-dev' },
          },
        ],
        summary: {
          total: 1,
          healthy: 0,
          stale: 1,
          busy: 0,
          idle: 0,
          capacity: 4,
          activeJobCount: 1,
        },
        caveat: queueCaveat,
        generatedAt: 300,
      });

      const response = await request(app)
        .get('/api/scraper/queue/workers?backend=sqlite&status=stale')
        .expect(200);

      expect(mockScraperService.getWorkerHealth).toHaveBeenCalledWith({
        backend: 'sqlite',
        status: 'stale',
      });
      expect(response.body.workers[0].metadata.redisUrl).toBeUndefined();
    });

    it('should return product job diagnostics', async () => {
      mockScraperService.getProductJobDiagnostics.mockResolvedValue({
        productId: 'product-1',
        job: {
          id: 'job-1',
          productId: 'product-1',
          status: 'retry_scheduled',
          priority: 0,
          attemptCount: 1,
          maxAttempts: 3,
          nextRunAt: 999,
          leaseOwner: null,
          leaseExpiresAt: null,
          lastAttemptId: 'attempt-1',
          lastFailureReason: 'captcha',
          createdAt: 100,
          updatedAt: 200,
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
          timestamp: 200,
          diagnostics: { detectedState: 'captcha' },
        },
        providerGate: null,
        recommendations: [],
        caveat: queueCaveat,
        generatedAt: 300,
      });

      const response = await request(app)
        .get('/api/scraper/product/product-1/job-diagnostics')
        .expect(200);

      expect(mockScraperService.getProductJobDiagnostics).toHaveBeenCalledWith(
        'product-1'
      );
      expect(response.body.job.delayReason).toBe('retry_backoff');
      expect(response.body.caveat).toBe(queueCaveat);
    });

    it('should return provider queue status', async () => {
      mockScraperService.getProviderQueueStatus.mockResolvedValue({
        providerGates: [
          {
            platform: 'amazon',
            provider: 'rainforest',
            status: 'rate_limited',
            resetAt: 999,
            currentConcurrency: 0,
            maxConcurrency: 2,
            activeCount: 0,
            recentRootCauses: ['rate_limited'],
            recommendations: [],
            updatedAt: 100,
          },
        ],
        caveat: queueCaveat,
        generatedAt: 300,
      });

      const response = await request(app)
        .get('/api/scraper/queue/providers/status?platform=amazon')
        .expect(200);

      expect(response.body.providerGates[0].status).toBe('rate_limited');
    });

    it('should retry and cancel supported jobs', async () => {
      mockScraperService.retryJob.mockResolvedValue({
        action: 'retry',
        result: 'accepted',
        job: { id: 'job-1', status: 'pending' },
        message: 'Job moved to pending for retry',
        caveat: queueCaveat,
      });
      mockScraperService.cancelJob.mockResolvedValue({
        action: 'cancel',
        result: 'accepted',
        job: { id: 'job-1', status: 'cancelled' },
        message: 'Job cancelled',
        caveat: queueCaveat,
      });

      await request(app)
        .post('/api/scraper/jobs/job-1/retry')
        .send({ reason: 'provider_reset' })
        .expect(200);
      await request(app)
        .post('/api/scraper/jobs/job-1/cancel')
        .send({ reason: 'operator_cancelled' })
        .expect(200);

      expect(mockScraperService.retryJob).toHaveBeenCalledWith(
        'job-1',
        'provider_reset',
        undefined
      );
      expect(mockScraperService.cancelJob).toHaveBeenCalledWith(
        'job-1',
        'operator_cancelled',
        undefined
      );
    });

    it('should validate unsupported cancel requests without mutation', async () => {
      await request(app)
        .post('/api/scraper/jobs/job-1/cancel')
        .send({ reason: '' })
        .expect(400);

      expect(mockScraperService.cancelJob).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/scraper/providers/amazon/health', () => {
    it('should return Amazon provider health summary', async () => {
      mockScraperService.getAmazonProviderHealth.mockResolvedValue({
        platform: 'amazon',
        status: 'degraded',
        window: { windowHours: 24, since: 1000, until: 2000 },
        providerSummaries: [],
        chainSummary: {
          totalAttempts: 1,
          liveSuccessCount: 0,
          liveFailureCount: 1,
          browserFallbackCount: 1,
          cacheFallbackCount: 0,
          primaryFailureCount: 1,
          degradedPathCounts: { browser_fallback: 1 },
          rootCauses: { captcha_or_blocked: 1 },
        },
        latestAttempts: [
          {
            id: 'attempt-1',
            productId: 'product-1',
            provider: 'amazon-browser',
            source: 'browser',
            status: 'failed',
            failureReason: 'captcha',
            durationMs: 1200,
            confidence: null,
            rootCause: 'captcha_or_blocked',
            marketplace: null,
            httpStatus: 503,
            fallbackType: 'browser_fallback',
            sanitizedMessage: 'Captcha challenge detected',
            timestamp: 1500,
          },
        ],
        recommendations: [
          {
            code: 'investigate_browser_blocking',
            severity: 'warning',
            message: 'Amazon browser fallback is encountering blocking.',
          },
        ],
      });

      const response = await request(app)
        .get('/api/scraper/providers/amazon/health?windowHours=24&productId=product-1')
        .expect(200);

      expect(mockScraperService.getAmazonProviderHealth).toHaveBeenCalledWith({
        windowHours: 24,
        productId: 'product-1',
        provider: undefined,
      });
      expect(response.body.status).toBe('degraded');
      expect(response.body.chainSummary.browserFallbackCount).toBe(1);
      expect(response.body.chainSummary.rootCauses.captcha_or_blocked).toBe(1);
      expect(response.body.latestAttempts[0].rootCause).toBe('captcha_or_blocked');
    });

    it('should validate provider health query parameters', async () => {
      await request(app)
        .get('/api/scraper/providers/amazon/health?windowHours=0')
        .expect(400);
    });
  });

  describe('GET /api/scraper/providers/:platform/health', () => {
    it('should return eBay provider health summary', async () => {
      mockScraperService.getProviderHealth.mockResolvedValue({
        platform: 'ebay',
        status: 'degraded',
        window: { windowHours: 24, since: 1000, until: 2000 },
        providerSummaries: [
          {
            provider: 'ebay-browse',
            source: 'official_api',
            attemptCount: 1,
            successCount: 0,
            failureCount: 1,
            successRate: 0,
            averageDurationMs: 120,
            latestSuccessTimestamp: null,
            latestFailureReason: 'provider_unavailable',
            latestConfidence: null,
            fallbackCount: 0,
            cacheCount: 0,
            failureReasons: { provider_unavailable: 1 },
            rootCauses: { missing_credentials: 1 },
          },
        ],
        chainSummary: {
          totalAttempts: 1,
          liveSuccessCount: 0,
          liveFailureCount: 1,
          browserFallbackCount: 0,
          cacheFallbackCount: 0,
          primaryFailureCount: 0,
          degradedPathCounts: {},
          rootCauses: { missing_credentials: 1 },
        },
        latestAttempts: [
          {
            id: 'attempt-ebay',
            productId: 'ebay-product',
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
            sanitizedMessage: 'Configure eBay credentials',
            timestamp: 1500,
          },
        ],
        recommendations: [
          {
            code: 'configure_ebay',
            severity: 'critical',
            message: 'Configure EBAY_CLIENT_ID and EBAY_CLIENT_SECRET.',
          },
        ],
      });

      const response = await request(app)
        .get('/api/scraper/providers/ebay/health?windowHours=24&productId=ebay-product')
        .expect(200);

      expect(mockScraperService.getProviderHealth).toHaveBeenCalledWith('ebay', {
        windowHours: 24,
        productId: 'ebay-product',
        provider: undefined,
      });
      expect(response.body.platform).toBe('ebay');
      expect(response.body.providerSummaries[0].provider).toBe('ebay-browse');
      expect(response.body.recommendations[0].code).toBe('configure_ebay');
    });

    it('should validate eBay provider health query parameters', async () => {
      await request(app)
        .get('/api/scraper/providers/ebay/health?windowHours=0')
        .expect(400);
    });

    it('should reject unsupported provider health platforms', async () => {
      await request(app)
        .get('/api/scraper/providers/unknown/health')
        .expect(400);
    });
  });

  describe('GET /api/scraper/jobs/:jobId', () => {
    it('should return scrape job status', async () => {
      mockScraperService.getJobById.mockResolvedValue({
        id: 'job-1',
        productId: 'product-1',
        status: 'pending',
        priority: 0,
        nextRunAt: 1000,
        attemptCount: 0,
        maxAttempts: 3,
        createdAt: 1000,
        updatedAt: 1000,
      });

      const response = await request(app)
        .get('/api/scraper/jobs/job-1')
        .expect(200);

      expect(response.body.id).toBe('job-1');
      expect(response.body.status).toBe('pending');
    });

    it('should return 404 for unknown scrape job', async () => {
      mockScraperService.getJobById.mockResolvedValue(null);

      await request(app).get('/api/scraper/jobs/missing').expect(404);
    });
  });
});
