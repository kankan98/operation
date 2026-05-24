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
  authSessionCookieName,
  createAuthSessionReference,
  createAuthSessionRepository,
  hashAuthSessionReference,
  type AuthSessionRepositoryDatabase,
} from "./index";
import {
  AUTH_LOGOUT_CSRF_HEADER_NAME,
  AUTH_LOGOUT_CSRF_HEADER_VALUE,
  handleAuthLogoutRoute,
  handleAuthSessionRoute,
} from "./route";

class ExpectedRollback extends Error {
  constructor() {
    super("Rollback local auth route check");
  }
}

type JsonObject = Record<string, unknown>;

function requestWithCookie(url: string, sessionReference: string): Request {
  return new Request(url, {
    headers: {
      cookie: `${authSessionCookieName}=${encodeURIComponent(sessionReference)}`,
    },
  });
}

function logoutRequest(
  sessionReference: string | null,
  csrfHeader: boolean,
): Request {
  const headers = new Headers();

  if (sessionReference) {
    headers.set(
      "cookie",
      `${authSessionCookieName}=${encodeURIComponent(sessionReference)}`,
    );
  }

  if (csrfHeader) {
    headers.set(AUTH_LOGOUT_CSRF_HEADER_NAME, AUTH_LOGOUT_CSRF_HEADER_VALUE);
  }

  return new Request("https://operation.local/api/auth/logout", {
    method: "POST",
    headers,
  });
}

async function readJson(response: Response): Promise<JsonObject> {
  const body = await response.json();

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new Error("Auth route response did not return a JSON object");
  }

  return body as JsonObject;
}

function expectNoStore(label: string, response: Response) {
  if (response.headers.get("cache-control") !== "no-store") {
    throw new Error(`${label} did not return Cache-Control: no-store`);
  }
}

function expectNoSensitive(label: string, value: unknown) {
  const serialized = JSON.stringify(value);

  for (const leaked of [
    "raw_cookie_value",
    "raw_session_secret",
    "provider_session_raw",
    "Bearer",
  ]) {
    if (serialized.includes(leaked)) {
      throw new Error(`${label} leaked sensitive auth metadata`);
    }
  }
}

