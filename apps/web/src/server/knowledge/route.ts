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
  createKnowledgeLifecycleRepository,
  KnowledgeLifecycleError,
  type AddExtractedKnowledgeClaimInput,
  type AddTeamKnowledgeNoteInput,
  type KnowledgeReviewDecisionInput,
  type ListKnowledgeInput,
  type PublishKnowledgeVersionInput,
  type RecordKnowledgeConflictInput,
  type RegisterKnowledgeSourceInput,
  type ResolveKnowledgeConflictInput,
} from "./repository";

export const KNOWLEDGE_LIFECYCLE_MUTATION_CSRF_HEADER_NAME =
  "x-operation-csrf";
export const KNOWLEDGE_LIFECYCLE_MUTATION_CSRF_HEADER_VALUE =
  "knowledge-lifecycle";

type KnowledgeLifecycleRouteRepository = ReturnType<
  typeof createKnowledgeLifecycleRepository
>;

type KnowledgeLifecycleRouteErrorCode =
  | AuthGuardErrorCode
  | "AUTH_SCOPE_REQUIRED"
  | "CSRF_HEADER_REQUIRED"
  | "SOURCE_ID_REQUIRED"
  | "CONFLICT_ID_REQUIRED"
  | KnowledgeLifecycleError["code"];

type KnowledgeLifecycleRouteErrorBody = {
  ok: false;
  code: KnowledgeLifecycleRouteErrorCode;
  requestId: string;
  retryable: boolean;
  userMessage: string;
};

type KnowledgeLifecycleRouteSuccessBody = {
  ok: true;
  requestId: string;
} & Record<string, unknown>;

type KnowledgeLifecycleRouteBody =
  | KnowledgeLifecycleRouteErrorBody
  | KnowledgeLifecycleRouteSuccessBody;

type RouteSourceParams = {
  sourceId?: string | null;
};

type RouteConflictParams = {
  conflictId?: string | null;
};

function getRequestId(request: Request): string {
  const requestId = request.headers.get("x-request-id")?.trim();

  if (requestId) {
    return requestId;
  }

  return `knowledge_route_${randomUUID()}`;
}

