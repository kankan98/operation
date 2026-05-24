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
  createRacketProductRepository,
  RacketProductError,
  type CreateRacketProductInput,
  type ListRacketProductsInput,
  type PublishRacketProductInput,
  type RacketReviewDecisionInput,
  type RegisterRacketSourceInput,
} from "./repository";

export const RACKET_PRODUCT_MUTATION_CSRF_HEADER_NAME = "x-operation-csrf";
export const RACKET_PRODUCT_MUTATION_CSRF_HEADER_VALUE = "racket-products";

type RacketProductRouteRepository = ReturnType<
  typeof createRacketProductRepository
>;

type RacketProductRouteErrorCode =
  | AuthGuardErrorCode
  | "AUTH_SCOPE_REQUIRED"
  | "CSRF_HEADER_REQUIRED"
  | "PRODUCT_ID_REQUIRED"
  | "MALFORMED_JSON"
  | "VALIDATION_ERROR"
  | "FORBIDDEN_PERMISSION"
  | "DUPLICATE_MODEL"
  | "ALIAS_CONFLICT"
  | "SOURCE_CONFLICT"
  | "MISSING_SOURCE"
  | "NOT_FOUND"
  | "STATE_TRANSITION_INVALID"
  | "DATABASE_OPERATION_FAILED";

type RacketProductRouteErrorBody = {
  ok: false;
  code: RacketProductRouteErrorCode;
  requestId: string;
  retryable: boolean;
  userMessage: string;
};

type RacketProductRouteListBody =
  | RacketProductRouteErrorBody
  | {
      ok: true;
      requestId: string;
      products: Awaited<
        ReturnType<RacketProductRouteRepository["listRacketProducts"]>
      >["items"];
    };

type RacketProductRouteCreateBody =
  | RacketProductRouteErrorBody
  | {
      ok: true;
      requestId: string;
      product: Awaited<
        ReturnType<RacketProductRouteRepository["createRacketProduct"]>
      >;
    };

type RacketProductRouteSuccessBody = {
  ok: true;
  requestId: string;
} & Record<string, unknown>;

type RacketProductRouteBody =
  | RacketProductRouteErrorBody
  | RacketProductRouteSuccessBody;

type RouteProductParams = {
  productId?: string | null;
};

function getRequestId(request: Request): string {
  const requestId = request.headers.get("x-request-id")?.trim();

  if (requestId) {
    return requestId;
  }

  return `rackets_route_${randomUUID()}`;
}

function createJsonResponse(
  body:
    | RacketProductRouteListBody
    | RacketProductRouteCreateBody
    | RacketProductRouteBody,
  status: number,
): Response {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

function readRouteProductId(params: RouteProductParams): string | null {
  return firstPresent(params.productId ?? null);
}

function firstPresent(...values: Array<string | null>): string | null {
  for (const value of values) {
    const trimmed = value?.trim();

    if (trimmed) {
      return trimmed;
    }
  }

  return null;
}

function readRacketRouteScope(request: Request):
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

function routeStatusForProductError(code: RacketProductError["code"]): number {
  switch (code) {
    case "VALIDATION_ERROR":
      return 400;
    case "FORBIDDEN_PERMISSION":
      return 403;
    case "DUPLICATE_MODEL":
    case "ALIAS_CONFLICT":
    case "SOURCE_CONFLICT":
      return 409;
    case "MISSING_SOURCE":
    case "STATE_TRANSITION_INVALID":
      return 422;
    case "NOT_FOUND":
      return 404;
    case "DATABASE_OPERATION_FAILED":
      return 500;
  }
}

function authRouteErrorBody(
  code: RacketProductRouteErrorCode,
  requestId: string,
  userMessage: string,
): RacketProductRouteErrorBody {
  return {
    ok: false,
    code,
    requestId,
    retryable: false,
    userMessage,
  };
}

function authErrorBody(error: AuthGuardError): RacketProductRouteErrorBody {
  return {
    ok: false,
    code: error.code,
    requestId: error.requestId,
    retryable: error.retryable,
    userMessage: error.userMessage,
  };
}

function productErrorBody(
  error: RacketProductError,
  requestId: string,
): RacketProductRouteErrorBody {
  return {
    ok: false,
    code: error.code,
    requestId,
    retryable: error.code === "DATABASE_OPERATION_FAILED",
    userMessage: userMessageForProductError(error.code),
  };
}

function userMessageForProductError(
  code: RacketProductError["code"],
): string {
  switch (code) {
    case "VALIDATION_ERROR":
      return "请检查球拍信息";
    case "FORBIDDEN_PERMISSION":
      return "需要商品管理权限";
    case "DUPLICATE_MODEL":
      return "该型号已存在";
    case "ALIAS_CONFLICT":
      return "该别名已关联到其他型号";
    case "SOURCE_CONFLICT":
      return "该来源已登记";
    case "MISSING_SOURCE":
      return "请先补充来源";
    case "NOT_FOUND":
      return "未找到该球拍记录";
    case "STATE_TRANSITION_INVALID":
      return "当前状态暂不能执行该操作";
    case "DATABASE_OPERATION_FAILED":
      return "产品库暂时不可用";
  }
}

function toSafeRouteError(
  error: unknown,
  requestId: string,
): {
  status: number;
  body: RacketProductRouteErrorBody;
} {
  if (error instanceof RacketProductError) {
    return {
      status: routeStatusForProductError(error.code),
      body: productErrorBody(error, requestId),
    };
  }

  const authError = toAuthGuardError(error, requestId);

  return {
    status: routeStatusForAuthError(authError.code),
    body: authErrorBody(authError),
  };
}

function readListInput(request: Request): ListRacketProductsInput {
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
        ? (statusValues as ListRacketProductsInput["status"])
        : undefined,
    search: search || undefined,
    limit: limitValue ? Number(limitValue) : undefined,
  };
}

