import { z } from 'zod';

export const ACQUISITION_QUEUE_CAVEAT =
  'Queue health describes acquisition operations only. It is not verified evidence of sales, demand, margin, ROI, or profitability.';

export const ACQUISITION_QUEUE_MAX_METADATA_KEYS = 20;
export const ACQUISITION_QUEUE_MAX_METADATA_STRING_LENGTH = 500;
export const ACQUISITION_QUEUE_MAX_METADATA_BYTES = 4000;

const unsafeMetadataKeyPattern =
  /(secret|token|api[_-]?key|authorization|cookie|password|credential|redis[_-]?url|raw[_-]?(html|payload|response)|html|payload)/i;

const unsafeMetadataValuePatterns = [
  /redis:\/\/[^:@\s]+:[^@\s]+@/i,
  /authorization\s*[:=]/i,
  /bearer\s+[a-z0-9._~+/=-]+/i,
  /api[_-]?key\s*[:=]/i,
  /cookie\s*[:=]/i,
  /<html[\s>]/i,
  /<!doctype\s+html/i,
];

function pushUnsafeIssue(
  issues: string[],
  path: string,
  message: string
): void {
  issues.push(path ? `${path}: ${message}` : message);
}

function inspectSafeMetadata(
  value: unknown,
  path: string,
  issues: string[],
  depth: number
): void {
  if (depth > 3) {
    pushUnsafeIssue(issues, path, 'metadata nesting is too deep');
    return;
  }

  if (typeof value === 'string') {
    if (value.length > ACQUISITION_QUEUE_MAX_METADATA_STRING_LENGTH) {
      pushUnsafeIssue(issues, path, 'metadata string is too long');
    }

    for (const pattern of unsafeMetadataValuePatterns) {
      if (pattern.test(value)) {
        pushUnsafeIssue(issues, path, 'metadata string contains unsafe diagnostic content');
        break;
      }
    }
    return;
  }

  if (Array.isArray(value)) {
    if (value.length > ACQUISITION_QUEUE_MAX_METADATA_KEYS) {
      pushUnsafeIssue(issues, path, 'metadata array has too many items');
    }
    value.forEach((item, index) => {
      inspectSafeMetadata(item, `${path}[${index}]`, issues, depth + 1);
    });
    return;
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length > ACQUISITION_QUEUE_MAX_METADATA_KEYS) {
      pushUnsafeIssue(issues, path, 'metadata object has too many keys');
    }

    for (const [key, child] of entries) {
      if (unsafeMetadataKeyPattern.test(key)) {
        pushUnsafeIssue(issues, path ? `${path}.${key}` : key, 'metadata key is unsafe');
      }
      inspectSafeMetadata(child, path ? `${path}.${key}` : key, issues, depth + 1);
    }
  }
}

function safeMetadataIssues(value: Record<string, unknown>): string[] {
  const issues: string[] = [];
  let serialized = '';
  try {
    serialized = JSON.stringify(value);
  } catch {
    issues.push('metadata must be JSON serializable');
  }

  if (serialized.length > ACQUISITION_QUEUE_MAX_METADATA_BYTES) {
    issues.push('metadata payload is too large');
  }

  inspectSafeMetadata(value, '', issues, 0);
  return issues;
}

export const queueSafeMetadataSchema = z
  .record(z.unknown())
  .superRefine((value, ctx) => {
    for (const issue of safeMetadataIssues(value)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: issue,
      });
    }
  });

export const acquisitionQueueBackendSchema = z.enum(['sqlite', 'bullmq']);

export const acquisitionQueueStatusSchema = z.enum([
  'healthy',
  'degraded',
  'unavailable',
  'insufficient_history',
]);

export const acquisitionWorkerStatusSchema = z.enum([
  'starting',
  'idle',
  'busy',
  'stopping',
  'stopped',
  'stale',
]);

export const acquisitionProviderGateStatusSchema = z.enum([
  'open',
  'rate_limited',
  'quota_exhausted',
  'unavailable',
  'disabled',
]);

export const acquisitionJobControlActionSchema = z.enum(['retry', 'cancel']);
export const acquisitionJobControlResultSchema = z.enum([
  'accepted',
  'rejected',
  'noop',
]);

