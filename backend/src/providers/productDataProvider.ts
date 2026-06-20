import {
  AcquisitionFailureReason,
  AcquisitionProvider,
  AcquisitionSource,
  Product,
  ProductDataAcquisitionResult,
  ScrapedProductData,
} from '../types';

export interface ProductDataProviderContext {
  jobId?: string;
  attemptId?: string;
}

export interface ProductDataProvider {
  name: AcquisitionProvider;
  source: AcquisitionSource;
  supports(product: Product): boolean;
  fetchProduct(
    product: Product,
    context?: ProductDataProviderContext
  ): Promise<ProductDataAcquisitionResult>;
}

export function createAcquisitionSuccess(params: {
  provider: AcquisitionProvider;
  source: AcquisitionSource;
  data: ScrapedProductData;
  startedAt: number;
  confidence?: number;
  freshnessMs?: number;
  diagnostics?: ProductDataAcquisitionResult['diagnostics'];
  attemptId?: string;
  jobId?: string;
}): ProductDataAcquisitionResult {
  const timestamp = Date.now();
  return {
    success: true,
    provider: params.provider,
    source: params.source,
    data: params.data,
    confidence: params.confidence ?? 1,
    freshnessMs: params.freshnessMs ?? 0,
    diagnostics: params.diagnostics,
    timestamp,
    durationMs: timestamp - params.startedAt,
    attemptId: params.attemptId,
    jobId: params.jobId,
  };
}

export function createAcquisitionFailure(params: {
  provider: AcquisitionProvider;
  source: AcquisitionSource;
  failureReason: AcquisitionFailureReason;
  startedAt: number;
  error?: string;
  diagnostics?: ProductDataAcquisitionResult['diagnostics'];
  attemptId?: string;
  jobId?: string;
}): ProductDataAcquisitionResult {
  const timestamp = Date.now();
  return {
    success: false,
    provider: params.provider,
    source: params.source,
    failureReason: params.failureReason,
    error: params.error,
    diagnostics: params.diagnostics,
    timestamp,
    durationMs: timestamp - params.startedAt,
    attemptId: params.attemptId,
    jobId: params.jobId,
  };
}
