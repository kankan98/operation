import "server-only";

import { randomUUID } from "node:crypto";

import {
  AuthGuardError,
  AUTH_TEAM_ID_HEADER_NAME,
  AUTH_TENANT_ID_HEADER_NAME,
  authContextToDataAccessContext,
  readAuthSessionReferenceFromRequestCookie,
  resolveAuthContextFromRequestCookie,
  toAuthGuardError,
  type AuthCookieRequestLike,
  type AuthGuardErrorCode,
  type AuthPermission,
  type AuthSessionRepository,
} from "../auth";
import {
  AiProviderError,
  isAiProviderError,
  type AiProviderErrorCode,
  type AiProviderPort,
} from "../ai-provider";
import {
  AiReviewExecutionError,
  executeAiReviewRun,
  isAiReviewExecutionError,
  type ExecuteAiReviewRunInput,
} from "./execution";
import type { AiReviewLiveModelStatus } from "./live-model-gate";
import {
  AiReviewRunError,
  createAiReviewRunRepository,
  type CreateAiReviewDownstreamArtifactInput,
  type CreateAiReviewPromptVersionInput,
  type ListAiReviewRunsInput,
  type PrepareAiReviewRunInput,
  type RecordAiReviewDecisionInput,
  type RecordAiReviewFeedbackSignalInput,
} from "./repository";

export const AI_REVIEW_MUTATION_CSRF_HEADER_NAME = "x-operation-csrf";
export const AI_REVIEW_MUTATION_CSRF_HEADER_VALUE = "ai-review";

type AiReviewRouteRepository = ReturnType<typeof createAiReviewRunRepository>;

type AiReviewRouteErrorCode =
  | AuthGuardErrorCode
  | AiProviderErrorCode
  | AiReviewRunError["code"]
  | AiReviewExecutionError["code"]
  | "AI_REVIEW_LIVE_MODEL_DISABLED"
  | "AUTH_SCOPE_REQUIRED"
  | "CSRF_HEADER_REQUIRED"
  | "RUN_ID_REQUIRED";

type AiReviewRouteErrorBody = {
  ok: false;
  code: AiReviewRouteErrorCode;
  requestId: string;
  retryable: boolean;
  userMessage: string;
};

type AiReviewRouteSuccessBody = {
  ok: true;
  requestId: string;
} & Record<string, unknown>;

type AiReviewRouteBody = AiReviewRouteErrorBody | AiReviewRouteSuccessBody;

type RouteRunParams = {
  runId?: string | null;
};

type ExecuteRouteBody = {
  promptVersionId?: string;
  providerPolicy?: ExecuteAiReviewRunInput["providerPolicy"];
  maxTokens?: number;
  temperature?: number;
};

type AiReviewRunExecuteRouteOptions = {
  liveModelStatus?: AiReviewLiveModelStatus;
};

function getRequestId(request: Request): string {
  const requestId = request.headers.get("x-request-id")?.trim();

  if (requestId) {
    return requestId;
  }

  return `ai_review_route_${randomUUID()}`;
}

