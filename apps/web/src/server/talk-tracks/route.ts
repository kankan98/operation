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
  createTalkTrackAssetRepository,
  TalkTrackAssetError,
  type CreateTalkTrackAssetInput,
  type CreateTalkTrackCandidateInput,
  type ListTalkTrackAssetsInput,
  type RecordTalkTrackReviewDecisionInput,
  type RecordTalkTrackUsageSignalInput,
  type ReviewTalkTrackCandidateInput,
} from "./repository";

export const TALK_TRACK_ASSET_MUTATION_CSRF_HEADER_NAME = "x-operation-csrf";
export const TALK_TRACK_ASSET_MUTATION_CSRF_HEADER_VALUE =
  "talk-track-assets";

type TalkTrackRouteRepository = ReturnType<
  typeof createTalkTrackAssetRepository
>;

type TalkTrackRouteErrorCode =
  | AuthGuardErrorCode
  | "AUTH_SCOPE_REQUIRED"
  | "CSRF_HEADER_REQUIRED"
  | "ASSET_ID_REQUIRED"
  | TalkTrackAssetError["code"];

type TalkTrackRouteErrorBody = {
  ok: false;
  code: TalkTrackRouteErrorCode;
  requestId: string;
  retryable: boolean;
  userMessage: string;
};

type TalkTrackRouteSuccessBody = {
  ok: true;
  requestId: string;
} & Record<string, unknown>;

type TalkTrackRouteBody =
  | TalkTrackRouteErrorBody
  | TalkTrackRouteSuccessBody;

type RouteAssetParams = {
  assetId?: string | null;
};

function getRequestId(request: Request): string {
  const requestId = request.headers.get("x-request-id")?.trim();

  if (requestId) {
    return requestId;
  }

  return `talk_tracks_route_${randomUUID()}`;
}

