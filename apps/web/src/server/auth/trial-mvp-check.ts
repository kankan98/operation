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
  createAiReviewRunRepository,
  type AiReviewRunRepositoryDatabase,
} from "../ai-review/repository";
import { handleAiReviewRunsListRoute } from "../ai-review/route";
import {
  createKnowledgeLifecycleRepository,
  type KnowledgeLifecycleRepositoryDatabase,
} from "../knowledge/repository";
import { handleKnowledgeSourcesListRoute } from "../knowledge/route";
import {
  createNextSessionTaskRepository,
  type NextSessionTaskRepositoryDatabase,
} from "../next-actions/repository";
import { handleNextActionTasksListRoute } from "../next-actions/route";
import {
  createRacketProductRepository,
  type RacketProductRepositoryDatabase,
} from "../rackets/repository";
import { handleRacketProductsListRoute } from "../rackets/route";
import {
  createSessionCaptureRepository,
  type SessionCaptureRepositoryDatabase,
} from "../sessions/repository";
import { handleSessionCapturesListRoute } from "../sessions/route";
import {
  createTalkTrackAssetRepository,
  type TalkTrackAssetRepositoryDatabase,
} from "../talk-tracks/repository";
import { handleTalkTrackAssetsListRoute } from "../talk-tracks/route";
import {
  bootstrapBodyToInternalTrialScope,
  scopedInternalTrialApiUrl,
  type InternalTrialBootstrapBody,
} from "../../lib/internal-trial-access";
import {
  authSessionCookieName as clientAuthSessionCookieName,
  decidePublicTrialRoute,
  defaultPublicTrialNextPath,
  getSafePublicTrialNextPath,
  publicTrialProtectedPaths,
} from "../../lib/public-trial-auth";

class ExpectedRollback extends Error {
  constructor() {
    super("Rollback local trial MVP check");
  }
}

type JsonObject = Record<string, unknown>;

type WorkbenchCheck = {
  label: string;
  path: string;
  route: (request: Request) => Promise<Response>;
};

function bootstrapRequest(): Request {
  return new Request("https://operation.local/api/auth/operator-v0-session", {
    method: "POST",
    headers: {
      [OPERATOR_V0_BOOTSTRAP_CSRF_HEADER_NAME]:
        OPERATOR_V0_BOOTSTRAP_CSRF_HEADER_VALUE,
    },
  });
}