function createJsonResponse(body: AiReviewRouteBody, status: number): Response {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

function firstPresent(
  ...values: Array<string | null | undefined>
): string | null {
  for (const value of values) {
    const trimmed = value?.trim();

    if (trimmed) {
      return trimmed;
    }
  }

  return null;
}

function readAiReviewRouteScope(request: Request):
  | {
      tenantId: string;
      teamId: string;
    }
  | null {
  const url = new URL(request.url);
  const tenantId = firstPresent(
    url.searchParams.get("tenantId"),
    request.headers.get(AUTH_TENANT_ID_HEADER_NAME),
  );
  const teamId = firstPresent(
    url.searchParams.get("teamId"),
    request.headers.get(AUTH_TEAM_ID_HEADER_NAME),
  );

  if (!tenantId || !teamId) {
    return null;
  }

  return {
    tenantId,
    teamId,
  };
}

function readRouteRunId(params: RouteRunParams): string | null {
  return firstPresent(params.runId);
}

function routeStatusForAuthError(code: AuthGuardErrorCode): number {
  switch (code) {
    case "AUTH_CONTEXT_INVALID":
      return 400;
    case "UNAUTHENTICATED":
    case "SESSION_EXPIRED":
    case "SESSION_REVOKED":
      return 401;
    case "TENANT_NOT_FOUND":
    case "TEAM_NOT_FOUND":
    case "MEMBERSHIP_INACTIVE":
    case "FORBIDDEN_PERMISSION":
    case "FORBIDDEN_ROLE":
    case "FORBIDDEN_SCOPE":
      return 403;
    case "AUTH_OPERATION_FAILED":
      return 500;
  }
}

function routeStatusForProviderError(code: AiProviderErrorCode): number {
  switch (code) {
    case "AI_PROVIDER_CONFIG_MISSING":
    case "AI_PROVIDER_CONFIG_INVALID":
      return 503;
    case "AI_PROVIDER_INVALID_REQUEST":
      return 400;
    case "AI_PROVIDER_AUTH_FAILED":
    case "AI_PROVIDER_QUOTA_EXCEEDED":
      return 503;
    case "AI_PROVIDER_RATE_LIMITED":
      return 429;
    case "AI_PROVIDER_TIMEOUT":
    case "AI_PROVIDER_UNAVAILABLE":
      return 503;
    case "AI_PROVIDER_REFUSAL":
    case "AI_PROVIDER_EMPTY_OUTPUT":
    case "PARTIAL_MODEL_OUTPUT":
    case "AI_PROVIDER_MALFORMED_JSON":
    case "AI_PROVIDER_SCHEMA_MISMATCH":
      return 422;
  }
}

function routeStatusForLiveModelStatus(
  code: AiReviewLiveModelStatus["code"],
): number {
  switch (code) {
    case "AI_REVIEW_LIVE_MODEL_READY":
      return 200;
    case "AI_REVIEW_LIVE_MODEL_DISABLED":
      return 403;
    case "AI_PROVIDER_CONFIG_MISSING":
    case "AI_PROVIDER_CONFIG_INVALID":
      return 503;
  }
}

function routeStatusForAiReviewRunError(
  code: AiReviewRunError["code"],
): number {
  switch (code) {
    case "VALIDATION_ERROR":
    case "MISSING_SESSION_SNAPSHOT":
    case "KNOWLEDGE_SNAPSHOT_UNAVAILABLE":
      return 400;
    case "FORBIDDEN_PERMISSION":
      return 403;
    case "NOT_FOUND":
      return 404;
    case "LONG_INPUT_LIMIT_EXCEEDED":
      return 413;
    case "STATE_TRANSITION_INVALID":
    case "REGENERATION_NOT_ALLOWED":
      return 409;
    case "SESSION_NOT_REVIEW_READY":
    case "SENSITIVE_DATA_NEEDS_REVIEW":
    case "STALE_KNOWLEDGE_BLOCKED":
    case "CONFLICTING_KNOWLEDGE_BLOCKED":
    case "INSUFFICIENT_EVIDENCE":
    case "PROMPT_VERSION_INACTIVE":
    case "PROVIDER_UNAVAILABLE":
    case "PROVIDER_TIMEOUT":
    case "PROVIDER_RATE_LIMITED":
    case "MODEL_REFUSAL":
    case "PARTIAL_MODEL_OUTPUT":
    case "AI_OUTPUT_SCHEMA_MISMATCH":
    case "AI_OUTPUT_POLICY_BLOCKED":
    case "REVIEW_REQUIRED":
      return 422;
    case "DATABASE_OPERATION_FAILED":
      return 500;
  }
}

function routeStatusForExecutionError(
  code: AiReviewExecutionError["code"],
): number {
  switch (code) {
    case "MISSING_RUN_SNAPSHOT":
    case "MISSING_PROMPT_VERSION":
    case "MISSING_PROVIDER_POLICY":
      return 400;
    case "RUN_NOT_EXECUTABLE":
      return 409;
    case "PROVIDER_AUTH_FAILED":
    case "PROVIDER_QUOTA_EXCEEDED":
    case "PROVIDER_TIMEOUT":
    case "PROVIDER_RATE_LIMITED":
    case "PROVIDER_UNAVAILABLE":
      return 503;
    case "MODEL_REFUSAL":
    case "AI_OUTPUT_EMPTY":
    case "AI_OUTPUT_MALFORMED":
    case "AI_OUTPUT_SCHEMA_MISMATCH":
    case "AI_OUTPUT_POLICY_BLOCKED":
    case "PARTIAL_MODEL_OUTPUT":
    case "SENSITIVE_DATA_NEEDS_REVIEW":
    case "SESSION_NOT_REVIEW_READY":
    case "WEAK_SESSION_INPUT":
    case "STALE_KNOWLEDGE_BLOCKED":
    case "CONFLICTING_KNOWLEDGE_BLOCKED":
    case "INSUFFICIENT_EVIDENCE":
      return 422;
    default:
      return routeStatusForAiReviewRunError(code as AiReviewRunError["code"]);
  }
}

function routeErrorBody(
  code: AiReviewRouteErrorCode,
  requestId: string,
  userMessage: string,
  retryable = false,
): AiReviewRouteErrorBody {
  return {
    ok: false,
    code,
    requestId,
    retryable,
    userMessage,
  };
}

function authErrorBody(error: AuthGuardError): AiReviewRouteErrorBody {
  return {
    ok: false,
    code: error.code,
    requestId: error.requestId,
    retryable: error.retryable,
    userMessage: error.userMessage,
  };
}

function aiReviewRunErrorBody(
  error: AiReviewRunError,
  requestId: string,
): AiReviewRouteErrorBody {
  return routeErrorBody(
    error.code,
    requestId,
    userMessageForAiReviewRunError(error.code),
    error.code === "DATABASE_OPERATION_FAILED",
  );
}

function aiReviewExecutionErrorBody(
  error: AiReviewExecutionError,
  requestId: string,
): AiReviewRouteErrorBody {
  return routeErrorBody(
    error.code,
    error.requestId ?? requestId,
    userMessageForExecutionError(error.code),
    error.retryable,
  );
}

function providerErrorBody(
  error: AiProviderError,
  requestId: string,
): AiReviewRouteErrorBody {
  return routeErrorBody(
    error.code,
    error.requestId ?? requestId,
    userMessageForProviderError(error.code),
    error.retryable,
  );
}

function liveModelStatusErrorBody(
  status: AiReviewLiveModelStatus,
  requestId: string,
): AiReviewRouteErrorBody {
  const code: AiReviewRouteErrorCode =
    status.code === "AI_REVIEW_LIVE_MODEL_READY"
      ? "AI_REVIEW_LIVE_MODEL_DISABLED"
      : status.code === "AI_REVIEW_LIVE_MODEL_DISABLED"
        ? "AI_REVIEW_LIVE_MODEL_DISABLED"
        : status.code;

  return routeErrorBody(
    code,
    requestId,
    status.userMessage,
    false,
  );
}

function userMessageForProviderError(code: AiProviderErrorCode): string {
  switch (code) {
    case "AI_PROVIDER_CONFIG_MISSING":
    case "AI_PROVIDER_CONFIG_INVALID":
      return "AI 服务配置暂不可用";
    case "AI_PROVIDER_INVALID_REQUEST":
      return "AI 请求信息不完整";
    case "AI_PROVIDER_AUTH_FAILED":
    case "AI_PROVIDER_QUOTA_EXCEEDED":
      return "AI 服务暂不可用";
    case "AI_PROVIDER_RATE_LIMITED":
      return "AI 服务繁忙，请稍后重试";
    case "AI_PROVIDER_TIMEOUT":
      return "AI 复盘生成超时，请稍后重试";
    case "AI_PROVIDER_UNAVAILABLE":
      return "AI 服务暂时不可用";
    case "AI_PROVIDER_REFUSAL":
      return "AI 暂不能生成该复盘";
    case "AI_PROVIDER_EMPTY_OUTPUT":
    case "PARTIAL_MODEL_OUTPUT":
    case "AI_PROVIDER_MALFORMED_JSON":
    case "AI_PROVIDER_SCHEMA_MISMATCH":
      return "AI 返回内容暂不能用于审核";
  }
}

function userMessageForExecutionError(
  code: AiReviewExecutionError["code"],
): string {
  switch (code) {
    case "MISSING_RUN_SNAPSHOT":
      return "复盘缺少输入快照";
    case "MISSING_PROMPT_VERSION":
      return "复盘缺少提示词版本";
    case "MISSING_PROVIDER_POLICY":
      return "复盘缺少 AI 服务策略";
    case "RUN_NOT_EXECUTABLE":
      return "当前复盘状态暂不能生成";
    case "PROVIDER_AUTH_FAILED":
    case "PROVIDER_QUOTA_EXCEEDED":
    case "PROVIDER_UNAVAILABLE":
      return "AI 服务暂时不可用";
    case "PROVIDER_TIMEOUT":
      return "AI 复盘生成超时，请稍后重试";
    case "PROVIDER_RATE_LIMITED":
      return "AI 服务繁忙，请稍后重试";
    case "MODEL_REFUSAL":
      return "AI 暂不能生成该复盘";
    case "PARTIAL_MODEL_OUTPUT":
    case "AI_OUTPUT_EMPTY":
    case "AI_OUTPUT_MALFORMED":
    case "AI_OUTPUT_SCHEMA_MISMATCH":
    case "AI_OUTPUT_POLICY_BLOCKED":
      return "AI 返回内容暂不能用于审核";
    case "SENSITIVE_DATA_NEEDS_REVIEW":
      return "复盘输入需要先脱敏";
    case "LONG_INPUT_LIMIT_EXCEEDED":
      return "复盘输入过长，请先整理后再生成";
    case "SESSION_NOT_REVIEW_READY":
      return "场次尚未准备好复盘";
    case "WEAK_SESSION_INPUT":
      return "场次信息不足，暂不能生成复盘";
    case "STALE_KNOWLEDGE_BLOCKED":
      return "知识来源已过期，请先复核";
    case "CONFLICTING_KNOWLEDGE_BLOCKED":
      return "知识存在冲突，请先处理";
    case "INSUFFICIENT_EVIDENCE":
      return "已审核知识不足，暂不能生成复盘";
    default:
      return userMessageForAiReviewRunError(code as AiReviewRunError["code"]);
  }
}

function userMessageForAiReviewRunError(
  code: AiReviewRunError["code"],
): string {
  switch (code) {
    case "VALIDATION_ERROR":
      return "请检查 AI 复盘信息";
    case "MISSING_SESSION_SNAPSHOT":
      return "缺少场次输入快照";
    case "SESSION_NOT_REVIEW_READY":
      return "场次尚未准备好复盘";
    case "SENSITIVE_DATA_NEEDS_REVIEW":
      return "复盘输入需要先脱敏";
    case "LONG_INPUT_LIMIT_EXCEEDED":
      return "复盘输入过长，请先整理后再生成";
    case "KNOWLEDGE_SNAPSHOT_UNAVAILABLE":
      return "知识快照不可用";
    case "STALE_KNOWLEDGE_BLOCKED":
      return "知识来源已过期，请先复核";
    case "CONFLICTING_KNOWLEDGE_BLOCKED":
      return "知识存在冲突，请先处理";
    case "INSUFFICIENT_EVIDENCE":
      return "已审核知识不足，暂不能生成复盘";
    case "PROMPT_VERSION_INACTIVE":
      return "提示词版本尚未启用";
    case "PROVIDER_UNAVAILABLE":
      return "AI 服务暂时不可用";
    case "PROVIDER_TIMEOUT":
      return "AI 复盘生成超时，请稍后重试";
    case "PROVIDER_RATE_LIMITED":
      return "AI 服务繁忙，请稍后重试";
    case "MODEL_REFUSAL":
      return "AI 暂不能生成该复盘";
    case "PARTIAL_MODEL_OUTPUT":
    case "AI_OUTPUT_SCHEMA_MISMATCH":
    case "AI_OUTPUT_POLICY_BLOCKED":
      return "AI 返回内容暂不能用于审核";
    case "REGENERATION_NOT_ALLOWED":
      return "当前复盘暂不能重新生成";
    case "STATE_TRANSITION_INVALID":
      return "当前复盘状态暂不能执行该操作";
    case "FORBIDDEN_PERMISSION":
      return "需要 AI 复盘权限";
    case "NOT_FOUND":
      return "未找到该复盘记录";
    case "REVIEW_REQUIRED":
      return "该建议需要先人工审核";
    case "DATABASE_OPERATION_FAILED":
      return "AI 复盘暂时不可用";
  }
}

function toSafeRouteError(
  error: unknown,
  requestId: string,
): {
  status: number;
  body: AiReviewRouteErrorBody;
} {
  if (error instanceof AiReviewRunError) {
    return {
      status: routeStatusForAiReviewRunError(error.code),
      body: aiReviewRunErrorBody(error, requestId),
    };
  }

  if (isAiReviewExecutionError(error)) {
    return {
      status: routeStatusForExecutionError(error.code),
      body: aiReviewExecutionErrorBody(error, requestId),
    };
  }

  if (isAiProviderError(error)) {
    return {
      status: routeStatusForProviderError(error.code),
      body: providerErrorBody(error, requestId),
    };
  }

  const authError = toAuthGuardError(error, requestId);

  return {
    status: routeStatusForAuthError(authError.code),
    body: authErrorBody(authError),
  };
}

function readStringArrayQuery(
  url: URL,
  name: string,
): string[] | undefined {
  const values = url.searchParams
    .getAll(name)
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter(Boolean);

  return values.length > 0 ? values : undefined;
}

function readListInput(request: Request): ListAiReviewRunsInput {
  const url = new URL(request.url);
  const limitValue = url.searchParams.get("limit");

  return {
    status: readStringArrayQuery(
      url,
      "status",
    ) as ListAiReviewRunsInput["status"],
    limit: limitValue ? Number(limitValue) : undefined,
  };
}

async function readJsonObject(request: Request): Promise<Record<string, unknown>> {
  try {
    const body = await request.json();

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      throw new Error("Request body must be an object");
    }

    return body as Record<string, unknown>;
  } catch (error) {
    throw new AiReviewRunError(
      "VALIDATION_ERROR",
      "AI review route request body is malformed",
      { cause: error },
    );
  }
}

