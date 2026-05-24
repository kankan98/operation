import type {
  AuthGuardErrorCode,
  AuthorizationDecision,
} from "./types";

const sensitiveKeyPatterns = [
  /authorization/i,
  /callback/i,
  /cookie/i,
  /customer/i,
  /invitation/i,
  /message/i,
  /password/i,
  /phone/i,
  /prompt/i,
  /provider/i,
  /secret/i,
  /session/i,
  /token/i,
  /transcript/i,
];

export class AuthGuardError extends Error {
  readonly code: AuthGuardErrorCode;
  readonly requestId: string;
  readonly retryable: boolean;
  readonly userMessage: string;
  readonly details?: Record<string, unknown>;

  constructor(
    code: AuthGuardErrorCode,
    message: string,
    options: {
      requestId: string;
      userMessage?: string;
      retryable?: boolean;
      details?: Record<string, unknown>;
      cause?: unknown;
    },
  ) {
    super(message, { cause: options.cause });
    this.name = "AuthGuardError";
    this.code = code;
    this.requestId = options.requestId;
    this.retryable = options.retryable ?? false;
    this.userMessage = options.userMessage ?? userMessageForCode(code);
    this.details = redactAuthMetadata(options.details);
  }
}

export function userMessageForCode(code: AuthGuardErrorCode): string {
  switch (code) {
    case "AUTH_CONTEXT_INVALID":
    case "UNAUTHENTICATED":
      return "请先登录";
    case "SESSION_EXPIRED":
      return "登录已过期，请重新登录";
    case "SESSION_REVOKED":
      return "登录状态已失效，请重新登录";
    case "TENANT_NOT_FOUND":
    case "TEAM_NOT_FOUND":
    case "FORBIDDEN_SCOPE":
      return "暂不能访问该团队数据";
    case "MEMBERSHIP_INACTIVE":
      return "团队成员状态不可用";
    case "FORBIDDEN_PERMISSION":
    case "FORBIDDEN_ROLE":
      return "需要更高权限";
    case "AUTH_OPERATION_FAILED":
      return "权限校验暂时失败";
  }
}

export function redactAuthMetadata(
  metadata: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
  if (!metadata) {
    return metadata;
  }

  return redactAuthValue(metadata) as Record<string, unknown>;
}

function redactAuthValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(redactAuthValue);
  }

  if (value && typeof value === "object") {
    if (value instanceof Date) {
      return value;
    }

    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => {
        if (sensitiveKeyPatterns.some((pattern) => pattern.test(key))) {
          return [key, "[redacted]"];
        }

        return [key, redactAuthValue(item)];
      }),
    );
  }

  return value;
}

export function toAuthorizationDecision(error: AuthGuardError): AuthorizationDecision {
  return {
    allowed: false,
    code: error.code,
    requestId: error.requestId,
    retryable: error.retryable,
    userMessage: error.userMessage,
    details: error.details,
  };
}

export function toAuthGuardError(
  error: unknown,
  requestId: string,
): AuthGuardError {
  if (error instanceof AuthGuardError) {
    return error;
  }

  if (error instanceof Error) {
    return new AuthGuardError(
      "AUTH_OPERATION_FAILED",
      "Auth guard operation failed",
      {
        requestId,
        cause: error,
        details: {
          message: error.message,
        },
      },
    );
  }

  return new AuthGuardError(
    "AUTH_OPERATION_FAILED",
    "Unknown auth guard operation failure",
    {
      requestId,
    },
  );
}
