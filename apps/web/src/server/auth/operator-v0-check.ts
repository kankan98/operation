import { createDatabaseConnection } from "../db/client";
import type { AuthSessionRepositoryDatabase } from "./index";
import {
  AUTH_LOGOUT_CSRF_HEADER_NAME,
  AUTH_LOGOUT_CSRF_HEADER_VALUE,
  authSessionCookieName,
  createAuthSessionRepository,
  handleAuthLogoutRoute,
  internalV0PreviewCookieEnvName,
  internalV0PreviewSessionMaxAgeSeconds,
} from "./index";
import { handleAuthSessionRoute } from "./route";
import {
  handleOperatorV0SessionRoute,
  OPERATOR_V0_BOOTSTRAP_CSRF_HEADER_NAME,
  OPERATOR_V0_BOOTSTRAP_CSRF_HEADER_VALUE,
  operatorV0TeamId,
  operatorV0TenantId,
  type OperatorV0BootstrapDatabase,
} from "./operator-v0";

class ExpectedRollback extends Error {
  constructor() {
    super("Rollback local operator V0 workflow check");
  }
}

type JsonObject = Record<string, unknown>;

function bootstrapRequest(csrfHeader: boolean): Request {
  const headers = new Headers();

  if (csrfHeader) {
    headers.set(
      OPERATOR_V0_BOOTSTRAP_CSRF_HEADER_NAME,
      OPERATOR_V0_BOOTSTRAP_CSRF_HEADER_VALUE,
    );
  }

  return new Request("https://operation.local/api/auth/operator-v0-session", {
    method: "POST",
    headers,
  });
}

function requestWithSetCookie(url: string, setCookie: string | null): Request {
  const cookieValue = setCookie?.split(";")[0] ?? "";

  return new Request(url, {
    headers: {
      cookie: cookieValue,
    },
  });
}

function logoutRequestWithSetCookie(setCookie: string | null): Request {
  const cookieValue = setCookie?.split(";")[0] ?? "";

  return new Request("http://operation.local/api/auth/logout", {
    method: "POST",
    headers: {
      cookie: cookieValue,
      [AUTH_LOGOUT_CSRF_HEADER_NAME]: AUTH_LOGOUT_CSRF_HEADER_VALUE,
    },
  });
}

async function readJson(response: Response): Promise<JsonObject> {
  const body = await response.json();

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new Error("Operator V0 workflow response was not a JSON object");
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
    "postgres://operation:operation_dev_password@",
    "Bearer",
  ]) {
    if (serialized.includes(leaked)) {
      throw new Error(`${label} leaked sensitive metadata`);
    }
  }
}