async function readPromptVersionInput(
  request: Request,
): Promise<CreateAiReviewPromptVersionInput> {
  return (await readJsonObject(request)) as CreateAiReviewPromptVersionInput;
}

async function readPrepareRunInput(
  request: Request,
): Promise<PrepareAiReviewRunInput> {
  return (await readJsonObject(request)) as PrepareAiReviewRunInput;
}

async function readExecuteInput(
  request: Request,
  runId: string,
): Promise<ExecuteRouteBody & { runId: string }> {
  return {
    ...(await readJsonObject(request)),
    runId,
  } as ExecuteRouteBody & { runId: string };
}

async function readDecisionInput(
  request: Request,
  runId: string,
): Promise<RecordAiReviewDecisionInput> {
  return {
    ...(await readJsonObject(request)),
    runId,
  } as RecordAiReviewDecisionInput;
}

async function readFeedbackInput(
  request: Request,
  runId: string,
): Promise<RecordAiReviewFeedbackSignalInput> {
  return {
    ...(await readJsonObject(request)),
    runId,
  } as RecordAiReviewFeedbackSignalInput;
}

async function readDownstreamArtifactInput(
  request: Request,
  runId: string,
): Promise<CreateAiReviewDownstreamArtifactInput> {
  return {
    ...(await readJsonObject(request)),
    runId,
  } as CreateAiReviewDownstreamArtifactInput;
}

