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
  createNextSessionTaskRepository,
  NextSessionTaskError,
  type CompleteNextSessionTaskInput,
  type CreateNextSessionTaskInput,
  type ListNextSessionTasksInput,
  type RecordTaskDependencyInput,
  type RecordTaskFeedbackSignalInput,
  type RecordTaskReviewResultInput,
  type UpdateNextSessionTaskStatusInput,
  type UpdateTaskChecklistItemInput,
  type UpdateTaskDependencyStateInput,
} from "./repository";

export const NEXT_SESSION_TASK_MUTATION_CSRF_HEADER_NAME = "x-operation-csrf";
export const NEXT_SESSION_TASK_MUTATION_CSRF_HEADER_VALUE =
  "next-session-tasks";

type NextActionRouteRepository = ReturnType<
  typeof createNextSessionTaskRepository
>;

type NextActionRouteErrorCode =
  | AuthGuardErrorCode
  | "AUTH_SCOPE_REQUIRED"
  | "CSRF_HEADER_REQUIRED"
  | "TASK_ID_REQUIRED"
  | "CHECKLIST_ITEM_ID_REQUIRED"
  | "DEPENDENCY_ID_REQUIRED"
  | NextSessionTaskError["code"];

type NextActionRouteErrorBody = {
  ok: false;
  code: NextActionRouteErrorCode;
  requestId: string;
  retryable: boolean;
  userMessage: string;
};

type NextActionRouteSuccessBody = {
  ok: true;
  requestId: string;
} & Record<string, unknown>;

type NextActionRouteBody =
  | NextActionRouteErrorBody
  | NextActionRouteSuccessBody;

type RouteTaskParams = {
  taskId?: string | null;
};

type RouteChecklistParams = RouteTaskParams & {
  itemId?: string | null;
};

type RouteDependencyParams = RouteTaskParams & {
  dependencyId?: string | null;
};

function getRequestId(request: Request): string {
  const requestId = request.headers.get("x-request-id")?.trim();

  if (requestId) {
    return requestId;
  }

  return `next_actions_route_${randomUUID()}`;
}

