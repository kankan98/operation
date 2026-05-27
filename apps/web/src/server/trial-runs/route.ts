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
  createV0TrialRunRepository,
  V0TrialRunError,
  type CompleteV0TrialRunInput,
  type ListV0TrialRunsInput,
  type StartV0TrialRunInput,
  type UpdateV0TrialRunStepInput,
  type V0TrialRunStepId,
} from "./repository";

export const V0_TRIAL_RUN_MUTATION_CSRF_HEADER_NAME = "x-operation-csrf";
export const V0_TRIAL_RUN_MUTATION_CSRF_HEADER_VALUE = "v0-trial-run";

type V0TrialRunRouteRepository = ReturnType<typeof createV0TrialRunRepository>;

type V0TrialRunRouteErrorCode =
  | AuthGuardErrorCode
  | "AUTH_SCOPE_REQUIRED"
  | "CSRF_HEADER_REQUIRED"
  | "RUN_ID_REQUIRED"
  | "STEP_ID_REQUIRED"
  | V0TrialRunError["code"];

type V0TrialRunRouteErrorBody = {
  ok: false;
  code: V0TrialRunRouteErrorCode;
  requestId: string;
  retryable: boolean;
  userMessage: string;
};

type V0TrialRunRouteSuccessBody = {
  ok: true;
  requestId: string;
} & Record<string, unknown>;

type V0TrialRunRouteBody =
  | V0TrialRunRouteErrorBody
  | V0TrialRunRouteSuccessBody;

type RouteRunParams = {
  runId?: string | null;
};

type RouteStepParams = RouteRunParams & {
  stepId?: string | null;
};

function getRequestId(request: Request): string {
  const requestId = request.headers.get("x-request-id")?.trim();

  if (requestId) {
    return requestId;
  }

  return `trial_runs_route_${randomUUID()}`;
}

