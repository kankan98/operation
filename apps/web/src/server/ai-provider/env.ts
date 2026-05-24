import { z } from "zod";

import { AiProviderError } from "./errors";

const defaultDeepSeekBaseUrl = "https://api.deepseek.com";
const defaultDeepSeekModel = "deepseek-v4-pro";

const deepSeekProviderEnvSchema = z.object({
  DEEPSEEK_API_KEY: z.string().trim().min(1),
  DEEPSEEK_API_BASE_URL: z
    .string()
    .trim()
    .url()
    .optional()
    .default(defaultDeepSeekBaseUrl),
  DEEPSEEK_MODEL: z
    .string()
    .trim()
    .min(1)
    .optional()
    .default(defaultDeepSeekModel),
  DEEPSEEK_TIMEOUT_MS: z.coerce
    .number()
    .int()
    .min(1)
    .max(120000)
    .optional()
    .default(30000),
  DEEPSEEK_MAX_TOKENS: z.coerce
    .number()
    .int()
    .min(1)
    .max(8192)
    .optional()
    .default(2048),
});

export type DeepSeekProviderConfig = z.infer<typeof deepSeekProviderEnvSchema>;

export function parseDeepSeekProviderEnv(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): DeepSeekProviderConfig {
  const parsed = deepSeekProviderEnvSchema.safeParse(env);

  if (parsed.success) {
    return parsed.data;
  }

  const missingApiKey = parsed.error.issues.some(
    (issue) => issue.path.join(".") === "DEEPSEEK_API_KEY",
  );

  throw new AiProviderError(
    missingApiKey ? "AI_PROVIDER_CONFIG_MISSING" : "AI_PROVIDER_CONFIG_INVALID",
    missingApiKey
      ? "DEEPSEEK_API_KEY is required to create the DeepSeek provider"
      : "DeepSeek provider environment variables are invalid",
    {
      details: {
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
    },
  );
}