async function main() {
  const { client, db } = createDatabaseConnection();

  try {
    try {
      await db.transaction(async (transaction) => {
        const disabledResponse = await handleOperatorV0SessionRoute(
          null,
          bootstrapRequest(true),
          { enabled: false },
        );
        expectNoStore("disabled bootstrap", disabledResponse);

        const disabledBody = await readJson(disabledResponse);
        if (
          disabledResponse.status !== 404 ||
          disabledBody.ok !== false ||
          disabledBody.code !== "OPERATOR_V0_BOOTSTRAP_DISABLED" ||
          disabledResponse.headers.has("set-cookie")
        ) {
          throw new Error("Disabled bootstrap did not fail safely");
        }

        const csrfBlockedResponse = await handleOperatorV0SessionRoute(
          null,
          bootstrapRequest(false),
          { enabled: true },
        );
        expectNoStore("csrf-blocked bootstrap", csrfBlockedResponse);

        const csrfBlockedBody = await readJson(csrfBlockedResponse);
        if (
          csrfBlockedResponse.status !== 403 ||
          csrfBlockedBody.ok !== false ||
          csrfBlockedBody.code !== "CSRF_HEADER_REQUIRED" ||
          csrfBlockedResponse.headers.has("set-cookie")
        ) {
          throw new Error("Bootstrap without CSRF header was not blocked");
        }

        const bootstrapResponse = await handleOperatorV0SessionRoute(
          transaction as unknown as OperatorV0BootstrapDatabase,
          bootstrapRequest(true),
          { enabled: true },
        );
        expectNoStore("successful bootstrap", bootstrapResponse);

        const setCookie = bootstrapResponse.headers.get("set-cookie");
        const bootstrapBody = await readJson(bootstrapResponse);
        if (
          bootstrapResponse.status !== 200 ||
          bootstrapBody.ok !== true ||
          !setCookie?.includes(`${authSessionCookieName}=`)
        ) {
          throw new Error("Successful bootstrap did not issue a safe session");
        }
        if (
          !setCookie.includes("Secure") ||
          !setCookie.includes("Max-Age=604800")
        ) {
          throw new Error("Default bootstrap did not use secure cookie policy");
        }

        const tenant = (bootstrapBody.tenant ?? {}) as JsonObject;
        const team = (bootstrapBody.team ?? {}) as JsonObject;
        const actor = (bootstrapBody.actor ?? {}) as JsonObject;
        const membership = (bootstrapBody.membership ?? {}) as JsonObject;
        const permissions = membership.permissions;
        if (
          tenant.id !== operatorV0TenantId ||
          team.id !== operatorV0TeamId ||
          typeof actor.displayName !== "string"
        ) {
          throw new Error("Bootstrap response lost operator context");
        }
        if (
          !Array.isArray(permissions) ||
          !permissions.includes("read_workspace") ||
          !permissions.includes("capture_session") ||
          !permissions.includes("run_ai_review") ||
          !permissions.includes("manage_talk_tracks") ||
          !permissions.includes("manage_next_tasks") ||
          !permissions.includes("manage_products") ||
          !permissions.includes("review_knowledge")
        ) {
          throw new Error(
            "Bootstrap response did not include V0 workflow permissions",
          );
        }
        expectNoSensitive("successful bootstrap", bootstrapBody);

        const scopedSessionUrl = `https://operation.local/api/auth/session?tenantId=${operatorV0TenantId}&teamId=${operatorV0TeamId}`;
        const sessionResponse = await handleAuthSessionRoute(
          createAuthSessionRepository(
            transaction as unknown as AuthSessionRepositoryDatabase,
          ),
          requestWithSetCookie(scopedSessionUrl, setCookie),
        );
        expectNoStore("bootstrap session verification", sessionResponse);

        const sessionBody = await readJson(sessionResponse);
        if (
          sessionResponse.status !== 200 ||
          sessionBody.authenticated !== true
        ) {
          throw new Error("Bootstrap cookie did not resolve a safe auth session");
        }
        const sessionMembership = (sessionBody.membership ?? {}) as JsonObject;
        const sessionPermissions = sessionMembership.permissions;
        if (
          !Array.isArray(sessionPermissions) ||
          !sessionPermissions.includes("run_ai_review") ||
          !sessionPermissions.includes("manage_talk_tracks") ||
          !sessionPermissions.includes("manage_next_tasks")
        ) {
          throw new Error(
            "Bootstrap session did not resolve downstream permissions",
          );
        }

        await handleOperatorV0SessionRoute(
          transaction as unknown as OperatorV0BootstrapDatabase,
          bootstrapRequest(true),
          { enabled: true },
        );

        const previousBootstrapFlag = process.env.OPERATION_ENABLE_V0_BOOTSTRAP;
        const previousPreviewFlag =
          process.env[internalV0PreviewCookieEnvName];

        try {
          process.env.OPERATION_ENABLE_V0_BOOTSTRAP = "1";
          process.env[internalV0PreviewCookieEnvName] = "1";

          const previewResponse = await handleOperatorV0SessionRoute(
            transaction as unknown as OperatorV0BootstrapDatabase,
            bootstrapRequest(true),
            { enabled: true },
          );
          expectNoStore("preview bootstrap", previewResponse);

          const previewSetCookie = previewResponse.headers.get("set-cookie");
          const previewBody = await readJson(previewResponse);

          if (
            previewResponse.status !== 200 ||
            previewBody.ok !== true ||
            !previewSetCookie?.includes(`${authSessionCookieName}=`)
          ) {
            throw new Error("Preview bootstrap did not issue a session");
          }

          if (
            previewSetCookie.includes("Secure") ||
            !previewSetCookie.includes(
              `Max-Age=${internalV0PreviewSessionMaxAgeSeconds}`,
            )
          ) {
            throw new Error("Preview bootstrap did not use preview cookie policy");
          }

          const previewSessionResponse = await handleAuthSessionRoute(
            createAuthSessionRepository(
              transaction as unknown as AuthSessionRepositoryDatabase,
            ),
            requestWithSetCookie(scopedSessionUrl, previewSetCookie),
          );
          const previewSessionBody = await readJson(previewSessionResponse);

          if (
            previewSessionResponse.status !== 200 ||
            previewSessionBody.authenticated !== true
          ) {
            throw new Error("Preview cookie did not resolve auth context");
          }

          const previewSession = (previewSessionBody.session ?? {}) as JsonObject;
          const expiresAt =
            typeof previewSession.expiresAt === "string"
              ? new Date(previewSession.expiresAt)
              : null;

          if (
            !expiresAt ||
            Number.isNaN(expiresAt.getTime()) ||
            expiresAt.getTime() - Date.now() >
              (internalV0PreviewSessionMaxAgeSeconds + 60) * 1000
          ) {
            throw new Error("Preview session expiration was not shortened");
          }

          const previewLogoutResponse = await handleAuthLogoutRoute(
            createAuthSessionRepository(
              transaction as unknown as AuthSessionRepositoryDatabase,
            ),
            logoutRequestWithSetCookie(previewSetCookie),
          );
          expectNoStore("preview logout", previewLogoutResponse);

          const previewLogoutSetCookie =
            previewLogoutResponse.headers.get("set-cookie") ?? "";
          const previewLogoutBody = await readJson(previewLogoutResponse);
          if (
            previewLogoutResponse.status !== 200 ||
            previewLogoutBody.loggedOut !== true ||
            previewLogoutSetCookie.includes("Secure") ||
            !previewLogoutSetCookie.includes("Max-Age=0")
          ) {
            throw new Error("Preview logout did not clear the preview cookie");
          }
        } finally {
          if (previousBootstrapFlag === undefined) {
            delete process.env.OPERATION_ENABLE_V0_BOOTSTRAP;
          } else {
            process.env.OPERATION_ENABLE_V0_BOOTSTRAP = previousBootstrapFlag;
          }

          if (previousPreviewFlag === undefined) {
            delete process.env[internalV0PreviewCookieEnvName];
          } else {
            process.env[internalV0PreviewCookieEnvName] = previousPreviewFlag;
          }
        }

        throw new ExpectedRollback();
      });
    } catch (error) {
      if (error instanceof ExpectedRollback) {
        return;
      }

      throw error;
    }
  } finally {
    await client.end();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
