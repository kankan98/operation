import { z } from "zod";

import {
  AiProviderError,
  createDeepSeekProvider,
  isAiProviderError,
  parseDeepSeekProviderEnv,
  type AiProviderFetch,
} from "./index";

const sampleOutputSchema = z.object({
  summary: z.string().min(1),
  score: z.number().int().min(0).max(10),
});

type FetchScenario = {
  status?: number;
  body?: unknown;
  delayMs?: number;
  throws?: Error;
};

async function expectRejected(
  label: string,
  action: () => Promise<unknown> | unknown,
  expectedCode: string,
) {
  try {
    await action();
  } catch (error) {
    if (isAiProviderError(error) && error.code === expectedCode) {
      const serialized = JSON.stringify(error);

      if (
        serialized.includes("test_deepseek_key") ||
        serialized.includes("Bearer") ||
        serialized.includes("Authorization")
      ) {
        throw new Error(`${label} leaked sensitive provider metadata`);
      }

      return;
    }

    throw new Error(`${label} failed with unexpected rejection`);
  }

  throw new Error(`${label} should have been rejected`);
}

function createFetchScenario(scenario: FetchScenario): AiProviderFetch {
  return async (_url, init) => {
    if (scenario.delayMs) {
      await new Promise((resolve) => setTimeout(resolve, scenario.delayMs));
    }

    if (scenario.throws) {
      throw scenario.throws;
    }

    const headers = init?.headers;
    const authorization =
      headers instanceof Headers
        ? headers.get("authorization")
        : typeof headers === "object" && headers !== null
          ? (headers as Record<string, string>).Authorization
          : "";

    if (authorization !== "Bearer test_deepseek_key") {
      throw new Error("DeepSeek adapter should send the API key as bearer auth");
    }

    return new Response(JSON.stringify(scenario.body), {
      status: scenario.status ?? 200,
      headers: {
        "content-type": "application/json",
      },
    });
  };
}

function createSuccessBody(content: string, finishReason = "stop") {
  return {
    id: "chatcmpl_test",
    choices: [
      {
        index: 0,
        message: {
          role: "assistant",
          content,
        },
        finish_reason: finishReason,
      },
    ],
    usage: {
      prompt_tokens: 12,
      completion_tokens: 8,
      total_tokens: 20,
    },
  };
}

async function runJsonRequest(fetchImpl: AiProviderFetch, timeoutMs = 5000) {
  const provider = createDeepSeekProvider(
    parseDeepSeekProviderEnv({
      DEEPSEEK_API_KEY: "test_deepseek_key",
      DEEPSEEK_API_BASE_URL: "https://api.deepseek.com",
      DEEPSEEK_MODEL: "deepseek-v4-pro",
      DEEPSEEK_TIMEOUT_MS: String(timeoutMs),
    }),
    fetchImpl,
  );

  return provider.generateJson({
    requestId: "ai_provider_check_request",
    messages: [
      {
        role: "system",
        content: "Return only valid JSON matching the requested schema.",
      },
      {
        role: "user",
        content: "Summarize this local verifier scenario as JSON.",
      },
    ],
    schema: sampleOutputSchema,
    schemaName: "AiProviderCheckOutput",
    maxTokens: 128,
    temperature: 0,
  });
}

async function runLocalChecks() {
  await expectRejected(
    "missing DeepSeek key",
    () => parseDeepSeekProviderEnv({}),
    "AI_PROVIDER_CONFIG_MISSING",
  );

  const success = await runJsonRequest(
    createFetchScenario({
      body: createSuccessBody('{"summary":"adapter works","score":8}'),
    }),
  );

  if (
    success.data.summary !== "adapter works" ||
    success.metadata.provider !== "deepseek" ||
    success.metadata.model !== "deepseek-v4-pro" ||
    success.metadata.responseId !== "chatcmpl_test" ||
    success.metadata.tokenUsage?.totalTokens !== 20
  ) {
    throw new Error("DeepSeek adapter success metadata is incorrect");
  }

  await expectRejected(
    "provider rate limit",
    () =>
      runJsonRequest(
        createFetchScenario({
          status: 429,
          body: {
            error: {
              message: "rate limit",
            },
          },
        }),
      ),
    "AI_PROVIDER_RATE_LIMITED",
  );

  await expectRejected(
    "provider auth failure",
    () =>
      runJsonRequest(
        createFetchScenario({
          status: 401,
          body: {
            error: {
              message: "bad key",
            },
          },
        }),
      ),
    "AI_PROVIDER_AUTH_FAILED",
  );

  await expectRejected(
    "provider unavailable",
    () =>
      runJsonRequest(
        createFetchScenario({
          status: 503,
          body: {
            error: {
              message: "temporarily unavailable",
            },
          },
        }),
      ),
    "AI_PROVIDER_UNAVAILABLE",
  );

  await expectRejected(
    "provider timeout",
    () =>
      runJsonRequest(
        createFetchScenario({
          delayMs: 50,
          body: createSuccessBody('{"summary":"too late","score":5}'),
        }),
        5,
      ),
    "AI_PROVIDER_TIMEOUT",
  );

  await expectRejected(
    "empty provider output",
    () =>
      runJsonRequest(
        createFetchScenario({
          body: createSuccessBody(""),
        }),
      ),
    "AI_PROVIDER_EMPTY_OUTPUT",
  );

  await expectRejected(
    "malformed provider output",
    () =>
      runJsonRequest(
        createFetchScenario({
          body: createSuccessBody("{not json"),
        }),
      ),
    "AI_PROVIDER_MALFORMED_JSON",
  );

  await expectRejected(
    "schema mismatch",
    () =>
      runJsonRequest(
        createFetchScenario({
          body: createSuccessBody('{"summary":"","score":99}'),
        }),
      ),
    "AI_PROVIDER_SCHEMA_MISMATCH",
  );

  await expectRejected(
    "partial provider output",
    () =>
      runJsonRequest(
        createFetchScenario({
          body: createSuccessBody('{"summary":"cut"', "length"),
        }),
      ),
    "PARTIAL_MODEL_OUTPUT",
  );

  await expectRejected(
    "network failure",
    () =>
      runJsonRequest(
        createFetchScenario({
          throws: new Error("network connection failed with token=secret"),
        }),
      ),
    "AI_PROVIDER_UNAVAILABLE",
  );
}

async function runLiveSmokeIfEnabled() {
  if (process.env.DEEPSEEK_LIVE_SMOKE !== "1") {
    return;
  }

  const provider = createDeepSeekProvider(parseDeepSeekProviderEnv(process.env));
  const result = await provider.generateJson({
    requestId: "ai_provider_live_smoke",
    messages: [
      {
        role: "system",
        content: "Return only valid JSON with keys summary and score.",
      },
      {
        role: "user",
        content: "Return JSON: summary is ok, score is 1.",
      },
    ],
    schema: sampleOutputSchema,
    schemaName: "AiProviderCheckOutput",
    maxTokens: 64,
    temperature: 0,
  });

  console.log(
    `DeepSeek live smoke passed: ${result.metadata.provider}/${result.metadata.model}`,
  );
}

async function main() {
  await runLocalChecks();
  await runLiveSmokeIfEnabled();
  console.log("AI provider port check passed");
}

main().catch((error) => {
  if (error instanceof AiProviderError) {
    console.error(`${error.code}: ${error.message}`);
  } else {
    console.error(error);
  }
  process.exitCode = 1;
});
