export type AiProviderErrorCode =
  | "AI_PROVIDER_CONFIG_MISSING"
  | "AI_PROVIDER_CONFIG_INVALID"
  | "AI_PROVIDER_INVALID_REQUEST"
  | "AI_PROVIDER_AUTH_FAILED"
  | "AI_PROVIDER_QUOTA_EXCEEDED"
  | "AI_PROVIDER_RATE_LIMITED"
  | "AI_PROVIDER_UNAVAILABLE"
  | "AI_PROVIDER_TIMEOUT"
  | "AI_PROVIDER_REFUSAL"
  | "AI_PROVIDER_EMPTY_OUTPUT"
  | "PARTIAL_MODEL_OUTPUT"
  | "AI_PROVIDER_MALFORMED_JSON"
  | "AI_PROVIDER_SCHEMA_MISMATCH";

export class AiProviderError extends Error {
  readonly code: AiProviderErrorCode;
  readonly retryable: boolean;
  readonly status?: number;
  readonly requestId?: string;
  readonly details?: Record<string, unknown>;

  constructor(
    code: AiProviderErrorCode,
    message: string,
    options?: {
      cause?: unknown;
      retryable?: boolean;
      status?: number;
      requestId?: string;
      details?: Record<string, unknown>;
    },
  ) {
    super(message, { cause: options?.cause });
    this.name = "AiProviderError";
    this.code = code;
    this.retryable = options?.retryable ?? false;
    this.status = options?.status;
    this.requestId = options?.requestId;
    this.details = redactMetadata(options?.details);
  }
}

const sensitiveValuePatterns = [
  /Bearer\s+[A-Za-z0-9._~+/=-]+/gi,
  /(api[_-]?key|authorization|password|passwd|pwd|secret|token|cookie)=([^&\s]+)/gi,
  /(sk-[A-Za-z0-9_-]{12,})/g,
];

const sensitiveKeyPatterns = [
  /api[_-]?key/i,
  /authorization/i,
  /cookie/i,
  /customer/i,
  /message/i,
  /password/i,
  /phone/i,
  /prompt/i,
  /secret/i,
  /supplier/i,
  /token/i,
  /transcript/i,
];

export function isAiProviderError(error: unknown): error is AiProviderError {
  return error instanceof AiProviderError;
}

export function redactSensitiveText(value: string): string {
  return sensitiveValuePatterns.reduce((redacted, pattern) => {
    return redacted.replace(pattern, (match) => {
      if (/^Bearer\s+/i.test(match)) {
        return "Bearer [redacted]";
      }

      const [key] = match.split("=");

      if (key && key !== match) {
        return `${key}=[redacted]`;
      }

      return "[redacted]";
    });
  }, value);
}

export function redactMetadata(
  metadata: Record<string, unknown> | undefined,
): Record<string, unknown> {
  if (!metadata) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(metadata).map(([key, value]) => {
      if (sensitiveKeyPatterns.some((pattern) => pattern.test(key))) {
        return [key, "[redacted]"];
      }

      if (typeof value === "string") {
        return [key, redactSensitiveText(value)];
      }

      if (Array.isArray(value)) {
        return [
          key,
          value.map((item) =>
            typeof item === "string" ? redactSensitiveText(item) : item,
          ),
        ];
      }

      return [key, value];
    }),
  );
}

