import {
  AcquisitionDiagnostics,
  AcquisitionFailureReason,
  AcquisitionFallbackType,
  AcquisitionProvider,
  AcquisitionRootCause,
  AcquisitionSource,
} from '../types';

const MAX_MESSAGE_LENGTH = 240;
const MAX_SUMMARY_LENGTH = 500;
const REDACTION = '[redacted]';

const SENSITIVE_PATTERNS = [
  /api[_-]?key\s*[:=]\s*[^&\s"'<>]+/gi,
  /(api_key=)[^&\s]+/gi,
  /(key=)[^&\s]+/gi,
  /client[_-]?id\s*[:=]\s*[^&\s"'<>]+/gi,
  /client[_-]?secret\s*[:=]\s*[^&\s"'<>]+/gi,
  /access[_-]?token\s*[:=]\s*[^&\s"'<>]+/gi,
  /(client_id=)[^&\s]+/gi,
  /(client_secret=)[^&\s]+/gi,
  /(access_token=)[^&\s]+/gi,
  /(token=)[^&\s]+/gi,
  /(authorization\s*[:=]\s*)(?:Bearer\s+)?[^\s,;]+/gi,
  /(bearer\s+)[A-Za-z0-9._~+/=-]+/gi,
  /AKIA[0-9A-Z]{16}/g,
];

type DiagnosticPrimitive = string | number | boolean | null;

export interface ProviderFailureDiagnostic {
  provider: AcquisitionProvider;
  source: AcquisitionSource;
  failureReason?: AcquisitionFailureReason;
  rootCause?: AcquisitionRootCause;
  error?: string;
  providerErrorCode?: string;
  marketplace?: string;
  durationMs?: number;
}

export interface SafeProviderDiagnosticInput extends AcquisitionDiagnostics {
  providerFailures?: ProviderFailureDiagnostic[];
  fallbackProviders?: AcquisitionProvider[];
}

function redactSensitiveText(value: string): string {
  let sanitized = value;
  for (const pattern of SENSITIVE_PATTERNS) {
    sanitized = sanitized.replace(pattern, (_match, prefix) =>
      typeof prefix === 'string' ? `${prefix}${REDACTION}` : REDACTION
    );
  }
  return sanitized
    .replace(/https?:\/\/[^\s"'<>]+/gi, (url) => sanitizeUrl(url) ?? REDACTION)
    .replace(/<[^>]*>/g, '')
    .slice(0, MAX_MESSAGE_LENGTH);
}

export function sanitizeUrl(value: unknown): string | undefined {
  if (typeof value !== 'string' || value.length === 0) return undefined;

  try {
    const url = new URL(value);
    return `${url.origin}${url.pathname}`;
  } catch {
    return undefined;
  }
}

function primitive(value: unknown): DiagnosticPrimitive | undefined {
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    value === null
  ) {
    return value;
  }
  return undefined;
}

function text(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0
    ? redactSensitiveText(value)
    : undefined;
}

const ROOT_CAUSES = new Set<AcquisitionRootCause>([
  'missing_api_key',
  'missing_credentials',
  'invalid_key',
  'auth_failed',
  'quota_exhausted',
  'rate_limited',
  'marketplace_mismatch',
  'captcha_or_blocked',
  'selector_drift',
  'cache_only',
  'insufficient_history',
  'network_timeout',
  'not_found',
  'price_missing',
  'unsupported_platform',
  'unsupported_product',
  'unsupported_url',
  'unknown',
  'insufficient_diagnostics',
]);

const FALLBACK_TYPES = new Set<AcquisitionFallbackType>([
  'primary_live',
  'browser_fallback',
  'cache_fallback',
  'all_failed',
]);

export function isAcquisitionRootCause(
  value: unknown
): value is AcquisitionRootCause {
  return typeof value === 'string' && ROOT_CAUSES.has(value as AcquisitionRootCause);
}

export function isAcquisitionFallbackType(
  value: unknown
): value is AcquisitionFallbackType {
  return (
    typeof value === 'string' &&
    FALLBACK_TYPES.has(value as AcquisitionFallbackType)
  );
}

export function rootCauseFromFailureReason(
  failureReason?: AcquisitionFailureReason
): AcquisitionRootCause {
  switch (failureReason) {
    case 'network_timeout':
      return 'network_timeout';
    case 'blocked':
    case 'captcha':
    case 'geo_restricted':
      return 'captcha_or_blocked';
    case 'selector_drift':
      return 'selector_drift';
    case 'not_found':
      return 'not_found';
    case 'price_missing':
      return 'price_missing';
    case 'unsupported_platform':
      return 'unsupported_platform';
    case 'unsupported_product':
      return 'unsupported_product';
    case 'provider_unavailable':
      return 'insufficient_diagnostics';
    case 'unsupported_url':
      return 'unsupported_url';
    case 'unknown':
    default:
      return 'unknown';
  }
}

export function rootCauseFromProviderCode(
  providerErrorCode: unknown,
  fallbackReason?: AcquisitionFailureReason
): AcquisitionRootCause {
  if (isAcquisitionRootCause(providerErrorCode)) {
    return providerErrorCode;
  }

  switch (providerErrorCode) {
    case 'auth_or_key_invalid':
      return 'invalid_key';
    case 'missing_credentials':
      return 'missing_credentials';
    case 'auth_failed':
      return 'auth_failed';
    case 'quota_or_rate_limit':
      return 'quota_exhausted';
    case 'rate_limited':
      return 'rate_limited';
    case 'asin_missing':
      return 'insufficient_diagnostics';
    case 'unsupported_url':
      return 'unsupported_url';
    case 'unsupported_product':
      return 'unsupported_product';
    default:
      if (providerErrorCode != null) {
        const fallbackRootCause = rootCauseFromFailureReason(fallbackReason);
        return fallbackRootCause === 'unknown'
          ? 'insufficient_diagnostics'
          : fallbackRootCause;
      }
      return rootCauseFromFailureReason(fallbackReason);
  }
}

function summarizeUnknown(value: unknown): string | undefined {
  if (value == null) return undefined;
  if (typeof value === 'string') return redactSensitiveText(value);

  try {
    return redactSensitiveText(JSON.stringify(value)).slice(0, MAX_SUMMARY_LENGTH);
  } catch {
    return undefined;
  }
}

function sanitizeProviderFailures(
  failures: unknown
): ProviderFailureDiagnostic[] | undefined {
  if (!Array.isArray(failures)) return undefined;

  const safeFailures = failures
    .map((failure) => {
      if (!failure || typeof failure !== 'object') return null;
      const record = failure as Record<string, unknown>;
      const provider = record.provider;
      const source = record.source;
      if (typeof provider !== 'string' || typeof source !== 'string') {
        return null;
      }
      const safeFailure = {
        provider: provider as AcquisitionProvider,
        source: source as AcquisitionSource,
        failureReason:
          typeof record.failureReason === 'string'
            ? (record.failureReason as AcquisitionFailureReason)
            : undefined,
        rootCause: isAcquisitionRootCause(record.rootCause)
          ? record.rootCause
          : rootCauseFromProviderCode(record.providerErrorCode, record.failureReason as
              | AcquisitionFailureReason
              | undefined),
        error: text(record.error),
        providerErrorCode: text(record.providerErrorCode),
        marketplace: text(record.marketplace),
        durationMs:
          typeof record.durationMs === 'number' ? record.durationMs : undefined,
      };
      return Object.fromEntries(
        Object.entries(safeFailure).filter(([, value]) => value !== undefined)
      ) as unknown as ProviderFailureDiagnostic;
    })
    .filter((failure): failure is ProviderFailureDiagnostic => failure !== null);

  return safeFailures.length > 0 ? safeFailures : undefined;
}

export function sanitizeProviderDiagnostics(
  diagnostics: AcquisitionDiagnostics | undefined
): AcquisitionDiagnostics | undefined {
  if (!diagnostics) return undefined;

  const safe: AcquisitionDiagnostics = {};
  const copyText = (key: string) => {
    const value = text(diagnostics[key]);
    if (value !== undefined) safe[key] = value;
  };
  const copyPrimitive = (key: string) => {
    const value = primitive(diagnostics[key]);
    if (value !== undefined) safe[key] = value;
  };

  copyText('providerErrorCode');
  copyText('providerMessage');
  copyText('message');
  copyText('sanitizedMessage');
  copyText('detectedState');
  copyText('marketplace');
  copyText('ebayItemId');
  copyText('legacyItemId');
  copyText('itemIdKind');
  copyText('keepaAsin');
  copyText('pageTitle');
  copyText('degradedReason');
  copyText('healthHint');
  copyText('failureCategory');
  copyText('selectorVersion');
  copyPrimitive('httpStatus');
  copyPrimitive('creditsUsed');
  copyPrimitive('creditsRemaining');
  copyPrimitive('durationMs');
  copyPrimitive('freshnessMs');
  copyPrimitive('windowDays');
  copyPrimitive('tokensLeft');
  copyPrimitive('refillIn');
  copyPrimitive('primaryProviderFailed');
  copyPrimitive('cacheFallback');
  copyPrimitive('degraded');

  const rootCause = isAcquisitionRootCause(diagnostics.rootCause)
    ? diagnostics.rootCause
    : rootCauseFromProviderCode(
        diagnostics.providerErrorCode,
        diagnostics.failureReason as AcquisitionFailureReason | undefined
      );
  if (rootCause) safe.rootCause = rootCause;

  if (isAcquisitionFallbackType(diagnostics.fallbackType)) {
    safe.fallbackType = diagnostics.fallbackType;
  }

  const finalUrl = sanitizeUrl(diagnostics.finalUrl);
  if (finalUrl) safe.finalUrl = finalUrl;

  const listingUrl = sanitizeUrl(diagnostics.listingUrl);
  if (listingUrl) safe.listingUrl = listingUrl;

  const errorsSummary =
    text(diagnostics.providerErrorsSummary) ??
    summarizeUnknown(diagnostics.providerErrors);
  if (errorsSummary) safe.providerErrorsSummary = errorsSummary;

  const providerFailures = sanitizeProviderFailures(diagnostics.providerFailures);
  if (providerFailures) safe.providerFailures = providerFailures;

  if (Array.isArray(diagnostics.fallbackProviders)) {
    safe.fallbackProviders = diagnostics.fallbackProviders
      .filter((provider): provider is AcquisitionProvider => typeof provider === 'string')
      .slice(0, 5);
  }

  return Object.keys(safe).length > 0 ? safe : undefined;
}

export function mergeProviderDiagnostics(
  ...diagnosticsList: Array<AcquisitionDiagnostics | undefined>
): AcquisitionDiagnostics | undefined {
  const merged = diagnosticsList.reduce<AcquisitionDiagnostics>(
    (acc, diagnostics) => ({ ...acc, ...(diagnostics ?? {}) }),
    {}
  );
  return sanitizeProviderDiagnostics(merged);
}
