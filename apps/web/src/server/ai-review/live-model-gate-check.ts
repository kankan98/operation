import { z } from "zod";

import {
  authSessionCookieName,
  createAuthSessionRepository,
  type AuthSessionRepositoryDatabase,
} from "../auth";
import {
  handleOperatorV0SessionRoute,
  OPERATOR_V0_BOOTSTRAP_CSRF_HEADER_NAME,
  OPERATOR_V0_BOOTSTRAP_CSRF_HEADER_VALUE,
  operatorV0TeamId,
  operatorV0TenantId,
  type OperatorV0BootstrapDatabase,
} from "../auth/operator-v0";
import { createDatabaseConnection } from "../db/client";
import type { AiReviewRunRepositoryDatabase } from "./repository";
import { createAiReviewRunRepository } from "./repository";
import {
  AI_REVIEW_MUTATION_CSRF_HEADER_NAME,
  AI_REVIEW_MUTATION_CSRF_HEADER_VALUE,
  handleAiReviewLiveModelStatusRoute,
  handleAiReviewRunExecuteRoute,
} from "./route";
import {
  createAiReviewLiveModelProvider,
  getAiReviewLiveModelStatus,
  isAiReviewLiveSmokeEnabled,
} from "./live-model-gate";

class ExpectedRollback extends Error {
  constructor() {
    super("Rollback local AI review live-model gate check");
  }
}

type JsonObject = Record<string, unknown>;

function bootstrapRequest(): Request {
  return new Request("https://operation.local/api/auth/operator-v0-session", {
    method: "POST",
    headers: {
      [OPERATOR_V0_BOOTSTRAP_CSRF_HEADER_NAME]:
        OPERATOR_V0_BOOTSTRAP_CSRF_HEADER_VALUE,
    },
  });
}

function scopedUrl(path: string): string {
  return `https://operation.local${path}?tenantId=${operatorV0TenantId}&teamId=${operatorV0TeamId}`;
}

function requestWithSetCookie(url: string, setCookie: string | null): Request {
  const cookieValue = setCookie?.split(";")[0] ?? "";

  return new Request(url, {
    headers: {
      cookie: cookieValue,
    },
  });
}

function jsonRequest(input: {
  url: string;
  setCookie?: string | null;
  csrf?: boolean;
  body?: unknown;
}): Request {
  const headers = new Headers({
    "content-type": "application/json",
  });
  const cookieValue = input.setCookie?.split(";")[0] ?? "";

  if (cookieValue) {
    headers.set("cookie", cookieValue);
  }

  if (input.csrf) {
    headers.set(
      AI_REVIEW_MUTATION_CSRF_HEADER_NAME,
      AI_REVIEW_MUTATION_CSRF_HEADER_VALUE,
    );
  }

  return new Request(input.url, {
    method: "POST",
    headers,
    body: JSON.stringify(input.body ?? {}),
  });
}

async function readJson(response: Response): Promise<JsonObject> {
  const body = await response.json();

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new Error("AI review live-model gate response was not a JSON object");
  }

  return body as JsonObject;
}

function expectStatus(label: string, response: Response, status: number) {
  if (response.status !== status) {
    throw new Error(`${label} returned ${response.status}, expected ${status}`);
  }
}

function expectNoStore(label: string, response: Response) {
  if (response.headers.get("cache-control") !== "no-store") {
    throw new Error(`${label} did not return Cache-Control: no-store`);
  }
}

function expectNoSensitive(label: string, value: unknown) {
  const serialized = JSON.stringify(value);

  for (const leaked of [
    authSessionCookieName,
    "test_deepseek_key",
    "raw_cookie_value",
    "raw_session_secret",
    "postgres://operation:operation_dev_password@",
    "Return only valid JSON",
    "Authorization",
    "Bearer",
    "sk-",
  ]) {
    if (serialized.includes(leaked)) {
      throw new Error(`${label} leaked sensitive metadata`);
    }
  }
}