function createJsonResponse(
  body: TalkTrackRouteBody,
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

function readTalkTrackRouteScope(request: Request):
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

function readRouteAssetId(params: RouteAssetParams): string | null {
  return firstPresent(params.assetId);
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

function routeStatusForTalkTrackError(
  code: TalkTrackAssetError["code"],
): number {
  switch (code) {
    case "VALIDATION_ERROR":
      return 400;
    case "LONG_INPUT_LIMIT_EXCEEDED":
      return 413;
    case "FORBIDDEN_PERMISSION":
      return 403;
    case "DUPLICATE_SCENARIO":
    case "VERSION_CONFLICT":
      return 409;
    case "SOURCE_REQUIRED":
    case "SOURCE_STALE":
    case "SOURCE_CONFLICT":
    case "AI_CANDIDATE_NOT_REVIEWED":
    case "UNSAFE_CLAIM":
    case "SENSITIVE_DATA_BLOCKED":
    case "REVIEW_REQUIRED":
    case "STATE_TRANSITION_INVALID":
      return 422;
    case "NOT_FOUND":
      return 404;
    case "DATABASE_OPERATION_FAILED":
      return 500;
  }
}

function routeErrorBody(
  code: TalkTrackRouteErrorCode,
  requestId: string,
  userMessage: string,
): TalkTrackRouteErrorBody {
  return {
    ok: false,
    code,
    requestId,
    retryable: false,
    userMessage,
  };
}

function authErrorBody(error: AuthGuardError): TalkTrackRouteErrorBody {
  return {
    ok: false,
    code: error.code,
    requestId: error.requestId,
    retryable: error.retryable,
    userMessage: error.userMessage,
  };
}

function talkTrackErrorBody(
  error: TalkTrackAssetError,
  requestId: string,
): TalkTrackRouteErrorBody {
  return {
    ok: false,
    code: error.code,
    requestId,
    retryable: error.code === "DATABASE_OPERATION_FAILED",
    userMessage: userMessageForTalkTrackError(error.code),
  };
}

function userMessageForTalkTrackError(
  code: TalkTrackAssetError["code"],
): string {
  switch (code) {
    case "VALIDATION_ERROR":
      return "请检查话术信息";
    case "LONG_INPUT_LIMIT_EXCEEDED":
      return "话术内容过长，请拆分后再保存";
    case "FORBIDDEN_PERMISSION":
      return "需要话术管理权限";
    case "SOURCE_REQUIRED":
      return "发布前需要补充可信来源";
    case "SOURCE_STALE":
      return "来源已过期，请先复核";
    case "SOURCE_CONFLICT":
      return "来源存在冲突，请先处理";
    case "AI_CANDIDATE_NOT_REVIEWED":
      return "AI 候选话术需要先人工审核";
    case "DUPLICATE_SCENARIO":
      return "该场景已有活跃话术";
    case "UNSAFE_CLAIM":
      return "该话术候选存在风险，请先调整";
    case "SENSITIVE_DATA_BLOCKED":
      return "话术包含敏感内容，不能保存";
    case "VERSION_CONFLICT":
      return "话术版本已变化，请刷新后重试";
    case "REVIEW_REQUIRED":
      return "该话术需要先审核";
    case "NOT_FOUND":
      return "未找到该话术记录";
    case "STATE_TRANSITION_INVALID":
      return "当前话术状态暂不能执行该操作";
    case "DATABASE_OPERATION_FAILED":
      return "话术资产暂时不可用";
  }
}

function toSafeRouteError(
  error: unknown,
  requestId: string,
): {
  status: number;
  body: TalkTrackRouteErrorBody;
} {
  if (error instanceof TalkTrackAssetError) {
    return {
      status: routeStatusForTalkTrackError(error.code),
      body: talkTrackErrorBody(error, requestId),
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

function readListInput(request: Request): ListTalkTrackAssetsInput {
  const url = new URL(request.url);
  const limitValue = url.searchParams.get("limit");
  const assetType = firstPresent(url.searchParams.get("assetType"));

  return {
    status: readStringArrayQuery(url, "status") as ListTalkTrackAssetsInput["status"],
    assetType: (assetType ?? undefined) as ListTalkTrackAssetsInput["assetType"],
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
    throw new TalkTrackAssetError(
      "VALIDATION_ERROR",
      "Talk-track route request body is malformed",
      { cause: error },
    );
  }
}

async function readAssetCreateInput(
  request: Request,
): Promise<CreateTalkTrackAssetInput> {
  return (await readJsonObject(request)) as CreateTalkTrackAssetInput;
}

async function readCandidateCreateInput(
  request: Request,
): Promise<CreateTalkTrackCandidateInput> {
  return (await readJsonObject(request)) as CreateTalkTrackCandidateInput;
}

async function readCandidateReviewInput(
  request: Request,
): Promise<ReviewTalkTrackCandidateInput> {
  return (await readJsonObject(request)) as ReviewTalkTrackCandidateInput;
}

async function readReviewDecisionInput(
  request: Request,
): Promise<RecordTalkTrackReviewDecisionInput> {
  return (await readJsonObject(request)) as RecordTalkTrackReviewDecisionInput;
}

async function readAssetVersionInput(
  request: Request,
  assetId: string,
): Promise<{ assetId: string; versionId?: string }> {
  return {
    ...(await readJsonObject(request)),
    assetId,
  } as { assetId: string; versionId?: string };
}

async function readUsageSignalInput(
  request: Request,
): Promise<RecordTalkTrackUsageSignalInput> {
  return (await readJsonObject(request)) as RecordTalkTrackUsageSignalInput;
}

function hasTalkTrackMutationCsrfHeader(request: Request): boolean {
  return (
    request.headers.get(TALK_TRACK_ASSET_MUTATION_CSRF_HEADER_NAME) ===
    TALK_TRACK_ASSET_MUTATION_CSRF_HEADER_VALUE
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
  const scope = readTalkTrackRouteScope(input.request);

  if (!scope) {
    throw new AuthGuardError(
      "AUTH_CONTEXT_INVALID",
      "Talk-track route requires tenant and team scope",
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
        type: "talk_track_asset",
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
  if (!hasTalkTrackMutationCsrfHeader(request)) {
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
  if (!readTalkTrackRouteScope(request)) {
    return createJsonResponse(
      routeErrorBody("AUTH_SCOPE_REQUIRED", requestId, "请选择团队后再继续"),
      400,
    );
  }

  return null;
}

function requireRepositories(
  authRepository: AuthSessionRepository | null,
  talkTrackRepository: TalkTrackRouteRepository | null,
  requestId: string,
) {
  if (!authRepository || !talkTrackRepository) {
    return createJsonResponse(
      routeErrorBody("AUTH_OPERATION_FAILED", requestId, "权限校验暂时失败"),
      500,
    );
  }

  return null;
}

function preflightRead(input: {
  authRepository: AuthSessionRepository | null;
  talkTrackRepository: TalkTrackRouteRepository | null;
  request: Request;
  requestId: string;
}) {
  return (
    requireAuthCookie(input.request, input.requestId) ??
    requireRouteScope(input.request, input.requestId) ??
    requireRepositories(
      input.authRepository,
      input.talkTrackRepository,
      input.requestId,
    )
  );
}

function preflightMutation(input: {
  authRepository: AuthSessionRepository | null;
  talkTrackRepository: TalkTrackRouteRepository | null;
  request: Request;
  requestId: string;
}) {
  return (
    requireMutationCsrf(input.request, input.requestId) ??
    requireAuthCookie(input.request, input.requestId) ??
    requireRouteScope(input.request, input.requestId) ??
    requireRepositories(
      input.authRepository,
      input.talkTrackRepository,
      input.requestId,
    )
  );
}

export async function handleTalkTrackAssetsListRoute(
  authRepository: AuthSessionRepository | null,
  talkTrackRepository: TalkTrackRouteRepository | null,
  request: Request & AuthCookieRequestLike,
): Promise<Response> {
  const requestId = getRequestId(request);
  const preflight = preflightRead({
    authRepository,
    talkTrackRepository,
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
      route: "/api/talk-tracks/assets",
    });
    const result = await talkTrackRepository!.listAssets(
      context,
      readListInput(request),
    );

    return createJsonResponse(
      {
        ok: true,
        requestId,
        assets: result.items,
      },
      200,
    );
  } catch (error) {
    const safeError = toSafeRouteError(error, requestId);

    return createJsonResponse(safeError.body, safeError.status);
  }
}

export async function handleTalkTrackAssetsCreateRoute(
  authRepository: AuthSessionRepository | null,
  talkTrackRepository: TalkTrackRouteRepository | null,
  request: Request & AuthCookieRequestLike,
): Promise<Response> {
  const requestId = getRequestId(request);
  const preflight = preflightMutation({
    authRepository,
    talkTrackRepository,
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
      requiredPermission: "manage_talk_tracks",
      route: "/api/talk-tracks/assets",
    });
    const asset = await talkTrackRepository!.createAsset(
      context,
      await readAssetCreateInput(request),
    );

    return createJsonResponse(
      {
        ok: true,
        requestId,
        asset,
      },
      201,
    );
  } catch (error) {
    const safeError = toSafeRouteError(error, requestId);

    return createJsonResponse(safeError.body, safeError.status);
  }
}

export async function handleTalkTrackAssetDetailRoute(
  authRepository: AuthSessionRepository | null,
  talkTrackRepository: TalkTrackRouteRepository | null,
  request: Request & AuthCookieRequestLike,
  params: RouteAssetParams,
): Promise<Response> {
  const requestId = getRequestId(request);
  const assetId = readRouteAssetId(params);
  const preflight = preflightRead({
    authRepository,
    talkTrackRepository,
    request,
    requestId,
  });

  if (preflight) {
    return preflight;
  }

  if (!assetId) {
    return createJsonResponse(
      routeErrorBody("ASSET_ID_REQUIRED", requestId, "缺少话术资产"),
      400,
    );
  }

  try {
    const context = await resolveDataAccessContext({
      authRepository: authRepository!,
      request,
      requestId,
      requiredPermission: "read_workspace",
      route: "/api/talk-tracks/assets/[assetId]",
      targetId: assetId,
    });
    const asset = await talkTrackRepository!.getAsset(context, { assetId });

    return createJsonResponse(
      {
        ok: true,
        requestId,
        asset,
      },
      200,
    );
  } catch (error) {
    const safeError = toSafeRouteError(error, requestId);

    return createJsonResponse(safeError.body, safeError.status);
  }
}

export async function handleTalkTrackCandidatesCreateRoute(
  authRepository: AuthSessionRepository | null,
  talkTrackRepository: TalkTrackRouteRepository | null,
  request: Request & AuthCookieRequestLike,
): Promise<Response> {
  const requestId = getRequestId(request);
  const preflight = preflightMutation({
    authRepository,
    talkTrackRepository,
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
      requiredPermission: "manage_talk_tracks",
      route: "/api/talk-tracks/candidates",
    });
    const candidate = await talkTrackRepository!.createCandidate(
      context,
      await readCandidateCreateInput(request),
    );

    return createJsonResponse(
      {
        ok: true,
        requestId,
        candidate,
      },
      201,
    );
  } catch (error) {
    const safeError = toSafeRouteError(error, requestId);

    return createJsonResponse(safeError.body, safeError.status);
  }
}

export async function handleTalkTrackCandidateReviewRoute(
  authRepository: AuthSessionRepository | null,
  talkTrackRepository: TalkTrackRouteRepository | null,
  request: Request & AuthCookieRequestLike,
): Promise<Response> {
  const requestId = getRequestId(request);
  const preflight = preflightMutation({
    authRepository,
    talkTrackRepository,
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
      requiredPermission: "manage_talk_tracks",
      route: "/api/talk-tracks/candidate-reviews",
    });
    const candidate = await talkTrackRepository!.reviewCandidate(
      context,
      await readCandidateReviewInput(request),
    );

    return createJsonResponse(
      {
        ok: true,
        requestId,
        candidate,
      },
      200,
    );
  } catch (error) {
    const safeError = toSafeRouteError(error, requestId);

    return createJsonResponse(safeError.body, safeError.status);
  }
}

export async function handleTalkTrackReviewDecisionRoute(
  authRepository: AuthSessionRepository | null,
  talkTrackRepository: TalkTrackRouteRepository | null,
  request: Request & AuthCookieRequestLike,
): Promise<Response> {
  const requestId = getRequestId(request);
  const preflight = preflightMutation({
    authRepository,
    talkTrackRepository,
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
      requiredPermission: "manage_talk_tracks",
      route: "/api/talk-tracks/review-decisions",
    });
    const decision = await talkTrackRepository!.recordReviewDecision(
      context,
      await readReviewDecisionInput(request),
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

async function mutateAssetVersion(input: {
  authRepository: AuthSessionRepository | null;
  talkTrackRepository: TalkTrackRouteRepository | null;
  request: Request & AuthCookieRequestLike;
  params: RouteAssetParams;
  route: string;
  mutate: (
    context: Awaited<ReturnType<typeof resolveDataAccessContext>>,
    versionInput: { assetId: string; versionId?: string },
  ) => Promise<unknown>;
  successKey: string;
  successStatus?: number;
}): Promise<Response> {
  const requestId = getRequestId(input.request);
  const assetId = readRouteAssetId(input.params);
  const preflight = preflightMutation({
    authRepository: input.authRepository,
    talkTrackRepository: input.talkTrackRepository,
    request: input.request,
    requestId,
  });

  if (preflight) {
    return preflight;
  }

  if (!assetId) {
    return createJsonResponse(
      routeErrorBody("ASSET_ID_REQUIRED", requestId, "缺少话术资产"),
      400,
    );
  }

  try {
    const context = await resolveDataAccessContext({
      authRepository: input.authRepository!,
      request: input.request,
      requestId,
      requiredPermission: "manage_talk_tracks",
      route: input.route,
      targetId: assetId,
    });
    const result = await input.mutate(
      context,
      await readAssetVersionInput(input.request, assetId),
    );

    return createJsonResponse(
      {
        ok: true,
        requestId,
        [input.successKey]: result,
      },
      input.successStatus ?? 200,
    );
  } catch (error) {
    const safeError = toSafeRouteError(error, requestId);

    return createJsonResponse(safeError.body, safeError.status);
  }
}

export async function handleTalkTrackAssetSubmitRoute(
  authRepository: AuthSessionRepository | null,
  talkTrackRepository: TalkTrackRouteRepository | null,
  request: Request & AuthCookieRequestLike,
  params: RouteAssetParams,
): Promise<Response> {
  return mutateAssetVersion({
    authRepository,
    talkTrackRepository,
    request,
    params,
    route: "/api/talk-tracks/assets/[assetId]/submit",
    mutate: (context, input) =>
      talkTrackRepository!.submitForReview(context, input),
    successKey: "asset",
  });
}

export async function handleTalkTrackAssetPublishRoute(
  authRepository: AuthSessionRepository | null,
  talkTrackRepository: TalkTrackRouteRepository | null,
  request: Request & AuthCookieRequestLike,
  params: RouteAssetParams,
): Promise<Response> {
  return mutateAssetVersion({
    authRepository,
    talkTrackRepository,
    request,
    params,
    route: "/api/talk-tracks/assets/[assetId]/publish",
    mutate: (context, input) => talkTrackRepository!.publishVersion(context, input),
    successKey: "asset",
  });
}

async function mutateAsset(input: {
  authRepository: AuthSessionRepository | null;
  talkTrackRepository: TalkTrackRouteRepository | null;
  request: Request & AuthCookieRequestLike;
  params: RouteAssetParams;
  route: string;
  mutate: (
    context: Awaited<ReturnType<typeof resolveDataAccessContext>>,
    assetInput: { assetId: string },
  ) => Promise<unknown>;
}): Promise<Response> {
  const requestId = getRequestId(input.request);
  const assetId = readRouteAssetId(input.params);
  const preflight = preflightMutation({
    authRepository: input.authRepository,
    talkTrackRepository: input.talkTrackRepository,
    request: input.request,
    requestId,
  });

  if (preflight) {
    return preflight;
  }

  if (!assetId) {
    return createJsonResponse(
      routeErrorBody("ASSET_ID_REQUIRED", requestId, "缺少话术资产"),
      400,
    );
  }

  try {
    const context = await resolveDataAccessContext({
      authRepository: input.authRepository!,
      request: input.request,
      requestId,
      requiredPermission: "manage_talk_tracks",
      route: input.route,
      targetId: assetId,
    });
    const asset = await input.mutate(context, { assetId });

    return createJsonResponse(
      {
        ok: true,
        requestId,
        asset,
      },
      200,
    );
  } catch (error) {
    const safeError = toSafeRouteError(error, requestId);

    return createJsonResponse(safeError.body, safeError.status);
  }
}

export async function handleTalkTrackAssetArchiveRoute(
  authRepository: AuthSessionRepository | null,
  talkTrackRepository: TalkTrackRouteRepository | null,
  request: Request & AuthCookieRequestLike,
  params: RouteAssetParams,
): Promise<Response> {
  return mutateAsset({
    authRepository,
    talkTrackRepository,
    request,
    params,
    route: "/api/talk-tracks/assets/[assetId]/archive",
    mutate: (context, input) => talkTrackRepository!.archiveAsset(context, input),
  });
}

export async function handleTalkTrackAssetRestoreRoute(
  authRepository: AuthSessionRepository | null,
  talkTrackRepository: TalkTrackRouteRepository | null,
  request: Request & AuthCookieRequestLike,
  params: RouteAssetParams,
): Promise<Response> {
  return mutateAsset({
    authRepository,
    talkTrackRepository,
    request,
    params,
    route: "/api/talk-tracks/assets/[assetId]/restore",
    mutate: (context, input) => talkTrackRepository!.restoreAsset(context, input),
  });
}

export async function handleTalkTrackUsageSignalRoute(
  authRepository: AuthSessionRepository | null,
  talkTrackRepository: TalkTrackRouteRepository | null,
  request: Request & AuthCookieRequestLike,
): Promise<Response> {
  const requestId = getRequestId(request);
  const preflight = preflightMutation({
    authRepository,
    talkTrackRepository,
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
      requiredPermission: "manage_talk_tracks",
      route: "/api/talk-tracks/usage-signals",
    });
    const signal = await talkTrackRepository!.recordUsageSignal(
      context,
      await readUsageSignalInput(request),
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
