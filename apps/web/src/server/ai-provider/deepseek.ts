import "server-only";

import { z } from "zod";

import type { DeepSeekProviderConfig } from "./env";
import { AiProviderError, isAiProviderError, redactSensitiveText } from "./errors";
import type {
  AiProviderFetch,
  AiProviderInvocationMetadata,
  AiProviderJsonRequest,
  AiProviderJsonResult,
  AiProviderPort,
  AiProviderTokenUsage,
} from "./port";

const deepSeekResponseSchema = z
  .object({
    id: z.string().optional(),
    choices: z
      .array(
        z
          .object({
            message: z
              .object({
                content: z.string().nullable().optional(),
              })
              .passthrough()
              .optional(),
            finish_reason: z.string().nullable().optional(),
          })
          .passthrough(),
      )
      .default([]),
    usage: z
      .object({
        prompt_tokens: z.number().optional(),
        completion_tokens: z.number().optional(),
        total_tokens: z.number().optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

function createMetadata(
  config: DeepSeekProviderConfig,
  requestId: string,
  startedAt: number,
  response?: z.infer<typeof deepSeekResponseSchema>,
): AiProviderInvocationMetadata {
  const usage: AiProviderTokenUsage | undefined = response?.usage
    ? {
        inputTokens: response.usage.prompt_tokens,
        outputTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens,
      }
    : undefined;

  return {
    provider: "deepseek",
    providerApi: "chat_completions",
    model: config.DEEPSEEK_MODEL,
    requestId,
    responseId: response?.id,
    latencyMs: Math.max(0, Date.now() - startedAt),
    tokenUsage: usage,
    finishReason: response?.choices[0]?.finish_reason ?? undefined,
    retryable: false,
  };
}

function mapHttpStatusToError(status: number): {
  code: AiProviderError["code"];
  message: string;
  retryable: boolean;
} {
  if (status === 400 || status === 422) {
    return {
      code: "AI_PROVIDER_INVALID_REQUEST",
      message: "DeepSeek rejected the provider request",
      retryable: false,
    };
  }

  if (status === 401) {
    return {
      code: "AI_PROVIDER_AUTH_FAILED",
      message: "DeepSeek authentication failed",
      retryable: false,
    };
  }

  if (status === 402) {
    return {
      code: "AI_PROVIDER_QUOTA_EXCEEDED",
      message: "DeepSeek quota or balance is unavailable",
      retryable: false,
    };
  }

  if (status === 429) {
    return {
      code: "AI_PROVIDER_RATE_LIMITED",
      message: "DeepSeek rate limited the request",
      retryable: true,
    };
  }

  return {
    code: "AI_PROVIDER_UNAVAILABLE",
    message: "DeepSeek provider is unavailable",
    retryable: status >= 500,
  };
}

async function parseProviderJson(response: Response): Promise<unknown> {
  const text = await response.text();

  if (!text.trim()) {
    return {};
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return {};
  }
}

async function fetchWithTimeout(
  fetchImpl: AiProviderFetch,
  url: string,
  init: RequestInit,
  timeoutMs: number,
) {
  const controller = new AbortController();
  const started = Date.now();
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<Response>((_, reject) => {
    timeoutId = setTimeout(() => {
      controller.abort();
      reject(
        new AiProviderError(
          "AI_PROVIDER_TIMEOUT",
          "DeepSeek provider request timed out",
          {
            retryable: true,
            details: {
              timeoutMs,
            },
          },
        ),
      );
    }, timeoutMs);
  });

  try {
    return await Promise.race([
      fetchImpl(url, {
        ...init,
        signal: controller.signal,
      }),
      timeout,
    ]);
  } catch (error) {
    if (isAiProviderError(error)) {
      throw error;
    }

    throw new AiProviderError(
      "AI_PROVIDER_UNAVAILABLE",
      "DeepSeek provider request failed",
      {
        cause: error,
        retryable: true,
        details: {
          elapsedMs: Date.now() - started,
          reason:
            error instanceof Error
              ? redactSensitiveText(error.message)
              : "Unknown provider network failure",
        },
      },
    );
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

function assertRequestShape<TData>(input: AiProviderJsonRequest<TData>) {
  if (input.messages.length === 0) {
    throw new AiProviderError(
      "AI_PROVIDER_INVALID_REQUEST",
      "AI provider request requires at least one message",
    );
  }

  for (const message of input.messages) {
    if (message.content.trim().length === 0) {
      throw new AiProviderError(
        "AI_PROVIDER_INVALID_REQUEST",
        "AI provider messages cannot be empty",
      );
    }
  }
}

function parseStructuredContent<TData>(
  input: AiProviderJsonRequest<TData>,
  response: z.infer<typeof deepSeekResponseSchema>,
) {
  const choice = response.choices[0];
  const finishReason = choice?.finish_reason ?? undefined;

  if (finishReason === "length") {
    throw new AiProviderError(
      "PARTIAL_MODEL_OUTPUT",
      "DeepSeek returned partial JSON output",
      {
        retryable: true,
        details: {
          finishReason,
          schemaName: input.schemaName,
        },
      },
    );
  }

  if (finishReason === "content_filter" || finishReason === "refusal") {
    throw new AiProviderError(
      "AI_PROVIDER_REFUSAL",
      "DeepSeek refused or filtered the JSON output",
      {
        retryable: false,
        details: {
          finishReason,
          schemaName: input.schemaName,
        },
      },
    );
  }

  const content = choice?.message?.content?.trim() ?? "";

  if (!content) {
    throw new AiProviderError(
      "AI_PROVIDER_EMPTY_OUTPUT",
      "DeepSeek returned empty JSON output",
      {
        retryable: true,
        details: {
          schemaName: input.schemaName,
        },
      },
    );
  }

  let parsedJson: unknown;

  try {
    parsedJson = JSON.parse(content);
  } catch (error) {
    throw new AiProviderError(
      "AI_PROVIDER_MALFORMED_JSON",
      "DeepSeek returned malformed JSON output",
      {
        cause: error,
        retryable: true,
        details: {
          schemaName: input.schemaName,
        },
      },
    );
  }

  const parsed = input.schema.safeParse(parsedJson);

  if (!parsed.success) {
    throw new AiProviderError(
      "AI_PROVIDER_SCHEMA_MISMATCH",
      "DeepSeek JSON output does not match the requested schema",
      {
        retryable: true,
        details: {
          schemaName: input.schemaName,
          issues: parsed.error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        },
      },
    );
  }

  return {
    content,
    data: parsed.data,
  };
}

export function createDeepSeekProvider(
  config: DeepSeekProviderConfig,
  fetchImpl: AiProviderFetch = fetch,
): AiProviderPort {
  const baseUrl = config.DEEPSEEK_API_BASE_URL.replace(/\/+$/, "");

  return {
    async generateJson<TData>(
      input: AiProviderJsonRequest<TData>,
    ): Promise<AiProviderJsonResult<TData>> {
      assertRequestShape(input);
      const startedAt = Date.now();
      const requestBody = {
        model: config.DEEPSEEK_MODEL,
        messages: input.messages,
        temperature: input.temperature ?? 0,
        max_tokens: input.maxTokens ?? config.DEEPSEEK_MAX_TOKENS,
        response_format: {
          type: "json_object",
        },
      };

      const response = await fetchWithTimeout(
        fetchImpl,
        `${baseUrl}/chat/completions`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${config.DEEPSEEK_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        },
        config.DEEPSEEK_TIMEOUT_MS,
      );

      if (!response.ok) {
        const safeError = mapHttpStatusToError(response.status);
        await parseProviderJson(response);
        throw new AiProviderError(safeError.code, safeError.message, {
          retryable: safeError.retryable,
          status: response.status,
          requestId: input.requestId,
        });
      }

      const rawBody = await parseProviderJson(response);
      const parsedResponse = deepSeekResponseSchema.safeParse(rawBody);

      if (!parsedResponse.success) {
        throw new AiProviderError(
          "AI_PROVIDER_MALFORMED_JSON",
          "DeepSeek provider response envelope is invalid",
          {
            retryable: true,
            requestId: input.requestId,
            details: {
              schemaName: "DeepSeekChatCompletionResponse",
              issues: parsedResponse.error.issues.map((issue) => ({
                path: issue.path.join("."),
                message: issue.message,
              })),
            },
          },
        );
      }

      const output = parseStructuredContent(input, parsedResponse.data);

      return {
        ...output,
        metadata: createMetadata(config, input.requestId, startedAt, parsedResponse.data),
      };
    },
  };
}