function getObject(source: JsonObject, key: string, label: string): JsonObject {
  const value = source[key];

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} did not include ${key}`);
  }

  return value as JsonObject;
}

function assertReadinessStatus() {
  const disabled = getAiReviewLiveModelStatus({
    OPERATION_ENABLE_LIVE_AI_REVIEW: "0",
    DEEPSEEK_API_KEY: "test_deepseek_key",
    DEEPSEEK_MODEL: "deepseek-v4-pro",
  });

  if (disabled.ready || disabled.enabled || disabled.code !== "AI_REVIEW_LIVE_MODEL_DISABLED") {
    throw new Error("Disabled live-model status should not be ready");
  }

  const missing = getAiReviewLiveModelStatus({
    OPERATION_ENABLE_LIVE_AI_REVIEW: "1",
  });

  if (missing.ready || missing.configured || missing.code !== "AI_PROVIDER_CONFIG_MISSING") {
    throw new Error("Missing live-model config should be unavailable");
  }

  const ready = getAiReviewLiveModelStatus({
    OPERATION_ENABLE_LIVE_AI_REVIEW: "1",
    DEEPSEEK_API_KEY: "test_deepseek_key",
    DEEPSEEK_MODEL: "deepseek-v4-pro",
    DEEPSEEK_API_BASE_URL: "https://api.deepseek.com",
  });

  if (!ready.ready || ready.model !== "deepseek-v4-pro") {
    throw new Error("Configured live-model status should be ready");
  }

  expectNoSensitive("readiness status", { disabled, missing, ready });
}

async function runOptionalLiveSmoke() {
  if (!isAiReviewLiveSmokeEnabled()) {
    return;
  }

  const { provider, status } = createAiReviewLiveModelProvider();

  if (!provider || !status.ready) {
    throw new Error("Live smoke requested but live model is not ready");
  }

  const result = await provider.generateJson({
    requestId: "ai_review_live_model_gate_smoke",
    messages: [
      {
        role: "system",
        content: "Return only valid JSON with an ok boolean.",
      },
      {
        role: "user",
        content: "Return JSON with ok true.",
      },
    ],
    schema: z.object({
      ok: z.boolean(),
    }),
    schemaName: "AiReviewLiveModelGateSmoke",
    maxTokens: 64,
    temperature: 0,
  });

  console.log(
    `AI review live-model smoke passed: ${result.metadata.provider}/${result.metadata.model}`,
  );
}

async function main() {
  assertReadinessStatus();

  const noAuth = await handleAiReviewLiveModelStatusRoute(
    null,
    new Request(scopedUrl("/api/ai-review/live-model/status")),
    getAiReviewLiveModelStatus(),
  );
  expectStatus("status no auth", noAuth, 401);
  expectNoStore("status no auth", noAuth);

  const noScope = await handleAiReviewLiveModelStatusRoute(
    null,
    new Request("https://operation.local/api/ai-review/live-model/status", {
      headers: {
        cookie: `${authSessionCookieName}=fake_reference`,
      },
    }),
    getAiReviewLiveModelStatus(),
  );
  expectStatus("status no scope", noScope, 400);
  expectNoStore("status no scope", noScope);

  const { client, db } = createDatabaseConnection();

  try {
    try {
      await db.transaction(async (transaction) => {
        const bootstrapResponse = await handleOperatorV0SessionRoute(
          transaction as unknown as OperatorV0BootstrapDatabase,
          bootstrapRequest(),
          { enabled: true },
        );
        expectStatus("bootstrap", bootstrapResponse, 200);
        const setCookie = bootstrapResponse.headers.get("set-cookie");

        const authRepository = createAuthSessionRepository(
          transaction as unknown as AuthSessionRepositoryDatabase,
        );
        const aiReviewRepository = createAiReviewRunRepository(
          transaction as unknown as AiReviewRunRepositoryDatabase,
        );

        const readyStatus = getAiReviewLiveModelStatus({
          OPERATION_ENABLE_LIVE_AI_REVIEW: "1",
          DEEPSEEK_API_KEY: "test_deepseek_key",
          DEEPSEEK_MODEL: "deepseek-v4-pro",
          DEEPSEEK_API_BASE_URL: "https://api.deepseek.com",
        });
        const statusResponse = await handleAiReviewLiveModelStatusRoute(
          authRepository,
          requestWithSetCookie(
            scopedUrl("/api/ai-review/live-model/status"),
            setCookie,
          ),
          readyStatus,
        );
        expectStatus("status ready", statusResponse, 200);
        expectNoStore("status ready", statusResponse);
        const statusBody = await readJson(statusResponse);
        expectNoSensitive("status ready", statusBody);
        const liveModel = getObject(statusBody, "liveModel", "status ready");
        if (liveModel.ready !== true || liveModel.model !== "deepseek-v4-pro") {
          throw new Error("status ready did not expose safe live-model metadata");
        }

        const disabledStatus = getAiReviewLiveModelStatus({
          OPERATION_ENABLE_LIVE_AI_REVIEW: "0",
          DEEPSEEK_API_KEY: "test_deepseek_key",
          DEEPSEEK_MODEL: "deepseek-v4-pro",
        });
        const disabledExecute = await handleAiReviewRunExecuteRoute(
          authRepository,
          aiReviewRepository,
          null,
          jsonRequest({
            url: scopedUrl("/api/ai-review/runs/missing/execute"),
            setCookie,
            csrf: true,
            body: {
              promptVersionId: "missing_prompt",
              providerPolicy: {
                provider: "deepseek",
                providerApi: "chat_completions",
                model: "deepseek-v4-pro",
                structuredOutputRequired: true,
              },
            },
          }),
          { runId: "missing" },
          {
            liveModelStatus: disabledStatus,
          },
        );
        expectStatus("disabled live execute", disabledExecute, 403);
        expectNoStore("disabled live execute", disabledExecute);
        expectNoSensitive("disabled live execute", await readJson(disabledExecute));

        throw new ExpectedRollback();
      });
    } catch (error) {
      if (error instanceof ExpectedRollback) {
        await runOptionalLiveSmoke();
        console.log("AI review live-model gate check passed");
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
