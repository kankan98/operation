import { createDatabaseConnection } from "../db/client";
import {
  appUsers,
  authSessions,
  teamMemberships,
  teams,
  tenantMemberships,
  tenants,
} from "../db/schema";
import {
  AuthGuardError,
  createAuthSessionReference,
  createAuthSessionRepository,
  hashAuthSessionReference,
  requireAuthContextFromSession,
  type AuthSessionRepositoryDatabase,
} from "./index";

class ExpectedRollback extends Error {
  constructor() {
    super("Rollback local auth session check");
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
      error instanceof AuthGuardError &&
      error.code === expectedCode
    ) {
      return;
    }

    throw new Error(`${label} failed with unexpected denial`);
  }

  throw new Error(`${label} should have been denied`);
}

async function expectRedacted(label: string, action: () => Promise<unknown>) {
  try {
    await action();
  } catch (error) {
    if (!(error instanceof AuthGuardError)) {
      throw new Error(`${label} did not throw an auth error`);
    }

    const serialized = JSON.stringify(error);

    if (
      serialized.includes("raw_session_secret") ||
      serialized.includes("raw_cookie_value") ||
      serialized.includes("provider_session_raw") ||
      serialized.includes("Bearer")
    ) {
      throw new Error(`${label} leaked sensitive session metadata`);
    }

    return;
  }

  throw new Error(`${label} should have failed with redacted details`);
}

