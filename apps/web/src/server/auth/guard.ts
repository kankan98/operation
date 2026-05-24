import "server-only";

import {
  parseDataAccessContext,
  type DataAccessContext,
} from "../db/context";
import { AuthGuardError } from "./errors";
import type { AuthRepositoryDatabase } from "./repository";
import { createAuthGuardRepository } from "./repository";
import type {
  AuthContext,
  AuthGuardRequest,
  AuthPermission,
  AuthTeamRole,
} from "./types";

export type AuthGuardRepository = ReturnType<typeof createAuthGuardRepository>;

export async function requireAuthContext(
  repository: AuthGuardRepository,
  request: AuthGuardRequest,
): Promise<AuthContext> {
  const context = await repository.resolveAuthContext(request);

  if (!context.permissions.includes(request.requiredPermission)) {
    throw new AuthGuardError(
      "FORBIDDEN_PERMISSION",
      "Actor is missing required permission",
      {
        requestId: request.requestId,
        details: {
          requiredPermission: request.requiredPermission,
        },
      },
    );
  }

  if (request.allowedRoles && !request.allowedRoles.includes(context.role)) {
    throw new AuthGuardError("FORBIDDEN_ROLE", "Actor role is not allowed", {
      requestId: request.requestId,
      details: {
        role: context.role,
      },
    });
  }

  if (
    request.target &&
    (request.target.tenantId !== context.tenant.id ||
      request.target.teamId !== context.team.id)
  ) {
    throw new AuthGuardError(
      "FORBIDDEN_SCOPE",
      "Target scope is outside authorized tenant/team",
      {
        requestId: request.requestId,
        details: {
          targetType: request.target.type,
        },
      },
    );
  }

  return context;
}

export function authContextToDataAccessContext(
  context: AuthContext,
): DataAccessContext {
  return parseDataAccessContext({
    requestId: context.requestId,
    actorId: context.actor.id,
    tenantId: context.tenant.id,
    teamId: context.team.id,
    role: context.role,
    permissions: context.permissions,
  });
}

export async function requireAuthorizedDataAccess(
  repository: AuthGuardRepository,
  request: AuthGuardRequest,
): Promise<DataAccessContext> {
  const context = await requireAuthContext(repository, request);

  return authContextToDataAccessContext(context);
}

export function createAuthGuard(database: AuthRepositoryDatabase) {
  return createAuthGuardRepository(database);
}

export type { AuthPermission, AuthTeamRole };
