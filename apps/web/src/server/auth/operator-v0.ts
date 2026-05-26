import "server-only";

import { randomUUID } from "node:crypto";

import { eq } from "drizzle-orm";

import type { DatabaseClient } from "../db/client";
import {
  appUsers,
  authSessions,
  teamMemberships,
  teams,
  tenantMemberships,
  tenants,
} from "../db/schema";
import {
  createAuthSessionSetCookieHeader,
  getAuthSessionMaxAgeForCookiePolicy,
  getInternalV0PreviewCookiePolicy,
  type AuthSessionCookiePolicy,
} from "./cookie";
import {
  authSessionMaxAgeSeconds,
  createAuthSessionReference,
  hashAuthSessionReference,
} from "./session";
import { ensureV0TrialDemoData } from "./trial-demo-data";
import type { AuthPermission } from "./types";

export const OPERATOR_V0_BOOTSTRAP_CSRF_HEADER_NAME = "x-operation-csrf";
export const OPERATOR_V0_BOOTSTRAP_CSRF_HEADER_VALUE = "operator-v0";

export const operatorV0TenantId = "operation_v0_tenant";
export const operatorV0TeamId = "operation_v0_live_team";
export const operatorV0ActorId = "operation_v0_operator";

export type OperatorV0BootstrapDatabase = Pick<
  DatabaseClient,
  "insert" | "select" | "update"
>;

type OperatorV0RouteErrorCode =
  | "OPERATOR_V0_BOOTSTRAP_DISABLED"
  | "CSRF_HEADER_REQUIRED"
  | "BOOTSTRAP_UNAVAILABLE";

type OperatorV0RouteBody =
  | {
      ok: false;
      code: OperatorV0RouteErrorCode;
      requestId: string;
      userMessage: string;
    }
  | {
      ok: true;
      requestId: string;
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
        role: "operator";
        permissions: AuthPermission[];
      };
      nextPath: "/sessions";
    };

type OperatorV0SessionRouteOptions = {
  enabled?: boolean;
  cookiePolicy?: AuthSessionCookiePolicy;
};

const operatorV0TenantName = "V0 内部演示租户";
const operatorV0TeamName = "直播运营 V0 小组";
const operatorV0ActorDisplayName = "V0 运营";
const operatorV0ActorEmail = "operator-v0@example.invalid";
const operatorV0PermissionOverrides: AuthPermission[] = [
  "run_ai_review",
  "manage_talk_tracks",
  "manage_next_tasks",
  "manage_products",
  "review_knowledge",
];

function getRequestId(request: Request): string {
  const requestId = request.headers.get("x-request-id")?.trim();

  if (requestId) {
    return requestId;
  }

  return `operator_v0_${randomUUID()}`;
}