function createJsonResponse(
  body: V0TrialRunRouteBody,
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

function readTrialRunRouteScope(request: Request):
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

function readRouteStepId(params: RouteStepParams): string | null {
  return firstPresent(params.stepId);
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

function routeStatusForTrialRunError(code: V0TrialRunError["code"]): number {
  switch (code) {
    case "VALIDATION_ERROR":
      return 400;
    case "LONG_INPUT_LIMIT_EXCEEDED":
      return 413;
    case "FORBIDDEN_PERMISSION":
      return 403;
    case "NOT_FOUND":
      return 404;
    case "SENSITIVE_DATA_BLOCKED":
      return 422;
    case "DATABASE_OPERATION_FAILED":
      return 500;
  }
}

function routeErrorBody(
  code: V0TrialRunRouteErrorCode,
  requestId: string,
  userMessage: string,
): V0TrialRunRouteErrorBody {
  return {
    ok: false,
    code,
    requestId,
    retryable: false,
    userMessage,
  };
}

function authErrorBody(error: AuthGuardError): V0TrialRunRouteErrorBody {
  return {
    ok: false,
    code: error.code,
    requestId: error.requestId,
    retryable: error.retryable,
    userMessage: error.userMessage,
  };
}

function trialRunErrorBody(
  error: V0TrialRunError,
  requestId: string,
): V0TrialRunRouteErrorBody {
  return {
    ok: false,
    code: error.code,
    requestId,
    retryable: error.code === "DATABASE_OPERATION_FAILED",
    userMessage: userMessageForTrialRunError(error.code),
  };
}

function userMessageForTrialRunError(code: V0TrialRunError["code"]): string {
  switch (code) {
    case "VALIDATION_ERROR":
      return "请检查试用运行内容";
    case "LONG_INPUT_LIMIT_EXCEEDED":
      return "试用运行备注过长，请精简后再提交";
    case "FORBIDDEN_PERMISSION":
      return "需要试用团队访问权限";
    case "NOT_FOUND":
      return "未找到该试用运行记录";
    case "SENSITIVE_DATA_BLOCKED":
      return "备注里包含敏感信息，请删除后再提交";
    case "DATABASE_OPERATION_FAILED":
      return "试用运行记录暂时不可用";
  }
}

function toSafeRouteError(
  error: unknown,
  requestId: string,
): {
  status: number;
  body: V0TrialRunRouteErrorBody;
} {
  if (error instanceof V0TrialRunError) {
    return {
      body: trialRunErrorBody(error, requestId),
      status: routeStatusForTrialRunError(error.code),
    };
  }

  const authError = toAuthGuardError(error, requestId);

  return {
    body: authErrorBody(authError),
    status: routeStatusForAuthError(authError.code),
  };
}

function readListInput(request: Request): ListV0TrialRunsInput {
  const url = new URL(request.url);
  const status = firstPresent(url.searchParams.get("status"));
  const limitValue = url.searchParams.get("limit");

  return {
    limit: limitValue ? Number(limitValue) : undefined,
    status: (status ?? undefined) as ListV0TrialRunsInput["status"],
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
    throw new V0TrialRunError(
      "VALIDATION_ERROR",
      "V0 trial run route request body is malformed",
      { cause: error },
    );
  }
}

async function readStartInput(request: Request): Promise<StartV0TrialRunInput> {
  return (await readJsonObject(request)) as StartV0TrialRunInput;
}

async function readCompleteInput(
  request: Request,
): Promise<CompleteV0TrialRunInput> {
  const body = await readJsonObject(request);

  if (body.status !== "completed") {
    throw new V0TrialRunError(
      "VALIDATION_ERROR",
      "V0 trial run route only supports completing a run in this wave",
    );
  }

  return {
    summaryNote: body.summaryNote,
  } as CompleteV0TrialRunInput;
}

async function readStepUpdateInput(
  request: Request,
): Promise<UpdateV0TrialRunStepInput> {
  return (await readJsonObject(request)) as UpdateV0TrialRunStepInput;
}

function hasTrialRunMutationCsrfHeader(request: Request): boolean {
  return (
    request.headers.get(V0_TRIAL_RUN_MUTATION_CSRF_HEADER_NAME) ===
    V0_TRIAL_RUN_MUTATION_CSRF_HEADER_VALUE
  );
}

async function resolveDataAccessContext(input: {
  authRepository: AuthSessionRepository;
  request: Request & AuthCookieRequestLike;
  requestId: string;
  route: string;
}) {
  const scope = readTrialRunRouteScope(input.request);

  if (!scope) {
    throw new AuthGuardError(
      "AUTH_CONTEXT_INVALID",
      "V0 trial run route requires tenant and team scope",
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
      metadata: {
        route: input.route,
      },
      requestId: input.requestId,
      requiredPermission: "read_workspace",
      target: {
        teamId: scope.teamId,
        tenantId: scope.tenantId,
        type: "v0_trial_runs",
      },
      teamId: scope.teamId,
      tenantId: scope.tenantId,
    },
  );

  return authContextToDataAccessContext(resolution.context);
}

function requireMutationCsrf(request: Request, requestId: string) {
  if (!hasTrialRunMutationCsrfHeader(request)) {
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
  if (!readTrialRunRouteScope(request)) {
    return createJsonResponse(
      routeErrorBody("AUTH_SCOPE_REQUIRED", requestId, "请选择团队后再继续"),
      400,
    );
  }

  return null;
}

function requireRouteRunId(
  runId: string | null,
  requestId: string,
) {
  if (!runId) {
    return createJsonResponse(
      routeErrorBody("RUN_ID_REQUIRED", requestId, "缺少试用运行记录"),
      400,
    );
  }

  return null;
}

function requireRouteStepId(
  stepId: string | null,
  requestId: string,
) {
  if (!stepId) {
    return createJsonResponse(
      routeErrorBody("STEP_ID_REQUIRED", requestId, "缺少试用步骤"),
      400,
    );
  }

  return null;
}

function requireRepositories(
  authRepository: AuthSessionRepository | null,
  trialRunRepository: V0TrialRunRouteRepository | null,
  requestId: string,
) {
  if (!authRepository || !trialRunRepository) {
    return createJsonResponse(
      routeErrorBody("AUTH_OPERATION_FAILED", requestId, "权限校验暂时失败"),
      500,
    );
  }

  return null;
}

function preflightRead(input: {
  authRepository: AuthSessionRepository | null;
  request: Request;
  requestId: string;
  trialRunRepository: V0TrialRunRouteRepository | null;
}) {
  return (
    requireAuthCookie(input.request, input.requestId) ??
    requireRouteScope(input.request, input.requestId) ??
    requireRepositories(
      input.authRepository,
      input.trialRunRepository,
      input.requestId,
    )
  );
}

function preflightMutation(input: {
  authRepository: AuthSessionRepository | null;
  request: Request;
  requestId: string;
  trialRunRepository: V0TrialRunRouteRepository | null;
}) {
  return (
    requireMutationCsrf(input.request, input.requestId) ??
    requireAuthCookie(input.request, input.requestId) ??
    requireRouteScope(input.request, input.requestId) ??
    requireRepositories(
      input.authRepository,
      input.trialRunRepository,
      input.requestId,
    )
  );
}

export async function handleV0TrialRunListRoute(
  authRepository: AuthSessionRepository | null,
  trialRunRepository: V0TrialRunRouteRepository | null,
  request: Request & AuthCookieRequestLike,
): Promise<Response> {
  const requestId = getRequestId(request);
  const preflight = preflightRead({
    authRepository,
    request,
    requestId,
    trialRunRepository,
  });

  if (preflight) {
    return preflight;
  }

  try {
    const context = await resolveDataAccessContext({
      authRepository: authRepository!,
      request,
      requestId,
      route: "/api/trial-runs",
    });
    const result = await trialRunRepository!.listRuns(
      context,
      readListInput(request),
    );

    return createJsonResponse(
      {
        ok: true,
        requestId,
        runs: result.items,
        summary: result.summary,
      },
      200,
    );
  } catch (error) {
    const safeError = toSafeRouteError(error, requestId);

    return createJsonResponse(safeError.body, safeError.status);
  }
}

export async function handleV0TrialRunCreateRoute(
  authRepository: AuthSessionRepository | null,
  trialRunRepository: V0TrialRunRouteRepository | null,
  request: Request & AuthCookieRequestLike,
): Promise<Response> {
  const requestId = getRequestId(request);
  const preflight = preflightMutation({
    authRepository,
    request,
    requestId,
    trialRunRepository,
  });

  if (preflight) {
    return preflight;
  }

  try {
    const context = await resolveDataAccessContext({
      authRepository: authRepository!,
      request,
      requestId,
      route: "/api/trial-runs",
    });
    const run = await trialRunRepository!.startRun(
      context,
      await readStartInput(request),
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

export async function handleV0TrialRunDetailRoute(
  authRepository: AuthSessionRepository | null,
  trialRunRepository: V0TrialRunRouteRepository | null,
  request: Request & AuthCookieRequestLike,
  params: RouteRunParams,
): Promise<Response> {
  const requestId = getRequestId(request);
  const runId = readRouteRunId(params);
  const preflight =
    preflightRead({
      authRepository,
      request,
      requestId,
      trialRunRepository,
    }) ?? requireRouteRunId(runId, requestId);

  if (preflight) {
    return preflight;
  }

  try {
    const context = await resolveDataAccessContext({
      authRepository: authRepository!,
      request,
      requestId,
      route: "/api/trial-runs/[runId]",
    });
    const run = await trialRunRepository!.getRun(context, runId!);

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

export async function handleV0TrialRunCompleteRoute(
  authRepository: AuthSessionRepository | null,
  trialRunRepository: V0TrialRunRouteRepository | null,
  request: Request & AuthCookieRequestLike,
  params: RouteRunParams,
): Promise<Response> {
  const requestId = getRequestId(request);
  const runId = readRouteRunId(params);
  const preflight =
    preflightMutation({
      authRepository,
      request,
      requestId,
      trialRunRepository,
    }) ?? requireRouteRunId(runId, requestId);

  if (preflight) {
    return preflight;
  }

  try {
    const context = await resolveDataAccessContext({
      authRepository: authRepository!,
      request,
      requestId,
      route: "/api/trial-runs/[runId]",
    });
    const run = await trialRunRepository!.completeRun(
      context,
      runId!,
      await readCompleteInput(request),
    );

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

export async function handleV0TrialRunStepUpdateRoute(
  authRepository: AuthSessionRepository | null,
  trialRunRepository: V0TrialRunRouteRepository | null,
  request: Request & AuthCookieRequestLike,
  params: RouteStepParams,
): Promise<Response> {
  const requestId = getRequestId(request);
  const runId = readRouteRunId(params);
  const stepId = readRouteStepId(params);
  const preflight =
    preflightMutation({
      authRepository,
      request,
      requestId,
      trialRunRepository,
    }) ??
    requireRouteRunId(runId, requestId) ??
    requireRouteStepId(stepId, requestId);

  if (preflight) {
    return preflight;
  }

  try {
    const context = await resolveDataAccessContext({
      authRepository: authRepository!,
      request,
      requestId,
      route: "/api/trial-runs/[runId]/steps/[stepId]",
    });
    const run = await trialRunRepository!.updateStep(
      context,
      runId!,
      stepId! as V0TrialRunStepId,
      await readStepUpdateInput(request),
    );

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