export const acquisitionJobStatusSchema = z.enum([
  'pending',
  'running',
  'succeeded',
  'failed',
  'retry_scheduled',
  'cancelled',
]);

export const acquisitionQueueRecommendationSchema = z.object({
  code: z.string().min(1).max(80),
  severity: z.enum(['info', 'warning', 'critical']),
  message: z.string().min(1).max(500),
});

export const acquisitionProviderLimitStateSchema = z.object({
  platform: z.string().min(1).max(40),
  provider: z.string().min(1).max(80),
  status: acquisitionProviderGateStatusSchema,
  resetAt: z.number().int().nullable().optional(),
  currentConcurrency: z.number().int().min(0),
  maxConcurrency: z.number().int().min(1),
  activeCount: z.number().int().min(0),
  recentRootCauses: z.array(z.string().min(1).max(120)).max(10),
  recommendations: z.array(acquisitionQueueRecommendationSchema).max(8),
  metadata: queueSafeMetadataSchema.optional(),
  updatedAt: z.number().int(),
});

export const acquisitionWorkerHeartbeatSchema = z.object({
  workerId: z.string().min(1).max(120),
  backend: acquisitionQueueBackendSchema,
  status: acquisitionWorkerStatusSchema,
  concurrency: z.number().int().min(1),
  activeJobCount: z.number().int().min(0),
  queues: z.array(z.string().min(1).max(80)).max(10),
  startedAt: z.number().int(),
  lastHeartbeatAt: z.number().int(),
  stale: z.boolean().optional(),
  metadata: queueSafeMetadataSchema.optional(),
});

export const acquisitionWorkerSummarySchema = z.object({
  total: z.number().int().min(0),
  healthy: z.number().int().min(0),
  stale: z.number().int().min(0),
  busy: z.number().int().min(0),
  idle: z.number().int().min(0),
  capacity: z.number().int().min(0),
  activeJobCount: z.number().int().min(0),
});

export const acquisitionQueueCountsSchema = z.object({
  backlog: z.number().int().min(0),
  pending: z.number().int().min(0),
  running: z.number().int().min(0),
  retryScheduled: z.number().int().min(0),
  failed: z.number().int().min(0),
  cancelled: z.number().int().min(0),
  staleLeases: z.number().int().min(0),
});

export const acquisitionQueueHealthQuerySchema = z.object({
  platform: z.string().min(1).max(40).optional(),
  provider: z.string().min(1).max(80).optional(),
});

export const acquisitionQueueHealthSchema = z.object({
  backend: acquisitionQueueBackendSchema,
  status: acquisitionQueueStatusSchema,
  operationsVisible: z.boolean(),
  scope: acquisitionQueueHealthQuerySchema,
  counts: acquisitionQueueCountsSchema,
  workerSummary: acquisitionWorkerSummarySchema,
  providerGates: z.array(acquisitionProviderLimitStateSchema),
  recommendations: z.array(acquisitionQueueRecommendationSchema),
  caveat: z.literal(ACQUISITION_QUEUE_CAVEAT),
  generatedAt: z.number().int(),
});

export const acquisitionWorkerHealthQuerySchema = z.object({
  status: acquisitionWorkerStatusSchema.optional(),
  backend: acquisitionQueueBackendSchema.optional(),
});

export const acquisitionWorkerHealthSchema = z.object({
  workers: z.array(acquisitionWorkerHeartbeatSchema),
  summary: acquisitionWorkerSummarySchema,
  caveat: z.literal(ACQUISITION_QUEUE_CAVEAT),
  generatedAt: z.number().int(),
});

export const acquisitionAttemptSummarySchema = z.object({
  id: z.string(),
  provider: z.string(),
  source: z.string(),
  status: z.string(),
  failureReason: z.string().nullable(),
  durationMs: z.number().int().min(0),
  confidence: z.number().nullable(),
  httpStatus: z.number().int().nullable(),
  timestamp: z.number().int(),
  diagnostics: queueSafeMetadataSchema.optional(),
});

