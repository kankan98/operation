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
  type AuthSessionRepository,
} from "../auth";
import {
  createV0TrialFeedbackRepository,
  V0TrialFeedbackError,
  type CreateV0TrialFeedbackInput,
  type ListV0TrialFeedbackInput,
} from "./repository";

export const V0_TRIAL_FEEDBACK_MUTATION_CSRF_HEADER_NAME = "x-operation-csrf";
export const V0_TRIAL_FEEDBACK_MUTATION_CSRF_HEADER_VALUE =
  "v0-trial-feedback";

type V0TrialFeedbackRouteRepository = ReturnType<
  typeof createV0TrialFeedbackRepository
>;

type V0TrialFeedbackRouteErrorCode =
  | AuthGuardErrorCode
  | "AUTH_SCOPE_REQUIRED"
  | "CSRF_HEADER_REQUIRED"
  | V0TrialFeedbackError["code"];

type V0TrialFeedbackRouteErrorBody = {
  ok: false;
  code: V0TrialFeedbackRouteErrorCode;
  requestId: string;
  retryable: boolean;
  userMessage: string;
};

type V0TrialFeedbackRouteSuccessBody = {
  ok: true;
  requestId: string;
} & Record<string, unknown>;

type V0TrialFeedbackRouteBody =
  | V0TrialFeedbackRouteErrorBody
  | V0TrialFeedbackRouteSuccessBody;

function getRequestId(request: Request): string {
  const requestId = request.headers.get("x-request-id")?.trim();

  if (requestId) {
    return requestId;
  }

  return `trial_feedback_route_${randomUUID()}`;
}

function createJsonResponse(
  body: V0TrialFeedbackRouteBody,
  status: number,
): Response {
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

function readTrialFeedbackRouteScope(request: Request):
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

function routeStatusForFeedbackError(
  code: V0TrialFeedbackError["code"],
): number {
  switch (code) {
    case "VALIDATION_ERROR":
      return 400;
    case "LONG_INPUT_LIMIT_EXCEEDED":
      return 413;
    case "FORBIDDEN_PERMISSION":
      return 403;
    case "SENSITIVE_DATA_BLOCKED":
      return 422;
    case "DATABASE_OPERATION_FAILED":
      return 500;
  }
}

function routeErrorBody(
  code: V0TrialFeedbackRouteErrorCode,
  requestId: string,
  userMessage: string,
): V0TrialFeedbackRouteErrorBody {
  return {
    ok: false,
    code,
    requestId,
    retryable: false,
    userMessage,
  };
}

function authErrorBody(error: AuthGuardError): V0TrialFeedbackRouteErrorBody {
  return {
    ok: false,
    code: error.code,
    requestId: error.requestId,
    retryable: error.retryable,
    userMessage: error.userMessage,
  };
}

function feedbackErrorBody(
  error: V0TrialFeedbackError,
  requestId: string,
): V0TrialFeedbackRouteErrorBody {
  return {
    ok: false,
    code: error.code,
    requestId,
    retryable: error.code === "DATABASE_OPERATION_FAILED",
    userMessage: userMessageForFeedbackError(error.code),
  };
}

function userMessageForFeedbackError(
  code: V0TrialFeedbackError["code"],
): string {
  switch (code) {
    case "VALIDATION_ERROR":
      return "请检查反馈内容";
    case "LONG_INPUT_LIMIT_EXCEEDED":
      return "反馈备注过长，请精简后再提交";
    case "FORBIDDEN_PERMISSION":
      return "需要试用团队访问权限";
    case "SENSITIVE_DATA_BLOCKED":
      return "反馈里包含敏感信息，请删除后再提交";
    case "DATABASE_OPERATION_FAILED":
      return "反馈暂时不可用";
  }
}

function toSafeRouteError(
  error: unknown,
  requestId: string,
): {
  status: number;
  body: V0TrialFeedbackRouteErrorBody;
} {
  if (error instanceof V0TrialFeedbackError) {
    return {
      status: routeStatusForFeedbackError(error.code),
      body: feedbackErrorBody(error, requestId),
    };
  }

  const authError = toAuthGuardError(error, requestId);

  return {
    status: routeStatusForAuthError(authError.code),
    body: authErrorBody(authError),
  };
}

function readListInput(request: Request): ListV0TrialFeedbackInput {
  const url = new URL(request.url);
  const workbench = firstPresent(url.searchParams.get("workbench"));
  const issueType = firstPresent(url.searchParams.get("issueType"));
  const limitValue = url.searchParams.get("limit");

  return {
    workbench: (workbench ?? undefined) as ListV0TrialFeedbackInput["workbench"],
    issueType: (issueType ?? undefined) as ListV0TrialFeedbackInput["issueType"],
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
    throw new V0TrialFeedbackError(
      "VALIDATION_ERROR",
      "V0 trial feedback route request body is malformed",
      { cause: error },
    );
  }
}

async function readCreateInput(
  request: Request,
): Promise<CreateV0TrialFeedbackInput> {
  return (await readJsonObject(request)) as CreateV0TrialFeedbackInput;
}

function hasTrialFeedbackMutationCsrfHeader(request: Request): boolean {
  return (
    request.headers.get(V0_TRIAL_FEEDBACK_MUTATION_CSRF_HEADER_NAME) ===
    V0_TRIAL_FEEDBACK_MUTATION_CSRF_HEADER_VALUE
  );
}

async function resolveDataAccessContext(input: {
  authRepository: AuthSessionRepository;
  request: Request & AuthCookieRequestLike;
  requestId: string;
  route: string;
}) {
  const scope = readTrialFeedbackRouteScope(input.request);

  if (!scope) {
    throw new AuthGuardError(
      "AUTH_CONTEXT_INVALID",
      "V0 trial feedback route requires tenant and team scope",
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
      requiredPermission: "read_workspace",
      target: {
        tenantId: scope.tenantId,
        teamId: scope.teamId,
        type: "v0_trial_feedback",
      },
      metadata: {
        route: input.route,
      },
    },
  );

  return authContextToDataAccessContext(resolution.context);
}

function requireMutationCsrf(request: Request, requestId: string) {
  if (!hasTrialFeedbackMutationCsrfHeader(request)) {
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
      routeErrorBody("UNAUTHENTICATED", requestId, "请先进入试用"),
      401,
    );
  }

  return null;
}

