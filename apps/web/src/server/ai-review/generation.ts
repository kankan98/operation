import "server-only";

import { createHash } from "node:crypto";

import { z } from "zod";

import {
  isAiProviderError,
  redactAiProviderMetadata,
  type AiProviderInvocationMetadata,
  type AiProviderMessage,
  type AiProviderPort,
} from "../ai-provider";

export type AiReviewGenerationErrorCode =
  | "VALIDATION_ERROR"
  | "SESSION_NOT_REVIEW_READY"
  | "SENSITIVE_DATA_NEEDS_REVIEW"
  | "LONG_INPUT_LIMIT_EXCEEDED"
  | "INSUFFICIENT_EVIDENCE"
  | "STALE_KNOWLEDGE_BLOCKED"
  | "CONFLICTING_KNOWLEDGE_BLOCKED"
  | "WEAK_SESSION_INPUT"
  | "PROVIDER_AUTH_FAILED"
  | "PROVIDER_QUOTA_EXCEEDED"
  | "PROVIDER_RATE_LIMITED"
  | "PROVIDER_TIMEOUT"
  | "PROVIDER_UNAVAILABLE"
  | "MODEL_REFUSAL"
  | "PARTIAL_MODEL_OUTPUT"
  | "AI_OUTPUT_EMPTY"
  | "AI_OUTPUT_MALFORMED"
  | "AI_OUTPUT_SCHEMA_MISMATCH"
  | "AI_OUTPUT_POLICY_BLOCKED";

export class AiReviewGenerationError extends Error {
  readonly code: AiReviewGenerationErrorCode;
  readonly retryable: boolean;
  readonly requestId?: string;
  readonly details: Record<string, unknown>;

  constructor(
    code: AiReviewGenerationErrorCode,
    message: string,
    options?: {
      cause?: unknown;
      retryable?: boolean;
      requestId?: string;
      details?: Record<string, unknown>;
    },
  ) {
    super(message, { cause: options?.cause });
    this.name = "AiReviewGenerationError";
    this.code = code;
    this.retryable = options?.retryable ?? false;
    this.requestId = options?.requestId;
    this.details = redactAiProviderMetadata(options?.details);
  }
}

const sectionTypeSchema = z.enum([
  "live_recap",
  "product_diagnosis",
  "question_cluster",
  "objection_pattern",
  "talk_track_candidate",
  "short_video_topic",
  "next_session_action",
]);
const sessionStatusSchema = z.enum([
  "draft",
  "autosaved",
  "submitted",
  "review_ready",
  "processing",
  "processed",
  "failed",
  "archived",
  "deleted",
]);
const platformSchema = z.enum([
  "douyin",
  "kuaishou",
  "video_account",
  "offline_notes",
  "other",
]);
const redactionStateSchema = z.enum([
  "not_needed",
  "redacted",
  "needs_review",
  "blocked",
]);
const longInputPolicySchema = z.enum([
  "within_limit",
  "chunked",
  "truncated_with_notice",
  "blocked",
]);
const knowledgeConflictStateSchema = z.enum(["none", "low_risk", "blocked"]);
const knowledgeFreshnessStateSchema = z.enum([
  "current",
  "stale_warning",
  "stale_blocked",
]);
const knowledgeReviewStateSchema = z.enum([
  "published_only",
  "approved_candidates",
  "insufficient",
  "blocked",
]);
const promptPurposeSchema = z.enum([
  "full_review",
  "section_regeneration",
  "validation",
]);
const confidenceSchema = z.enum(["high", "medium", "low", "unknown"]);
const validationCheckTypeSchema = z.enum([
  "schema",
  "empty_section",
  "source_grounding",
  "stale_source",
  "sensitive_data",
  "fact_conflict",
  "long_input",
  "policy",
]);
const validationStatusSchema = z.enum([
  "passed",
  "warning",
  "failed",
  "blocked",
]);

const stringField = (max: number) => z.string().trim().max(max);
const requiredStringField = (max: number) => z.string().trim().min(1).max(max);
const idListSchema = z.array(requiredStringField(180)).max(80).default([]);
const objectArraySchema = z
  .array(z.record(z.string(), z.unknown()))
  .max(80)
  .default([]);
const metadataSchema = z.record(z.string(), z.unknown()).default({});

const promptMetadataSchema = z.object({
  name: requiredStringField(180),
  version: requiredStringField(80),
  purpose: promptPurposeSchema.default("full_review"),
  inputSchemaVersion: requiredStringField(120),
  outputSchemaVersion: requiredStringField(120),
  modelPolicy: requiredStringField(3000),
});

