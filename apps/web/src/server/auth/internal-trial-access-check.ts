import { createDatabaseConnection } from "../db/client";
import {
  authSessionCookieName,
  AUTH_LOGOUT_CSRF_HEADER_NAME,
  AUTH_LOGOUT_CSRF_HEADER_VALUE,
  createAuthSessionRepository,
  handleAuthLogoutRoute,
  handleAuthSessionRoute,
  type AuthSessionRepositoryDatabase,
} from "./index";
import {
  handleOperatorV0SessionRoute,
  OPERATOR_V0_BOOTSTRAP_CSRF_HEADER_NAME,
  OPERATOR_V0_BOOTSTRAP_CSRF_HEADER_VALUE,
  type OperatorV0BootstrapDatabase,
} from "./operator-v0";
import {
  createRacketProductRepository,
  type RacketProductRepositoryDatabase,
} from "../rackets/repository";
import { handleRacketProductsListRoute } from "../rackets/route";
import {
  bootstrapBodyToInternalTrialScope,
  defaultInternalTrialScope,
  internalTrialScopeStorageKey,
  scopedInternalTrialApiUrl,
  sessionBodyToInternalTrialScope,
  trialAccessUserMessage,
  type InternalTrialAuthSessionBody,
  type InternalTrialBootstrapBody,
} from "../../lib/internal-trial-access";

class ExpectedRollback extends Error {
  constructor() {
    super("Rollback local internal trial access check");
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

  return new Request(toLocalUrl(url), {
    headers: {
      cookie: cookieValue,
    },
  });
}

function logoutRequestWithSetCookie(setCookie: string | null): Request {
  const cookieValue = setCookie?.split(";")[0] ?? "";

  return new Request("https://operation.local/api/auth/logout", {
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
    throw new Error("Internal trial access response was not a JSON object");
  }

  return body as JsonObject;
}

function toLocalUrl(path: string): string {
  return new URL(path, "https://operation.local").toString();
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

function expectInternalTrialScope(label: string, value: unknown) {
  const scope = value as JsonObject;

  if (
    scope.tenantId !== "operation_v0_tenant" ||
    scope.teamId !== "operation_v0_live_team" ||
    typeof scope.tenantName !== "string" ||
    typeof scope.teamName !== "string" ||
    typeof scope.actorName !== "string"
  ) {
    throw new Error(`${label} did not return the safe V0 trial display scope`);
  }

  expectNoSensitive(label, scope);
}

async function main() {
  const { client, db } = createDatabaseConnection();

  try {
    try {
      await db.transaction(async (transaction) => {
        if (internalTrialScopeStorageKey !== "operation.operatorV0Scope") {
          throw new Error("Internal trial scope storage key changed");
        }

        const defaultScope = defaultInternalTrialScope();
        const scopedSessionUrl = scopedInternalTrialApiUrl(
          "/api/auth/session",
          defaultScope,
        );

        if (
          scopedSessionUrl !==
          "/api/auth/session?tenantId=operation_v0_tenant&teamId=operation_v0_live_team"
        ) {
          throw new Error("Scoped trial API URL did not append tenant/team");
        }

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
        if (trialAccessUserMessage(disabledBody) !== "当前环境未开启内部试用") {
          throw new Error("Disabled bootstrap did not map to safe user copy");
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
        const bootstrapBody = (await readJson(
          bootstrapResponse,
        )) as InternalTrialBootstrapBody;
        if (
          bootstrapResponse.status !== 200 ||
          bootstrapBody.ok !== true ||
          !setCookie?.includes(`${authSessionCookieName}=`)
        ) {
          throw new Error("Successful bootstrap did not issue a safe session");
        }

        const bootstrappedScope = bootstrapBodyToInternalTrialScope({
          ...bootstrapBody,
          rawSessionReference: "raw_session_secret",
        } as Extract<InternalTrialBootstrapBody, { ok: true }>);
        expectInternalTrialScope("bootstrap scope", bootstrappedScope);

        const authRepository = createAuthSessionRepository(
          transaction as unknown as AuthSessionRepositoryDatabase,
        );
        const sessionResponse = await handleAuthSessionRoute(
          authRepository,
          requestWithSetCookie(
            scopedInternalTrialApiUrl("/api/auth/session", bootstrappedScope),
            setCookie,
          ),
        );
        expectNoStore("session verification", sessionResponse);
        const sessionBody = (await readJson(
          sessionResponse,
        )) as InternalTrialAuthSessionBody;
        if (
          sessionResponse.status !== 200 ||
          sessionBody.authenticated !== true
        ) {
          throw new Error("Bootstrap cookie did not resolve a safe session");
        }

        const verifiedScope = sessionBodyToInternalTrialScope(sessionBody);
        expectInternalTrialScope("verified scope", verifiedScope);

        const racketRepository = createRacketProductRepository(
          transaction as unknown as RacketProductRepositoryDatabase,
        );
        const protectedRacketResponse = await handleRacketProductsListRoute(
          authRepository,
          racketRepository,
          requestWithSetCookie(
            scopedInternalTrialApiUrl(
              "/api/rackets/products?limit=1",
              verifiedScope,
            ),
            setCookie,
          ),
        );
        expectNoStore("protected racket access", protectedRacketResponse);
        const protectedRacketBody = await readJson(protectedRacketResponse);
        if (
          protectedRacketResponse.status !== 200 ||
          protectedRacketBody.ok !== true ||
          !Array.isArray(protectedRacketBody.products)
        ) {
          throw new Error("Protected racket API access did not verify");
        }
        expectNoSensitive("protected racket access", protectedRacketBody);

        const logoutResponse = await handleAuthLogoutRoute(
          authRepository,
          logoutRequestWithSetCookie(setCookie),
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
          throw new Error("Logout did not invalidate and clear the session");
        }
        expectNoSensitive("logout", logoutBody);

        const loggedOutReuseResponse = await handleAuthSessionRoute(
          authRepository,
          requestWithSetCookie(
            scopedInternalTrialApiUrl("/api/auth/session", verifiedScope),
            setCookie,
          ),
        );
        expectNoStore("logged-out session reuse", loggedOutReuseResponse);
        const loggedOutReuseBody = await readJson(loggedOutReuseResponse);
        if (
          loggedOutReuseResponse.status !== 401 ||
          loggedOutReuseBody.code !== "SESSION_REVOKED"
        ) {
          throw new Error("Logged-out trial session reuse was not denied");
        }

        const redactedResponse = await handleRacketProductsListRoute(
          authRepository,
          racketRepository,
          new Request(
            toLocalUrl(
              scopedInternalTrialApiUrl("/api/rackets/products", verifiedScope),
            ),
            {
              headers: {
                cookie: `${authSessionCookieName}=raw_cookie_value`,
                authorization: "Bearer raw_session_secret",
                "x-provider-session-id": "provider_session_raw",
              },
            },
          ),
        );
        expectNoStore("redacted route error", redactedResponse);
        const redactedBody = await readJson(redactedResponse);
        expectNoSensitive("redacted route error", redactedBody);

        throw new ExpectedRollback();
      });
    } catch (error) {
      if (!(error instanceof ExpectedRollback)) {
        throw error;
      }
    }

    console.log("Internal trial access check passed; transaction rolled back.");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(
    error instanceof Error
      ? error.message
      : "Unknown internal trial access check failure",
  );
  process.exitCode = 1;
});
