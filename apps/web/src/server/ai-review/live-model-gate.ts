import "server-only";

import {
  AiProviderError,
  createDeepSeekProvider,
  isAiProviderError,
  parseDeepSeekProviderEnv,
  type AiProviderPort,
} from "../ai-provider";

export const AI_REVIEW_LIVE_MODEL_GATE_ENV = "OPERATION_ENABLE_LIVE_AI_REVIEW";
export const AI_REVIEW_LIVE_SMOKE_ENV = "AI_REVIEW_LIVE_SMOKE";

export type AiReviewLiveModelStatusCode =
  | "AI_REVIEW_LIVE_MODEL_READY"
  | "AI_REVIEW_LIVE_MODEL_DISABLED"
  | "AI_PROVIDER_CONFIG_MISSING"
  | "AI_PROVIDER_CONFIG_INVALID";

export type AiReviewLiveModelStatus = {
  enabled: boolean;
  configured: boolean;
  ready: boolean;
  provider: "deepseek";
  providerApi: "chat_completions";
  model: string;
  modeLabel: "真实模型";
  code: AiReviewLiveModelStatusCode;
  userMessage: string;
};

const defaultDeepSeekModel = "deepseek-v4-pro";

function isTruthy(value: string | undefined): boolean {
  return ["1", "true", "yes", "on"].includes(value?.trim().toLowerCase() ?? "");
}

function safeModelFromEnv(
  env: NodeJS.ProcessEnv | Record<string, string | undefined>,
): string {
  return env.DEEPSEEK_MODEL?.trim() || defaultDeepSeekModel;
}

export function isAiReviewLiveSmokeEnabled(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): boolean {
  return isTruthy(env[AI_REVIEW_LIVE_SMOKE_ENV]);
}

export function getAiReviewLiveModelStatus(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): AiReviewLiveModelStatus {
  if (!isTruthy(env[AI_REVIEW_LIVE_MODEL_GATE_ENV])) {
    return {
      enabled: false,
      configured: false,
      ready: false,
      provider: "deepseek",
      providerApi: "chat_completions",
      model: safeModelFromEnv(env),
      modeLabel: "真实模型",
      code: "AI_REVIEW_LIVE_MODEL_DISABLED",
      userMessage: "真实模型未开启，当前可使用本地演示生成",
    };
  }

  try {
    const config = parseDeepSeekProviderEnv(env);

    return {
      enabled: true,
      configured: true,
      ready: true,
      provider: "deepseek",
      providerApi: "chat_completions",
      model: config.DEEPSEEK_MODEL,
      modeLabel: "真实模型",
      code: "AI_REVIEW_LIVE_MODEL_READY",
      userMessage: "真实模型已就绪，生成后仍需人工审核",
    };
  } catch (error) {
    const code =
      isAiProviderError(error) &&
      (error.code === "AI_PROVIDER_CONFIG_MISSING" ||
        error.code === "AI_PROVIDER_CONFIG_INVALID")
        ? error.code
        : "AI_PROVIDER_CONFIG_INVALID";

    return {
      enabled: true,
      configured: false,
      ready: false,
      provider: "deepseek",
      providerApi: "chat_completions",
      model: safeModelFromEnv(env),
      modeLabel: "真实模型",
      code,
      userMessage: "真实模型配置暂不可用，当前可使用本地演示生成",
    };
  }
}

export function createAiReviewLiveModelProvider(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): {
  provider: AiProviderPort | null;
  status: AiReviewLiveModelStatus;
} {
  const status = getAiReviewLiveModelStatus(env);

  if (!status.ready) {
    return {
      provider: null,
      status,
    };
  }

  try {
    return {
      provider: createDeepSeekProvider(parseDeepSeekProviderEnv(env)),
      status,
    };
  } catch (error) {
    if (error instanceof AiProviderError) {
      return {
        provider: null,
        status: getAiReviewLiveModelStatus(env),
      };
    }

    return {
      provider: null,
      status: {
        ...status,
        configured: false,
        ready: false,
        code: "AI_PROVIDER_CONFIG_INVALID",
        userMessage: "真实模型配置暂不可用，当前可使用本地演示生成",
      },
    };
  }
}
