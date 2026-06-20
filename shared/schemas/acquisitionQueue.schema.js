"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.acquisitionProviderQueueStatusSchema = exports.acquisitionJobControlResponseSchema = exports.acquisitionJobCancelRequestSchema = exports.acquisitionJobRetryRequestSchema = exports.acquisitionProductJobDiagnosticsQuerySchema = exports.acquisitionProductJobDiagnosticsSchema = exports.acquisitionProductJobStateSchema = exports.acquisitionAttemptSummarySchema = exports.acquisitionWorkerHealthSchema = exports.acquisitionWorkerHealthQuerySchema = exports.acquisitionQueueHealthSchema = exports.acquisitionQueueHealthQuerySchema = exports.acquisitionQueueCountsSchema = exports.acquisitionWorkerSummarySchema = exports.acquisitionWorkerHeartbeatSchema = exports.acquisitionProviderLimitStateSchema = exports.acquisitionQueueRecommendationSchema = exports.acquisitionJobStatusSchema = exports.acquisitionJobControlResultSchema = exports.acquisitionJobControlActionSchema = exports.acquisitionProviderGateStatusSchema = exports.acquisitionWorkerStatusSchema = exports.acquisitionQueueStatusSchema = exports.acquisitionQueueBackendSchema = exports.queueSafeMetadataSchema = exports.ACQUISITION_QUEUE_MAX_METADATA_BYTES = exports.ACQUISITION_QUEUE_MAX_METADATA_STRING_LENGTH = exports.ACQUISITION_QUEUE_MAX_METADATA_KEYS = exports.ACQUISITION_QUEUE_CAVEAT = void 0;
const zod_1 = require("zod");
exports.ACQUISITION_QUEUE_CAVEAT =
    'Queue health describes acquisition operations only. It is not verified evidence of sales, demand, margin, ROI, or profitability.';