async function main() {
  const { client, db } = createDatabaseConnection();
  const checkId = `auth_session_check_${Date.now()}`;

  try {
    try {
      await db.transaction(async (transaction) => {
        const tenantId = `${checkId}_tenant`;
        const teamId = `${checkId}_team`;
        const otherTeamId = `${checkId}_other_team`;
        const operatorId = `${checkId}_operator`;
        const viewerId = `${checkId}_viewer`;
        const suspendedId = `${checkId}_suspended`;
        const now = new Date();
        const future = new Date(Date.now() + 60 * 60 * 1000);
        const past = new Date(Date.now() - 60 * 60 * 1000);

        await transaction.insert(tenants).values({
          id: tenantId,
          name: "Local auth session check",
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
            joinedAt: now,
          },
          {
            id: `${viewerId}_tenant_membership`,
            tenantId,
            userId: viewerId,
            status: "active",
            tenantRole: "member",
            joinedAt: now,
          },
          {
            id: `${suspendedId}_tenant_membership`,
            tenantId,
            userId: suspendedId,
            status: "active",
            tenantRole: "member",
            joinedAt: now,
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
            joinedAt: now,
          },
          {
            id: `${viewerId}_team_membership`,
            tenantId,
            teamId,
            userId: viewerId,
            status: "active",
            role: "viewer",
            joinedAt: now,
          },
          {
            id: `${suspendedId}_team_membership`,
            tenantId,
            teamId,
            userId: suspendedId,
            status: "suspended",
            role: "operator",
            joinedAt: now,
          },
        ]);

        const activeReference = createAuthSessionReference();
        const expiredReference = createAuthSessionReference();
        const revokedReference = createAuthSessionReference();
        const invalidatedReference = createAuthSessionReference();
        const viewerReference = createAuthSessionReference();
        const suspendedReference = createAuthSessionReference();

        await transaction.insert(authSessions).values([
          {
            id: `${checkId}_active_session`,
            userId: operatorId,
            sessionReferenceHash: hashAuthSessionReference(activeReference),
            providerSessionId: `${checkId}_provider_ref`,
            status: "active",
            issuedAt: now,
            expiresAt: future,
          },
          {
            id: `${checkId}_expired_session`,
            userId: operatorId,
            sessionReferenceHash: hashAuthSessionReference(expiredReference),
            status: "active",
            issuedAt: past,
            expiresAt: past,
          },
          {
            id: `${checkId}_revoked_session`,
            userId: operatorId,
            sessionReferenceHash: hashAuthSessionReference(revokedReference),
            status: "revoked",
            invalidatedReason: "logout",
            issuedAt: now,
            expiresAt: future,
          },
          {
            id: `${checkId}_invalidated_session`,
            userId: operatorId,
            sessionReferenceHash: hashAuthSessionReference(invalidatedReference),
            status: "invalidated",
            invalidatedReason: "role_changed",
            issuedAt: now,
            expiresAt: future,
          },
          {
            id: `${checkId}_viewer_session`,
            userId: viewerId,
            sessionReferenceHash: hashAuthSessionReference(viewerReference),
            status: "active",
            issuedAt: now,
            expiresAt: future,
          },
          {
            id: `${checkId}_suspended_session`,
            userId: suspendedId,
            sessionReferenceHash: hashAuthSessionReference(suspendedReference),
            status: "active",
            issuedAt: now,
            expiresAt: future,
          },
        ]);

        const repository = createAuthSessionRepository(
          transaction as unknown as AuthSessionRepositoryDatabase,
        );

        const resolved = await requireAuthContextFromSession(repository, {
          requestId: `${checkId}_allowed`,
          sessionReference: activeReference,
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

        if (
          resolved.context.actor.id !== operatorId ||
          resolved.session.status !== "active" ||
          "sessionReference" in resolved.session ||
          JSON.stringify(resolved).includes(activeReference)
        ) {
          throw new Error("Active session did not resolve to a safe auth context");
        }

        await expectDenied(
          "expired session",
          () =>
            requireAuthContextFromSession(repository, {
              requestId: `${checkId}_expired`,
              sessionReference: expiredReference,
              tenantId,
              teamId,
              requiredPermission: "capture_session",
            }),
          "SESSION_EXPIRED",
        );

        await expectDenied(
          "revoked session",
          () =>
            requireAuthContextFromSession(repository, {
              requestId: `${checkId}_revoked`,
              sessionReference: revokedReference,
              tenantId,
              teamId,
              requiredPermission: "capture_session",
            }),
          "SESSION_REVOKED",
        );

        await expectDenied(
          "invalidated session",
          () =>
            requireAuthContextFromSession(repository, {
              requestId: `${checkId}_invalidated`,
              sessionReference: invalidatedReference,
              tenantId,
              teamId,
              requiredPermission: "capture_session",
            }),
          "SESSION_REVOKED",
        );

        await expectDenied(
          "inactive membership",
          () =>
            requireAuthContextFromSession(repository, {
              requestId: `${checkId}_inactive_membership`,
              sessionReference: suspendedReference,
              tenantId,
              teamId,
              requiredPermission: "capture_session",
            }),
          "MEMBERSHIP_INACTIVE",
        );

        await expectDenied(
          "missing permission",
          () =>
            requireAuthContextFromSession(repository, {
              requestId: `${checkId}_missing_permission`,
              sessionReference: viewerReference,
              tenantId,
              teamId,
              requiredPermission: "capture_session",
            }),
          "FORBIDDEN_PERMISSION",
        );

        await expectDenied(
          "cross team target",
          () =>
            requireAuthContextFromSession(repository, {
              requestId: `${checkId}_cross_team`,
              sessionReference: activeReference,
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

        await expectRedacted("redacted missing session", () =>
          requireAuthContextFromSession(repository, {
            requestId: `${checkId}_redacted`,
            sessionReference: "raw_session_secret",
            tenantId,
            teamId,
            requiredPermission: "capture_session",
            metadata: {
              cookie: "raw_cookie_value",
              providerSessionId: "provider_session_raw",
              authorization: "Bearer raw_session_secret",
            },
          }),
        );

        throw new ExpectedRollback();
      });
    } catch (error) {
      if (!(error instanceof ExpectedRollback)) {
        throw error;
      }
    }

    console.log("Auth session local check passed; transaction rolled back.");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(
    error instanceof Error
      ? error.message
      : "Unknown auth:session-check failure",
  );
  process.exitCode = 1;
});
