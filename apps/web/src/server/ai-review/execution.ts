import "server-only";

import { z } from "zod";

import {
  redactAiProviderMetadata,
  type AiProviderPort,
  type AiProviderTokenUsage,
} from "../ai-provider";
import type { DataAccessContext } from "../db/context";
import {
  generateAiReview,
  isAiReviewGenerationError,
  type AiReviewGenerationErrorCode,
  type AiReviewGenerationInput,
  type AiReviewGenerationValidationResult,
  type AiReviewSectionType,
} from "./generation";
import {
  AiReviewRunError,
  createAiReviewRunRepository,
  type AiReviewRunDetail,
  type AiReviewRunErrorCode,
  type StartAiReviewRunInput,
} from "./repository";

export type AiReviewExecutionErrorCode =
  | AiReviewGenerationErrorCode
  | AiReviewRunErrorCode
  | "MISSING_RUN_SNAPSHOT"
  | "MISSING_PROMPT_VERSION"
  | "MISSING_PROVIDER_POLICY"
  | "RUN_NOT_EXECUTABLE";

export class AiReviewExecutionError extends Error {
  readonly code: AiReviewExecutionErrorCode;
  readonly retryable: boolean;
  readonly requestId?: string;
  readonly details: Record<string, unknown>;

  constructor(
    code: AiReviewExecutionErrorCode,
    message: string,
    options?: {
      cause?: unknown;
      retryable?: boolean;
      requestId?: string;
      details?: Record<string, unknown>;
    },
  ) {
    super(message, { cause: options?.cause });
    this.name = "AiReviewExecutionError";
    this.code = code;
    this.retryable = options?.retryable ?? false;
    this.requestId = options?.requestId;
    this.details = redactAiProviderMetadata(options?.details);
  }
}

export function isAiReviewExecutionError(
  error: unknown,
): error is AiReviewExecutionError {
  return error instanceof AiReviewExecutionError;
}

type AiReviewRunRepository = ReturnType<typeof createAiReviewRunRepository>;
type ProviderPolicy = StartAiReviewRunInput["providerPolicy"];
type ReadyAiReviewRunDetail = AiReviewRunDetail & {
  inputSnapshot: NonNullable<AiReviewRunDetail["inputSnapshot"]>;
  knowledgeSnapshot: NonNullable<AiReviewRunDetail["knowledgeSnapshot"]>;
  promptVersion: NonNullable<AiReviewRunDetail["promptVersion"]>;
};

const providerPolicySchema = z.object({
  provider: z.string().trim().min(1).max(80),
  providerApi: z.string().trim().min(1).max(120),
  model: z.string().trim().min(1).max(160),
  structuredOutputRequired: z.boolean().default(true),
});

const providerFailureCodes = new Set<AiReviewGenerationErrorCode>([
  "PROVIDER_AUTH_FAILED",
  "PROVIDER_QUOTA_EXCEEDED",
  "PROVIDER_RATE_LIMITED",
  "PROVIDER_TIMEOUT",
  "PROVIDER_UNAVAILABLE",
  "MODEL_REFUSAL",
  "PARTIAL_MODEL_OUTPUT",
  "AI_OUTPUT_EMPTY",
  "AI_OUTPUT_MALFORMED",
  "AI_OUTPUT_SCHEMA_MISMATCH",
  "AI_OUTPUT_POLICY_BLOCKED",
]);

export type ExecuteAiReviewRunInput = {
  context: DataAccessContext;
  repository: AiReviewRunRepository;
  provider: AiProviderPort;
  runId: string;
  promptVersionId?: string;
  providerPolicy?: ProviderPolicy;
  requestId?: string;
  maxTokens?: number;
  temperature?: number;
};

export type AiReviewExecutionResult = {
  runId: string;
  status: AiReviewRunDetail["run"]["status"];
  reviewReady: boolean;
  validationStatus: "passed" | "warning" | "failed";
  providerRequestId: string;
  detail: AiReviewRunDetail;
};