export const acquisitionProductJobStateSchema = z.object({
  id: z.string(),
  productId: z.string(),
  status: acquisitionJobStatusSchema,
  priority: z.number().int(),
  attemptCount: z.number().int().min(0),
  maxAttempts: z.number().int().min(1),
  nextRunAt: z.number().int(),
  leaseOwner: z.string().nullable(),
  leaseExpiresAt: z.number().int().nullable(),
  lastAttemptId: z.string().nullable(),
  lastFailureReason: z.string().nullable(),
  createdAt: z.number().int(),
  updatedAt: z.number().int(),
  completedAt: z.number().int().nullable(),
  retryable: z.boolean(),
  cancellable: z.boolean(),
  delayReason: z.string().nullable(),
  metadata: queueSafeMetadataSchema.optional(),
});

export const acquisitionProductJobDiagnosticsSchema = z.object({
  productId: z.string(),
  job: acquisitionProductJobStateSchema.nullable(),
  latestAttempt: acquisitionAttemptSummarySchema.nullable(),
  providerGate: acquisitionProviderLimitStateSchema.nullable(),
  recommendations: z.array(acquisitionQueueRecommendationSchema),
  caveat: z.literal(ACQUISITION_QUEUE_CAVEAT),
  generatedAt: z.number().int(),
});

export const acquisitionProductJobDiagnosticsQuerySchema = z.object({
  includeAttempts: z.coerce.boolean().default(true),
});

export const acquisitionJobRetryRequestSchema = z.object({
  jobId: z.string().min(1).max(120),
  reason: z.string().trim().min(1).max(120).optional(),
  operatorNote: z.string().trim().max(500).optional(),
});

export const acquisitionJobCancelRequestSchema = z.object({
  jobId: z.string().min(1).max(120),
  reason: z.string().trim().min(1).max(120),
  operatorNote: z.string().trim().max(500).optional(),
});

export const acquisitionJobControlResponseSchema = z.object({
  action: acquisitionJobControlActionSchema,
  result: acquisitionJobControlResultSchema,
  job: acquisitionProductJobStateSchema.nullable(),
  message: z.string().min(1).max(500),
  caveat: z.literal(ACQUISITION_QUEUE_CAVEAT),
});

export const acquisitionProviderQueueStatusSchema = z.object({
  providerGates: z.array(acquisitionProviderLimitStateSchema),
  caveat: z.literal(ACQUISITION_QUEUE_CAVEAT),
  generatedAt: z.number().int(),
});

export type QueueSafeMetadata = z.infer<typeof queueSafeMetadataSchema>;
export type AcquisitionQueueBackend = z.infer<
  typeof acquisitionQueueBackendSchema
>;
export type AcquisitionQueueStatus = z.infer<
  typeof acquisitionQueueStatusSchema
>;
export type AcquisitionWorkerStatus = z.infer<
  typeof acquisitionWorkerStatusSchema
>;
export type AcquisitionProviderGateStatus = z.infer<
  typeof acquisitionProviderGateStatusSchema
>;
export type AcquisitionProviderLimitState = z.infer<
  typeof acquisitionProviderLimitStateSchema
>;
export type AcquisitionWorkerHeartbeat = z.infer<
  typeof acquisitionWorkerHeartbeatSchema
>;
export type AcquisitionWorkerSummary = z.infer<
  typeof acquisitionWorkerSummarySchema
>;
export type AcquisitionQueueHealth = z.infer<
  typeof acquisitionQueueHealthSchema
>;
export type AcquisitionWorkerHealth = z.infer<
  typeof acquisitionWorkerHealthSchema
>;
export type AcquisitionProductJobDiagnostics = z.infer<
  typeof acquisitionProductJobDiagnosticsSchema
>;
export type AcquisitionJobRetryRequest = z.infer<
  typeof acquisitionJobRetryRequestSchema
>;
export type AcquisitionJobCancelRequest = z.infer<
  typeof acquisitionJobCancelRequestSchema
>;
export type AcquisitionJobControlResponse = z.infer<
  typeof acquisitionJobControlResponseSchema
>;
export type AcquisitionProviderQueueStatus = z.infer<
  typeof acquisitionProviderQueueStatusSchema
>;