function createJsonResponse(
  body: OperatorV0RouteBody,
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

function routeErrorBody(
  code: OperatorV0RouteErrorCode,
  requestId: string,
  userMessage: string,
): OperatorV0RouteBody {
  return {
    ok: false,
    code,
    requestId,
    userMessage,
  };
}

export function isOperatorV0BootstrapEnabled(): boolean {
  return (
    process.env.NODE_ENV !== "production" ||
    process.env.OPERATION_ENABLE_V0_BOOTSTRAP === "1"
  );
}

function hasBootstrapCsrfHeader(request: Request): boolean {
  return (
    request.headers.get(OPERATOR_V0_BOOTSTRAP_CSRF_HEADER_NAME) ===
    OPERATOR_V0_BOOTSTRAP_CSRF_HEADER_VALUE
  );
}

async function ensureOperatorV0Seed(database: OperatorV0BootstrapDatabase) {
  const now = new Date();

  const [existingTenant] = await database
    .select({ id: tenants.id })
    .from(tenants)
    .where(eq(tenants.id, operatorV0TenantId))
    .limit(1);

  if (existingTenant) {
    await database
      .update(tenants)
      .set({
        name: operatorV0TenantName,
        status: "active",
        defaultTeamId: operatorV0TeamId,
        updatedAt: now,
      })
      .where(eq(tenants.id, operatorV0TenantId));
  } else {
    await database.insert(tenants).values({
      id: operatorV0TenantId,
      name: operatorV0TenantName,
      status: "active",
      defaultTeamId: operatorV0TeamId,
    });
  }

  const [existingUser] = await database
    .select({ id: appUsers.id })
    .from(appUsers)
    .where(eq(appUsers.id, operatorV0ActorId))
    .limit(1);

  if (existingUser) {
    await database
      .update(appUsers)
      .set({
        displayName: operatorV0ActorDisplayName,
        primaryEmail: operatorV0ActorEmail,
        status: "active",
        lastActiveAt: now,
        updatedAt: now,
      })
      .where(eq(appUsers.id, operatorV0ActorId));
  } else {
    await database.insert(appUsers).values({
      id: operatorV0ActorId,
      displayName: operatorV0ActorDisplayName,
      primaryEmail: operatorV0ActorEmail,
      status: "active",
      lastActiveAt: now,
    });
  }

  const [existingTeam] = await database
    .select({ id: teams.id })
    .from(teams)
    .where(eq(teams.id, operatorV0TeamId))
    .limit(1);

  if (existingTeam) {
    await database
      .update(teams)
      .set({
        tenantId: operatorV0TenantId,
        name: operatorV0TeamName,
        teamType: "live_operations",
        status: "active",
        createdBy: operatorV0ActorId,
        updatedAt: now,
      })
      .where(eq(teams.id, operatorV0TeamId));
  } else {
    await database.insert(teams).values({
      id: operatorV0TeamId,
      tenantId: operatorV0TenantId,
      name: operatorV0TeamName,
      teamType: "live_operations",
      status: "active",
      createdBy: operatorV0ActorId,
    });
  }

  const [existingTenantMembership] = await database
    .select({ id: tenantMemberships.id })
    .from(tenantMemberships)
    .where(eq(tenantMemberships.id, "operation_v0_tenant_membership"))
    .limit(1);

  if (existingTenantMembership) {
    await database
      .update(tenantMemberships)
      .set({
        status: "active",
        tenantRole: "member",
        joinedAt: now,
        removedAt: null,
        updatedAt: now,
      })
      .where(eq(tenantMemberships.id, "operation_v0_tenant_membership"));
  } else {
    await database.insert(tenantMemberships).values({
      id: "operation_v0_tenant_membership",
      tenantId: operatorV0TenantId,
      userId: operatorV0ActorId,
      status: "active",
      tenantRole: "member",
      joinedAt: now,
    });
  }

  const [existingTeamMembership] = await database
    .select({ id: teamMemberships.id })
    .from(teamMemberships)
    .where(eq(teamMemberships.id, "operation_v0_team_membership"))
    .limit(1);

  if (existingTeamMembership) {
    await database
      .update(teamMemberships)
      .set({
        status: "active",
        role: "operator",
        permissionOverrides: operatorV0PermissionOverrides,
        joinedAt: now,
        lastRoleChangedAt: now,
        updatedAt: now,
      })
      .where(eq(teamMemberships.id, "operation_v0_team_membership"));
  } else {
    await database.insert(teamMemberships).values({
      id: "operation_v0_team_membership",
      tenantId: operatorV0TenantId,
      teamId: operatorV0TeamId,
      userId: operatorV0ActorId,
      status: "active",
      role: "operator",
      permissionOverrides: operatorV0PermissionOverrides,
      joinedAt: now,
      lastRoleChangedAt: now,
    });
  }
}

async function createOperatorV0AuthSession(
  database: OperatorV0BootstrapDatabase,
  maxAgeSeconds = authSessionMaxAgeSeconds,
): Promise<string> {
  const sessionReference = createAuthSessionReference();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + maxAgeSeconds * 1000);

  await database.insert(authSessions).values({
    id: `operation_v0_session_${randomUUID()}`,
    userId: operatorV0ActorId,
    sessionReferenceHash: hashAuthSessionReference(sessionReference),
    providerSessionId: null,
    status: "active",
    issuedAt: now,
    expiresAt,
  });

  return sessionReference;
}

export async function handleOperatorV0SessionRoute(
  database: OperatorV0BootstrapDatabase | null,
  request: Request,
  options: OperatorV0SessionRouteOptions = {},
): Promise<Response> {
  const requestId = getRequestId(request);
  const enabled = options.enabled ?? isOperatorV0BootstrapEnabled();

  if (!enabled) {
    return createJsonResponse(
      routeErrorBody(
        "OPERATOR_V0_BOOTSTRAP_DISABLED",
        requestId,
        "本地演示入口未开启",
      ),
      404,
    );
  }

  if (!hasBootstrapCsrfHeader(request)) {
    return createJsonResponse(
      routeErrorBody("CSRF_HEADER_REQUIRED", requestId, "请求无效，请刷新后重试"),
      403,
    );
  }

  if (!database) {
    return createJsonResponse(
      routeErrorBody(
        "BOOTSTRAP_UNAVAILABLE",
        requestId,
        "本地演示入口暂时不可用",
      ),
      500,
    );
  }

  try {
    await ensureOperatorV0Seed(database);
    await ensureV0TrialDemoData(database, {
      tenantId: operatorV0TenantId,
      teamId: operatorV0TeamId,
      actorId: operatorV0ActorId,
    });
    const cookiePolicy =
      options.cookiePolicy ?? getInternalV0PreviewCookiePolicy();
    const sessionReference = await createOperatorV0AuthSession(
      database,
      getAuthSessionMaxAgeForCookiePolicy(cookiePolicy),
    );

    return createJsonResponse(
      {
        ok: true,
        requestId,
        actor: {
          id: operatorV0ActorId,
          displayName: operatorV0ActorDisplayName,
        },
        tenant: {
          id: operatorV0TenantId,
          name: operatorV0TenantName,
        },
        team: {
          id: operatorV0TeamId,
          name: operatorV0TeamName,
        },
        membership: {
          role: "operator",
          permissions: [
            "read_workspace",
            "capture_session",
            "run_ai_review",
            "manage_talk_tracks",
            "manage_next_tasks",
            "manage_products",
            "review_knowledge",
          ],
        },
        nextPath: "/sessions",
      },
      200,
      {
        "Set-Cookie": createAuthSessionSetCookieHeader(
          sessionReference,
          cookiePolicy,
        ),
      },
    );
  } catch (error) {
    console.error("Operator V0 bootstrap failed", {
      requestId,
      error: error instanceof Error ? error.name : "UnknownError",
    });

    return createJsonResponse(
      routeErrorBody(
        "BOOTSTRAP_UNAVAILABLE",
        requestId,
        "本地演示入口暂时不可用",
      ),
      500,
    );
  }
}