function toExecutionError(
  error: unknown,
  fallbackRequestId?: string,
): AiReviewExecutionError {
  if (isAiReviewExecutionError(error)) {
    return error;
  }

  if (isAiReviewGenerationError(error)) {
    return new AiReviewExecutionError(error.code, error.message, {
      cause: error,
      retryable: error.retryable,
      requestId: error.requestId ?? fallbackRequestId,
      details: error.details,
    });
  }

  if (error instanceof AiReviewRunError) {
    return new AiReviewExecutionError(error.code, error.message, {
      cause: error,
      requestId: fallbackRequestId,
      details: error.details,
    });
  }

  return new AiReviewExecutionError(
    "PROVIDER_UNAVAILABLE",
    "AI review execution failed unexpectedly",
    {
      cause: error,
      retryable: true,
      requestId: fallbackRequestId,
    },
  );
}

function parseProviderPolicy(
  value: unknown,
  requestId: string,
): ProviderPolicy {
  const parsed = providerPolicySchema.safeParse(value);

  if (parsed.success) {
    return parsed.data;
  }

  throw new AiReviewExecutionError(
    "MISSING_PROVIDER_POLICY",
    "AI review execution requires provider policy metadata",
    {
      requestId,
      details: {
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
    },
  );
}

function assertExecutableRun(detail: AiReviewRunDetail, requestId: string) {
  const executableStatuses = new Set<AiReviewRunDetail["run"]["status"]>([
    "input_ready",
    "queued",
    "regeneration_requested",
  ]);

  if (!executableStatuses.has(detail.run.status)) {
    throw new AiReviewExecutionError(
      "RUN_NOT_EXECUTABLE",
      `AI review run cannot be executed from ${detail.run.status}`,
      {
        requestId,
        details: {
          runId: detail.run.id,
          status: detail.run.status,
        },
      },
    );
  }
}

function assertExecutionDetailReady(
  detail: AiReviewRunDetail,
  requestId: string,
): asserts detail is ReadyAiReviewRunDetail {
  if (!detail.inputSnapshot || !detail.knowledgeSnapshot) {
    throw new AiReviewExecutionError(
      "MISSING_RUN_SNAPSHOT",
      "AI review execution requires input and knowledge snapshots",
      {
        requestId,
        details: {
          runId: detail.run.id,
        },
      },
    );
  }

  if (!detail.promptVersion) {
    throw new AiReviewExecutionError(
      "MISSING_PROMPT_VERSION",
      "AI review execution requires prompt version metadata",
      {
        requestId,
        details: {
          runId: detail.run.id,
        },
      },
    );
  }
}

function buildGenerationInput({
  detail,
  requestId,
  maxTokens,
  temperature,
}: {
  detail: AiReviewRunDetail;
  requestId: string;
  maxTokens?: number;
  temperature?: number;
}): AiReviewGenerationInput {
  assertExecutionDetailReady(detail, requestId);

  return {
    requestId,
    sessionId: detail.run.sessionId,
    requestedSections: detail.run
      .requestedSections as AiReviewGenerationInput["requestedSections"],
    prompt: {
      name: detail.promptVersion.name,
      version: detail.promptVersion.version,
      purpose: detail.promptVersion.purpose,
      inputSchemaVersion: detail.promptVersion.inputSchemaVersion,
      outputSchemaVersion: detail.promptVersion.outputSchemaVersion,
      modelPolicy: detail.promptVersion.modelPolicy,
    },
    inputSnapshot: {
      sessionStatus: detail.inputSnapshot.sessionStatus,
      title: detail.inputSnapshot.title,
      sessionDate: detail.inputSnapshot.sessionDate,
      platform: detail.inputSnapshot.platform,
      hostRoles: detail.inputSnapshot.hostRoles,
      productOrder: detail.inputSnapshot.productOrder,
      operatorSummary: detail.inputSnapshot.operatorSummary,
      questionSummaries: detail.inputSnapshot.questionSummaries,
      objectionSummaries: detail.inputSnapshot.objectionSummaries,
      noteHighlights: detail.inputSnapshot.noteHighlights,
      redactionState: detail.inputSnapshot.redactionState,
      longInputPolicy: detail.inputSnapshot.longInputPolicy,
    },
    knowledgeSnapshot: {
      knowledgeVersionIds: detail.knowledgeSnapshot.knowledgeVersionIds,
      racketProductVersionIds:
        detail.knowledgeSnapshot.racketProductVersionIds,
      sourceIds: detail.knowledgeSnapshot.sourceIds,
      trustSummary: detail.knowledgeSnapshot.trustSummary,
      conflictState: detail.knowledgeSnapshot.conflictState,
      freshnessState: detail.knowledgeSnapshot.freshnessState,
      reviewState: detail.knowledgeSnapshot.reviewState,
      intendedUse: detail.knowledgeSnapshot.intendedUse,
    },
    maxTokens,
    temperature,
  };
}

function mapAffectedSectionIds(
  detail: AiReviewRunDetail,
  affectedSectionTypes: AiReviewSectionType[],
) {
  if (affectedSectionTypes.length === 0) {
    return [];
  }

  const affectedTypes = new Set(affectedSectionTypes);

  return detail.sections
    .filter((section) => affectedTypes.has(section.sectionType))
    .map((section) => section.id);
}

function validationStatus(
  results: AiReviewGenerationValidationResult[],
): AiReviewExecutionResult["validationStatus"] {
  if (
    results.some(
      (result) => result.status === "failed" || result.status === "blocked",
    )
  ) {
    return "failed";
  }

  if (results.some((result) => result.status === "warning")) {
    return "warning";
  }

  return "passed";
}

async function recordValidationResults({
  context,
  repository,
  runId,
  detail,
  results,
}: {
  context: DataAccessContext;
  repository: AiReviewRunRepository;
  runId: string;
  detail: AiReviewRunDetail;
  results: AiReviewGenerationValidationResult[];
}) {
  for (const result of results) {
    await repository.recordValidationResult(context, {
      runId,
      checkType: result.checkType,
      status: result.status,
      message: result.message,
      affectedSectionIds: mapAffectedSectionIds(
        detail,
        result.affectedSectionTypes,
      ),
      recoverable: result.recoverable,
    });
  }
}

async function recordProviderFailure({
  context,
  repository,
  runId,
  requestId,
  providerPolicy,
  error,
  tokenUsage,
}: {
  context: DataAccessContext;
  repository: AiReviewRunRepository;
  runId: string;
  requestId: string;
  providerPolicy: ProviderPolicy;
  error: AiReviewExecutionError;
  tokenUsage?: AiProviderTokenUsage;
}) {
  await repository.recordProviderInvocation(context, {
    runId,
    provider: providerPolicy.provider,
    providerApi: providerPolicy.providerApi,
    model: providerPolicy.model,
    requestId,
    latencyMs: 0,
    tokenUsage: tokenUsage ?? {},
    errorCode: error.code,
    recoverable: error.retryable,
    redactionState: "redacted",
  });
}

function validationCheckForError(
  code: AiReviewExecutionErrorCode,
): AiReviewGenerationValidationResult["checkType"] {
  switch (code) {
    case "SENSITIVE_DATA_NEEDS_REVIEW":
      return "sensitive_data";
    case "LONG_INPUT_LIMIT_EXCEEDED":
      return "long_input";
    case "STALE_KNOWLEDGE_BLOCKED":
      return "stale_source";
    case "CONFLICTING_KNOWLEDGE_BLOCKED":
      return "fact_conflict";
    case "AI_OUTPUT_SCHEMA_MISMATCH":
    case "AI_OUTPUT_MALFORMED":
    case "AI_OUTPUT_EMPTY":
    case "PARTIAL_MODEL_OUTPUT":
      return "schema";
    case "INSUFFICIENT_EVIDENCE":
      return "source_grounding";
    default:
      return "policy";
  }
}

async function recordValidationFailure({
  context,
  repository,
  runId,
  error,
}: {
  context: DataAccessContext;
  repository: AiReviewRunRepository;
  runId: string;
  error: AiReviewExecutionError;
}) {
  await repository.recordValidationResult(context, {
    runId,
    checkType: validationCheckForError(error.code),
    status: "blocked",
    message: error.message,
    affectedSectionIds: [],
    recoverable: error.retryable,
  });
}

async function prepareExecutableDetail({
  context,
  repository,
  runId,
  promptVersionId,
  providerPolicy,
  requestId,
}: Pick<
  ExecuteAiReviewRunInput,
  "context" | "repository" | "runId" | "promptVersionId" | "providerPolicy"
> & {
  requestId: string;
}) {
  const initialDetail = await repository.getRun(context, { runId });
  assertExecutableRun(initialDetail, requestId);

  if (
    initialDetail.run.status === "input_ready" ||
    initialDetail.run.status === "regeneration_requested"
  ) {
    if (!promptVersionId) {
      throw new AiReviewExecutionError(
        "MISSING_PROMPT_VERSION",
        "AI review execution requires a prompt version to start the run",
        {
          requestId,
          details: {
            runId,
          },
        },
      );
    }

    if (!providerPolicy) {
      throw new AiReviewExecutionError(
        "MISSING_PROVIDER_POLICY",
        "AI review execution requires provider policy to start the run",
        {
          requestId,
          details: {
            runId,
          },
        },
      );
    }

    await repository.startRun(context, {
      runId,
      promptVersionId,
      providerPolicy,
    });
  }

  const executableDetail = await repository.getRun(context, { runId });

  if (executableDetail.run.status !== "queued") {
    throw new AiReviewExecutionError(
      "RUN_NOT_EXECUTABLE",
      "AI review execution requires a queued run after start",
      {
        requestId,
        details: {
          runId,
          status: executableDetail.run.status,
        },
      },
    );
  }

  const effectiveProviderPolicy = parseProviderPolicy(
    executableDetail.run.providerPolicy,
    requestId,
  );

  return {
    detail: executableDetail,
    providerPolicy: effectiveProviderPolicy,
  };
}

export async function executeAiReviewRun(
  input: ExecuteAiReviewRunInput,
): Promise<AiReviewExecutionResult> {
  const requestId = input.requestId ?? input.context.requestId;

  try {
    const { detail, providerPolicy } = await prepareExecutableDetail({
      context: input.context,
      repository: input.repository,
      runId: input.runId,
      promptVersionId: input.promptVersionId,
      providerPolicy: input.providerPolicy,
      requestId,
    });

    try {
      const generation = await generateAiReview({
        provider: input.provider,
        input: buildGenerationInput({
          detail,
          requestId,
          maxTokens: input.maxTokens,
          temperature: input.temperature,
        }),
      });

      await input.repository.recordProviderInvocation(input.context, {
        runId: input.runId,
        provider: generation.metadata.provider.provider,
        providerApi: generation.metadata.provider.providerApi,
        model: generation.metadata.provider.model,
        requestId: generation.metadata.provider.requestId,
        responseId: generation.metadata.provider.responseId,
        latencyMs: generation.metadata.provider.latencyMs,
        tokenUsage: generation.metadata.provider.tokenUsage ?? {},
        finishReason: generation.metadata.provider.finishReason,
        recoverable: generation.metadata.provider.retryable,
        redactionState: detail.inputSnapshot?.redactionState ?? "redacted",
      });

      const output = await input.repository.recordOutput(input.context, {
        runId: input.runId,
        schemaVersion: generation.output.schemaVersion,
        overallConfidence: generation.output.overallConfidence,
        evidenceSummary: generation.output.evidenceSummary,
        sections: generation.output.sections,
      });

      const outputDetail: AiReviewRunDetail = {
        ...detail,
        sections: output.sections,
      };

      await recordValidationResults({
        context: input.context,
        repository: input.repository,
        runId: input.runId,
        detail: outputDetail,
        results: generation.validationResults,
      });

      if (generation.reviewReady) {
        await input.repository.markReviewReady(input.context, {
          runId: input.runId,
        });
      }

      const finalDetail = await input.repository.getRun(input.context, {
        runId: input.runId,
      });

      return {
        runId: input.runId,
        status: finalDetail.run.status,
        reviewReady: finalDetail.run.status === "review_ready",
        validationStatus: validationStatus(generation.validationResults),
        providerRequestId: generation.metadata.provider.requestId,
        detail: finalDetail,
      };
    } catch (error) {
      const executionError = toExecutionError(error, requestId);

      if (providerFailureCodes.has(executionError.code as AiReviewGenerationErrorCode)) {
        await recordProviderFailure({
          context: input.context,
          repository: input.repository,
          runId: input.runId,
          requestId,
          providerPolicy,
          error: executionError,
        });
      } else {
        await recordValidationFailure({
          context: input.context,
          repository: input.repository,
          runId: input.runId,
          error: executionError,
        });
      }

      throw executionError;
    }
  } catch (error) {
    throw toExecutionError(error, requestId);
  }
}