function hasAiReviewMutationCsrfHeader(request: Request): boolean {
  return (
    request.headers.get(AI_REVIEW_MUTATION_CSRF_HEADER_NAME) ===
    AI_REVIEW_MUTATION_CSRF_HEADER_VALUE
  );
}

async function resolveDataAccessContext(input: {
  authRepository: AuthSessionRepository;
  request: Request & AuthCookieRequestLike;
  requestId: string;
  requiredPermission: AuthPermission;
  route: string;
  targetId?: string;
}) {
  const scope = readAiReviewRouteScope(input.request);

  if (!scope) {
    throw new AuthGuardError(
      "AUTH_CONTEXT_INVALID",
      "AI review route requires tenant and team scope",
      {
        requestId: input.requestId,
        userMessage: "请选择团队后再继续",
      },
    );
  }

  const resolution = await resolveAuthContextFromRequestCookie(
    input.authRepository,
    input.request,
    {
      requestId: input.requestId,
      tenantId: scope.tenantId,
      teamId: scope.teamId,
      requiredPermission: input.requiredPermission,
      target: {
        tenantId: scope.tenantId,
        teamId: scope.teamId,
        type: "ai_review_run",
        id: input.targetId,
      },
      metadata: {
        route: input.route,
      },
    },
  );

  return authContextToDataAccessContext(resolution.context);
}

