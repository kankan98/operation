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
  authSessionCookieName,
  createAuthSessionReference,
  createAuthSessionRepository,
  createAuthSessionSetCookieHeader,
  createAuthSessionClearCookieHeader,
  getInternalV0PreviewCookiePolicy,
  hashAuthSessionReference,
  internalV0PreviewSessionMaxAgeSeconds,
  invalidateAuthSessionFromRequestCookie,
  isInternalV0PreviewCookiePolicyEnabled,
  readAuthSessionReferenceFromCookieHeader,
  resolveAuthContextFromRequestCookie,
  type AuthSessionRepositoryDatabase,
} from "./index";

class ExpectedRollback extends Error {
  constructor() {
    super("Rollback local auth cookie check");
  }
}

function requestWithCookie(cookieHeader: string): Request {
  return new Request("https://operation.local/protected", {
    headers: {
      cookie: cookieHeader,
    },
  });
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
      serialized.includes("raw_cookie_value") ||
      serialized.includes("raw_session_secret") ||
      serialized.includes("provider_session_raw") ||
      serialized.includes("Bearer")
    ) {
      throw new Error(`${label} leaked sensitive cookie metadata`);
    }

    return;
  }

  throw new Error(`${label} should have failed with redacted details`);
}

async function main() {
  const { client, db } = createDatabaseConnection();
  const checkId = `auth_cookie_check_${Date.now()}`;

  try {
    try {
      await db.transaction(async (transaction) => {
        const tenantId = `${checkId}_tenant`;
        const teamId = `${checkId}_team`;
        const operatorId = `${checkId}_operator`;
        const now = new Date();
        const future = new Date(Date.now() + 60 * 60 * 1000);
        const past = new Date(Date.now() - 60 * 60 * 1000);

        await transaction.insert(tenants).values({
          id: tenantId,
          name: "Local auth cookie check",
          defaultTeamId: teamId,
        });

        await transaction.insert(teams).values({
          id: teamId,
          tenantId,
          name: "Live operations",
          createdBy: operatorId,
        });

        await transaction.insert(appUsers).values({
          id: operatorId,
          displayName: "Operator",
          primaryEmail: `${operatorId}@example.invalid`,
          status: "active",
        });

        await transaction.insert(tenantMemberships).values({
          id: `${operatorId}_tenant_membership`,
          tenantId,
          userId: operatorId,
          status: "active",
          tenantRole: "member",
          joinedAt: now,
        });

        await transaction.insert(teamMemberships).values({
          id: `${operatorId}_team_membership`,
          tenantId,
          teamId,
          userId: operatorId,
          status: "active",
          role: "operator",
          joinedAt: now,
        });

        const activeReference = createAuthSessionReference();
        const expiredReference = createAuthSessionReference();
        const revokedReference = createAuthSessionReference();
        const invalidatedReference = createAuthSessionReference();

        await transaction.insert(authSessions).values([
          {
            id: `${checkId}_active_session`,
            userId: operatorId,
            sessionReferenceHash: hashAuthSessionReference(activeReference),
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
        ]);

        const repository = createAuthSessionRepository(
          transaction as unknown as AuthSessionRepositoryDatabase,
        );

        const setCookieHeader =
          createAuthSessionSetCookieHeader(activeReference);

        for (const expected of [
          `${authSessionCookieName}=`,
          "HttpOnly",
          "Secure",
          "SameSite=Lax",
          "Path=/",
          "Max-Age=604800",
        ]) {
          if (!setCookieHeader.includes(expected)) {
            throw new Error(`Set-Cookie header is missing ${expected}`);
          }
        }

        if (
          isInternalV0PreviewCookiePolicyEnabled({
            OPERATION_ENABLE_V0_BOOTSTRAP: "1",
          })
        ) {
          throw new Error("Preview cookie policy enabled without preview flag");
        }

        const previewPolicy = getInternalV0PreviewCookiePolicy({
          OPERATION_ENABLE_V0_BOOTSTRAP: "1",
          OPERATION_ALLOW_INSECURE_V0_PREVIEW_COOKIE: "1",
        });

        if (!previewPolicy) {
          throw new Error("Preview cookie policy did not enable with both flags");
        }

        const previewCookieHeader = createAuthSessionSetCookieHeader(
          activeReference,
          previewPolicy,
        );
        const previewClearHeader =
          createAuthSessionClearCookieHeader(previewPolicy);

        for (const [label, header] of [
          ["preview issue", previewCookieHeader],
          ["preview clear", previewClearHeader],
        ] as const) {
          for (const expected of [
            `${authSessionCookieName}=`,
            "HttpOnly",
            "SameSite=Lax",
            "Path=/",
          ]) {
            if (!header.includes(expected)) {
              throw new Error(`${label} cookie header is missing ${expected}`);
            }
          }

          if (header.includes("Secure")) {
            throw new Error(`${label} cookie header should omit Secure`);
          }
        }

        if (
          !previewCookieHeader.includes(
            `Max-Age=${internalV0PreviewSessionMaxAgeSeconds}`,
          ) ||
          !previewClearHeader.includes("Max-Age=0")
        ) {
          throw new Error("Preview cookie max-age was not explicit");
        }

        const parsedReference = readAuthSessionReferenceFromCookieHeader(
          `${authSessionCookieName}=${encodeURIComponent(activeReference)}; theme=dark`,
        );

        if (parsedReference !== activeReference) {
          throw new Error("Cookie parser did not return the session reference");
        }

        const resolved = await resolveAuthContextFromRequestCookie(
          repository,
          requestWithCookie(
            `${authSessionCookieName}=${encodeURIComponent(activeReference)}`,
          ),
          {
            requestId: `${checkId}_allowed`,
            tenantId,
            teamId,
            requiredPermission: "capture_session",
            target: {
              tenantId,
              teamId,
              type: "session",
              id: `${checkId}_session`,
            },
          },
        );

        if (
          resolved.context.actor.id !== operatorId ||
          JSON.stringify(resolved).includes(activeReference)
        ) {
          throw new Error("Request cookie did not resolve safely");
        }

        await expectDenied(
          "missing cookie",
          () =>
            resolveAuthContextFromRequestCookie(
              repository,
              new Request("https://operation.local/protected"),
              {
                requestId: `${checkId}_missing_cookie`,
                tenantId,
                teamId,
                requiredPermission: "capture_session",
              },
            ),
          "UNAUTHENTICATED",
        );

        await expectDenied(
          "expired cookie",
          () =>
            resolveAuthContextFromRequestCookie(
              repository,
              requestWithCookie(
                `${authSessionCookieName}=${encodeURIComponent(expiredReference)}`,
              ),
              {
                requestId: `${checkId}_expired`,
                tenantId,
                teamId,
                requiredPermission: "capture_session",
              },
            ),
          "SESSION_EXPIRED",
        );

        await expectDenied(
          "revoked cookie",
          () =>
            resolveAuthContextFromRequestCookie(
              repository,
              requestWithCookie(
                `${authSessionCookieName}=${encodeURIComponent(revokedReference)}`,
              ),
              {
                requestId: `${checkId}_revoked`,
                tenantId,
                teamId,
                requiredPermission: "capture_session",
              },
            ),
          "SESSION_REVOKED",
        );

        await expectDenied(
          "invalidated cookie",
          () =>
            resolveAuthContextFromRequestCookie(
              repository,
              requestWithCookie(
                `${authSessionCookieName}=${encodeURIComponent(invalidatedReference)}`,
              ),
              {
                requestId: `${checkId}_invalidated`,
                tenantId,
                teamId,
                requiredPermission: "capture_session",
              },
            ),
          "SESSION_REVOKED",
        );

        const logoutResult = await invalidateAuthSessionFromRequestCookie(
          repository,
          requestWithCookie(
            `${authSessionCookieName}=${encodeURIComponent(activeReference)}`,
          ),
          {
            requestId: `${checkId}_logout`,
          },
        );

        if (
          !logoutResult.invalidated ||
          !logoutResult.clearCookieHeader.includes("Max-Age=0") ||
          JSON.stringify(logoutResult).includes(activeReference)
        ) {
          throw new Error("Logout did not invalidate and clear safely");
        }

        await expectDenied(
          "logged-out cookie reuse",
          () =>
            resolveAuthContextFromRequestCookie(
              repository,
              requestWithCookie(
                `${authSessionCookieName}=${encodeURIComponent(activeReference)}`,
              ),
              {
                requestId: `${checkId}_logged_out_reuse`,
                tenantId,
                teamId,
                requiredPermission: "capture_session",
              },
            ),
          "SESSION_REVOKED",
        );

        const missingLogout = await invalidateAuthSessionFromRequestCookie(
          repository,
          new Request("https://operation.local/logout"),
          {
            requestId: `${checkId}_missing_logout`,
          },
        );

        if (missingLogout.invalidated || !missingLogout.clearCookieHeader) {
          throw new Error("Missing-cookie logout should be idempotent");
        }

        await expectRedacted("redacted cookie failure", () =>
          resolveAuthContextFromRequestCookie(
            repository,
            requestWithCookie(`${authSessionCookieName}=raw_cookie_value`),
            {
              requestId: `${checkId}_redacted`,
              tenantId,
              teamId,
              requiredPermission: "capture_session",
              metadata: {
                cookie: "raw_cookie_value",
                providerSessionId: "provider_session_raw",
                authorization: "Bearer raw_session_secret",
              },
            },
          ),
        );

        throw new ExpectedRollback();
      });
    } catch (error) {
      if (!(error instanceof ExpectedRollback)) {
        throw error;
      }
    }

    console.log("Auth cookie local check passed; transaction rolled back.");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(
    error instanceof Error
      ? error.message
      : "Unknown auth:cookie-check failure",
  );
  process.exitCode = 1;
});
