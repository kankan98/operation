import { AmazonScraper } from '../scrapers/amazonScraper';
import { AcquisitionFailureReason, Product, ProductDataAcquisitionResult } from '../types';
import {
  rootCauseFromFailureReason,
  sanitizeProviderDiagnostics,
} from '../utils/providerDiagnostics';
import {
  createAcquisitionFailure,
  createAcquisitionSuccess,
  ProductDataProvider,
  ProductDataProviderContext,
} from './productDataProvider';

export class AmazonBrowserProvider implements ProductDataProvider {
  name = 'amazon-browser' as const;
  source = 'browser' as const;

  supports(product: Product): boolean {
    return product.platform === 'amazon';
  }

  async fetchProduct(
    product: Product,
    context: ProductDataProviderContext = {}
  ): Promise<ProductDataAcquisitionResult> {
    const startedAt = Date.now();
    const scraper = new AmazonScraper();

    try {
      await scraper.initialize();
      const result = await scraper.scrape(product.productUrl);

      if (result.success && result.data) {
        return createAcquisitionSuccess({
          provider: this.name,
          source: this.source,
          data: result.data,
          startedAt,
          confidence: 0.75,
          jobId: context.jobId,
          attemptId: context.attemptId,
        });
      }

      return createAcquisitionFailure({
        provider: this.name,
        source: this.source,
        failureReason: result.failureReason || 'unknown',
        error: result.error || 'Amazon browser provider failed',
        diagnostics: sanitizeProviderDiagnostics({
          ...result.diagnostics,
          rootCause: rootCauseFromFailureReason(
            result.failureReason || 'unknown'
          ),
          failureCategory: this.failureCategory(result.failureReason || 'unknown'),
          providerMessage: result.error || 'Amazon browser provider failed',
          sanitizedMessage: result.error || 'Amazon browser provider failed',
        }),
        startedAt,
        jobId: context.jobId,
        attemptId: context.attemptId,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      const failureReason: AcquisitionFailureReason = message
        .toLowerCase()
        .includes('timeout')
        ? 'network_timeout'
        : 'unknown';
      return createAcquisitionFailure({
        provider: this.name,
        source: this.source,
        failureReason,
        error: message,
        diagnostics: sanitizeProviderDiagnostics({
          rootCause: rootCauseFromFailureReason(failureReason),
          failureCategory: this.failureCategory(failureReason),
          providerMessage: message,
          sanitizedMessage: message,
        }),
        startedAt,
        jobId: context.jobId,
        attemptId: context.attemptId,
      });
    } finally {
      await scraper.close();
    }
  }

  private failureCategory(failureReason: AcquisitionFailureReason): string {
    switch (failureReason) {
      case 'captcha':
      case 'blocked':
      case 'geo_restricted':
        return 'browser_blocking';
      case 'selector_drift':
        return 'selector_drift';
      case 'network_timeout':
        return 'timeout';
      default:
        return 'unknown';
    }
  }
}
