import { createDatabaseConnection } from "../db/client";
import {
  appUsers,
  teamMemberships,
  teams,
  tenantMemberships,
  tenants,
} from "../db/schema";
import {
  createAuthGuardRepository,
  requireAuthorizedDataAccess,
  type AuthRepositoryDatabase,
} from "./index";

class ExpectedRollback extends Error {
  constructor() {
    super("Rollback local auth guard check");
  }
}

async function expectDenied(
  label: string,
  action: () => Promise<unknown>,
  expectedCode: string,
) {
  try {
    await action();
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      error.code === expectedCode
    ) {
      return;
    }

    throw new Error(`${label} failed with unexpected denial`);
  }

  throw new Error(`${label} should have been denied`);
}

async function main() {
  const { client, db } = createDatabaseConnection();
  const checkId = `auth_check_${Date.now()}`;

  try {
    try {
      await db.transaction(async (transaction) => {
        const tenantId = `${checkId}_tenant`;
        const teamId = `${checkId}_team`;
        const otherTeamId = `${checkId}_other_team`;
        const operatorId = `${checkId}_operator`;
        const viewerId = `${checkId}_viewer`;
        const suspendedId = `${checkId}_suspended`;

        await transaction.insert(tenants).values({
          id: tenantId,
          name: "Local auth guard check",
          defaultTeamId: teamId,
        });

        await transaction.insert(teams).values([
          {
            id: teamId,
            tenantId,
            name: "Live operations",
            createdBy: operatorId,
          },
          {
            id: otherTeamId,
            tenantId,
            name: "Other team",
            createdBy: operatorId,
          },
        ]);

        await transaction.insert(appUsers).values([
          {
            id: operatorId,
            displayName: "Operator",
            primaryEmail: `${operatorId}@example.invalid`,
            status: "active",
          },
          {
            id: viewerId,
            displayName: "Viewer",
            primaryEmail: `${viewerId}@example.invalid`,
            status: "active",
          },
          {
            id: suspendedId,
            displayName: "Suspended",
            primaryEmail: `${suspendedId}@example.invalid`,
            status: "active",
          },
        ]);

        await transaction.insert(tenantMemberships).values([
          {
            id: `${operatorId}_tenant_membership`,
            tenantId,
            userId: operatorId,
            status: "active",
            tenantRole: "member",
            joinedAt: new Date(),
          },
          {
            id: `${viewerId}_tenant_membership`,
            tenantId,
            userId: viewerId,
            status: "active",
            tenantRole: "member",
            joinedAt: new Date(),
          },
          {
            id: `${suspendedId}_tenant_membership`,
            tenantId,
            userId: suspendedId,
            status: "active",
            tenantRole: "member",
            joinedAt: new Date(),
          },
        ]);

        await transaction.insert(teamMemberships).values([
          {
            id: `${operatorId}_team_membership`,
            tenantId,
            teamId,
            userId: operatorId,
            status: "active",
            role: "operator",
            joinedAt: new Date(),
          },
          {
            id: `${viewerId}_team_membership`,
            tenantId,
            teamId,
            userId: viewerId,
            status: "active",
            role: "viewer",
            joinedAt: new Date(),
          },
          {
            id: `${suspendedId}_team_membership`,
            tenantId,
            teamId,
            userId: suspendedId,
            status: "suspended",
            role: "operator",
            joinedAt: new Date(),
          },
        ]);

        const repository = createAuthGuardRepository(
          transaction as unknown as AuthRepositoryDatabase,
        );

        const dataAccessContext = await requireAuthorizedDataAccess(repository, {
          requestId: `${checkId}_allowed`,
          actorId: operatorId,
          tenantId,
          teamId,
          requiredPermission: "capture_session",
          target: {
            tenantId,
            teamId,
            type: "session",
            id: `${checkId}_session`,
          },
        });

        if (dataAccessContext.actorId !== operatorId) {
          throw new Error("Authorized data access context used the wrong actor");
        }

        await expectDenied(
          "missing permission",
          () =>
            requireAuthorizedDataAccess(repository, {
              requestId: `${checkId}_missing_permission`,
              actorId: viewerId,
              tenantId,
              teamId,
              requiredPermission: "capture_session",
            }),
          "FORBIDDEN_PERMISSION",
        );

        await expectDenied(
          "inactive membership",
          () =>
            requireAuthorizedDataAccess(repository, {
              requestId: `${checkId}_inactive`,
              actorId: suspendedId,
              tenantId,
              teamId,
              requiredPermission: "capture_session",
            }),
          "MEMBERSHIP_INACTIVE",
        );

        await expectDenied(
          "cross team target",
          () =>
            requireAuthorizedDataAccess(repository, {
              requestId: `${checkId}_cross_team`,
              actorId: operatorId,
              tenantId,
              teamId,
              requiredPermission: "capture_session",
              target: {
                tenantId,
                teamId: otherTeamId,
                type: "session",
                id: `${checkId}_other_session`,
              },
            }),
          "FORBIDDEN_SCOPE",
        );

        throw new ExpectedRollback();
      });
    } catch (error) {
      if (!(error instanceof ExpectedRollback)) {
        throw error;
      }
    }

    console.log("Auth guard local check passed; transaction rolled back.");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Unknown auth:check failure");
  process.exitCode = 1;
});
