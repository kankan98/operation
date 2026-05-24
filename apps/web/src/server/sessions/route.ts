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
  createSessionCaptureRepository,
  SessionCaptureError,
  type AutosaveSessionDraftInput,
  type CreateSessionCaptureInput,
  type ListSessionCapturesInput,
  type SubmitSessionCaptureInput,
} from "./repository";

export const SESSION_CAPTURE_MUTATION_CSRF_HEADER_NAME = "x-operation-csrf";
export const SESSION_CAPTURE_MUTATION_CSRF_HEADER_VALUE = "session-captures";

type SessionCaptureRouteRepository = ReturnType<
  typeof createSessionCaptureRepository
>;

type SessionCaptureRouteErrorCode =
  | AuthGuardErrorCode
  | "AUTH_SCOPE_REQUIRED"
  | "CSRF_HEADER_REQUIRED"
  | "SESSION_ID_REQUIRED"
  | SessionCaptureError["code"];

type SessionCaptureRouteErrorBody = {
  ok: false;
  code: SessionCaptureRouteErrorCode;
  requestId: string;
  retryable: boolean;
  userMessage: string;
};

type SessionCaptureRouteListBody =
  | SessionCaptureRouteErrorBody
  | {
      ok: true;
      requestId: string;
      sessions: Awaited<
        ReturnType<SessionCaptureRouteRepository["listSessionCaptures"]>
      >["items"];
    };

type SessionCaptureRouteSingleBody =
  | SessionCaptureRouteErrorBody
  | {
      ok: true;
      requestId: string;
      session: Awaited<
        ReturnType<SessionCaptureRouteRepository["createSessionCapture"]>
      >;
    };

type RouteSessionParams = {
  sessionId?: string | null;
};

function getRequestId(request: Request): string {
  const requestId = request.headers.get("x-request-id")?.trim();

  if (requestId) {
    return requestId;
  }

  return `sessions_route_${randomUUID()}`;
}

