import "server-only";

import { randomUUID } from "node:crypto";

import {
  AuthGuardError,
  toAuthGuardError,
} from "./errors";
import {
  createAuthSessionClearCookieHeader,
  getInternalV0PreviewCookiePolicy,
  invalidateAuthSessionFromRequestCookie,
  readAuthSessionReferenceFromRequestCookie,
  resolveAuthContextFromRequestCookie,
  type AuthCookieRequestLike,
} from "./cookie";
import type {
  AuthSessionRepository,
  AuthSessionResolution,
  AuthSessionSummary,
} from "./session";
import type { AuthGuardErrorCode } from "./types";

export const AUTH_LOGOUT_CSRF_HEADER_NAME = "x-operation-csrf";
export const AUTH_LOGOUT_CSRF_HEADER_VALUE = "logout";
export const AUTH_TENANT_ID_HEADER_NAME = "x-operation-tenant-id";
export const AUTH_TEAM_ID_HEADER_NAME = "x-operation-team-id";

type AuthRouteErrorCode =
  | AuthGuardErrorCode
  | "AUTH_SCOPE_REQUIRED"
  | "CSRF_HEADER_REQUIRED";

type AuthRouteErrorBody = {
  authenticated: false;
  code: AuthRouteErrorCode;
  requestId: string;
  retryable: boolean;
  userMessage: string;
};

type AuthSessionView = {
  status: AuthSessionSummary["status"];
  expiresAt: string;
  lastVerifiedAt: string | null;
};

type AuthSessionRouteBody =
  | AuthRouteErrorBody
  | {
      authenticated: true;
      actor: {
        id: string;
        displayName: string;
      };
      tenant: {
        id: string;
        name: string;
      };
      team: {
        id: string;
        name: string;
      };
      membership: {
        role: AuthSessionResolution["context"]["role"];
        permissions: AuthSessionResolution["context"]["permissions"];
      };
      session: AuthSessionView;
    };

type AuthLogoutRouteBody =
  | AuthRouteErrorBody
  | {
      authenticated: false;
      loggedOut: boolean;
      code: "invalidated" | "session_not_found" | "already_inactive";
      requestId: string;
      session?: AuthSessionView;
    };

function getRequestId(request: Request): string {
  const requestId = request.headers.get("x-request-id")?.trim();

  if (requestId) {
    return requestId;
  }

  return `auth_route_${randomUUID()}`;
}

function createJsonResponse(
  body: AuthSessionRouteBody | AuthLogoutRouteBody,
  status: number,
  headers?: HeadersInit,
): Response {
  const responseHeaders = new Headers(headers);
  responseHeaders.set("Cache-Control", "no-store");

  return Response.json(body, {
    status,
    headers: responseHeaders,
  });
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

function readAuthRouteScope(request: Request):
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

function authErrorBody(error: AuthGuardError): AuthRouteErrorBody {
  return {
    authenticated: false,
    code: error.code,
    requestId: error.requestId,
    retryable: error.retryable,
    userMessage: error.userMessage,
  };
}

function authRouteErrorBody(
  code: AuthRouteErrorCode,
  requestId: string,
  userMessage: string,
): AuthRouteErrorBody {
  return {
    authenticated: false,
    code,
    requestId,
    retryable: false,
    userMessage,
  };
}

function toSessionView(session: AuthSessionSummary): AuthSessionView {
  return {
    status: session.status,
    expiresAt: session.expiresAt.toISOString(),
    lastVerifiedAt: session.lastVerifiedAt?.toISOString() ?? null,
  };
}

function toAuthenticatedSessionBody(
  resolution: AuthSessionResolution,
): AuthSessionRouteBody {
  return {
    authenticated: true,
    actor: {
      id: resolution.context.actor.id,
      displayName: resolution.context.actor.displayName,
    },
    tenant: {
      id: resolution.context.tenant.id,
      name: resolution.context.tenant.name,
    },
    team: {
      id: resolution.context.team.id,
      name: resolution.context.team.name,
    },
    membership: {
      role: resolution.context.role,
      permissions: resolution.context.permissions,
    },
    session: toSessionView(resolution.session),
  };
}

function toSafeAuthRouteError(error: unknown, requestId: string): AuthGuardError {
  return toAuthGuardError(error, requestId);
}

function hasLogoutCsrfHeader(request: Request): boolean {
  return (
    request.headers.get(AUTH_LOGOUT_CSRF_HEADER_NAME) ===
    AUTH_LOGOUT_CSRF_HEADER_VALUE
  );
}

export async function handleAuthSessionRoute(
  repository: AuthSessionRepository | null,
  request: Request & AuthCookieRequestLike,
): Promise<Response> {
  const requestId = getRequestId(request);
  const sessionReference = readAuthSessionReferenceFromRequestCookie(request);

  if (!sessionReference) {
    return createJsonResponse(
      authRouteErrorBody("UNAUTHENTICATED", requestId, "请先登录"),
      200,
    );
  }

  const scope = readAuthRouteScope(request);

  if (!scope) {
    return createJsonResponse(
      authRouteErrorBody(
        "AUTH_SCOPE_REQUIRED",
        requestId,
        "请选择团队后再继续",
      ),
      400,
    );
  }

  if (!repository) {
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
    const resolution = await resolveAuthContextFromRequestCookie(
      repository,
      request,
      {
        requestId,
        tenantId: scope.tenantId,
        teamId: scope.teamId,
        requiredPermission: "read_workspace",
        metadata: {
          route: "/api/auth/session",
        },
      },
    );

    return createJsonResponse(toAuthenticatedSessionBody(resolution), 200);
  } catch (error) {
    const authError = toSafeAuthRouteError(error, requestId);

    return createJsonResponse(
      authErrorBody(authError),
      routeStatusForAuthError(authError.code),
    );
  }
}

export async function handleAuthLogoutRoute(
  repository: AuthSessionRepository | null,
  request: Request & AuthCookieRequestLike,
): Promise<Response> {
  const requestId = getRequestId(request);
  const cookiePolicy = getInternalV0PreviewCookiePolicy();

  if (!hasLogoutCsrfHeader(request)) {
    return createJsonResponse(
      authRouteErrorBody(
        "CSRF_HEADER_REQUIRED",
        requestId,
        "请求无效，请刷新后重试",
      ),
      403,
    );
  }

  const sessionReference = readAuthSessionReferenceFromRequestCookie(request);

  if (!sessionReference) {
    return createJsonResponse(
      {
        authenticated: false,
        loggedOut: false,
        code: "session_not_found",
        requestId,
      },
      200,
      {
        "Set-Cookie": createAuthSessionClearCookieHeader(cookiePolicy),
      },
    );
  }

  if (!repository) {
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
    const result = await invalidateAuthSessionFromRequestCookie(
      repository,
      request,
      {
        requestId,
        reason: "logout",
        cookiePolicy,
        metadata: {
          route: "/api/auth/logout",
        },
      },
    );

    return createJsonResponse(
      {
        authenticated: false,
        loggedOut: result.invalidated,
        code: result.code,
        requestId,
        session: result.session ? toSessionView(result.session) : undefined,
      },
      200,
      {
        "Set-Cookie":
          result.clearCookieHeader ??
          createAuthSessionClearCookieHeader(cookiePolicy),
      },
    );
  } catch (error) {
    const authError = toSafeAuthRouteError(error, requestId);

    return createJsonResponse(
      authErrorBody(authError),
      routeStatusForAuthError(authError.code),
    );
  }
}