function requireRouteScope(request: Request, requestId: string) {
  if (!readTrialFeedbackRouteScope(request)) {
    return createJsonResponse(
      routeErrorBody("AUTH_SCOPE_REQUIRED", requestId, "请选择团队后再继续"),
      400,
    );
  }

  return null;
}

function requireRepositories(
  authRepository: AuthSessionRepository | null,
  feedbackRepository: V0TrialFeedbackRouteRepository | null,
  requestId: string,
) {
  if (!authRepository || !feedbackRepository) {
    return createJsonResponse(
      routeErrorBody("AUTH_OPERATION_FAILED", requestId, "权限校验暂时失败"),
      500,
    );
  }

  return null;
}

function preflightRead(input: {
  authRepository: AuthSessionRepository | null;
  feedbackRepository: V0TrialFeedbackRouteRepository | null;
  request: Request;
  requestId: string;
}) {
  return (
    requireAuthCookie(input.request, input.requestId) ??
    requireRouteScope(input.request, input.requestId) ??
    requireRepositories(
      input.authRepository,
      input.feedbackRepository,
      input.requestId,
    )
  );
}

function preflightMutation(input: {
  authRepository: AuthSessionRepository | null;
  feedbackRepository: V0TrialFeedbackRouteRepository | null;
  request: Request;
  requestId: string;
}) {
  return (
    requireMutationCsrf(input.request, input.requestId) ??
    requireAuthCookie(input.request, input.requestId) ??
    requireRouteScope(input.request, input.requestId) ??
    requireRepositories(
      input.authRepository,
      input.feedbackRepository,
      input.requestId,
    )
  );
}

export async function handleV0TrialFeedbackListRoute(
  authRepository: AuthSessionRepository | null,
  feedbackRepository: V0TrialFeedbackRouteRepository | null,
  request: Request & AuthCookieRequestLike,
): Promise<Response> {
  const requestId = getRequestId(request);
  const preflight = preflightRead({
    authRepository,
    feedbackRepository,
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
      route: "/api/trial-feedback",
    });
    const result = await feedbackRepository!.listFeedback(
      context,
      readListInput(request),
    );

    return createJsonResponse(
      {
        ok: true,
        requestId,
        feedback: result.items,
        summary: result.summary,
      },
      200,
    );
  } catch (error) {
    const safeError = toSafeRouteError(error, requestId);

    return createJsonResponse(safeError.body, safeError.status);
  }
}

export async function handleV0TrialFeedbackCreateRoute(
  authRepository: AuthSessionRepository | null,
  feedbackRepository: V0TrialFeedbackRouteRepository | null,
  request: Request & AuthCookieRequestLike,
): Promise<Response> {
  const requestId = getRequestId(request);
  const preflight = preflightMutation({
    authRepository,
    feedbackRepository,
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
      route: "/api/trial-feedback",
    });
    const feedback = await feedbackRepository!.createFeedback(
      context,
      await readCreateInput(request),
    );

    return createJsonResponse(
      {
        ok: true,
        requestId,
        feedback,
      },
      201,
    );
  } catch (error) {
    const safeError = toSafeRouteError(error, requestId);

    return createJsonResponse(safeError.body, safeError.status);
  }
}