function createJsonResponse(
  body: KnowledgeLifecycleRouteBody,
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

function readKnowledgeRouteScope(request: Request):
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

function readRouteSourceId(params: RouteSourceParams): string | null {
  return firstPresent(params.sourceId);
}

function readRouteConflictId(params: RouteConflictParams): string | null {
  return firstPresent(params.conflictId);
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

function routeStatusForKnowledgeError(
  code: KnowledgeLifecycleError["code"],
): number {
  switch (code) {
    case "VALIDATION_ERROR":
      return 400;
    case "LONG_INPUT_LIMIT_EXCEEDED":
      return 413;
    case "FORBIDDEN_PERMISSION":
      return 403;
    case "DUPLICATE_SOURCE":
    case "CONFLICTING_CLAIM":
      return 409;
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
  code: KnowledgeLifecycleRouteErrorCode,
  requestId: string,
  userMessage: string,
): KnowledgeLifecycleRouteErrorBody {
  return {
    ok: false,
    code,
    requestId,
    retryable: false,
    userMessage,
  };
}

function authErrorBody(error: AuthGuardError): KnowledgeLifecycleRouteErrorBody {
  return {
    ok: false,
    code: error.code,
    requestId: error.requestId,
    retryable: error.retryable,
    userMessage: error.userMessage,
  };
}

function knowledgeErrorBody(
  error: KnowledgeLifecycleError,
  requestId: string,
): KnowledgeLifecycleRouteErrorBody {
  return {
    ok: false,
    code: error.code,
    requestId,
    retryable: error.code === "DATABASE_OPERATION_FAILED",
    userMessage: userMessageForKnowledgeError(error.code),
  };
}

function userMessageForKnowledgeError(
  code: KnowledgeLifecycleError["code"],
): string {
  switch (code) {
    case "VALIDATION_ERROR":
      return "请检查知识信息";
    case "LONG_INPUT_LIMIT_EXCEEDED":
      return "知识内容过长，请拆分后再保存";
    case "FORBIDDEN_PERMISSION":
      return "需要知识审核权限";
    case "DUPLICATE_SOURCE":
      return "该来源已登记";
    case "CONFLICTING_CLAIM":
      return "该知识存在冲突，请先处理";
    case "SENSITIVE_DATA_NEEDS_REVIEW":
      return "敏感知识需要先审核";
    case "NOT_FOUND":
      return "未找到该知识记录";
    case "STATE_TRANSITION_INVALID":
      return "当前状态暂不能执行该操作";
    case "DATABASE_OPERATION_FAILED":
      return "知识库暂时不可用";
  }
}

function toSafeRouteError(
  error: unknown,
  requestId: string,
): {
  status: number;
  body: KnowledgeLifecycleRouteErrorBody;
} {
  if (error instanceof KnowledgeLifecycleError) {
    return {
      status: routeStatusForKnowledgeError(error.code),
      body: knowledgeErrorBody(error, requestId),
    };
  }

  const authError = toAuthGuardError(error, requestId);

  return {
    status: routeStatusForAuthError(authError.code),
    body: authErrorBody(authError),
  };
}

function readListInput(request: Request): ListKnowledgeInput {
  const url = new URL(request.url);
  const limitValue = url.searchParams.get("limit");

  return {
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
    throw new KnowledgeLifecycleError(
      "VALIDATION_ERROR",
      "Knowledge lifecycle request body is malformed",
      { cause: error },
    );
  }
}

async function readSourceCreateInput(
  request: Request,
): Promise<RegisterKnowledgeSourceInput> {
  return (await readJsonObject(request)) as RegisterKnowledgeSourceInput;
}

async function readClaimCreateInput(
  request: Request,
): Promise<AddExtractedKnowledgeClaimInput> {
  return (await readJsonObject(request)) as AddExtractedKnowledgeClaimInput;
}

async function readTeamNoteCreateInput(
  request: Request,
): Promise<AddTeamKnowledgeNoteInput> {
  return (await readJsonObject(request)) as AddTeamKnowledgeNoteInput;
}

async function readReviewDecisionInput(
  request: Request,
): Promise<KnowledgeReviewDecisionInput> {
  return (await readJsonObject(request)) as KnowledgeReviewDecisionInput;
}

async function readConflictCreateInput(
  request: Request,
): Promise<RecordKnowledgeConflictInput> {
  return (await readJsonObject(request)) as RecordKnowledgeConflictInput;
}

async function readConflictResolveInput(
  request: Request,
  conflictId: string,
): Promise<ResolveKnowledgeConflictInput> {
  return {
    ...(await readJsonObject(request)),
    conflictId,
  } as ResolveKnowledgeConflictInput;
}

async function readVersionCreateInput(
  request: Request,
): Promise<PublishKnowledgeVersionInput> {
  return (await readJsonObject(request)) as PublishKnowledgeVersionInput;
}

function hasKnowledgeMutationCsrfHeader(request: Request): boolean {
  return (
    request.headers.get(KNOWLEDGE_LIFECYCLE_MUTATION_CSRF_HEADER_NAME) ===
    KNOWLEDGE_LIFECYCLE_MUTATION_CSRF_HEADER_VALUE
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
  const scope = readKnowledgeRouteScope(input.request);

  if (!scope) {
    throw new AuthGuardError(
      "AUTH_CONTEXT_INVALID",
      "Knowledge lifecycle route requires tenant and team scope",
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
        type: "knowledge_lifecycle",
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
  if (!hasKnowledgeMutationCsrfHeader(request)) {
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
  if (!readKnowledgeRouteScope(request)) {
    return createJsonResponse(
      routeErrorBody("AUTH_SCOPE_REQUIRED", requestId, "请选择团队后再继续"),
      400,
    );
  }

  return null;
}

function requireRepositories(
  authRepository: AuthSessionRepository | null,
  knowledgeRepository: KnowledgeLifecycleRouteRepository | null,
  requestId: string,
) {
  if (!authRepository || !knowledgeRepository) {
    return createJsonResponse(
      routeErrorBody("AUTH_OPERATION_FAILED", requestId, "权限校验暂时失败"),
      500,
    );
  }

  return null;
}

function preflightRead(input: {
  authRepository: AuthSessionRepository | null;
  knowledgeRepository: KnowledgeLifecycleRouteRepository | null;
  request: Request;
  requestId: string;
}) {
  return (
    requireAuthCookie(input.request, input.requestId) ??
    requireRouteScope(input.request, input.requestId) ??
    requireRepositories(
      input.authRepository,
      input.knowledgeRepository,
      input.requestId,
    )
  );
}

function preflightMutation(input: {
  authRepository: AuthSessionRepository | null;
  knowledgeRepository: KnowledgeLifecycleRouteRepository | null;
  request: Request;
  requestId: string;
}) {
  return (
    requireMutationCsrf(input.request, input.requestId) ??
    requireAuthCookie(input.request, input.requestId) ??
    requireRouteScope(input.request, input.requestId) ??
    requireRepositories(
      input.authRepository,
      input.knowledgeRepository,
      input.requestId,
    )
  );
}

export async function handleKnowledgeSourcesListRoute(
  authRepository: AuthSessionRepository | null,
  knowledgeRepository: KnowledgeLifecycleRouteRepository | null,
  request: Request & AuthCookieRequestLike,
): Promise<Response> {
  const requestId = getRequestId(request);
  const preflight = preflightRead({
    authRepository,
    knowledgeRepository,
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
      route: "/api/knowledge/sources",
    });
    const result = await knowledgeRepository!.listKnowledgeSources(
      context,
      readListInput(request),
    );

    return createJsonResponse(
      {
        ok: true,
        requestId,
        sources: result.items,
      },
      200,
    );
  } catch (error) {
    const safeError = toSafeRouteError(error, requestId);

    return createJsonResponse(safeError.body, safeError.status);
  }
}

export async function handleKnowledgeSourcesCreateRoute(
  authRepository: AuthSessionRepository | null,
  knowledgeRepository: KnowledgeLifecycleRouteRepository | null,
  request: Request & AuthCookieRequestLike,
): Promise<Response> {
  const requestId = getRequestId(request);
  const preflight = preflightMutation({
    authRepository,
    knowledgeRepository,
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
      requiredPermission: "review_knowledge",
      route: "/api/knowledge/sources",
    });
    const source = await knowledgeRepository!.registerKnowledgeSource(
      context,
      await readSourceCreateInput(request),
    );

    return createJsonResponse(
      {
        ok: true,
        requestId,
        source,
      },
      201,
    );
  } catch (error) {
    const safeError = toSafeRouteError(error, requestId);

    return createJsonResponse(safeError.body, safeError.status);
  }
}

export async function handleKnowledgeSourceDetailRoute(
  authRepository: AuthSessionRepository | null,
  knowledgeRepository: KnowledgeLifecycleRouteRepository | null,
  request: Request & AuthCookieRequestLike,
  params: RouteSourceParams,
): Promise<Response> {
  const requestId = getRequestId(request);
  const sourceId = readRouteSourceId(params);
  const preflight = preflightRead({
    authRepository,
    knowledgeRepository,
    request,
    requestId,
  });

  if (preflight) {
    return preflight;
  }

  if (!sourceId) {
    return createJsonResponse(
      routeErrorBody("SOURCE_ID_REQUIRED", requestId, "缺少知识来源"),
      400,
    );
  }

  try {
    const context = await resolveDataAccessContext({
      authRepository: authRepository!,
      request,
      requestId,
      requiredPermission: "read_workspace",
      route: "/api/knowledge/sources/[sourceId]",
      targetId: sourceId,
    });
    const source = await knowledgeRepository!.getKnowledgeSource(context, {
      sourceId,
    });

    return createJsonResponse(
      {
        ok: true,
        requestId,
        source,
      },
      200,
    );
  } catch (error) {
    const safeError = toSafeRouteError(error, requestId);

    return createJsonResponse(safeError.body, safeError.status);
  }
}

export async function handleKnowledgeClaimsCreateRoute(
  authRepository: AuthSessionRepository | null,
  knowledgeRepository: KnowledgeLifecycleRouteRepository | null,
  request: Request & AuthCookieRequestLike,
): Promise<Response> {
  const requestId = getRequestId(request);
  const preflight = preflightMutation({
    authRepository,
    knowledgeRepository,
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
      requiredPermission: "review_knowledge",
      route: "/api/knowledge/claims",
    });
    const claim = await knowledgeRepository!.addExtractedKnowledgeClaim(
      context,
      await readClaimCreateInput(request),
    );

    return createJsonResponse(
      {
        ok: true,
        requestId,
        claim,
      },
      201,
    );
  } catch (error) {
    const safeError = toSafeRouteError(error, requestId);

    return createJsonResponse(safeError.body, safeError.status);
  }
}

export async function handleKnowledgeTeamNotesCreateRoute(
  authRepository: AuthSessionRepository | null,
  knowledgeRepository: KnowledgeLifecycleRouteRepository | null,
  request: Request & AuthCookieRequestLike,
): Promise<Response> {
  const requestId = getRequestId(request);
  const preflight = preflightMutation({
    authRepository,
    knowledgeRepository,
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
      requiredPermission: "review_knowledge",
      route: "/api/knowledge/team-notes",
    });
    const teamNote = await knowledgeRepository!.addTeamKnowledgeNote(
      context,
      await readTeamNoteCreateInput(request),
    );

    return createJsonResponse(
      {
        ok: true,
        requestId,
        teamNote,
      },
      201,
    );
  } catch (error) {
    const safeError = toSafeRouteError(error, requestId);

    return createJsonResponse(safeError.body, safeError.status);
  }
}

export async function handleKnowledgeReviewQueueRoute(
  authRepository: AuthSessionRepository | null,
  knowledgeRepository: KnowledgeLifecycleRouteRepository | null,
  request: Request & AuthCookieRequestLike,
): Promise<Response> {
  const requestId = getRequestId(request);
  const preflight = preflightRead({
    authRepository,
    knowledgeRepository,
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
      route: "/api/knowledge/review-queue",
    });
    const result = await knowledgeRepository!.listKnowledgeReviewQueue(
      context,
      readListInput(request),
    );

    return createJsonResponse(
      {
        ok: true,
        requestId,
        items: result.items,
      },
      200,
    );
  } catch (error) {
    const safeError = toSafeRouteError(error, requestId);

    return createJsonResponse(safeError.body, safeError.status);
  }
}

export async function handleKnowledgeReviewDecisionRoute(
  authRepository: AuthSessionRepository | null,
  knowledgeRepository: KnowledgeLifecycleRouteRepository | null,
  request: Request & AuthCookieRequestLike,
): Promise<Response> {
  const requestId = getRequestId(request);
  const preflight = preflightMutation({
    authRepository,
    knowledgeRepository,
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
      requiredPermission: "review_knowledge",
      route: "/api/knowledge/review-decisions",
    });
    const target = await knowledgeRepository!.recordKnowledgeReviewDecision(
      context,
      await readReviewDecisionInput(request),
    );

    return createJsonResponse(
      {
        ok: true,
        requestId,
        target,
      },
      200,
    );
  } catch (error) {
    const safeError = toSafeRouteError(error, requestId);

    return createJsonResponse(safeError.body, safeError.status);
  }
}

export async function handleKnowledgeConflictsCreateRoute(
  authRepository: AuthSessionRepository | null,
  knowledgeRepository: KnowledgeLifecycleRouteRepository | null,
  request: Request & AuthCookieRequestLike,
): Promise<Response> {
  const requestId = getRequestId(request);
  const preflight = preflightMutation({
    authRepository,
    knowledgeRepository,
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
      requiredPermission: "review_knowledge",
      route: "/api/knowledge/conflicts",
    });
    const conflict = await knowledgeRepository!.recordKnowledgeConflict(
      context,
      await readConflictCreateInput(request),
    );

    return createJsonResponse(
      {
        ok: true,
        requestId,
        conflict,
      },
      201,
    );
  } catch (error) {
    const safeError = toSafeRouteError(error, requestId);

    return createJsonResponse(safeError.body, safeError.status);
  }
}