function requireMutationCsrf(request: Request, requestId: string) {
  if (!hasAiReviewMutationCsrfHeader(request)) {
    return createJsonResponse(
      routeErrorBody(
        "CSRF_HEADER_REQUIRED",
        requestId,
        "请求无效，请刷新后重试",
      ),
      403,
    );
  }

  return null;
}

function requireAuthCookie(request: Request, requestId: string) {
  if (!readAuthSessionReferenceFromRequestCookie(request)) {
    return createJsonResponse(
      routeErrorBody("UNAUTHENTICATED", requestId, "请先登录"),
      401,
    );
  }

  return null;
}

function requireRouteScope(request: Request, requestId: string) {
  if (!readAiReviewRouteScope(request)) {
    return createJsonResponse(
      routeErrorBody("AUTH_SCOPE_REQUIRED", requestId, "请选择团队后再继续"),
      400,
    );
  }

  return null;
}

function requireRepositories(
  authRepository: AuthSessionRepository | null,
  aiReviewRepository: AiReviewRouteRepository | null,
  requestId: string,
) {
  if (!authRepository || !aiReviewRepository) {
    return createJsonResponse(
      routeErrorBody("AUTH_OPERATION_FAILED", requestId, "权限校验暂时失败"),
      500,
    );
  }

  return null;
}

function requireProvider(provider: AiProviderPort | null, requestId: string) {
  if (!provider) {
    return createJsonResponse(
      routeErrorBody(
        "AI_PROVIDER_CONFIG_MISSING",
        requestId,
        "AI 服务配置暂不可用",
        true,
      ),
      503,
    );
  }

  return null;
}