const inputSnapshotSchema = z.object({
  sessionStatus: sessionStatusSchema,
  title: requiredStringField(240),
  sessionDate: z.coerce.date(),
  platform: platformSchema,
  hostRoles: objectArraySchema,
  productOrder: objectArraySchema,
  operatorSummary: stringField(5000).default(""),
  questionSummaries: objectArraySchema,
  objectionSummaries: objectArraySchema,
  noteHighlights: objectArraySchema,
  redactionState: redactionStateSchema.default("not_needed"),
  longInputPolicy: longInputPolicySchema.default("within_limit"),
});

const knowledgeSnapshotSchema = z.object({
  knowledgeVersionIds: idListSchema,
  racketProductVersionIds: idListSchema,
  sourceIds: idListSchema,
  trustSummary: metadataSchema,
  conflictState: knowledgeConflictStateSchema.default("none"),
  freshnessState: knowledgeFreshnessStateSchema.default("current"),
  reviewState: knowledgeReviewStateSchema.default("published_only"),
  intendedUse: idListSchema,
});

const generationInputSchema = z.object({
  requestId: requiredStringField(180),
  sessionId: requiredStringField(180),
  requestedSections: z.array(sectionTypeSchema).min(1).max(7),
  prompt: promptMetadataSchema,
  inputSnapshot: inputSnapshotSchema,
  knowledgeSnapshot: knowledgeSnapshotSchema,
  maxTokens: z.number().int().min(1).max(8192).optional(),
  temperature: z.number().min(0).max(2).optional(),
});

const generatedSectionSchema = z.object({
  sectionType: sectionTypeSchema,
  title: stringField(240).default(""),
  summary: stringField(5000).default(""),
  items: objectArraySchema,
  sourceRefs: idListSchema,
  confidence: confidenceSchema.default("unknown"),
});

const generatedOutputSchema = z.object({
  schemaVersion: requiredStringField(120),
  overallConfidence: confidenceSchema.default("unknown"),
  evidenceSummary: metadataSchema,
  sections: z.array(generatedSectionSchema).min(1).max(20),
});

const generationValidationResultSchema = z.object({
  checkType: validationCheckTypeSchema,
  status: validationStatusSchema,
  message: requiredStringField(800),
  affectedSectionTypes: z.array(sectionTypeSchema).max(7).default([]),
  recoverable: z.boolean().default(false),
});

export type AiReviewSectionType = z.infer<typeof sectionTypeSchema>;
export type AiReviewGenerationInput = z.input<typeof generationInputSchema>;
export type AiReviewGenerationValidatedInput = z.output<
  typeof generationInputSchema
>;
export type AiReviewGeneratedOutputSection = z.output<
  typeof generatedSectionSchema
>;
export type AiReviewGeneratedOutput = z.output<typeof generatedOutputSchema>;
export type AiReviewGenerationValidationResult = z.output<
  typeof generationValidationResultSchema
>;

export type AiReviewGenerationMetadata = {
  requestId: string;
  promptName: string;
  promptVersion: string;
  promptPurpose: z.infer<typeof promptPurposeSchema>;
  inputSchemaVersion: string;
  outputSchemaVersion: string;
  promptFingerprint: string;
  provider: AiProviderInvocationMetadata;
  generatedAt: string;
};

export type AiReviewGenerationResult = {
  output: AiReviewGeneratedOutput;
  validationResults: AiReviewGenerationValidationResult[];
  reviewReady: boolean;
  metadata: AiReviewGenerationMetadata;
};

const groundedSectionTypes = new Set<AiReviewSectionType>([
  "product_diagnosis",
  "objection_pattern",
  "talk_track_candidate",
  "short_video_topic",
  "next_session_action",
]);

const sensitiveOutputPatterns = [
  /1[3-9]\d{9}/,
  /手机号|电话|地址|订单|私信|完整未脱敏转录/,
  /Bearer\s+[A-Za-z0-9._~+/=-]+/i,
  /sk-[A-Za-z0-9_-]{12,}/,
];

export function isAiReviewGenerationError(
  error: unknown,
): error is AiReviewGenerationError {
  return error instanceof AiReviewGenerationError;
}

