export type DataFoundationErrorCode =
  | "DATABASE_URL_REQUIRED"
  | "DATABASE_ENV_INVALID"
  | "VALIDATION_FAILED"
  | "TENANT_SCOPE_MISMATCH"
  | "DATABASE_OPERATION_FAILED";

export class DataFoundationError extends Error {
  readonly code: DataFoundationErrorCode;
  readonly retryable: boolean;
  readonly details?: Record<string, unknown>;

  constructor(
    code: DataFoundationErrorCode,
    message: string,
    options?: {
      cause?: unknown;
      retryable?: boolean;
      details?: Record<string, unknown>;
    },
  ) {
    super(message, { cause: options?.cause });
    this.name = "DataFoundationError";
    this.code = code;
    this.retryable = options?.retryable ?? false;
    this.details = options?.details;
  }
}

const sensitiveValuePatterns = [
  /postgres(?:ql)?:\/\/[^@\s]+@/gi,
  /(password|passwd|pwd|secret|token|cookie|authorization)=([^&\s]+)/gi,
];

const sensitiveKeyPatterns = [
  /address/i,
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

export function redactErrorMessage(message: string): string {
  return sensitiveValuePatterns.reduce(
    (redacted, pattern) => redacted.replace(pattern, (match) => {
      if (match.startsWith("postgres://") || match.startsWith("postgresql://")) {
        return "postgres://[redacted]@";
      }

      const [key] = match.split("=");
      return `${key}=[redacted]`;
    }),
    message,
  );
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
        return [key, redactErrorMessage(value)];
      }

      return [key, value];
    }),
  );
}

export function toDataFoundationError(error: unknown): DataFoundationError {
  if (error instanceof DataFoundationError) {
    return error;
  }

  if (error instanceof Error) {
    return new DataFoundationError(
      "DATABASE_OPERATION_FAILED",
      redactErrorMessage(error.message),
      {
        cause: error,
        retryable: false,
      },
    );
  }

  return new DataFoundationError(
    "DATABASE_OPERATION_FAILED",
    "Unknown database operation failure",
  );
}
