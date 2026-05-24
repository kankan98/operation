import "server-only";

import type { z } from "zod";

export type AiProviderRole = "system" | "user" | "assistant";

export type AiProviderMessage = {
  role: AiProviderRole;
  content: string;
};

export type AiProviderTokenUsage = {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
};

export type AiProviderInvocationMetadata = {
  provider: string;
  providerApi: string;
  model: string;
  requestId: string;
  responseId?: string;
  latencyMs: number;
  tokenUsage?: AiProviderTokenUsage;
  finishReason?: string;
  retryable: boolean;
};

export type AiProviderJsonRequest<TData> = {
  requestId: string;
  messages: AiProviderMessage[];
  schema: z.ZodType<TData>;
  schemaName: string;
  maxTokens?: number;
  temperature?: number;
};

export type AiProviderJsonResult<TData> = {
  data: TData;
  content: string;
  metadata: AiProviderInvocationMetadata;
};

export type AiProviderPort = {
  generateJson<TData>(
    input: AiProviderJsonRequest<TData>,
  ): Promise<AiProviderJsonResult<TData>>;
};

export type AiProviderFetch = (
  input: string | URL | Request,
  init?: RequestInit,
) => Promise<Response>;