function preflightRead(input: {
  authRepository: AuthSessionRepository | null;
  aiReviewRepository: AiReviewRouteRepository | null;
  request: Request;
  requestId: string;
}) {
  return (
    requireAuthCookie(input.request, input.requestId) ??
    requireRouteScope(input.request, input.requestId) ??
    requireRepositories(
      input.authRepository,
      input.aiReviewRepository,
      input.requestId,
    )
  );
}

function preflightMutation(input: {
  authRepository: AuthSessionRepository | null;
  aiReviewRepository: AiReviewRouteRepository | null;
  request: Request;
  requestId: string;
}) {
  return (
    requireMutationCsrf(input.request, input.requestId) ??
    requireAuthCookie(input.request, input.requestId) ??
    requireRouteScope(input.request, input.requestId) ??
    requireRepositories(
      input.authRepository,
      input.aiReviewRepository,
      input.requestId,
    )
  );
}

function preflightExecute(input: {
  authRepository: AuthSessionRepository | null;
  aiReviewRepository: AiReviewRouteRepository | null;
  request: Request;
  requestId: string;
}) {
  return preflightMutation(input);
}

export async function handleAiReviewPromptVersionsCreateRoute(
  authRepository: AuthSessionRepository | null,
  aiReviewRepository: AiReviewRouteRepository | null,
  request: Request & AuthCookieRequestLike,
): Promise<Response> {
  const requestId = getRequestId(request);
  const preflight = preflightMutation({
    authRepository,
    aiReviewRepository,
    request,
    requestId,
  });

  if (preflight) {
    return preflight;
  }

  try {
    const context = await resolveDataAccessContext({
      authRepository: authRepository!,
      request,
      requestId,
      requiredPermission: "run_ai_review",
      route: "/api/ai-review/prompt-versions",
    });
    const promptVersion = await aiReviewRepository!.createPromptVersion(
      context,
      await readPromptVersionInput(request),
    );

    return createJsonResponse(
      {
        ok: true,
        requestId,
        promptVersion,
      },
      201,
    );
  } catch (error) {
    const safeError = toSafeRouteError(error, requestId);

    return createJsonResponse(safeError.body, safeError.status);
  }
}

export async function handleAiReviewRunsListRoute(
  authRepository: AuthSessionRepository | null,
  aiReviewRepository: AiReviewRouteRepository | null,
  request: Request & AuthCookieRequestLike,
): Promise<Response> {
  const requestId = getRequestId(request);
  const preflight = preflightRead({
    authRepository,
    aiReviewRepository,
    request,
    requestId,
  });

  if (preflight) {
    return preflight;
  }

  try {
    const context = await resolveDataAccessContext({
      authRepository: authRepository!,
      request,
      requestId,
      requiredPermission: "read_workspace",
      route: "/api/ai-review/runs",
    });
    const result = await aiReviewRepository!.listRuns(
      context,
      readListInput(request),
    );

    return createJsonResponse(
      {
        ok: true,
        requestId,
        runs: result.items,
      },
      200,
    );
  } catch (error) {
    const safeError = toSafeRouteError(error, requestId);

    return createJsonResponse(safeError.body, safeError.status);
  }
}

export async function handleAiReviewLiveModelStatusRoute(
  authRepository: AuthSessionRepository | null,
  request: Request & AuthCookieRequestLike,
  status: AiReviewLiveModelStatus,
): Promise<Response> {
  const requestId = getRequestId(request);

  const preflight =
    requireAuthCookie(request, requestId) ??
    requireRouteScope(request, requestId) ??
    (!authRepository
      ? createJsonResponse(
          routeErrorBody("AUTH_OPERATION_FAILED", requestId, "权限校验暂时失败"),
          500,
        )
      : null);

  if (preflight) {
    return preflight;
  }

  try {
    await resolveDataAccessContext({
      authRepository: authRepository!,
      request,
      requestId,
      requiredPermission: "read_workspace",
      route: "/api/ai-review/live-model/status",
    });

    return createJsonResponse(
      {
        ok: true,
        requestId,
        liveModel: status,
      },
      200,
    );
  } catch (error) {
    const safeError = toSafeRouteError(error, requestId);

    return createJsonResponse(safeError.body, safeError.status);
  }
}

