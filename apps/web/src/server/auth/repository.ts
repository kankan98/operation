import "server-only";

import { and, eq } from "drizzle-orm";

import type { DatabaseClient } from "../db/client";
import {
  appUsers,
  teamMemberships,
  teams,
  tenantMemberships,
  tenants,
} from "../db/schema";
import { AuthGuardError } from "./errors";
import { getPermissionsForRole } from "./policy";
import {
  authGuardRequestSchema,
  authTeamRoleSchema,
  authTenantRoleSchema,
  type AuthContext,
  type AuthGuardRequest,
} from "./types";

export type AuthRepositoryDatabase = Pick<DatabaseClient, "select">;

function parseRequest(input: unknown): AuthGuardRequest {
  const parsed = authGuardRequestSchema.safeParse(input);

  if (parsed.success) {
    return parsed.data;
  }

  throw new AuthGuardError(
    "AUTH_CONTEXT_INVALID",
    "Auth guard request is invalid",
    {
      requestId: "unknown",
      details: {
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
    },
  );
}

export function createAuthGuardRepository(database: AuthRepositoryDatabase) {
  return {
    async resolveAuthContext(input: AuthGuardRequest): Promise<AuthContext> {
      const request = parseRequest(input);

      const [user] = await database
        .select()
        .from(appUsers)
        .where(eq(appUsers.id, request.actorId))
        .limit(1);

      if (!user || user.status !== "active") {
        throw new AuthGuardError("UNAUTHENTICATED", "Actor is not active", {
          requestId: request.requestId,
        });
      }

      const [tenant] = await database
        .select()
        .from(tenants)
        .where(eq(tenants.id, request.tenantId))
        .limit(1);

      if (!tenant || tenant.status !== "active") {
        throw new AuthGuardError("TENANT_NOT_FOUND", "Tenant is not active", {
          requestId: request.requestId,
        });
      }

      const [team] = await database
        .select()
        .from(teams)
        .where(and(eq(teams.id, request.teamId), eq(teams.tenantId, request.tenantId)))
        .limit(1);

      if (!team || team.status !== "active") {
        throw new AuthGuardError("TEAM_NOT_FOUND", "Team is not active", {
          requestId: request.requestId,
        });
      }

      const [tenantMembership] = await database
        .select()
        .from(tenantMemberships)
        .where(
          and(
            eq(tenantMemberships.tenantId, request.tenantId),
            eq(tenantMemberships.userId, request.actorId),
          ),
        )
        .limit(1);

      if (!tenantMembership || tenantMembership.status !== "active") {
        throw new AuthGuardError(
          "MEMBERSHIP_INACTIVE",
          "Tenant membership is not active",
          {
            requestId: request.requestId,
          },
        );
      }

      const [teamMembership] = await database
        .select()
        .from(teamMemberships)
        .where(
          and(
            eq(teamMemberships.tenantId, request.tenantId),
            eq(teamMemberships.teamId, request.teamId),
            eq(teamMemberships.userId, request.actorId),
          ),
        )
        .limit(1);

      if (!teamMembership || teamMembership.status !== "active") {
        throw new AuthGuardError(
          "MEMBERSHIP_INACTIVE",
          "Team membership is not active",
          {
            requestId: request.requestId,
          },
        );
      }

      const role = authTeamRoleSchema.parse(teamMembership.role);
      const tenantRole = authTenantRoleSchema.parse(tenantMembership.tenantRole);

      return {
        requestId: request.requestId,
        actor: {
          id: user.id,
          displayName: user.displayName,
        },
        tenant: {
          id: tenant.id,
          name: tenant.name,
        },
        team: {
          id: team.id,
          name: team.name,
        },
        tenantMembershipId: tenantMembership.id,
        teamMembershipId: teamMembership.id,
        tenantRole,
        role,
        permissions: getPermissionsForRole(role, teamMembership.permissionOverrides),
        createdAt: new Date(),
      };
    },
  };
}