exports.ACQUISITION_QUEUE_MAX_METADATA_KEYS = 20;
exports.ACQUISITION_QUEUE_MAX_METADATA_STRING_LENGTH = 500;
exports.ACQUISITION_QUEUE_MAX_METADATA_BYTES = 4000;
const unsafeMetadataKeyPattern = /(secret|token|api[_-]?key|authorization|cookie|password|credential|redis[_-]?url|raw[_-]?(html|payload|response)|html|payload)/i;
const unsafeMetadataValuePatterns = [
    /redis:\/\/[^:@\s]+:[^@\s]+@/i,
    /authorization\s*[:=]/i,
    /bearer\s+[a-z0-9._~+/=-]+/i,
    /api[_-]?key\s*[:=]/i,
    /cookie\s*[:=]/i,
    /<html[\s>]/i,
    /<!doctype\s+html/i,
];
function pushUnsafeIssue(issues, path, message) {
    issues.push(path ? `${path}: ${message}` : message);
}
function inspectSafeMetadata(value, path, issues, depth) {
    if (depth > 3) {
        pushUnsafeIssue(issues, path, 'metadata nesting is too deep');
        return;
    }
    if (typeof value === 'string') {
        if (value.length > exports.ACQUISITION_QUEUE_MAX_METADATA_STRING_LENGTH) {
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
        if (value.length > exports.ACQUISITION_QUEUE_MAX_METADATA_KEYS) {
            pushUnsafeIssue(issues, path, 'metadata array has too many items');
        }
        value.forEach((item, index) => {
            inspectSafeMetadata(item, `${path}[${index}]`, issues, depth + 1);
        });
        return;
    }
    if (value && typeof value === 'object') {
        const entries = Object.entries(value);
        if (entries.length > exports.ACQUISITION_QUEUE_MAX_METADATA_KEYS) {
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
function safeMetadataIssues(value) {
    const issues = [];
    let serialized = '';
    try {
        serialized = JSON.stringify(value);
    }
    catch {
        issues.push('metadata must be JSON serializable');
    }
    if (serialized.length > exports.ACQUISITION_QUEUE_MAX_METADATA_BYTES) {
        issues.push('metadata payload is too large');
    }
    inspectSafeMetadata(value, '', issues, 0);
    return issues;
}
exports.queueSafeMetadataSchema = zod_1.z
    .record(zod_1.z.unknown())
    .superRefine((value, ctx) => {
    for (const issue of safeMetadataIssues(value)) {
        ctx.addIssue({
            code: zod_1.z.ZodIssueCode.custom,
            message: issue,
        });
    }
});
exports.acquisitionQueueBackendSchema = zod_1.z.enum(['sqlite', 'bullmq']);
exports.acquisitionQueueStatusSchema = zod_1.z.enum([
    'healthy',
    'degraded',
    'unavailable',
    'insufficient_history',
]);
exports.acquisitionWorkerStatusSchema = zod_1.z.enum([
    'starting',
    'idle',
    'busy',
    'stopping',
    'stopped',
    'stale',
]);
exports.acquisitionProviderGateStatusSchema = zod_1.z.enum([
    'open',
    'rate_limited',
    'quota_exhausted',
    'unavailable',
    'disabled',
]);
exports.acquisitionJobControlActionSchema = zod_1.z.enum(['retry', 'cancel']);
exports.acquisitionJobControlResultSchema = zod_1.z.enum([
    'accepted',
    'rejected',
    'noop',
]);
exports.acquisitionJobStatusSchema = zod_1.z.enum([
    'pending',
    'running',
    'succeeded',
    'failed',
    'retry_scheduled',
    'cancelled',
]);
exports.acquisitionQueueRecommendationSchema = zod_1.z.object({
    code: zod_1.z.string().min(1).max(80),
    severity: zod_1.z.enum(['info', 'warning', 'critical']),
    message: zod_1.z.string().min(1).max(500),
});
exports.acquisitionProviderLimitStateSchema = zod_1.z.object({
    platform: zod_1.z.string().min(1).max(40),
    provider: zod_1.z.string().min(1).max(80),
    status: exports.acquisitionProviderGateStatusSchema,
    resetAt: zod_1.z.number().int().nullable().optional(),
    currentConcurrency: zod_1.z.number().int().min(0),
    maxConcurrency: zod_1.z.number().int().min(1),
    activeCount: zod_1.z.number().int().min(0),
    recentRootCauses: zod_1.z.array(zod_1.z.string().min(1).max(120)).max(10),
    recommendations: zod_1.z.array(exports.acquisitionQueueRecommendationSchema).max(8),
    metadata: exports.queueSafeMetadataSchema.optional(),
    updatedAt: zod_1.z.number().int(),
});
exports.acquisitionWorkerHeartbeatSchema = zod_1.z.object({
    workerId: zod_1.z.string().min(1).max(120),
    backend: exports.acquisitionQueueBackendSchema,
    status: exports.acquisitionWorkerStatusSchema,
    concurrency: zod_1.z.number().int().min(1),
    activeJobCount: zod_1.z.number().int().min(0),
    queues: zod_1.z.array(zod_1.z.string().min(1).max(80)).max(10),
    startedAt: zod_1.z.number().int(),
    lastHeartbeatAt: zod_1.z.number().int(),
    stale: zod_1.z.boolean().optional(),
    metadata: exports.queueSafeMetadataSchema.optional(),
});
exports.acquisitionWorkerSummarySchema = zod_1.z.object({
    total: zod_1.z.number().int().min(0),
    healthy: zod_1.z.number().int().min(0),
    stale: zod_1.z.number().int().min(0),
    busy: zod_1.z.number().int().min(0),
    idle: zod_1.z.number().int().min(0),
    capacity: zod_1.z.number().int().min(0),
    activeJobCount: zod_1.z.number().int().min(0),
});
exports.acquisitionQueueCountsSchema = zod_1.z.object({
    backlog: zod_1.z.number().int().min(0),
    pending: zod_1.z.number().int().min(0),
    running: zod_1.z.number().int().min(0),
    retryScheduled: zod_1.z.number().int().min(0),
    failed: zod_1.z.number().int().min(0),
    cancelled: zod_1.z.number().int().min(0),
    staleLeases: zod_1.z.number().int().min(0),
});
exports.acquisitionQueueHealthQuerySchema = zod_1.z.object({
    platform: zod_1.z.string().min(1).max(40).optional(),
    provider: zod_1.z.string().min(1).max(80).optional(),
});
exports.acquisitionQueueHealthSchema = zod_1.z.object({
    backend: exports.acquisitionQueueBackendSchema,
    status: exports.acquisitionQueueStatusSchema,
    scope: exports.acquisitionQueueHealthQuerySchema,
    counts: exports.acquisitionQueueCountsSchema,
    workerSummary: exports.acquisitionWorkerSummarySchema,
    providerGates: zod_1.z.array(exports.acquisitionProviderLimitStateSchema),
    recommendations: zod_1.z.array(exports.acquisitionQueueRecommendationSchema),
    caveat: zod_1.z.literal(exports.ACQUISITION_QUEUE_CAVEAT),
    generatedAt: zod_1.z.number().int(),
});
exports.acquisitionWorkerHealthQuerySchema = zod_1.z.object({
    status: exports.acquisitionWorkerStatusSchema.optional(),
    backend: exports.acquisitionQueueBackendSchema.optional(),
});
exports.acquisitionWorkerHealthSchema = zod_1.z.object({
    workers: zod_1.z.array(exports.acquisitionWorkerHeartbeatSchema),
    summary: exports.acquisitionWorkerSummarySchema,
    caveat: zod_1.z.literal(exports.ACQUISITION_QUEUE_CAVEAT),
    generatedAt: zod_1.z.number().int(),
});
exports.acquisitionAttemptSummarySchema = zod_1.z.object({
    id: zod_1.z.string(),
    provider: zod_1.z.string(),
    source: zod_1.z.string(),
    status: zod_1.z.string(),
    failureReason: zod_1.z.string().nullable(),
    durationMs: zod_1.z.number().int().min(0),
    confidence: zod_1.z.number().nullable(),
    httpStatus: zod_1.z.number().int().nullable(),
    timestamp: zod_1.z.number().int(),
    diagnostics: exports.queueSafeMetadataSchema.optional(),
});
exports.acquisitionProductJobStateSchema = zod_1.z.object({
    id: zod_1.z.string(),
    productId: zod_1.z.string(),
    status: exports.acquisitionJobStatusSchema,
    priority: zod_1.z.number().int(),
    attemptCount: zod_1.z.number().int().min(0),
    maxAttempts: zod_1.z.number().int().min(1),
    nextRunAt: zod_1.z.number().int(),
    leaseOwner: zod_1.z.string().nullable(),
    leaseExpiresAt: zod_1.z.number().int().nullable(),
    lastAttemptId: zod_1.z.string().nullable(),
    lastFailureReason: zod_1.z.string().nullable(),
    createdAt: zod_1.z.number().int(),
    updatedAt: zod_1.z.number().int(),
    completedAt: zod_1.z.number().int().nullable(),
    retryable: zod_1.z.boolean(),
    cancellable: zod_1.z.boolean(),
    delayReason: zod_1.z.string().nullable(),
    metadata: exports.queueSafeMetadataSchema.optional(),
});
exports.acquisitionProductJobDiagnosticsSchema = zod_1.z.object({
    productId: zod_1.z.string(),
    job: exports.acquisitionProductJobStateSchema.nullable(),
    latestAttempt: exports.acquisitionAttemptSummarySchema.nullable(),
    providerGate: exports.acquisitionProviderLimitStateSchema.nullable(),
    recommendations: zod_1.z.array(exports.acquisitionQueueRecommendationSchema),
    caveat: zod_1.z.literal(exports.ACQUISITION_QUEUE_CAVEAT),
    generatedAt: zod_1.z.number().int(),
});
exports.acquisitionProductJobDiagnosticsQuerySchema = zod_1.z.object({
    includeAttempts: zod_1.z.coerce.boolean().default(true),
});
exports.acquisitionJobRetryRequestSchema = zod_1.z.object({
    jobId: zod_1.z.string().min(1).max(120),
    reason: zod_1.z.string().trim().min(1).max(120).optional(),
    operatorNote: zod_1.z.string().trim().max(500).optional(),
});
exports.acquisitionJobCancelRequestSchema = zod_1.z.object({
    jobId: zod_1.z.string().min(1).max(120),
    reason: zod_1.z.string().trim().min(1).max(120),
    operatorNote: zod_1.z.string().trim().max(500).optional(),
});
exports.acquisitionJobControlResponseSchema = zod_1.z.object({
    action: exports.acquisitionJobControlActionSchema,
    result: exports.acquisitionJobControlResultSchema,
    job: exports.acquisitionProductJobStateSchema.nullable(),
    message: zod_1.z.string().min(1).max(500),
    caveat: zod_1.z.literal(exports.ACQUISITION_QUEUE_CAVEAT),
});
exports.acquisitionProviderQueueStatusSchema = zod_1.z.object({
    providerGates: zod_1.z.array(exports.acquisitionProviderLimitStateSchema),
    caveat: zod_1.z.literal(exports.ACQUISITION_QUEUE_CAVEAT),
    generatedAt: zod_1.z.number().int(),
});