export async function handleAiReviewRunsCreateRoute(
  authRepository: AuthSessionRepository | null,
  aiReviewRepository: AiReviewRouteRepository | null,
  request: Request & AuthCookieRequestLike,
): Promise<Response> {
  const requestId = getRequestId(request);
  const preflight = preflightMutation({
    authRepository,
    aiReviewRepository,
    request,
    requestId,
  });

  if (preflight) {
    return preflight;
  }

  try {
    const context = await resolveDataAccessContext({
      authRepository: authRepository!,
      request,
      requestId,
      requiredPermission: "run_ai_review",
      route: "/api/ai-review/runs",
    });
    const run = await aiReviewRepository!.prepareRun(
      context,
      await readPrepareRunInput(request),
    );

    return createJsonResponse(
      {
        ok: true,
        requestId,
        run,
      },
      201,
    );
  } catch (error) {
    const safeError = toSafeRouteError(error, requestId);

    return createJsonResponse(safeError.body, safeError.status);
  }
}

export async function handleAiReviewRunDetailRoute(
  authRepository: AuthSessionRepository | null,
  aiReviewRepository: AiReviewRouteRepository | null,
  request: Request & AuthCookieRequestLike,
  params: RouteRunParams,
): Promise<Response> {
  const requestId = getRequestId(request);
  const runId = readRouteRunId(params);
  const preflight = preflightRead({
    authRepository,
    aiReviewRepository,
    request,
    requestId,
  });

  if (preflight) {
    return preflight;
  }

  if (!runId) {
    return createJsonResponse(
      routeErrorBody("RUN_ID_REQUIRED", requestId, "缺少 AI 复盘记录"),
      400,
    );
  }

  try {
    const context = await resolveDataAccessContext({
      authRepository: authRepository!,
      request,
      requestId,
      requiredPermission: "read_workspace",
      route: "/api/ai-review/runs/[runId]",
      targetId: runId,
    });
    const detail = await aiReviewRepository!.getRun(context, { runId });

    return createJsonResponse(
      {
        ok: true,
        requestId,
        detail,
      },
      200,
    );
  } catch (error) {
    const safeError = toSafeRouteError(error, requestId);

    return createJsonResponse(safeError.body, safeError.status);
  }
}

export async function handleAiReviewRunExecuteRoute(
  authRepository: AuthSessionRepository | null,
  aiReviewRepository: AiReviewRouteRepository | null,
  provider: AiProviderPort | null,
  request: Request & AuthCookieRequestLike,
  params: RouteRunParams,
  options: AiReviewRunExecuteRouteOptions = {},
): Promise<Response> {
  const requestId = getRequestId(request);
  const runId = readRouteRunId(params);
  const preflight = preflightExecute({
    authRepository,
    aiReviewRepository,
    request,
    requestId,
  });

  if (preflight) {
    return preflight;
  }

  if (!runId) {
    return createJsonResponse(
      routeErrorBody("RUN_ID_REQUIRED", requestId, "缺少 AI 复盘记录"),
      400,
    );
  }

  if (options.liveModelStatus && !options.liveModelStatus.ready) {
    return createJsonResponse(
      liveModelStatusErrorBody(options.liveModelStatus, requestId),
      routeStatusForLiveModelStatus(options.liveModelStatus.code),
    );
  }

  const providerPreflight = requireProvider(provider, requestId);
  if (providerPreflight) {
    return providerPreflight;
  }

  try {
    const context = await resolveDataAccessContext({
      authRepository: authRepository!,
      request,
      requestId,
      requiredPermission: "run_ai_review",
      route: "/api/ai-review/runs/[runId]/execute",
      targetId: runId,
    });
    const executeInput = await readExecuteInput(request, runId);
    const result = await executeAiReviewRun({
      context,
      repository: aiReviewRepository!,
      provider: provider!,
      runId,
      promptVersionId: executeInput.promptVersionId,
      providerPolicy: executeInput.providerPolicy,
      maxTokens: executeInput.maxTokens,
      temperature: executeInput.temperature,
      requestId,
    });

    return createJsonResponse(
      {
        ok: true,
        requestId,
        result,
      },
      200,
    );
  } catch (error) {
    const safeError = toSafeRouteError(error, requestId);

    return createJsonResponse(safeError.body, safeError.status);
  }
}