function createJsonResponse(
  body: NextActionRouteBody,
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

function readNextActionRouteScope(request: Request):
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

function readRouteTaskId(params: RouteTaskParams): string | null {
  return firstPresent(params.taskId);
}

function readRouteChecklistItemId(params: RouteChecklistParams): string | null {
  return firstPresent(params.itemId);
}

function readRouteDependencyId(params: RouteDependencyParams): string | null {
  return firstPresent(params.dependencyId);
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

function routeStatusForNextActionError(
  code: NextSessionTaskError["code"],
): number {
  switch (code) {
    case "VALIDATION_ERROR":
      return 400;
    case "LONG_INPUT_LIMIT_EXCEEDED":
      return 413;
    case "FORBIDDEN_PERMISSION":
      return 403;
    case "DUPLICATE_TASK":
    case "TASK_STATE_CONFLICT":
      return 409;
    case "SOURCE_NOT_REVIEW_READY":
    case "ASSIGNEE_NOT_ACTIVE":
    case "DUE_DATE_INVALID":
    case "STATE_TRANSITION_INVALID":
    case "CHECKLIST_REQUIRED_INCOMPLETE":
    case "DEPENDENCY_BLOCKED":
    case "REVIEW_REQUIRED":
    case "SENSITIVE_DATA_BLOCKED":
      return 422;
    case "NOT_FOUND":
      return 404;
    case "DATABASE_OPERATION_FAILED":
      return 500;
  }
}

function routeErrorBody(
  code: NextActionRouteErrorCode,
  requestId: string,
  userMessage: string,
): NextActionRouteErrorBody {
  return {
    ok: false,
    code,
    requestId,
    retryable: false,
    userMessage,
  };
}

function authErrorBody(error: AuthGuardError): NextActionRouteErrorBody {
  return {
    ok: false,
    code: error.code,
    requestId: error.requestId,
    retryable: error.retryable,
    userMessage: error.userMessage,
  };
}

function nextActionErrorBody(
  error: NextSessionTaskError,
  requestId: string,
): NextActionRouteErrorBody {
  return {
    ok: false,
    code: error.code,
    requestId,
    retryable: error.code === "DATABASE_OPERATION_FAILED",
    userMessage: userMessageForNextActionError(error.code),
  };
}

function userMessageForNextActionError(
  code: NextSessionTaskError["code"],
): string {
  switch (code) {
    case "VALIDATION_ERROR":
      return "请检查下场任务信息";
    case "LONG_INPUT_LIMIT_EXCEEDED":
      return "任务内容过长，请拆分后再保存";
    case "FORBIDDEN_PERMISSION":
      return "需要下场任务权限";
    case "SOURCE_NOT_REVIEW_READY":
      return "任务来源尚未达到可创建状态";
    case "ASSIGNEE_NOT_ACTIVE":
      return "负责人不是当前团队活跃成员";
    case "DUE_DATE_INVALID":
      return "请检查任务截止时间";
    case "DUPLICATE_TASK":
      return "已存在相同来源的活跃任务";
    case "TASK_STATE_CONFLICT":
      return "任务状态已变化，请刷新后重试";
    case "STATE_TRANSITION_INVALID":
      return "当前任务状态暂不能执行该操作";
    case "CHECKLIST_REQUIRED_INCOMPLETE":
      return "请先完成必做检查项";
    case "DEPENDENCY_BLOCKED":
      return "任务仍有未解决依赖";
    case "REVIEW_REQUIRED":
      return "任务需要先审核";
    case "SENSITIVE_DATA_BLOCKED":
      return "任务来源包含敏感内容，不能保存";
    case "NOT_FOUND":
      return "未找到该下场任务";
    case "DATABASE_OPERATION_FAILED":
      return "下场任务暂时不可用";
  }
}

function toSafeRouteError(
  error: unknown,
  requestId: string,
): {
  status: number;
  body: NextActionRouteErrorBody;
} {
  if (error instanceof NextSessionTaskError) {
    return {
      status: routeStatusForNextActionError(error.code),
      body: nextActionErrorBody(error, requestId),
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

function readListInput(request: Request): ListNextSessionTasksInput {
  const url = new URL(request.url);
  const limitValue = url.searchParams.get("limit");
  const ownerId = firstPresent(url.searchParams.get("ownerId"));
  const sourceWorkflow = firstPresent(url.searchParams.get("sourceWorkflow"));

  return {
    status: readStringArrayQuery(url, "status") as ListNextSessionTasksInput["status"],
    ownerId: ownerId ?? undefined,
    sourceWorkflow:
      (sourceWorkflow ?? undefined) as ListNextSessionTasksInput["sourceWorkflow"],
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
    throw new NextSessionTaskError(
      "VALIDATION_ERROR",
      "Next-session task route request body is malformed",
      { cause: error },
    );
  }
}

async function readTaskCreateInput(
  request: Request,
): Promise<CreateNextSessionTaskInput> {
  return (await readJsonObject(request)) as CreateNextSessionTaskInput;
}

async function readStatusInput(
  request: Request,
  taskId: string,
): Promise<UpdateNextSessionTaskStatusInput> {
  return {
    ...(await readJsonObject(request)),
    taskId,
  } as UpdateNextSessionTaskStatusInput;
}

async function readChecklistInput(
  request: Request,
  taskId: string,
  itemId: string,
): Promise<UpdateTaskChecklistItemInput> {
  return {
    ...(await readJsonObject(request)),
    taskId,
    itemId,
  } as UpdateTaskChecklistItemInput;
}

async function readDependencyCreateInput(
  request: Request,
  taskId: string,
): Promise<RecordTaskDependencyInput> {
  return {
    ...(await readJsonObject(request)),
    taskId,
  } as RecordTaskDependencyInput;
}

async function readDependencyUpdateInput(
  request: Request,
  taskId: string,
  dependencyId: string,
): Promise<UpdateTaskDependencyStateInput> {
  return {
    ...(await readJsonObject(request)),
    taskId,
    dependencyId,
  } as UpdateTaskDependencyStateInput;
}

async function readCompleteInput(
  request: Request,
  taskId: string,
): Promise<CompleteNextSessionTaskInput> {
  return {
    ...(await readJsonObject(request)),
    taskId,
  } as CompleteNextSessionTaskInput;
}

async function readReviewResultInput(
  request: Request,
  taskId: string,
): Promise<RecordTaskReviewResultInput> {
  return {
    ...(await readJsonObject(request)),
    taskId,
  } as RecordTaskReviewResultInput;
}

async function readFeedbackSignalInput(
  request: Request,
  taskId: string,
): Promise<RecordTaskFeedbackSignalInput> {
  return {
    ...(await readJsonObject(request)),
    taskId,
  } as RecordTaskFeedbackSignalInput;
}

function hasNextActionMutationCsrfHeader(request: Request): boolean {
  return (
    request.headers.get(NEXT_SESSION_TASK_MUTATION_CSRF_HEADER_NAME) ===
    NEXT_SESSION_TASK_MUTATION_CSRF_HEADER_VALUE
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
  const scope = readNextActionRouteScope(input.request);

  if (!scope) {
    throw new AuthGuardError(
      "AUTH_CONTEXT_INVALID",
      "Next-action route requires tenant and team scope",
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
        type: "next_session_task",
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
  if (!hasNextActionMutationCsrfHeader(request)) {
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
  if (!readNextActionRouteScope(request)) {
    return createJsonResponse(
      routeErrorBody("AUTH_SCOPE_REQUIRED", requestId, "请选择团队后再继续"),
      400,
    );
  }

  return null;
}

function requireRepositories(
  authRepository: AuthSessionRepository | null,
  nextActionRepository: NextActionRouteRepository | null,
  requestId: string,
) {
  if (!authRepository || !nextActionRepository) {
    return createJsonResponse(
      routeErrorBody("AUTH_OPERATION_FAILED", requestId, "权限校验暂时失败"),
      500,
    );
  }

  return null;
}

function preflightRead(input: {
  authRepository: AuthSessionRepository | null;
  nextActionRepository: NextActionRouteRepository | null;
  request: Request;
  requestId: string;
}) {
  return (
    requireAuthCookie(input.request, input.requestId) ??
    requireRouteScope(input.request, input.requestId) ??
    requireRepositories(
      input.authRepository,
      input.nextActionRepository,
      input.requestId,
    )
  );
}

function preflightMutation(input: {
  authRepository: AuthSessionRepository | null;
  nextActionRepository: NextActionRouteRepository | null;
  request: Request;
  requestId: string;
}) {
  return (
    requireMutationCsrf(input.request, input.requestId) ??
    requireAuthCookie(input.request, input.requestId) ??
    requireRouteScope(input.request, input.requestId) ??
    requireRepositories(
      input.authRepository,
      input.nextActionRepository,
      input.requestId,
    )
  );
}

export async function handleNextActionTasksListRoute(
  authRepository: AuthSessionRepository | null,
  nextActionRepository: NextActionRouteRepository | null,
  request: Request & AuthCookieRequestLike,
): Promise<Response> {
  const requestId = getRequestId(request);
  const preflight = preflightRead({
    authRepository,
    nextActionRepository,
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
      route: "/api/next-actions/tasks",
    });
    const result = await nextActionRepository!.listNextSessionTasks(
      context,
      readListInput(request),
    );

    return createJsonResponse(
      {
        ok: true,
        requestId,
        tasks: result.items,
      },
      200,
    );
  } catch (error) {
    const safeError = toSafeRouteError(error, requestId);

    return createJsonResponse(safeError.body, safeError.status);
  }
}

export async function handleNextActionTasksCreateRoute(
  authRepository: AuthSessionRepository | null,
  nextActionRepository: NextActionRouteRepository | null,
  request: Request & AuthCookieRequestLike,
): Promise<Response> {
  const requestId = getRequestId(request);
  const preflight = preflightMutation({
    authRepository,
    nextActionRepository,
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
      requiredPermission: "manage_next_tasks",
      route: "/api/next-actions/tasks",
    });
    const task = await nextActionRepository!.createNextSessionTask(
      context,
      await readTaskCreateInput(request),
    );

    return createJsonResponse(
      {
        ok: true,
        requestId,
        task,
      },
      201,
    );
  } catch (error) {
    const safeError = toSafeRouteError(error, requestId);

    return createJsonResponse(safeError.body, safeError.status);
  }
}

export async function handleNextActionTaskDetailRoute(
  authRepository: AuthSessionRepository | null,
  nextActionRepository: NextActionRouteRepository | null,
  request: Request & AuthCookieRequestLike,
  params: RouteTaskParams,
): Promise<Response> {
  const requestId = getRequestId(request);
  const taskId = readRouteTaskId(params);
  const preflight = preflightRead({
    authRepository,
    nextActionRepository,
    request,
    requestId,
  });

  if (preflight) {
    return preflight;
  }

  if (!taskId) {
    return createJsonResponse(
      routeErrorBody("TASK_ID_REQUIRED", requestId, "缺少下场任务"),
      400,
    );
  }

  try {
    const context = await resolveDataAccessContext({
      authRepository: authRepository!,
      request,
      requestId,
      requiredPermission: "read_workspace",
      route: "/api/next-actions/tasks/[taskId]",
      targetId: taskId,
    });
    const task = await nextActionRepository!.getNextSessionTask(context, {
      taskId,
    });

    return createJsonResponse(
      {
        ok: true,
        requestId,
        task,
      },
      200,
    );
  } catch (error) {
    const safeError = toSafeRouteError(error, requestId);

    return createJsonResponse(safeError.body, safeError.status);
  }
}

async function mutateTask(input: {
  authRepository: AuthSessionRepository | null;
  nextActionRepository: NextActionRouteRepository | null;
  request: Request & AuthCookieRequestLike;
  params: RouteTaskParams;
  route: string;
  requiredPermission: AuthPermission;
  readInput: (request: Request, taskId: string) => Promise<unknown>;
  mutate: (
    context: Awaited<ReturnType<typeof resolveDataAccessContext>>,
    values: never,
  ) => Promise<unknown>;
  successKey: string;
  successStatus?: number;
}): Promise<Response> {
  const requestId = getRequestId(input.request);
  const taskId = readRouteTaskId(input.params);
  const preflight = preflightMutation({
    authRepository: input.authRepository,
    nextActionRepository: input.nextActionRepository,
    request: input.request,
    requestId,
  });

  if (preflight) {
    return preflight;
  }

  if (!taskId) {
    return createJsonResponse(
      routeErrorBody("TASK_ID_REQUIRED", requestId, "缺少下场任务"),
      400,
    );
  }

  try {
    const context = await resolveDataAccessContext({
      authRepository: input.authRepository!,
      request: input.request,
      requestId,
      requiredPermission: input.requiredPermission,
      route: input.route,
      targetId: taskId,
    });
    const result = await input.mutate(
      context,
      (await input.readInput(input.request, taskId)) as never,
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

export async function handleNextActionTaskStatusRoute(
  authRepository: AuthSessionRepository | null,
  nextActionRepository: NextActionRouteRepository | null,
  request: Request & AuthCookieRequestLike,
  params: RouteTaskParams,
): Promise<Response> {
  return mutateTask({
    authRepository,
    nextActionRepository,
    request,
    params,
    route: "/api/next-actions/tasks/[taskId]/status",
    requiredPermission: "read_workspace",
    readInput: readStatusInput,
    mutate: (context, values) =>
      nextActionRepository!.updateNextSessionTaskStatus(context, values),
    successKey: "task",
  });
}

export async function handleNextActionTaskCompleteRoute(
  authRepository: AuthSessionRepository | null,
  nextActionRepository: NextActionRouteRepository | null,
  request: Request & AuthCookieRequestLike,
  params: RouteTaskParams,
): Promise<Response> {
  return mutateTask({
    authRepository,
    nextActionRepository,
    request,
    params,
    route: "/api/next-actions/tasks/[taskId]/complete",
    requiredPermission: "read_workspace",
    readInput: readCompleteInput,
    mutate: (context, values) =>
      nextActionRepository!.completeNextSessionTask(context, values),
    successKey: "task",
  });
}

export async function handleNextActionTaskReviewResultRoute(
  authRepository: AuthSessionRepository | null,
  nextActionRepository: NextActionRouteRepository | null,
  request: Request & AuthCookieRequestLike,
  params: RouteTaskParams,
): Promise<Response> {
  return mutateTask({
    authRepository,
    nextActionRepository,
    request,
    params,
    route: "/api/next-actions/tasks/[taskId]/review-results",
    requiredPermission: "manage_next_tasks",
    readInput: readReviewResultInput,
    mutate: (context, values) =>
      nextActionRepository!.recordTaskReviewResult(context, values),
    successKey: "task",
  });
}

export async function handleNextActionTaskFeedbackSignalRoute(
  authRepository: AuthSessionRepository | null,
  nextActionRepository: NextActionRouteRepository | null,
  request: Request & AuthCookieRequestLike,
  params: RouteTaskParams,
): Promise<Response> {
  return mutateTask({
    authRepository,
    nextActionRepository,
    request,
    params,
    route: "/api/next-actions/tasks/[taskId]/feedback-signals",
    requiredPermission: "manage_next_tasks",
    readInput: readFeedbackSignalInput,
    mutate: (context, values) =>
      nextActionRepository!.recordTaskFeedbackSignal(context, values),
    successKey: "signal",
    successStatus: 201,
  });
}

export async function handleNextActionTaskChecklistRoute(
  authRepository: AuthSessionRepository | null,
  nextActionRepository: NextActionRouteRepository | null,
  request: Request & AuthCookieRequestLike,
  params: RouteChecklistParams,
): Promise<Response> {
  const requestId = getRequestId(request);
  const taskId = readRouteTaskId(params);
  const itemId = readRouteChecklistItemId(params);
  const preflight = preflightMutation({
    authRepository,
    nextActionRepository,
    request,
    requestId,
  });

  if (preflight) {
    return preflight;
  }

  if (!taskId) {
    return createJsonResponse(
      routeErrorBody("TASK_ID_REQUIRED", requestId, "缺少下场任务"),
      400,
    );
  }

  if (!itemId) {
    return createJsonResponse(
      routeErrorBody(
        "CHECKLIST_ITEM_ID_REQUIRED",
        requestId,
        "缺少任务检查项",
      ),
      400,
    );
  }

  try {
    const context = await resolveDataAccessContext({
      authRepository: authRepository!,
      request,
      requestId,
      requiredPermission: "read_workspace",
      route: "/api/next-actions/tasks/[taskId]/checklist/[itemId]",
      targetId: taskId,
    });
    const task = await nextActionRepository!.updateTaskChecklistItem(
      context,
      await readChecklistInput(request, taskId, itemId),
    );

    return createJsonResponse(
      {
        ok: true,
        requestId,
        task,
      },
      200,
    );
  } catch (error) {
    const safeError = toSafeRouteError(error, requestId);

    return createJsonResponse(safeError.body, safeError.status);
  }
}

export async function handleNextActionTaskDependencyCreateRoute(
  authRepository: AuthSessionRepository | null,
  nextActionRepository: NextActionRouteRepository | null,
  request: Request & AuthCookieRequestLike,
  params: RouteTaskParams,
): Promise<Response> {
  return mutateTask({
    authRepository,
    nextActionRepository,
    request,
    params,
    route: "/api/next-actions/tasks/[taskId]/dependencies",
    requiredPermission: "manage_next_tasks",
    readInput: readDependencyCreateInput,
    mutate: (context, values) =>
      nextActionRepository!.recordTaskDependency(context, values),
    successKey: "dependency",
    successStatus: 201,
  });
}

export async function handleNextActionTaskDependencyUpdateRoute(
  authRepository: AuthSessionRepository | null,
  nextActionRepository: NextActionRouteRepository | null,
  request: Request & AuthCookieRequestLike,
  params: RouteDependencyParams,
): Promise<Response> {
  const requestId = getRequestId(request);
  const taskId = readRouteTaskId(params);
  const dependencyId = readRouteDependencyId(params);
  const preflight = preflightMutation({
    authRepository,
    nextActionRepository,
    request,
    requestId,
  });

  if (preflight) {
    return preflight;
  }

  if (!taskId) {
    return createJsonResponse(
      routeErrorBody("TASK_ID_REQUIRED", requestId, "缺少下场任务"),
      400,
    );
  }

  if (!dependencyId) {
    return createJsonResponse(
      routeErrorBody("DEPENDENCY_ID_REQUIRED", requestId, "缺少任务依赖"),
      400,
    );
  }

  try {
    const context = await resolveDataAccessContext({
      authRepository: authRepository!,
      request,
      requestId,
      requiredPermission: "manage_next_tasks",
      route: "/api/next-actions/tasks/[taskId]/dependencies/[dependencyId]",
      targetId: taskId,
    });
    const dependency = await nextActionRepository!.updateTaskDependencyState(
      context,
      await readDependencyUpdateInput(request, taskId, dependencyId),
    );

    return createJsonResponse(
      {
        ok: true,
        requestId,
        dependency,
      },
      200,
    );
  } catch (error) {
    const safeError = toSafeRouteError(error, requestId);

    return createJsonResponse(safeError.body, safeError.status);
  }
}