function parseGenerationInput(input: AiReviewGenerationInput) {
  const parsed = generationInputSchema.safeParse(input);

  if (parsed.success) {
    return parsed.data;
  }

  throw new AiReviewGenerationError(
    "VALIDATION_ERROR",
    "AI review generation input is invalid",
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

function assertSafeGenerationInput(input: AiReviewGenerationValidatedInput) {
  if (
    input.inputSnapshot.sessionStatus !== "review_ready" &&
    input.inputSnapshot.sessionStatus !== "processed"
  ) {
    throw new AiReviewGenerationError(
      "SESSION_NOT_REVIEW_READY",
      "Session is not ready for AI review generation",
      {
        requestId: input.requestId,
      },
    );
  }

  if (
    input.inputSnapshot.redactionState === "needs_review" ||
    input.inputSnapshot.redactionState === "blocked"
  ) {
    throw new AiReviewGenerationError(
      "SENSITIVE_DATA_NEEDS_REVIEW",
      "AI review generation input needs redaction review",
      {
        requestId: input.requestId,
      },
    );
  }

  if (input.inputSnapshot.longInputPolicy === "blocked") {
    throw new AiReviewGenerationError(
      "LONG_INPUT_LIMIT_EXCEEDED",
      "AI review generation input exceeds the safe long-input policy",
      {
        requestId: input.requestId,
      },
    );
  }

  if (input.knowledgeSnapshot.freshnessState === "stale_blocked") {
    throw new AiReviewGenerationError(
      "STALE_KNOWLEDGE_BLOCKED",
      "AI review generation knowledge snapshot is stale-blocked",
      {
        requestId: input.requestId,
      },
    );
  }

  if (input.knowledgeSnapshot.conflictState === "blocked") {
    throw new AiReviewGenerationError(
      "CONFLICTING_KNOWLEDGE_BLOCKED",
      "AI review generation knowledge snapshot has blocked conflicts",
      {
        requestId: input.requestId,
      },
    );
  }

  if (
    input.knowledgeSnapshot.reviewState === "insufficient" ||
    input.knowledgeSnapshot.reviewState === "blocked" ||
    input.knowledgeSnapshot.knowledgeVersionIds.length === 0 ||
    input.knowledgeSnapshot.sourceIds.length === 0
  ) {
    throw new AiReviewGenerationError(
      "INSUFFICIENT_EVIDENCE",
      "AI review generation requires reviewed knowledge and source references",
      {
        requestId: input.requestId,
      },
    );
  }

  const hasSessionSignal =
    input.inputSnapshot.operatorSummary.trim().length > 0 ||
    input.inputSnapshot.questionSummaries.length > 0 ||
    input.inputSnapshot.objectionSummaries.length > 0 ||
    input.inputSnapshot.noteHighlights.length > 0;

  if (!hasSessionSignal) {
    throw new AiReviewGenerationError(
      "WEAK_SESSION_INPUT",
      "AI review generation requires a session summary, question, objection, or note signal",
      {
        requestId: input.requestId,
      },
    );
  }
}

function buildPromptMessages(input: AiReviewGenerationValidatedInput) {
  const safePayload = {
    sessionId: input.sessionId,
    requestedSections: input.requestedSections,
    inputSnapshot: {
      sessionStatus: input.inputSnapshot.sessionStatus,
      title: input.inputSnapshot.title,
      sessionDate: input.inputSnapshot.sessionDate.toISOString(),
      platform: input.inputSnapshot.platform,
      hostRoles: input.inputSnapshot.hostRoles,
      productOrder: input.inputSnapshot.productOrder,
      operatorSummary: input.inputSnapshot.operatorSummary,
      questionSummaries: input.inputSnapshot.questionSummaries,
      objectionSummaries: input.inputSnapshot.objectionSummaries,
      noteHighlights: input.inputSnapshot.noteHighlights,
      redactionState: input.inputSnapshot.redactionState,
      longInputPolicy: input.inputSnapshot.longInputPolicy,
    },
    knowledgeSnapshot: {
      knowledgeVersionIds: input.knowledgeSnapshot.knowledgeVersionIds,
      racketProductVersionIds: input.knowledgeSnapshot.racketProductVersionIds,
      sourceIds: input.knowledgeSnapshot.sourceIds,
      trustSummary: input.knowledgeSnapshot.trustSummary,
      conflictState: input.knowledgeSnapshot.conflictState,
      freshnessState: input.knowledgeSnapshot.freshnessState,
      reviewState: input.knowledgeSnapshot.reviewState,
      intendedUse: input.knowledgeSnapshot.intendedUse,
    },
  };

  const messages: AiProviderMessage[] = [
    {
      role: "system",
      content: [
        "You are an AI review assistant for a Chinese badminton racket live-commerce operations team.",
        "Return one JSON object only. The JSON must match this schema: { schemaVersion, overallConfidence, evidenceSummary, sections[] }.",
        "Each section item must remain a reviewable suggestion, not an authoritative fact.",
        "Do not invent racket facts. Use only the provided reviewed knowledge snapshot and session summaries.",
        "Do not include customer personal data, orders, private messages, secrets, or raw transcripts.",
      ].join("\n"),
    },
    {
      role: "user",
      content: [
        `Prompt: ${input.prompt.name} ${input.prompt.version}`,
        `Input schema: ${input.prompt.inputSchemaVersion}`,
        `Output schema: ${input.prompt.outputSchemaVersion}`,
        `Model policy: ${input.prompt.modelPolicy}`,
        "Generate the requested AI review JSON from this bounded snapshot:",
        JSON.stringify(safePayload),
      ].join("\n"),
    },
  ];

  return messages;
}

function fingerprintPrompt(messages: AiProviderMessage[]) {
  return createHash("sha256")
    .update(JSON.stringify(messages))
    .digest("hex");
}

function mapProviderError(
  error: unknown,
  input: AiReviewGenerationValidatedInput,
): AiReviewGenerationError {
  if (!isAiProviderError(error)) {
    return new AiReviewGenerationError(
      "PROVIDER_UNAVAILABLE",
      "AI review generation provider failed unexpectedly",
      {
        cause: error,
        retryable: true,
        requestId: input.requestId,
      },
    );
  }

  const mapped = (() => {
    switch (error.code) {
      case "AI_PROVIDER_AUTH_FAILED":
        return {
          code: "PROVIDER_AUTH_FAILED" as const,
          message: "AI review generation provider authentication failed",
        };
      case "AI_PROVIDER_QUOTA_EXCEEDED":
        return {
          code: "PROVIDER_QUOTA_EXCEEDED" as const,
          message: "AI review generation provider quota is unavailable",
        };
      case "AI_PROVIDER_RATE_LIMITED":
        return {
          code: "PROVIDER_RATE_LIMITED" as const,
          message: "AI review generation provider rate limited the request",
        };
      case "AI_PROVIDER_TIMEOUT":
        return {
          code: "PROVIDER_TIMEOUT" as const,
          message: "AI review generation provider request timed out",
        };
      case "AI_PROVIDER_REFUSAL":
        return {
          code: "MODEL_REFUSAL" as const,
          message: "AI review generation model refused the request",
        };
      case "PARTIAL_MODEL_OUTPUT":
        return {
          code: "PARTIAL_MODEL_OUTPUT" as const,
          message: "AI review generation provider returned partial output",
        };
      case "AI_PROVIDER_EMPTY_OUTPUT":
        return {
          code: "AI_OUTPUT_EMPTY" as const,
          message: "AI review generation provider returned empty output",
        };
      case "AI_PROVIDER_MALFORMED_JSON":
        return {
          code: "AI_OUTPUT_MALFORMED" as const,
          message: "AI review generation provider returned malformed output",
        };
      case "AI_PROVIDER_SCHEMA_MISMATCH":
        return {
          code: "AI_OUTPUT_SCHEMA_MISMATCH" as const,
          message: "AI review generation provider output failed schema validation",
        };
      default:
        return {
          code: "PROVIDER_UNAVAILABLE" as const,
          message: "AI review generation provider is unavailable",
        };
    }
  })();

  return new AiReviewGenerationError(mapped.code, mapped.message, {
    cause: error,
    retryable: error.retryable,
    requestId: input.requestId,
    details: {
      providerCode: error.code,
      providerStatus: error.status,
      providerRequestId: error.requestId,
    },
  });
}

function collectStrings(value: unknown): string[] {
  if (typeof value === "string") {
    return [value];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => collectStrings(item));
  }

  if (value && typeof value === "object") {
    return Object.values(value).flatMap((item) => collectStrings(item));
  }

  return [];
}

function createValidationResult(
  input: z.input<typeof generationValidationResultSchema>,
) {
  return generationValidationResultSchema.parse(input);
}

function validateGeneratedOutput(
  output: AiReviewGeneratedOutput,
  input: AiReviewGenerationValidatedInput,
): AiReviewGenerationValidationResult[] {
  const validationResults: AiReviewGenerationValidationResult[] = [
    createValidationResult({
      checkType: "schema",
      status:
        output.schemaVersion === input.prompt.outputSchemaVersion
          ? "passed"
          : "warning",
      message:
        output.schemaVersion === input.prompt.outputSchemaVersion
          ? "结构化输出符合当前 schema version。"
          : "结构化输出 schema version 与当前 prompt metadata 不一致。",
      recoverable: output.schemaVersion !== input.prompt.outputSchemaVersion,
    }),
  ];

  if (
    input.inputSnapshot.longInputPolicy === "chunked" ||
    input.inputSnapshot.longInputPolicy === "truncated_with_notice"
  ) {
    validationResults.push(
      createValidationResult({
        checkType: "long_input",
        status: "warning",
        message: "输入已分段或截断，审核时需要确认是否遗漏关键上下文。",
        recoverable: true,
      }),
    );
  }

  if (input.knowledgeSnapshot.freshnessState === "stale_warning") {
    validationResults.push(
      createValidationResult({
        checkType: "stale_source",
        status: "warning",
        message: "部分知识来源存在过期风险，建议审核后再复用。",
        recoverable: true,
      }),
    );
  }

  if (input.knowledgeSnapshot.conflictState === "low_risk") {
    validationResults.push(
      createValidationResult({
        checkType: "fact_conflict",
        status: "warning",
        message: "知识快照存在低风险冲突，建议审核人员确认。",
        recoverable: true,
      }),
    );
  }

  if (
    input.knowledgeSnapshot.reviewState === "approved_candidates" ||
    output.overallConfidence === "low" ||
    output.overallConfidence === "unknown"
  ) {
    validationResults.push(
      createValidationResult({
        checkType: "policy",
        status: "warning",
        message: "输出置信度或知识审核状态需要人工确认。",
        recoverable: true,
      }),
    );
  }

  for (const requestedSection of input.requestedSections) {
    const matchingSections = output.sections.filter(
      (section) => section.sectionType === requestedSection,
    );

    if (matchingSections.length === 0) {
      validationResults.push(
        createValidationResult({
          checkType: "empty_section",
          status: "failed",
          message: `缺少请求的复盘区块：${requestedSection}`,
          affectedSectionTypes: [requestedSection],
          recoverable: true,
        }),
      );
    }
  }

  for (const section of output.sections) {
    const title = section.title.trim();
    const summary = section.summary.trim();
    const affectedSectionTypes = [section.sectionType];

    if (!title || !summary || section.items.length === 0) {
      validationResults.push(
        createValidationResult({
          checkType: "empty_section",
          status: "failed",
          message: "复盘区块标题、摘要或建议项为空。",
          affectedSectionTypes,
          recoverable: true,
        }),
      );
    }

    if (
      groundedSectionTypes.has(section.sectionType) &&
      section.sourceRefs.length === 0
    ) {
      validationResults.push(
        createValidationResult({
          checkType: "source_grounding",
          status: "warning",
          message: "运营建议缺少来源引用，审核时需要补充证据。",
          affectedSectionTypes,
          recoverable: true,
        }),
      );
    }

    const sectionText = collectStrings(section).join("\n");

    if (sensitiveOutputPatterns.some((pattern) => pattern.test(sectionText))) {
      validationResults.push(
        createValidationResult({
          checkType: "sensitive_data",
          status: "blocked",
          message: "复盘输出疑似包含敏感信息，必须先人工处理。",
          affectedSectionTypes,
          recoverable: false,
        }),
      );
    }
  }

  return validationResults;
}

function isReviewReady(
  validationResults: AiReviewGenerationValidationResult[],
) {
  return validationResults.every(
    (result) => result.status !== "failed" && result.status !== "blocked",
  );
}

export async function generateAiReview({
  provider,
  input,
}: {
  provider: AiProviderPort;
  input: AiReviewGenerationInput;
}): Promise<AiReviewGenerationResult> {
  const values = parseGenerationInput(input);
  assertSafeGenerationInput(values);

  const messages = buildPromptMessages(values);
  const promptFingerprint = fingerprintPrompt(messages);
  const generatedAt = new Date().toISOString();

  try {
    const providerResult = await provider.generateJson({
      requestId: values.requestId,
      messages,
      schema: generatedOutputSchema,
      schemaName: "AiReviewGeneratedOutput",
      maxTokens: values.maxTokens ?? 2048,
      temperature: values.temperature ?? 0.2,
    });
    const validationResults = validateGeneratedOutput(providerResult.data, values);

    return {
      output: providerResult.data,
      validationResults,
      reviewReady: isReviewReady(validationResults),
      metadata: {
        requestId: values.requestId,
        promptName: values.prompt.name,
        promptVersion: values.prompt.version,
        promptPurpose: values.prompt.purpose,
        inputSchemaVersion: values.prompt.inputSchemaVersion,
        outputSchemaVersion: values.prompt.outputSchemaVersion,
        promptFingerprint,
        provider: providerResult.metadata,
        generatedAt,
      },
    };
  } catch (error) {
    throw mapProviderError(error, values);
  }
}