function createJsonResponse(
  body: SessionCaptureRouteListBody | SessionCaptureRouteSingleBody,
  status: number,
): Response {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

function firstPresent(...values: Array<string | null | undefined>): string | null {
  for (const value of values) {
    const trimmed = value?.trim();

    if (trimmed) {
      return trimmed;
    }
  }

  return null;
}

function readSessionRouteScope(request: Request):
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

function readRouteSessionId(params: RouteSessionParams): string | null {
  return firstPresent(params.sessionId);
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

function routeStatusForSessionError(code: SessionCaptureError["code"]): number {
  switch (code) {
    case "VALIDATION_ERROR":
      return 400;
    case "LONG_INPUT_LIMIT_EXCEEDED":
      return 413;
    case "FORBIDDEN_PERMISSION":
      return 403;
    case "DUPLICATE_SESSION_LABEL":
    case "STALE_DRAFT_VERSION":
      return 409;
    case "MISSING_REQUIRED_FIELD":
    case "SENSITIVE_DATA_NEEDS_REVIEW":
    case "STATE_TRANSITION_INVALID":
      return 422;
    case "NOT_FOUND":
      return 404;
    case "DATABASE_OPERATION_FAILED":
      return 500;
  }
}

function routeErrorBody(
  code: SessionCaptureRouteErrorCode,
  requestId: string,
  userMessage: string,
): SessionCaptureRouteErrorBody {
  return {
    ok: false,
    code,
    requestId,
    retryable: false,
    userMessage,
  };
}

function authErrorBody(error: AuthGuardError): SessionCaptureRouteErrorBody {
  return {
    ok: false,
    code: error.code,
    requestId: error.requestId,
    retryable: error.retryable,
    userMessage: error.userMessage,
  };
}

function sessionErrorBody(
  error: SessionCaptureError,
  requestId: string,
): SessionCaptureRouteErrorBody {
  return {
    ok: false,
    code: error.code,
    requestId,
    retryable: error.code === "DATABASE_OPERATION_FAILED",
    userMessage: userMessageForSessionError(error.code),
  };
}

function userMessageForSessionError(
  code: SessionCaptureError["code"],
): string {
  switch (code) {
    case "VALIDATION_ERROR":
      return "请检查场次信息";
    case "LONG_INPUT_LIMIT_EXCEEDED":
      return "场次内容过长，请拆分后再保存";
    case "FORBIDDEN_PERMISSION":
      return "需要场次采集权限";
    case "DUPLICATE_SESSION_LABEL":
      return "当天已存在同名场次";
    case "STALE_DRAFT_VERSION":
      return "草稿已更新，请刷新后再保存";
    case "MISSING_REQUIRED_FIELD":
      return "请先补齐主播和商品顺序";
    case "SENSITIVE_DATA_NEEDS_REVIEW":
      return "敏感内容需要先审核";
    case "NOT_FOUND":
      return "未找到该场次记录";
    case "STATE_TRANSITION_INVALID":
      return "当前状态暂不能执行该操作";
    case "DATABASE_OPERATION_FAILED":
      return "场次采集暂时不可用";
  }
}

function toSafeRouteError(
  error: unknown,
  requestId: string,
): {
  status: number;
  body: SessionCaptureRouteErrorBody;
} {
  if (error instanceof SessionCaptureError) {
    return {
      status: routeStatusForSessionError(error.code),
      body: sessionErrorBody(error, requestId),
    };
  }

  const authError = toAuthGuardError(error, requestId);

  return {
    status: routeStatusForAuthError(authError.code),
    body: authErrorBody(authError),
  };
}

function readListInput(request: Request): ListSessionCapturesInput {
  const url = new URL(request.url);
  const statusValues = url.searchParams
    .getAll("status")
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter(Boolean);
  const search = url.searchParams.get("search")?.trim();
  const limitValue = url.searchParams.get("limit");

  return {
    status:
      statusValues.length > 0
        ? (statusValues as ListSessionCapturesInput["status"])
        : undefined,
    search: search || undefined,
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
    throw new SessionCaptureError(
      "VALIDATION_ERROR",
      "Session capture request body is malformed",
      { cause: error },
    );
  }
}

async function readCreateInput(
  request: Request,
): Promise<CreateSessionCaptureInput> {
  return (await readJsonObject(request)) as CreateSessionCaptureInput;
}

async function readAutosaveInput(
  request: Request,
  sessionId: string,
): Promise<AutosaveSessionDraftInput> {
  return {
    ...(await readJsonObject(request)),
    sessionId,
  } as AutosaveSessionDraftInput;
}

async function readSubmitInput(
  request: Request,
  sessionId: string,
): Promise<SubmitSessionCaptureInput> {
  return {
    ...(await readJsonObject(request)),
    sessionId,
  } as SubmitSessionCaptureInput;
}

function hasSessionMutationCsrfHeader(request: Request): boolean {
  return (
    request.headers.get(SESSION_CAPTURE_MUTATION_CSRF_HEADER_NAME) ===
    SESSION_CAPTURE_MUTATION_CSRF_HEADER_VALUE
  );
}

async function resolveDataAccessContext(input: {
  authRepository: AuthSessionRepository;
  request: Request & AuthCookieRequestLike;
  requestId: string;
  requiredPermission: AuthPermission;
  route: string;
}) {
  const scope = readSessionRouteScope(input.request);

  if (!scope) {
    throw new AuthGuardError(
      "AUTH_CONTEXT_INVALID",
      "Session capture route requires tenant and team scope",
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
        type: "session_captures",
      },
      metadata: {
        route: input.route,
      },
    },
  );

  return authContextToDataAccessContext(resolution.context);
}

export async function handleSessionCapturesListRoute(
  authRepository: AuthSessionRepository | null,
  sessionRepository: SessionCaptureRouteRepository | null,
  request: Request & AuthCookieRequestLike,
): Promise<Response> {
  const requestId = getRequestId(request);

  if (!readAuthSessionReferenceFromRequestCookie(request)) {
    return createJsonResponse(
      routeErrorBody("UNAUTHENTICATED", requestId, "请先登录"),
      401,
    );
  }

  if (!readSessionRouteScope(request)) {
    return createJsonResponse(
      routeErrorBody("AUTH_SCOPE_REQUIRED", requestId, "请选择团队后再继续"),
      400,
    );
  }

  if (!authRepository || !sessionRepository) {
    return createJsonResponse(
      routeErrorBody("AUTH_OPERATION_FAILED", requestId, "权限校验暂时失败"),
      500,
    );
  }

  try {
    const context = await resolveDataAccessContext({
      authRepository,
      request,
      requestId,
      requiredPermission: "read_workspace",
      route: "/api/sessions/captures",
    });
    const result = await sessionRepository.listSessionCaptures(
      context,
      readListInput(request),
    );

    return createJsonResponse(
      {
        ok: true,
        requestId,
        sessions: result.items,
      },
      200,
    );
  } catch (error) {
    const safeError = toSafeRouteError(error, requestId);

    return createJsonResponse(safeError.body, safeError.status);
  }
}

export async function handleSessionCapturesCreateRoute(
  authRepository: AuthSessionRepository | null,
  sessionRepository: SessionCaptureRouteRepository | null,
  request: Request & AuthCookieRequestLike,
): Promise<Response> {
  const requestId = getRequestId(request);

  if (!hasSessionMutationCsrfHeader(request)) {
    return createJsonResponse(
      routeErrorBody(
        "CSRF_HEADER_REQUIRED",
        requestId,
        "请求无效，请刷新后重试",
      ),
      403,
    );
  }

  if (!readAuthSessionReferenceFromRequestCookie(request)) {
    return createJsonResponse(
      routeErrorBody("UNAUTHENTICATED", requestId, "请先登录"),
      401,
    );
  }

  if (!readSessionRouteScope(request)) {
    return createJsonResponse(
      routeErrorBody("AUTH_SCOPE_REQUIRED", requestId, "请选择团队后再继续"),
      400,
    );
  }

  if (!authRepository || !sessionRepository) {
    return createJsonResponse(
      routeErrorBody("AUTH_OPERATION_FAILED", requestId, "权限校验暂时失败"),
      500,
    );
  }

  try {
    const context = await resolveDataAccessContext({
      authRepository,
      request,
      requestId,
      requiredPermission: "capture_session",
      route: "/api/sessions/captures",
    });
    const session = await sessionRepository.createSessionCapture(
      context,
      await readCreateInput(request),
    );

    return createJsonResponse(
      {
        ok: true,
        requestId,
        session,
      },
      201,
    );
  } catch (error) {
    const safeError = toSafeRouteError(error, requestId);

    return createJsonResponse(safeError.body, safeError.status);
  }
}

export async function handleSessionCaptureDetailRoute(
  authRepository: AuthSessionRepository | null,
  sessionRepository: SessionCaptureRouteRepository | null,
  request: Request & AuthCookieRequestLike,
  params: RouteSessionParams,
): Promise<Response> {
  const requestId = getRequestId(request);
  const sessionId = readRouteSessionId(params);

  if (!readAuthSessionReferenceFromRequestCookie(request)) {
    return createJsonResponse(
      routeErrorBody("UNAUTHENTICATED", requestId, "请先登录"),
      401,
    );
  }

  if (!readSessionRouteScope(request)) {
    return createJsonResponse(
      routeErrorBody("AUTH_SCOPE_REQUIRED", requestId, "请选择团队后再继续"),
      400,
    );
  }

  if (!sessionId) {
    return createJsonResponse(
      routeErrorBody("SESSION_ID_REQUIRED", requestId, "缺少场次记录"),
      400,
    );
  }

  if (!authRepository || !sessionRepository) {
    return createJsonResponse(
      routeErrorBody("AUTH_OPERATION_FAILED", requestId, "权限校验暂时失败"),
      500,
    );
  }

  try {
    const context = await resolveDataAccessContext({
      authRepository,
      request,
      requestId,
      requiredPermission: "read_workspace",
      route: "/api/sessions/captures/[sessionId]",
    });
    const session = await sessionRepository.getSessionCaptureDetail(context, {
      sessionId,
    });

    return createJsonResponse(
      {
        ok: true,
        requestId,
        session,
      },
      200,
    );
  } catch (error) {
    const safeError = toSafeRouteError(error, requestId);

    return createJsonResponse(safeError.body, safeError.status);
  }
}

export async function handleSessionCaptureDraftAutosaveRoute(
  authRepository: AuthSessionRepository | null,
  sessionRepository: SessionCaptureRouteRepository | null,
  request: Request & AuthCookieRequestLike,
  params: RouteSessionParams,
): Promise<Response> {
  const requestId = getRequestId(request);
  const sessionId = readRouteSessionId(params);

  if (!hasSessionMutationCsrfHeader(request)) {
    return createJsonResponse(
      routeErrorBody(
        "CSRF_HEADER_REQUIRED",
        requestId,
        "请求无效，请刷新后重试",
      ),
      403,
    );
  }

  if (!readAuthSessionReferenceFromRequestCookie(request)) {
    return createJsonResponse(
      routeErrorBody("UNAUTHENTICATED", requestId, "请先登录"),
      401,
    );
  }

  if (!readSessionRouteScope(request)) {
    return createJsonResponse(
      routeErrorBody("AUTH_SCOPE_REQUIRED", requestId, "请选择团队后再继续"),
      400,
    );
  }

  if (!sessionId) {
    return createJsonResponse(
      routeErrorBody("SESSION_ID_REQUIRED", requestId, "缺少场次记录"),
      400,
    );
  }

  if (!authRepository || !sessionRepository) {
    return createJsonResponse(
      routeErrorBody("AUTH_OPERATION_FAILED", requestId, "权限校验暂时失败"),
      500,
    );
  }

  try {
    const context = await resolveDataAccessContext({
      authRepository,
      request,
      requestId,
      requiredPermission: "capture_session",
      route: "/api/sessions/captures/[sessionId]/draft",
    });
    const session = await sessionRepository.autosaveSessionDraft(
      context,
      await readAutosaveInput(request, sessionId),
    );

    return createJsonResponse(
      {
        ok: true,
        requestId,
        session,
      },
      200,
    );
  } catch (error) {
    const safeError = toSafeRouteError(error, requestId);

    return createJsonResponse(safeError.body, safeError.status);
  }
}

export async function handleSessionCaptureSubmitRoute(
  authRepository: AuthSessionRepository | null,
  sessionRepository: SessionCaptureRouteRepository | null,
  request: Request & AuthCookieRequestLike,
  params: RouteSessionParams,
): Promise<Response> {
  const requestId = getRequestId(request);
  const sessionId = readRouteSessionId(params);

  if (!hasSessionMutationCsrfHeader(request)) {
    return createJsonResponse(
      routeErrorBody(
        "CSRF_HEADER_REQUIRED",
        requestId,
        "请求无效，请刷新后重试",
      ),
      403,
    );
  }

  if (!readAuthSessionReferenceFromRequestCookie(request)) {
    return createJsonResponse(
      routeErrorBody("UNAUTHENTICATED", requestId, "请先登录"),
      401,
    );
  }

  if (!readSessionRouteScope(request)) {
    return createJsonResponse(
      routeErrorBody("AUTH_SCOPE_REQUIRED", requestId, "请选择团队后再继续"),
      400,
    );
  }

  if (!sessionId) {
    return createJsonResponse(
      routeErrorBody("SESSION_ID_REQUIRED", requestId, "缺少场次记录"),
      400,
    );
  }

  if (!authRepository || !sessionRepository) {
    return createJsonResponse(
      routeErrorBody("AUTH_OPERATION_FAILED", requestId, "权限校验暂时失败"),
      500,
    );
  }

  try {
    const context = await resolveDataAccessContext({
      authRepository,
      request,
      requestId,
      requiredPermission: "capture_session",
      route: "/api/sessions/captures/[sessionId]/submit",
    });
    const session = await sessionRepository.submitSessionCapture(
      context,
      await readSubmitInput(request, sessionId),
    );

    return createJsonResponse(
      {
        ok: true,
        requestId,
        session,
      },
      200,
    );
  } catch (error) {
    const safeError = toSafeRouteError(error, requestId);

    return createJsonResponse(safeError.body, safeError.status);
  }
}