async function main() {
  const { client, db } = createDatabaseConnection();
  const checkId = `auth_route_check_${Date.now()}`;

  try {
    try {
      await db.transaction(async (transaction) => {
        const tenantId = `${checkId}_tenant`;
        const teamId = `${checkId}_team`;
        const otherTeamId = `${checkId}_other_team`;
        const operatorId = `${checkId}_operator`;
        const now = new Date();
        const future = new Date(Date.now() + 60 * 60 * 1000);
        const activeReference = createAuthSessionReference();

        await transaction.insert(tenants).values({
          id: tenantId,
          name: "Local auth route check",
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

        await transaction.insert(authSessions).values({
          id: `${checkId}_active_session`,
          userId: operatorId,
          sessionReferenceHash: hashAuthSessionReference(activeReference),
          status: "active",
          issuedAt: now,
          expiresAt: future,
        });

        const repository = createAuthSessionRepository(
          transaction as unknown as AuthSessionRepositoryDatabase,
        );
        const scopedUrl = `https://operation.local/api/auth/session?tenantId=${tenantId}&teamId=${teamId}`;

        const unauthenticatedResponse = await handleAuthSessionRoute(
          null,
          new Request(scopedUrl),
        );
        expectNoStore("unauthenticated session", unauthenticatedResponse);

        const unauthenticatedBody = await readJson(unauthenticatedResponse);
        if (
          unauthenticatedResponse.status !== 200 ||
          unauthenticatedBody.authenticated !== false ||
          unauthenticatedBody.code !== "UNAUTHENTICATED"
        ) {
          throw new Error("Missing-cookie session response was not safe");
        }

        const authenticatedResponse = await handleAuthSessionRoute(
          repository,
          requestWithCookie(scopedUrl, activeReference),
        );
        expectNoStore("authenticated session", authenticatedResponse);

        const authenticatedBody = await readJson(authenticatedResponse);
        if (
          authenticatedResponse.status !== 200 ||
          authenticatedBody.authenticated !== true
        ) {
          throw new Error("Authenticated session response did not succeed");
        }

        const actor = (authenticatedBody.actor ?? {}) as JsonObject;
        const membership = (authenticatedBody.membership ?? {}) as JsonObject;

        if (
          actor.id !== operatorId ||
          membership.role !== "operator" ||
          !Array.isArray(membership.permissions) ||
          !membership.permissions.includes("read_workspace")
        ) {
          throw new Error("Authenticated session response lost auth context");
        }

        expectNoSensitive("authenticated session", authenticatedBody);

        const missingScopeResponse = await handleAuthSessionRoute(
          repository,
          requestWithCookie(
            "https://operation.local/api/auth/session",
            activeReference,
          ),
        );
        expectNoStore("missing scope session", missingScopeResponse);

        const missingScopeBody = await readJson(missingScopeResponse);
        if (
          missingScopeResponse.status !== 400 ||
          missingScopeBody.authenticated !== false ||
          missingScopeBody.code !== "AUTH_SCOPE_REQUIRED"
        ) {
          throw new Error("Missing-scope session response was not explicit");
        }

        const csrfBlockedResponse = await handleAuthLogoutRoute(
          null,
          logoutRequest(activeReference, false),
        );
        expectNoStore("csrf-blocked logout", csrfBlockedResponse);

        const csrfBlockedBody = await readJson(csrfBlockedResponse);
        if (
          csrfBlockedResponse.status !== 403 ||
          csrfBlockedBody.code !== "CSRF_HEADER_REQUIRED" ||
          csrfBlockedResponse.headers.has("set-cookie")
        ) {
          throw new Error("Logout without CSRF header was not blocked safely");
        }

        const stillAuthenticatedResponse = await handleAuthSessionRoute(
          repository,
          requestWithCookie(scopedUrl, activeReference),
        );
        const stillAuthenticatedBody = await readJson(
          stillAuthenticatedResponse,
        );
        if (stillAuthenticatedBody.authenticated !== true) {
          throw new Error("CSRF-blocked logout mutated session state");
        }

        const logoutResponse = await handleAuthLogoutRoute(
          repository,
          logoutRequest(activeReference, true),
        );
        expectNoStore("logout", logoutResponse);

        const logoutSetCookie = logoutResponse.headers.get("set-cookie") ?? "";
        const logoutBody = await readJson(logoutResponse);
        if (
          logoutResponse.status !== 200 ||
          logoutBody.loggedOut !== true ||
          logoutBody.code !== "invalidated" ||
          !logoutSetCookie.includes("Max-Age=0")
        ) {
          throw new Error("Logout did not invalidate and clear safely");
        }

        expectNoSensitive("logout", {
          headers: Object.fromEntries(logoutResponse.headers.entries()),
          body: logoutBody,
        });

        const loggedOutReuseResponse = await handleAuthSessionRoute(
          repository,
          requestWithCookie(scopedUrl, activeReference),
        );
        const loggedOutReuseBody = await readJson(loggedOutReuseResponse);
        if (
          loggedOutReuseResponse.status !== 401 ||
          loggedOutReuseBody.code !== "SESSION_REVOKED"
        ) {
          throw new Error("Logged-out cookie reuse was not denied");
        }

        const missingCookieLogoutResponse = await handleAuthLogoutRoute(
          null,
          logoutRequest(null, true),
        );
        expectNoStore("missing-cookie logout", missingCookieLogoutResponse);

        const missingCookieLogoutBody = await readJson(
          missingCookieLogoutResponse,
        );
        if (
          missingCookieLogoutResponse.status !== 200 ||
          missingCookieLogoutBody.loggedOut !== false ||
          missingCookieLogoutBody.code !== "session_not_found" ||
          !missingCookieLogoutResponse.headers
            .get("set-cookie")
            ?.includes("Max-Age=0")
        ) {
          throw new Error("Missing-cookie logout was not idempotent");
        }

        const redactedResponse = await handleAuthSessionRoute(
          repository,
          new Request(scopedUrl, {
            headers: {
              cookie: `${authSessionCookieName}=raw_cookie_value`,
              authorization: "Bearer raw_session_secret",
              "x-provider-session-id": "provider_session_raw",
            },
          }),
        );
        const redactedBody = await readJson(redactedResponse);
        expectNoSensitive("redacted route error", redactedBody);

        throw new ExpectedRollback();
      });
    } catch (error) {
      if (!(error instanceof ExpectedRollback)) {
        throw error;
      }
    }

    console.log("Auth route local check passed; transaction rolled back.");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(
    error instanceof Error
      ? error.message
      : "Unknown auth:route-check failure",
  );
  process.exitCode = 1;
});