async function readCreateInput(
  request: Request,
): Promise<CreateRacketProductInput> {
  return (await readJsonObject(request)) as CreateRacketProductInput;
}

async function readJsonObject(request: Request): Promise<Record<string, unknown>> {
  try {
    const body = await request.json();

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      throw new Error("Request body must be an object");
    }

    return body as Record<string, unknown>;
  } catch (error) {
    throw new RacketProductError(
      "VALIDATION_ERROR",
      "Racket product request body is malformed",
      { cause: error },
    );
  }
}

async function readSourceCreateInput(
  request: Request,
  productId: string,
): Promise<RegisterRacketSourceInput> {
  return {
    ...(await readJsonObject(request)),
    productId,
  } as RegisterRacketSourceInput;
}

async function readReviewDecisionInput(
  request: Request,
): Promise<RacketReviewDecisionInput> {
  return (await readJsonObject(request)) as RacketReviewDecisionInput;
}

async function readPublishInput(
  request: Request,
  productId: string,
): Promise<PublishRacketProductInput> {
  return {
    ...(await readJsonObject(request)),
    productId,
  } as PublishRacketProductInput;
}

function hasProductMutationCsrfHeader(request: Request): boolean {
  return (
    request.headers.get(RACKET_PRODUCT_MUTATION_CSRF_HEADER_NAME) ===
    RACKET_PRODUCT_MUTATION_CSRF_HEADER_VALUE
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
  const scope = readRacketRouteScope(input.request);

  if (!scope) {
    throw new AuthGuardError(
      "AUTH_CONTEXT_INVALID",
      "Racket product route requires tenant and team scope",
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
        type: "racket_products",
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
  if (!hasProductMutationCsrfHeader(request)) {
    return createJsonResponse(
      authRouteErrorBody(
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
      authRouteErrorBody("UNAUTHENTICATED", requestId, "请先登录"),
      401,
    );
  }

  return null;
}

function requireRouteScope(request: Request, requestId: string) {
  if (!readRacketRouteScope(request)) {
    return createJsonResponse(
      authRouteErrorBody("AUTH_SCOPE_REQUIRED", requestId, "请选择团队后再继续"),
      400,
    );
  }

  return null;
}

function requireRepositories(
  authRepository: AuthSessionRepository | null,
  racketRepository: RacketProductRouteRepository | null,
  requestId: string,
) {
  if (!authRepository || !racketRepository) {
    return createJsonResponse(
      authRouteErrorBody(
        "AUTH_OPERATION_FAILED",
        requestId,
        "权限校验暂时失败",
      ),
      500,
    );
  }

  return null;
}

function preflightRead(input: {
  authRepository: AuthSessionRepository | null;
  racketRepository: RacketProductRouteRepository | null;
  request: Request;
  requestId: string;
}) {
  return (
    requireAuthCookie(input.request, input.requestId) ??
    requireRouteScope(input.request, input.requestId) ??
    requireRepositories(
      input.authRepository,
      input.racketRepository,
      input.requestId,
    )
  );
}

function preflightMutation(input: {
  authRepository: AuthSessionRepository | null;
  racketRepository: RacketProductRouteRepository | null;
  request: Request;
  requestId: string;
}) {
  return (
    requireMutationCsrf(input.request, input.requestId) ??
    requireAuthCookie(input.request, input.requestId) ??
    requireRouteScope(input.request, input.requestId) ??
    requireRepositories(
      input.authRepository,
      input.racketRepository,
      input.requestId,
    )
  );
}

export async function handleRacketProductsListRoute(
  authRepository: AuthSessionRepository | null,
  racketRepository: RacketProductRouteRepository | null,
  request: Request & AuthCookieRequestLike,
): Promise<Response> {
  const requestId = getRequestId(request);

  if (!readAuthSessionReferenceFromRequestCookie(request)) {
    return createJsonResponse(
      authRouteErrorBody("UNAUTHENTICATED", requestId, "请先登录"),
      401,
    );
  }

  if (!readRacketRouteScope(request)) {
    return createJsonResponse(
      authRouteErrorBody("AUTH_SCOPE_REQUIRED", requestId, "请选择团队后再继续"),
      400,
    );
  }

  if (!authRepository || !racketRepository) {
    return createJsonResponse(
      authRouteErrorBody(
        "AUTH_OPERATION_FAILED",
        requestId,
        "权限校验暂时失败",
      ),
      500,
    );
  }

  try {
    const context = await resolveDataAccessContext({
      authRepository,
      request,
      requestId,
      requiredPermission: "read_workspace",
      route: "/api/rackets/products",
    });
    const result = await racketRepository.listRacketProducts(
      context,
      readListInput(request),
    );

    return createJsonResponse(
      {
        ok: true,
        requestId,
        products: result.items,
      },
      200,
    );
  } catch (error) {
    const safeError = toSafeRouteError(error, requestId);

    return createJsonResponse(safeError.body, safeError.status);
  }
}

export async function handleRacketProductsCreateRoute(
  authRepository: AuthSessionRepository | null,
  racketRepository: RacketProductRouteRepository | null,
  request: Request & AuthCookieRequestLike,
): Promise<Response> {
  const requestId = getRequestId(request);

  if (!hasProductMutationCsrfHeader(request)) {
    return createJsonResponse(
      authRouteErrorBody(
        "CSRF_HEADER_REQUIRED",
        requestId,
        "请求无效，请刷新后重试",
      ),
      403,
    );
  }

  if (!readAuthSessionReferenceFromRequestCookie(request)) {
    return createJsonResponse(
      authRouteErrorBody("UNAUTHENTICATED", requestId, "请先登录"),
      401,
    );
  }

  if (!readRacketRouteScope(request)) {
    return createJsonResponse(
      authRouteErrorBody("AUTH_SCOPE_REQUIRED", requestId, "请选择团队后再继续"),
      400,
    );
  }

  if (!authRepository || !racketRepository) {
    return createJsonResponse(
      authRouteErrorBody(
        "AUTH_OPERATION_FAILED",
        requestId,
        "权限校验暂时失败",
      ),
      500,
    );
  }

  try {
    const context = await resolveDataAccessContext({
      authRepository,
      request,
      requestId,
      requiredPermission: "manage_products",
      route: "/api/rackets/products",
    });
    const product = await racketRepository.createRacketProduct(
      context,
      await readCreateInput(request),
    );

    return createJsonResponse(
      {
        ok: true,
        requestId,
        product,
      },
      201,
    );
  } catch (error) {
    const safeError = toSafeRouteError(error, requestId);

    return createJsonResponse(safeError.body, safeError.status);
  }
}

export async function handleRacketReviewQueueRoute(
  authRepository: AuthSessionRepository | null,
  racketRepository: RacketProductRouteRepository | null,
  request: Request & AuthCookieRequestLike,
): Promise<Response> {
  const requestId = getRequestId(request);
  const preflight = preflightRead({
    authRepository,
    racketRepository,
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
      route: "/api/rackets/review-queue",
    });
    const url = new URL(request.url);
    const limitValue = url.searchParams.get("limit");
    const result = await racketRepository!.listRacketReviewQueue(context, {
      limit: limitValue ? Number(limitValue) : undefined,
    });

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

export async function handleRacketProductSourceCreateRoute(
  authRepository: AuthSessionRepository | null,
  racketRepository: RacketProductRouteRepository | null,
  request: Request & AuthCookieRequestLike,
  params: RouteProductParams,
): Promise<Response> {
  const requestId = getRequestId(request);
  const productId = readRouteProductId(params);
  const preflight = preflightMutation({
    authRepository,
    racketRepository,
    request,
    requestId,
  });

  if (preflight) {
    return preflight;
  }

  if (!productId) {
    return createJsonResponse(
      authRouteErrorBody("PRODUCT_ID_REQUIRED", requestId, "缺少球拍记录"),
      400,
    );
  }

  try {
    const context = await resolveDataAccessContext({
      authRepository: authRepository!,
      request,
      requestId,
      requiredPermission: "manage_products",
      route: "/api/rackets/products/[productId]/sources",
      targetId: productId,
    });
    const source = await racketRepository!.registerRacketSource(
      context,
      await readSourceCreateInput(request, productId),
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

export async function handleRacketProductSubmitRoute(
  authRepository: AuthSessionRepository | null,
  racketRepository: RacketProductRouteRepository | null,
  request: Request & AuthCookieRequestLike,
  params: RouteProductParams,
): Promise<Response> {
  const requestId = getRequestId(request);
  const productId = readRouteProductId(params);
  const preflight = preflightMutation({
    authRepository,
    racketRepository,
    request,
    requestId,
  });

  if (preflight) {
    return preflight;
  }

  if (!productId) {
    return createJsonResponse(
      authRouteErrorBody("PRODUCT_ID_REQUIRED", requestId, "缺少球拍记录"),
      400,
    );
  }

  try {
    const context = await resolveDataAccessContext({
      authRepository: authRepository!,
      request,
      requestId,
      requiredPermission: "manage_products",
      route: "/api/rackets/products/[productId]/submit",
      targetId: productId,
    });
    const product = await racketRepository!.submitRacketProductForReview(
      context,
      { productId },
    );

    return createJsonResponse(
      {
        ok: true,
        requestId,
        product,
      },
      200,
    );
  } catch (error) {
    const safeError = toSafeRouteError(error, requestId);

    return createJsonResponse(safeError.body, safeError.status);
  }
}

export async function handleRacketReviewDecisionRoute(
  authRepository: AuthSessionRepository | null,
  racketRepository: RacketProductRouteRepository | null,
  request: Request & AuthCookieRequestLike,
): Promise<Response> {
  const requestId = getRequestId(request);
  const preflight = preflightMutation({
    authRepository,
    racketRepository,
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
      route: "/api/rackets/review-decisions",
    });
    const target = await racketRepository!.recordRacketReviewDecision(
      context,
      await readReviewDecisionInput(request),
    );

    if ("reviewState" in target) {
      return createJsonResponse(
        {
          ok: true,
          requestId,
          targetType: "source",
          source: target,
        },
        200,
      );
    }

    return createJsonResponse(
      {
        ok: true,
        requestId,
        targetType: "product",
        product: target,
      },
      200,
    );
  } catch (error) {
    const safeError = toSafeRouteError(error, requestId);

    return createJsonResponse(safeError.body, safeError.status);
  }
}

export async function handleRacketProductPublishRoute(
  authRepository: AuthSessionRepository | null,
  racketRepository: RacketProductRouteRepository | null,
  request: Request & AuthCookieRequestLike,
  params: RouteProductParams,
): Promise<Response> {
  const requestId = getRequestId(request);
  const productId = readRouteProductId(params);
  const preflight = preflightMutation({
    authRepository,
    racketRepository,
    request,
    requestId,
  });

  if (preflight) {
    return preflight;
  }

  if (!productId) {
    return createJsonResponse(
      authRouteErrorBody("PRODUCT_ID_REQUIRED", requestId, "缺少球拍记录"),
      400,
    );
  }

  try {
    const context = await resolveDataAccessContext({
      authRepository: authRepository!,
      request,
      requestId,
      requiredPermission: "review_knowledge",
      route: "/api/rackets/products/[productId]/publish",
      targetId: productId,
    });
    const product = await racketRepository!.publishRacketProduct(
      context,
      await readPublishInput(request, productId),
    );

    return createJsonResponse(
      {
        ok: true,
        requestId,
        product,
      },
      200,
    );
  } catch (error) {
    const safeError = toSafeRouteError(error, requestId);

    return createJsonResponse(safeError.body, safeError.status);
  }
}