function requestWithSetCookie(url: string, setCookie: string | null): Request {
  const cookieValue = setCookie?.split(";")[0] ?? "";

  return new Request(new URL(url, "https://operation.local").toString(), {
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
    throw new Error("Trial MVP response was not a JSON object");
  }

  return body as JsonObject;
}

function expect(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function expectNoStore(label: string, response: Response) {
  expect(
    response.headers.get("cache-control") === "no-store",
    `${label} did not return Cache-Control: no-store`,
  );
}

function expectNoSensitive(label: string, value: unknown) {
  const serialized = JSON.stringify(value);

  for (const leaked of [
    "raw_cookie_value",
    "raw_session_secret",
    "provider_session_raw",
    "postgres://operation:operation_dev_password@",
    "Bearer",
    "sk-",
  ]) {
    if (serialized.includes(leaked)) {
      throw new Error(`${label} leaked sensitive metadata`);
    }
  }
}

function verifyRouteGate() {
  for (const protectedPath of publicTrialProtectedPaths) {
    const redirected = decidePublicTrialRoute({
      hasSessionCookie: false,
      origin: "https://operation.local",
      pathname: protectedPath,
    });

    expect(
      redirected.action === "redirect",
      `${protectedPath} did not redirect without a trial cookie`,
    );
    expectNoSensitive(`${protectedPath} redirect`, redirected);

    const allowed = decidePublicTrialRoute({
      hasSessionCookie: true,
      origin: "https://operation.local",
      pathname: protectedPath,
    });

    expect(
      allowed.action === "allow",
      `${protectedPath} did not pass with a trial cookie`,
    );
    expectNoSensitive(`${protectedPath} allow`, allowed);
  }

  for (const unsafeNext of [
    "",
    "https://evil.example/sessions",
    "//evil.example/sessions",
    "/api/auth/session",
    "/_next/static/app.js",
    "/unknown",
    "/sessions/extra",
    "/\\evil",
  ]) {
    expect(
      getSafePublicTrialNextPath(unsafeNext) === defaultPublicTrialNextPath,
      `Unsafe next path ${unsafeNext} did not fall back`,
    );
  }

  expect(
    clientAuthSessionCookieName === authSessionCookieName,
    "Client and server trial cookie names drifted",
  );
}

async function expectWorkbenchAccess(
  check: WorkbenchCheck,
  setCookie: string | null,
) {
  const response = await check.route(
    requestWithSetCookie(check.path, setCookie),
  );
  expectNoStore(check.label, response);
  const body = await readJson(response);

  expect(
    response.status === 200 && body.ok === true,
    `${check.label} was not accessible under a verified trial session`,
  );
  expectNoSensitive(check.label, body);
}

async function main() {
  verifyRouteGate();

  const { client, db } = createDatabaseConnection();

  try {
    try {
      await db.transaction(async (transaction) => {
        const bootstrapResponse = await handleOperatorV0SessionRoute(
          transaction as unknown as OperatorV0BootstrapDatabase,
          bootstrapRequest(),
          { enabled: true },
        );
        expectNoStore("bootstrap", bootstrapResponse);

        const setCookie = bootstrapResponse.headers.get("set-cookie");
        const bootstrapBody = (await readJson(
          bootstrapResponse,
        )) as InternalTrialBootstrapBody;

        expect(
          bootstrapResponse.status === 200 &&
            bootstrapBody.ok === true &&
            Boolean(setCookie?.includes(`${authSessionCookieName}=`)),
          "Trial MVP bootstrap did not issue a safe session",
        );
        expectNoSensitive("bootstrap", bootstrapBody);

        const scope = bootstrapBodyToInternalTrialScope(
          bootstrapBody as Extract<InternalTrialBootstrapBody, { ok: true }>,
        );
        const authRepository = createAuthSessionRepository(
          transaction as unknown as AuthSessionRepositoryDatabase,
        );
        const sessionResponse = await handleAuthSessionRoute(
          authRepository,
          requestWithSetCookie(
            scopedInternalTrialApiUrl("/api/auth/session", scope),
            setCookie,
          ),
        );
        expectNoStore("session verification", sessionResponse);
        const sessionBody = await readJson(sessionResponse);
        expect(
          sessionResponse.status === 200 && sessionBody.authenticated === true,
          "Trial MVP session did not verify",
        );
        expectNoSensitive("session verification", sessionBody);

        const sessionRepository = createSessionCaptureRepository(
          transaction as unknown as SessionCaptureRepositoryDatabase,
        );
        const racketRepository = createRacketProductRepository(
          transaction as unknown as RacketProductRepositoryDatabase,
        );
        const knowledgeRepository = createKnowledgeLifecycleRepository(
          transaction as unknown as KnowledgeLifecycleRepositoryDatabase,
        );
        const aiReviewRepository = createAiReviewRunRepository(
          transaction as unknown as AiReviewRunRepositoryDatabase,
        );
        const talkTrackRepository = createTalkTrackAssetRepository(
          transaction as unknown as TalkTrackAssetRepositoryDatabase,
        );
        const nextActionRepository = createNextSessionTaskRepository(
          transaction as unknown as NextSessionTaskRepositoryDatabase,
        );

        const scopedPath = (path: string) =>
          scopedInternalTrialApiUrl(path, scope);

        const workbenchChecks: WorkbenchCheck[] = [
          {
            label: "sessions workbench API",
            path: scopedPath("/api/sessions/captures"),
            route: (request) =>
              handleSessionCapturesListRoute(
                authRepository,
                sessionRepository,
                request,
              ),
          },
          {
            label: "rackets workbench API",
            path: scopedPath("/api/rackets/products"),
            route: (request) =>
              handleRacketProductsListRoute(
                authRepository,
                racketRepository,
                request,
              ),
          },
          {
            label: "knowledge workbench API",
            path: scopedPath("/api/knowledge/sources"),
            route: (request) =>
              handleKnowledgeSourcesListRoute(
                authRepository,
                knowledgeRepository,
                request,
              ),
          },
          {
            label: "ai review workbench API",
            path: scopedPath("/api/ai-review/runs"),
            route: (request) =>
              handleAiReviewRunsListRoute(
                authRepository,
                aiReviewRepository,
                request,
              ),
          },
          {
            label: "talk tracks workbench API",
            path: scopedPath("/api/talk-tracks/assets"),
            route: (request) =>
              handleTalkTrackAssetsListRoute(
                authRepository,
                talkTrackRepository,
                request,
              ),
          },
          {
            label: "next actions workbench API",
            path: scopedPath("/api/next-actions/tasks"),
            route: (request) =>
              handleNextActionTasksListRoute(
                authRepository,
                nextActionRepository,
                request,
              ),
          },
        ];

        for (const check of workbenchChecks) {
          await expectWorkbenchAccess(check, setCookie);
        }

        const loggedOutResponse = await handleAuthLogoutRoute(
          authRepository,
          logoutRequestWithSetCookie(setCookie),
        );
        expectNoStore("logout", loggedOutResponse);
        const loggedOutBody = await readJson(loggedOutResponse);
        expect(
          loggedOutResponse.status === 200 &&
            loggedOutBody.loggedOut === true,
          "Trial MVP logout did not invalidate the session",
        );
        expectNoSensitive("logout", loggedOutBody);

        const deniedAfterLogout = await handleSessionCapturesListRoute(
          authRepository,
          sessionRepository,
          requestWithSetCookie(
            scopedInternalTrialApiUrl("/api/sessions/captures", scope),
            setCookie,
          ),
        );
        expectNoStore("logged-out protected access", deniedAfterLogout);
        const deniedBody = await readJson(deniedAfterLogout);
        expect(
          deniedAfterLogout.status === 401 &&
            deniedBody.code === "SESSION_REVOKED",
          "Logged-out trial session was not denied on protected workbench API",
        );
        expectNoSensitive("logged-out protected access", deniedBody);

        throw new ExpectedRollback();
      });
    } catch (error) {
      if (!(error instanceof ExpectedRollback)) {
        throw error;
      }
    }

    console.log("Trial MVP check passed; transaction rolled back.");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(
    error instanceof Error ? error.message : "Unknown trial MVP check failure",
  );
  process.exitCode = 1;
});