export async function handleAiReviewDecisionRoute(
  authRepository: AuthSessionRepository | null,
  aiReviewRepository: AiReviewRouteRepository | null,
  request: Request & AuthCookieRequestLike,
  params: RouteRunParams,
): Promise<Response> {
  const requestId = getRequestId(request);
  const runId = readRouteRunId(params);
  const preflight = preflightMutation({
    authRepository,
    aiReviewRepository,
    request,
    requestId,
  });

  if (preflight) {
    return preflight;
  }

  if (!runId) {
    return createJsonResponse(
      routeErrorBody("RUN_ID_REQUIRED", requestId, "缺少 AI 复盘记录"),
      400,
    );
  }

  try {
    const context = await resolveDataAccessContext({
      authRepository: authRepository!,
      request,
      requestId,
      requiredPermission: "run_ai_review",
      route: "/api/ai-review/runs/[runId]/decisions",
      targetId: runId,
    });
    const decision = await aiReviewRepository!.recordDecision(
      context,
      await readDecisionInput(request, runId),
    );

    return createJsonResponse(
      {
        ok: true,
        requestId,
        decision,
      },
      201,
    );
  } catch (error) {
    const safeError = toSafeRouteError(error, requestId);

    return createJsonResponse(safeError.body, safeError.status);
  }
}

export async function handleAiReviewFeedbackSignalRoute(
  authRepository: AuthSessionRepository | null,
  aiReviewRepository: AiReviewRouteRepository | null,
  request: Request & AuthCookieRequestLike,
  params: RouteRunParams,
): Promise<Response> {
  const requestId = getRequestId(request);
  const runId = readRouteRunId(params);
  const preflight = preflightMutation({
    authRepository,
    aiReviewRepository,
    request,
    requestId,
  });

  if (preflight) {
    return preflight;
  }

  if (!runId) {
    return createJsonResponse(
      routeErrorBody("RUN_ID_REQUIRED", requestId, "缺少 AI 复盘记录"),
      400,
    );
  }

  try {
    const context = await resolveDataAccessContext({
      authRepository: authRepository!,
      request,
      requestId,
      requiredPermission: "run_ai_review",
      route: "/api/ai-review/runs/[runId]/feedback-signals",
      targetId: runId,
    });
    const signal = await aiReviewRepository!.recordFeedbackSignal(
      context,
      await readFeedbackInput(request, runId),
    );

    return createJsonResponse(
      {
        ok: true,
        requestId,
        signal,
      },
      201,
    );
  } catch (error) {
    const safeError = toSafeRouteError(error, requestId);

    return createJsonResponse(safeError.body, safeError.status);
  }
}

export async function handleAiReviewDownstreamArtifactRoute(
  authRepository: AuthSessionRepository | null,
  aiReviewRepository: AiReviewRouteRepository | null,
  request: Request & AuthCookieRequestLike,
  params: RouteRunParams,
): Promise<Response> {
  const requestId = getRequestId(request);
  const runId = readRouteRunId(params);
  const preflight = preflightMutation({
    authRepository,
    aiReviewRepository,
    request,
    requestId,
  });

  if (preflight) {
    return preflight;
  }

  if (!runId) {
    return createJsonResponse(
      routeErrorBody("RUN_ID_REQUIRED", requestId, "缺少 AI 复盘记录"),
      400,
    );
  }

  try {
    const context = await resolveDataAccessContext({
      authRepository: authRepository!,
      request,
      requestId,
      requiredPermission: "run_ai_review",
      route: "/api/ai-review/runs/[runId]/downstream-artifacts",
      targetId: runId,
    });
    const artifact = await aiReviewRepository!.createDownstreamArtifact(
      context,
      await readDownstreamArtifactInput(request, runId),
    );

    return createJsonResponse(
      {
        ok: true,
        requestId,
        artifact,
      },
      201,
    );
  } catch (error) {
    const safeError = toSafeRouteError(error, requestId);

    return createJsonResponse(safeError.body, safeError.status);
  }
}

export async function handleAiReviewRunArchiveRoute(
  authRepository: AuthSessionRepository | null,
  aiReviewRepository: AiReviewRouteRepository | null,
  request: Request & AuthCookieRequestLike,
  params: RouteRunParams,
): Promise<Response> {
  const requestId = getRequestId(request);
  const runId = readRouteRunId(params);
  const preflight = preflightMutation({
    authRepository,
    aiReviewRepository,
    request,
    requestId,
  });

  if (preflight) {
    return preflight;
  }

  if (!runId) {
    return createJsonResponse(
      routeErrorBody("RUN_ID_REQUIRED", requestId, "缺少 AI 复盘记录"),
      400,
    );
  }

  try {
    const context = await resolveDataAccessContext({
      authRepository: authRepository!,
      request,
      requestId,
      requiredPermission: "run_ai_review",
      route: "/api/ai-review/runs/[runId]/archive",
      targetId: runId,
    });
    const run = await aiReviewRepository!.archiveRun(context, { runId });

    return createJsonResponse(
      {
        ok: true,
        requestId,
        run,
      },
      200,
    );
  } catch (error) {
    const safeError = toSafeRouteError(error, requestId);

    return createJsonResponse(safeError.body, safeError.status);
  }
}