export async function handleKnowledgeConflictResolveRoute(
  authRepository: AuthSessionRepository | null,
  knowledgeRepository: KnowledgeLifecycleRouteRepository | null,
  request: Request & AuthCookieRequestLike,
  params: RouteConflictParams,
): Promise<Response> {
  const requestId = getRequestId(request);
  const conflictId = readRouteConflictId(params);
  const preflight = preflightMutation({
    authRepository,
    knowledgeRepository,
    request,
    requestId,
  });

  if (preflight) {
    return preflight;
  }

  if (!conflictId) {
    return createJsonResponse(
      routeErrorBody("CONFLICT_ID_REQUIRED", requestId, "缺少知识冲突"),
      400,
    );
  }

  try {
    const context = await resolveDataAccessContext({
      authRepository: authRepository!,
      request,
      requestId,
      requiredPermission: "review_knowledge",
      route: "/api/knowledge/conflicts/[conflictId]",
      targetId: conflictId,
    });
    const conflict = await knowledgeRepository!.resolveKnowledgeConflict(
      context,
      await readConflictResolveInput(request, conflictId),
    );

    return createJsonResponse(
      {
        ok: true,
        requestId,
        conflict,
      },
      200,
    );
  } catch (error) {
    const safeError = toSafeRouteError(error, requestId);

    return createJsonResponse(safeError.body, safeError.status);
  }
}

export async function handleKnowledgeVersionsCreateRoute(
  authRepository: AuthSessionRepository | null,
  knowledgeRepository: KnowledgeLifecycleRouteRepository | null,
  request: Request & AuthCookieRequestLike,
): Promise<Response> {
  const requestId = getRequestId(request);
  const preflight = preflightMutation({
    authRepository,
    knowledgeRepository,
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
      requiredPermission: "review_knowledge",
      route: "/api/knowledge/versions",
    });
    const version = await knowledgeRepository!.publishKnowledgeVersion(
      context,
      await readVersionCreateInput(request),
    );

    return createJsonResponse(
      {
        ok: true,
        requestId,
        version,
      },
      201,
    );
  } catch (error) {
    const safeError = toSafeRouteError(error, requestId);

    return createJsonResponse(safeError.body, safeError.status);
  }
}
