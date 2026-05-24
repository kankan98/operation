import "server-only";

import { and, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";

import type { DatabaseClient } from "../db/client";
import type { DataAccessContext } from "../db/context";
import { createRecordId } from "../db/repository";
import {
  aiProviderInvocations,
  aiReviewDecisions,
  aiReviewDownstreamArtifacts,
  aiReviewFeedbackSignals,
  aiReviewInputSnapshots,
  aiReviewKnowledgeSnapshots,
  aiReviewOutputs,
  aiReviewPromptVersions,
  aiReviewRuns,
  aiReviewSections,
  aiReviewValidationResults,
  type AiProviderInvocationRecord,
  type AiReviewDecisionRecord,
  type AiReviewDownstreamArtifactRecord,
  type AiReviewFeedbackSignalRecord,
  type AiReviewInputSnapshotRecord,
  type AiReviewKnowledgeSnapshotRecord,
  type AiReviewOutputRecord,
  type AiReviewPromptVersionRecord,
  type AiReviewRunRecord,
  type AiReviewSectionRecord,
  type AiReviewValidationResultRecord,
} from "../db/schema";

export type AiReviewRunRepositoryDatabase = Pick<
  DatabaseClient,
  "insert" | "select" | "update"
>;

export type AiReviewRunErrorCode =
  | "VALIDATION_ERROR"
  | "MISSING_SESSION_SNAPSHOT"
  | "SESSION_NOT_REVIEW_READY"
  | "SENSITIVE_DATA_NEEDS_REVIEW"
  | "LONG_INPUT_LIMIT_EXCEEDED"
  | "KNOWLEDGE_SNAPSHOT_UNAVAILABLE"
  | "STALE_KNOWLEDGE_BLOCKED"
  | "CONFLICTING_KNOWLEDGE_BLOCKED"
  | "INSUFFICIENT_EVIDENCE"
  | "PROMPT_VERSION_INACTIVE"
  | "PROVIDER_UNAVAILABLE"
  | "PROVIDER_TIMEOUT"
  | "PROVIDER_RATE_LIMITED"
  | "MODEL_REFUSAL"
  | "PARTIAL_MODEL_OUTPUT"
  | "AI_OUTPUT_SCHEMA_MISMATCH"
  | "AI_OUTPUT_POLICY_BLOCKED"
  | "REGENERATION_NOT_ALLOWED"
  | "STATE_TRANSITION_INVALID"
  | "FORBIDDEN_PERMISSION"
  | "NOT_FOUND"
  | "REVIEW_REQUIRED"
  | "DATABASE_OPERATION_FAILED";

export class AiReviewRunError extends Error {
  readonly code: AiReviewRunErrorCode;
  readonly details?: Record<string, unknown>;

  constructor(
    code: AiReviewRunErrorCode,
    message: string,
    options?: {
      cause?: unknown;
      details?: Record<string, unknown>;
    },
  ) {
    super(message, { cause: options?.cause });
    this.name = "AiReviewRunError";
    this.code = code;
    this.details = options?.details;
  }
}

const runStatusSchema = z.enum([
  "draft",
  "input_ready",
  "blocked",
  "queued",
  "generating",
  "provider_failed",
  "validating",
  "validation_failed",
  "review_ready",
  "reviewing",
  "accepted",
  "partially_accepted",
  "rejected",
  "regeneration_requested",
  "regenerated",
  "downstream_ready",
  "archived",
]);
const runTypeSchema = z.enum([
  "initial_review",
  "regeneration",
  "section_regeneration",
  "manual_import",
]);
const requestedSectionSchema = z.enum([
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
const promptStatusSchema = z.enum([
  "draft",
  "reviewed",
  "active",
  "deprecated",
]);
const confidenceSchema = z.enum(["high", "medium", "low", "unknown"]);
const sectionTypeSchema = z.enum([
  "live_recap",
  "product_diagnosis",
  "question_cluster",
  "objection_pattern",
  "talk_track_candidate",
  "short_video_topic",
  "next_session_action",
]);
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
const decisionTargetTypeSchema = z.enum(["run", "section", "item"]);
const reviewDecisionSchema = z.enum([
  "accept",
  "edit_accept",
  "reject",
  "request_regeneration",
  "mark_needs_source",
]);
const feedbackSignalSchema = z.enum([
  "accepted",
  "edited",
  "rejected",
  "regenerated",
  "missing_knowledge",
  "wrong_source",
  "evidence_weak",
  "downstream_used",
]);
const prioritySchema = z.enum(["low", "normal", "high", "urgent"]);
const feedbackRouteSchema = z.enum([
  "evaluation_set",
  "knowledge_review",
  "prompt_review",
  "none",
]);
const downstreamArtifactTypeSchema = z.enum([
  "talk_track",
  "short_video_topic",
  "next_session_task",
  "knowledge_gap",
]);
const downstreamStatusSchema = z.enum([
  "draft",
  "reviewing",
  "accepted",
  "archived",
]);

const stringField = (max: number) => z.string().trim().min(1).max(max);
const optionalStringField = (max: number) =>
  z.string().trim().max(max).optional().default("");
const longTextField = (max: number) => z.string().trim().min(1).max(max);
const idListSchema = z.array(z.string().trim().min(1).max(180)).max(64).default([]);
const objectArraySchema = z
  .array(z.record(z.string(), z.unknown()))
  .max(80)
  .default([]);
const metadataSchema = z.record(z.string(), z.unknown()).default({});

const inputSnapshotSchema = z.object({
  sessionStatus: sessionStatusSchema,
  title: stringField(240),
  sessionDate: z.coerce.date(),
  platform: platformSchema,
  hostRoles: objectArraySchema,
  productOrder: objectArraySchema,
  operatorSummary: longTextField(5000),
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

const prepareRunInputSchema = z.object({
  sessionId: stringField(180),
  runType: runTypeSchema.default("initial_review"),
  parentRunId: optionalStringField(180),
  requestedSections: z.array(requestedSectionSchema).min(1).max(7),
  inputSnapshot: inputSnapshotSchema,
  knowledgeSnapshot: knowledgeSnapshotSchema,
});

const promptVersionInputSchema = z.object({
  name: stringField(180),
  version: stringField(80),
  purpose: promptPurposeSchema,
  inputSchemaVersion: stringField(120),
  outputSchemaVersion: stringField(120),
  modelPolicy: longTextField(3000),
  status: promptStatusSchema.default("draft"),
});

const providerPolicySchema = z.object({
  provider: stringField(80),
  providerApi: stringField(120),
  model: stringField(160),
  structuredOutputRequired: z.boolean().default(true),
});

const runIdInputSchema = z.object({
  runId: stringField(180),
});

const startRunInputSchema = runIdInputSchema.extend({
  promptVersionId: stringField(180),
  providerPolicy: providerPolicySchema,
});

const providerInvocationInputSchema = runIdInputSchema.extend({
  provider: stringField(80),
  providerApi: stringField(120),
  model: stringField(160),
  requestId: stringField(180),
  responseId: optionalStringField(180),
  latencyMs: z.number().int().min(0).max(600000).default(0),
  tokenUsage: metadataSchema,
  finishReason: optionalStringField(160),
  errorCode: optionalStringField(120),
  redactionState: redactionStateSchema.default("not_needed"),
  recoverable: z.boolean().default(false),
});

const outputSectionInputSchema = z.object({
  sectionType: sectionTypeSchema,
  title: stringField(240),
  summary: longTextField(5000),
  items: objectArraySchema,
  sourceRefs: idListSchema,
  confidence: confidenceSchema.default("unknown"),
});

const outputInputSchema = runIdInputSchema.extend({
  schemaVersion: stringField(120),
  overallConfidence: confidenceSchema.default("unknown"),
  evidenceSummary: metadataSchema,
  sections: z.array(outputSectionInputSchema).min(1).max(20),
});

const validationResultInputSchema = runIdInputSchema.extend({
  checkType: validationCheckTypeSchema,
  status: validationStatusSchema,
  message: stringField(800),
  affectedSectionIds: idListSchema,
  recoverable: z.boolean().default(false),
});

const decisionInputSchema = runIdInputSchema.extend({
  targetType: decisionTargetTypeSchema,
  targetId: stringField(180),
  decision: reviewDecisionSchema,
  reason: stringField(800),
  editedContent: metadataSchema.optional().default({}),
});

const feedbackInputSchema = runIdInputSchema.extend({
  sectionId: z.string().trim().min(1).max(180).optional(),
  signalType: feedbackSignalSchema,
  reason: stringField(800),
  reviewPriority: prioritySchema.default("normal"),
  routesTo: feedbackRouteSchema.default("none"),
});

const downstreamArtifactInputSchema = runIdInputSchema.extend({
  sectionId: stringField(180),
  artifactType: downstreamArtifactTypeSchema,
  status: downstreamStatusSchema.default("draft"),
});

const listRunInputSchema = z.object({
  status: z.array(runStatusSchema).max(20).optional(),
  limit: z.number().int().min(1).max(100).default(20),
});

export type PrepareAiReviewRunInput = z.input<typeof prepareRunInputSchema>;
export type CreateAiReviewPromptVersionInput = z.input<
  typeof promptVersionInputSchema
>;
export type StartAiReviewRunInput = z.input<typeof startRunInputSchema>;
export type RecordAiProviderInvocationInput = z.input<
  typeof providerInvocationInputSchema
>;
export type RecordAiReviewOutputInput = z.input<typeof outputInputSchema>;
export type RecordAiReviewValidationResultInput = z.input<
  typeof validationResultInputSchema
>;
export type RecordAiReviewDecisionInput = z.input<typeof decisionInputSchema>;
export type RecordAiReviewFeedbackSignalInput = z.input<
  typeof feedbackInputSchema
>;
export type CreateAiReviewDownstreamArtifactInput = z.input<
  typeof downstreamArtifactInputSchema
>;
export type ListAiReviewRunsInput = z.input<typeof listRunInputSchema>;

export type AiReviewOutputWithSections = AiReviewOutputRecord & {
  sections: AiReviewSectionRecord[];
};

export type AiReviewRunDetail = {
  run: AiReviewRunRecord;
  inputSnapshot: AiReviewInputSnapshotRecord | null;
  knowledgeSnapshot: AiReviewKnowledgeSnapshotRecord | null;
  promptVersion: AiReviewPromptVersionRecord | null;
  providerInvocation: AiProviderInvocationRecord | null;
  output: AiReviewOutputRecord | null;
  sections: AiReviewSectionRecord[];
  validationResults: AiReviewValidationResultRecord[];
  decisions: AiReviewDecisionRecord[];
  feedbackSignals: AiReviewFeedbackSignalRecord[];
  downstreamArtifacts: AiReviewDownstreamArtifactRecord[];
};

function parseInput<T>(schema: z.ZodType<T>, input: unknown): T {
  const parsed = schema.safeParse(input);

  if (parsed.success) {
    return parsed.data;
  }

  throw new AiReviewRunError("VALIDATION_ERROR", "AI review input is invalid", {
    details: {
      issues: parsed.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    },
  });
}

function toAiReviewRunError(error: unknown): AiReviewRunError {
  if (error instanceof AiReviewRunError) {
    return error;
  }

  return new AiReviewRunError(
    "DATABASE_OPERATION_FAILED",
    "AI review persistence operation failed",
    {
      cause: error,
    },
  );
}

function assertCanRunAiReview(context: DataAccessContext) {
  if (!context.permissions.includes("run_ai_review")) {
    throw new AiReviewRunError(
      "FORBIDDEN_PERMISSION",
      "Actor cannot manage AI review runs",
      {
        details: {
          requestId: context.requestId,
        },
      },
    );
  }
}

function assertRunTransition(
  run: AiReviewRunRecord,
  allowedFrom: AiReviewRunRecord["status"][],
  nextStatus: AiReviewRunRecord["status"],
) {
  if (!allowedFrom.includes(run.status)) {
    throw new AiReviewRunError(
      "STATE_TRANSITION_INVALID",
      `Cannot move AI review run from ${run.status} to ${nextStatus}`,
      {
        details: {
          runId: run.id,
        },
      },
    );
  }
}

function assertSafeSnapshots(values: z.output<typeof prepareRunInputSchema>) {
  if (
    values.inputSnapshot.sessionStatus !== "review_ready" &&
    values.inputSnapshot.sessionStatus !== "processed"
  ) {
    throw new AiReviewRunError(
      "SESSION_NOT_REVIEW_READY",
      "Session is not ready for AI review",
    );
  }

  if (
    values.inputSnapshot.redactionState === "blocked" ||
    values.inputSnapshot.redactionState === "needs_review"
  ) {
    throw new AiReviewRunError(
      "SENSITIVE_DATA_NEEDS_REVIEW",
      "AI review input contains sensitive data that needs review",
    );
  }

  if (values.inputSnapshot.longInputPolicy === "blocked") {
    throw new AiReviewRunError(
      "LONG_INPUT_LIMIT_EXCEEDED",
      "AI review input exceeds the safe long-input policy",
    );
  }

  if (values.knowledgeSnapshot.freshnessState === "stale_blocked") {
    throw new AiReviewRunError(
      "STALE_KNOWLEDGE_BLOCKED",
      "AI review knowledge snapshot contains blocked stale knowledge",
    );
  }

  if (values.knowledgeSnapshot.conflictState === "blocked") {
    throw new AiReviewRunError(
      "CONFLICTING_KNOWLEDGE_BLOCKED",
      "AI review knowledge snapshot contains blocked conflicts",
    );
  }

  if (
    values.knowledgeSnapshot.reviewState === "insufficient" ||
    values.knowledgeSnapshot.reviewState === "blocked" ||
    values.knowledgeSnapshot.knowledgeVersionIds.length === 0 ||
    values.knowledgeSnapshot.sourceIds.length === 0
  ) {
    throw new AiReviewRunError(
      "INSUFFICIENT_EVIDENCE",
      "AI review knowledge snapshot has insufficient reviewed evidence",
    );
  }
}

function mapDecisionToReviewState(
  decision: RecordAiReviewDecisionInput["decision"],
): AiReviewSectionRecord["reviewState"] {
  if (decision === "accept") {
    return "accepted";
  }

  if (decision === "edit_accept") {
    return "edited";
  }

  if (decision === "request_regeneration") {
    return "regenerate_requested";
  }

  return "rejected";
}

function providerErrorToRunStatus(
  errorCode: string,
): AiReviewRunRecord["status"] {
  if (errorCode === "") {
    return "validating";
  }

  if (
    errorCode === "AI_OUTPUT_SCHEMA_MISMATCH" ||
    errorCode === "PARTIAL_MODEL_OUTPUT" ||
    errorCode === "AI_OUTPUT_POLICY_BLOCKED"
  ) {
    return "validation_failed";
  }

  return "provider_failed";
}

export function createAiReviewRunRepository(
  database: AiReviewRunRepositoryDatabase,
) {
  async function getScopedRun(
    context: DataAccessContext,
    runId: string,
  ): Promise<AiReviewRunRecord> {
    const [run] = await database
      .select()
      .from(aiReviewRuns)
      .where(
        and(
          eq(aiReviewRuns.tenantId, context.tenantId),
          eq(aiReviewRuns.teamId, context.teamId),
          eq(aiReviewRuns.id, runId),
        ),
      )
      .limit(1);

    if (!run) {
      throw new AiReviewRunError("NOT_FOUND", "AI review run was not found");
    }

    return run;
  }

  async function getScopedSection(
    context: DataAccessContext,
    sectionId: string,
  ): Promise<AiReviewSectionRecord> {
    const [section] = await database
      .select()
      .from(aiReviewSections)
      .where(
        and(
          eq(aiReviewSections.tenantId, context.tenantId),
          eq(aiReviewSections.teamId, context.teamId),
          eq(aiReviewSections.id, sectionId),
        ),
      )
      .limit(1);

    if (!section) {
      throw new AiReviewRunError(
        "NOT_FOUND",
        "AI review section was not found",
      );
    }

    return section;
  }

  async function updateRunReviewStatus(
    context: DataAccessContext,
    runId: string,
  ): Promise<AiReviewRunRecord> {
    const sections = await database
      .select()
      .from(aiReviewSections)
      .where(
        and(
          eq(aiReviewSections.tenantId, context.tenantId),
          eq(aiReviewSections.teamId, context.teamId),
          eq(aiReviewSections.runId, runId),
        ),
      );

    const hasAccepted = sections.some(
      (section) =>
        section.reviewState === "accepted" || section.reviewState === "edited",
    );
    const hasPending = sections.some(
      (section) =>
        section.reviewState === "pending" ||
        section.reviewState === "regenerate_requested",
    );
    const hasRejected = sections.some((section) => section.reviewState === "rejected");
    const nextStatus: AiReviewRunRecord["status"] = hasPending
      ? hasAccepted
        ? "partially_accepted"
        : "reviewing"
      : hasAccepted && hasRejected
        ? "partially_accepted"
        : hasAccepted
          ? "accepted"
          : "rejected";

    const [updatedRun] = await database
      .update(aiReviewRuns)
      .set({
        status: nextStatus,
        updatedBy: context.actorId,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(aiReviewRuns.tenantId, context.tenantId),
          eq(aiReviewRuns.teamId, context.teamId),
          eq(aiReviewRuns.id, runId),
        ),
      )
      .returning();

    return updatedRun;
  }

  return {
    async createPromptVersion(
      context: DataAccessContext,
      input: CreateAiReviewPromptVersionInput,
    ): Promise<AiReviewPromptVersionRecord> {
      try {
        assertCanRunAiReview(context);
        const values = parseInput(promptVersionInputSchema, input);
        const now = new Date();
        const reviewed = values.status === "active" || values.status === "reviewed";
        const [promptVersion] = await database
          .insert(aiReviewPromptVersions)
          .values({
            id: createRecordId("airprompt"),
            tenantId: context.tenantId,
            teamId: context.teamId,
            name: values.name,
            version: values.version,
            purpose: values.purpose,
            inputSchemaVersion: values.inputSchemaVersion,
            outputSchemaVersion: values.outputSchemaVersion,
            modelPolicy: values.modelPolicy,
            status: values.status,
            reviewedBy: reviewed ? context.actorId : null,
            reviewedAt: reviewed ? now : null,
            createdBy: context.actorId,
            updatedBy: context.actorId,
          })
          .returning();

        return promptVersion;
      } catch (error) {
        throw toAiReviewRunError(error);
      }
    },

    async prepareRun(
      context: DataAccessContext,
      input: PrepareAiReviewRunInput,
    ): Promise<AiReviewRunRecord> {
      try {
        assertCanRunAiReview(context);
        const values = parseInput(prepareRunInputSchema, input);
        assertSafeSnapshots(values);

        const [inputSnapshot] = await database
          .insert(aiReviewInputSnapshots)
          .values({
            id: createRecordId("airinput"),
            tenantId: context.tenantId,
            teamId: context.teamId,
            sessionId: values.sessionId,
            sessionStatus: values.inputSnapshot.sessionStatus,
            title: values.inputSnapshot.title,
            sessionDate: values.inputSnapshot.sessionDate,
            platform: values.inputSnapshot.platform,
            hostRoles: values.inputSnapshot.hostRoles,
            productOrder: values.inputSnapshot.productOrder,
            operatorSummary: values.inputSnapshot.operatorSummary,
            questionSummaries: values.inputSnapshot.questionSummaries,
            objectionSummaries: values.inputSnapshot.objectionSummaries,
            noteHighlights: values.inputSnapshot.noteHighlights,
            redactionState: values.inputSnapshot.redactionState,
            longInputPolicy: values.inputSnapshot.longInputPolicy,
            createdBy: context.actorId,
          })
          .returning();

        const [knowledgeSnapshot] = await database
          .insert(aiReviewKnowledgeSnapshots)
          .values({
            id: createRecordId("airknowledge"),
            tenantId: context.tenantId,
            teamId: context.teamId,
            knowledgeVersionIds: values.knowledgeSnapshot.knowledgeVersionIds,
            racketProductVersionIds:
              values.knowledgeSnapshot.racketProductVersionIds,
            sourceIds: values.knowledgeSnapshot.sourceIds,
            trustSummary: values.knowledgeSnapshot.trustSummary,
            conflictState: values.knowledgeSnapshot.conflictState,
            freshnessState: values.knowledgeSnapshot.freshnessState,
            reviewState: values.knowledgeSnapshot.reviewState,
            intendedUse: values.knowledgeSnapshot.intendedUse,
            createdBy: context.actorId,
          })
          .returning();

        const [run] = await database
          .insert(aiReviewRuns)
          .values({
            id: createRecordId("airun"),
            tenantId: context.tenantId,
            teamId: context.teamId,
            sessionId: values.sessionId,
            status: "input_ready",
            runType: values.runType,
            parentRunId: values.parentRunId,
            inputSnapshotId: inputSnapshot.id,
            knowledgeSnapshotId: knowledgeSnapshot.id,
            requestedSections: values.requestedSections,
            createdBy: context.actorId,
            updatedBy: context.actorId,
          })
          .returning();

        return run;
      } catch (error) {
        throw toAiReviewRunError(error);
      }
    },

    async startRun(
      context: DataAccessContext,
      input: StartAiReviewRunInput,
    ): Promise<AiReviewRunRecord> {
      try {
        assertCanRunAiReview(context);
        const values = parseInput(startRunInputSchema, input);
        const run = await getScopedRun(context, values.runId);
        assertRunTransition(run, ["input_ready", "regeneration_requested"], "queued");

        const [promptVersion] = await database
          .select()
          .from(aiReviewPromptVersions)
          .where(
            and(
              eq(aiReviewPromptVersions.tenantId, context.tenantId),
              eq(aiReviewPromptVersions.teamId, context.teamId),
              eq(aiReviewPromptVersions.id, values.promptVersionId),
            ),
          )
          .limit(1);

        if (!promptVersion) {
          throw new AiReviewRunError(
            "NOT_FOUND",
            "AI review prompt version was not found",
          );
        }

        if (
          promptVersion.status !== "active" &&
          promptVersion.status !== "reviewed"
        ) {
          throw new AiReviewRunError(
            "PROMPT_VERSION_INACTIVE",
            "AI review prompt version is not active or reviewed",
          );
        }

        const [updatedRun] = await database
          .update(aiReviewRuns)
          .set({
            status: "queued",
            promptVersionId: promptVersion.id,
            providerPolicy: values.providerPolicy,
            updatedBy: context.actorId,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(aiReviewRuns.tenantId, context.tenantId),
              eq(aiReviewRuns.teamId, context.teamId),
              eq(aiReviewRuns.id, values.runId),
            ),
          )
          .returning();

        return updatedRun;
      } catch (error) {
        throw toAiReviewRunError(error);
      }
    },

    async recordProviderInvocation(
      context: DataAccessContext,
      input: RecordAiProviderInvocationInput,
    ): Promise<AiProviderInvocationRecord> {
      try {
        assertCanRunAiReview(context);
        const values = parseInput(providerInvocationInputSchema, input);

        if (values.redactionState === "blocked") {
          throw new AiReviewRunError(
            "SENSITIVE_DATA_NEEDS_REVIEW",
            "Provider invocation metadata indicates blocked redaction state",
          );
        }

        const run = await getScopedRun(context, values.runId);
        assertRunTransition(run, ["queued", "generating"], "validating");

        const now = new Date();
        const [invocation] = await database
          .insert(aiProviderInvocations)
          .values({
            id: createRecordId("airprovider"),
            tenantId: context.tenantId,
            teamId: context.teamId,
            runId: values.runId,
            provider: values.provider,
            providerApi: values.providerApi,
            model: values.model,
            requestId: values.requestId,
            responseId: values.responseId,
            startedAt: now,
            finishedAt: now,
            latencyMs: values.latencyMs,
            tokenUsage: values.tokenUsage,
            finishReason: values.finishReason,
            errorCode: values.errorCode,
            redactionState: values.redactionState,
            recoverable: values.recoverable,
          })
          .returning();

        await database
          .update(aiReviewRuns)
          .set({
            status: providerErrorToRunStatus(values.errorCode),
            providerInvocationId: invocation.id,
            updatedBy: context.actorId,
            updatedAt: now,
          })
          .where(
            and(
              eq(aiReviewRuns.tenantId, context.tenantId),
              eq(aiReviewRuns.teamId, context.teamId),
              eq(aiReviewRuns.id, values.runId),
            ),
          );

        return invocation;
      } catch (error) {
        throw toAiReviewRunError(error);
      }
    },

    async recordOutput(
      context: DataAccessContext,
      input: RecordAiReviewOutputInput,
    ): Promise<AiReviewOutputWithSections> {
      try {
        assertCanRunAiReview(context);
        const values = parseInput(outputInputSchema, input);
        const run = await getScopedRun(context, values.runId);
        assertRunTransition(run, ["validating"], "validating");

        const [output] = await database
          .insert(aiReviewOutputs)
          .values({
            id: createRecordId("airoutput"),
            tenantId: context.tenantId,
            teamId: context.teamId,
            runId: values.runId,
            schemaVersion: values.schemaVersion,
            overallConfidence: values.overallConfidence,
            evidenceSummary: values.evidenceSummary,
            createdBy: context.actorId,
          })
          .returning();

        const sections = await database
          .insert(aiReviewSections)
          .values(
            values.sections.map((section, index) => ({
              id: createRecordId("airsection"),
              tenantId: context.tenantId,
              teamId: context.teamId,
              outputId: output.id,
              runId: values.runId,
              sectionType: section.sectionType,
              title: section.title,
              summary: section.summary,
              items: section.items,
              sourceRefs: section.sourceRefs,
              confidence: section.confidence,
              reviewState: "pending" as const,
              position: index + 1,
            })),
          )
          .returning();

        return {
          ...output,
          sections,
        };
      } catch (error) {
        throw toAiReviewRunError(error);
      }
    },

    async recordValidationResult(
      context: DataAccessContext,
      input: RecordAiReviewValidationResultInput,
    ): Promise<AiReviewValidationResultRecord> {
      try {
        assertCanRunAiReview(context);
        const values = parseInput(validationResultInputSchema, input);
        await getScopedRun(context, values.runId);

        const [result] = await database
          .insert(aiReviewValidationResults)
          .values({
            id: createRecordId("airvalidation"),
            tenantId: context.tenantId,
            teamId: context.teamId,
            runId: values.runId,
            checkType: values.checkType,
            status: values.status,
            message: values.message,
            affectedSectionIds: values.affectedSectionIds,
            recoverable: values.recoverable,
            createdBy: context.actorId,
          })
          .returning();

        if (values.status === "failed" || values.status === "blocked") {
          await database
            .update(aiReviewRuns)
            .set({
              status: "validation_failed",
              updatedBy: context.actorId,
              updatedAt: new Date(),
            })
            .where(
              and(
                eq(aiReviewRuns.tenantId, context.tenantId),
                eq(aiReviewRuns.teamId, context.teamId),
                eq(aiReviewRuns.id, values.runId),
              ),
            );
        }

        return result;
      } catch (error) {
        throw toAiReviewRunError(error);
      }
    },

    async markReviewReady(
      context: DataAccessContext,
      input: { runId: string },
    ): Promise<AiReviewRunRecord> {
      try {
        assertCanRunAiReview(context);
        const values = parseInput(runIdInputSchema, input);
        const run = await getScopedRun(context, values.runId);
        assertRunTransition(run, ["validating"], "review_ready");

        const [output] = await database
          .select()
          .from(aiReviewOutputs)
          .where(
            and(
              eq(aiReviewOutputs.tenantId, context.tenantId),
              eq(aiReviewOutputs.teamId, context.teamId),
              eq(aiReviewOutputs.runId, values.runId),
            ),
          )
          .limit(1);

        if (!output) {
          throw new AiReviewRunError(
            "AI_OUTPUT_SCHEMA_MISMATCH",
            "AI review output is missing",
          );
        }

        const validationResults = await database
          .select()
          .from(aiReviewValidationResults)
          .where(
            and(
              eq(aiReviewValidationResults.tenantId, context.tenantId),
              eq(aiReviewValidationResults.teamId, context.teamId),
              eq(aiReviewValidationResults.runId, values.runId),
            ),
          );

        if (validationResults.length === 0) {
          throw new AiReviewRunError(
            "AI_OUTPUT_SCHEMA_MISMATCH",
            "AI review output has no validation results",
          );
        }

        const failedResults = validationResults.filter(
          (result) => result.status === "failed" || result.status === "blocked",
        );

        if (failedResults.length > 0) {
          throw new AiReviewRunError(
            "AI_OUTPUT_SCHEMA_MISMATCH",
            "AI review output has blocking validation results",
          );
        }

        const [updatedRun] = await database
          .update(aiReviewRuns)
          .set({
            status: "review_ready",
            updatedBy: context.actorId,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(aiReviewRuns.tenantId, context.tenantId),
              eq(aiReviewRuns.teamId, context.teamId),
              eq(aiReviewRuns.id, values.runId),
            ),
          )
          .returning();

        return updatedRun;
      } catch (error) {
        throw toAiReviewRunError(error);
      }
    },

    async recordDecision(
      context: DataAccessContext,
      input: RecordAiReviewDecisionInput,
    ): Promise<AiReviewDecisionRecord> {
      try {
        assertCanRunAiReview(context);
        const values = parseInput(decisionInputSchema, input);
        const run = await getScopedRun(context, values.runId);
        assertRunTransition(
          run,
          ["review_ready", "reviewing", "accepted", "partially_accepted"],
          "reviewing",
        );

        const [decision] = await database
          .insert(aiReviewDecisions)
          .values({
            id: createRecordId("airdecision"),
            tenantId: context.tenantId,
            teamId: context.teamId,
            runId: values.runId,
            targetType: values.targetType,
            targetId: values.targetId,
            decision: values.decision,
            reason: values.reason,
            editedContent: values.editedContent,
            reviewedBy: context.actorId,
            requestId: context.requestId,
          })
          .returning();

        if (values.targetType === "section") {
          const section = await getScopedSection(context, values.targetId);

          if (section.runId !== values.runId) {
            throw new AiReviewRunError(
              "NOT_FOUND",
              "AI review section does not belong to the run",
            );
          }

          await database
            .update(aiReviewSections)
            .set({
              reviewState: mapDecisionToReviewState(values.decision),
              updatedAt: new Date(),
            })
            .where(
              and(
                eq(aiReviewSections.tenantId, context.tenantId),
                eq(aiReviewSections.teamId, context.teamId),
                eq(aiReviewSections.id, values.targetId),
              ),
            );

          await updateRunReviewStatus(context, values.runId);
        }

        return decision;
      } catch (error) {
        throw toAiReviewRunError(error);
      }
    },

    async recordFeedbackSignal(
      context: DataAccessContext,
      input: RecordAiReviewFeedbackSignalInput,
    ): Promise<AiReviewFeedbackSignalRecord> {
      try {
        assertCanRunAiReview(context);
        const values = parseInput(feedbackInputSchema, input);
        await getScopedRun(context, values.runId);

        if (values.sectionId) {
          const section = await getScopedSection(context, values.sectionId);

          if (section.runId !== values.runId) {
            throw new AiReviewRunError(
              "NOT_FOUND",
              "AI review section does not belong to the run",
            );
          }
        }

        const [signal] = await database
          .insert(aiReviewFeedbackSignals)
          .values({
            id: createRecordId("airfeedback"),
            tenantId: context.tenantId,
            teamId: context.teamId,
            runId: values.runId,
            sectionId: values.sectionId,
            signalType: values.signalType,
            reason: values.reason,
            reviewPriority: values.reviewPriority,
            routesTo: values.routesTo,
            actorId: context.actorId,
          })
          .returning();

        return signal;
      } catch (error) {
        throw toAiReviewRunError(error);
      }
    },

    async createDownstreamArtifact(
      context: DataAccessContext,
      input: CreateAiReviewDownstreamArtifactInput,
    ): Promise<AiReviewDownstreamArtifactRecord> {
      try {
        assertCanRunAiReview(context);
        const values = parseInput(downstreamArtifactInputSchema, input);
        const run = await getScopedRun(context, values.runId);

        if (
          run.status !== "accepted" &&
          run.status !== "partially_accepted" &&
          run.status !== "downstream_ready"
        ) {
          throw new AiReviewRunError(
            "STATE_TRANSITION_INVALID",
            "AI review run is not ready for downstream artifact creation",
          );
        }

        const section = await getScopedSection(context, values.sectionId);

        if (section.runId !== values.runId) {
          throw new AiReviewRunError(
            "NOT_FOUND",
            "AI review section does not belong to the run",
          );
        }

        if (
          section.reviewState !== "accepted" &&
          section.reviewState !== "edited"
        ) {
          throw new AiReviewRunError(
            "REVIEW_REQUIRED",
            "AI review section must be accepted before downstream reuse",
          );
        }

        const [artifact] = await database
          .insert(aiReviewDownstreamArtifacts)
          .values({
            id: createRecordId("airartifact"),
            tenantId: context.tenantId,
            teamId: context.teamId,
            runId: values.runId,
            sectionId: values.sectionId,
            artifactType: values.artifactType,
            status: values.status,
            createdBy: context.actorId,
          })
          .returning();

        await database
          .update(aiReviewRuns)
          .set({
            status: "downstream_ready",
            updatedBy: context.actorId,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(aiReviewRuns.tenantId, context.tenantId),
              eq(aiReviewRuns.teamId, context.teamId),
              eq(aiReviewRuns.id, values.runId),
            ),
          );

        return artifact;
      } catch (error) {
        throw toAiReviewRunError(error);
      }
    },

    async archiveRun(
      context: DataAccessContext,
      input: { runId: string },
    ): Promise<AiReviewRunRecord> {
      try {
        assertCanRunAiReview(context);
        const values = parseInput(runIdInputSchema, input);
        await getScopedRun(context, values.runId);
        const [run] = await database
          .update(aiReviewRuns)
          .set({
            status: "archived",
            archivedBy: context.actorId,
            archivedAt: new Date(),
            updatedBy: context.actorId,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(aiReviewRuns.tenantId, context.tenantId),
              eq(aiReviewRuns.teamId, context.teamId),
              eq(aiReviewRuns.id, values.runId),
            ),
          )
          .returning();

        return run;
      } catch (error) {
        throw toAiReviewRunError(error);
      }
    },

    async getRun(
      context: DataAccessContext,
      input: { runId: string },
    ): Promise<AiReviewRunDetail> {
      try {
        const values = parseInput(runIdInputSchema, input);
        const run = await getScopedRun(context, values.runId);
        const [inputSnapshot] = await database
          .select()
          .from(aiReviewInputSnapshots)
          .where(eq(aiReviewInputSnapshots.id, run.inputSnapshotId))
          .limit(1);
        const [knowledgeSnapshot] = await database
          .select()
          .from(aiReviewKnowledgeSnapshots)
          .where(eq(aiReviewKnowledgeSnapshots.id, run.knowledgeSnapshotId))
          .limit(1);
        const [promptVersion] = run.promptVersionId
          ? await database
              .select()
              .from(aiReviewPromptVersions)
              .where(eq(aiReviewPromptVersions.id, run.promptVersionId))
              .limit(1)
          : [null];
        const [providerInvocation] = run.providerInvocationId
          ? await database
              .select()
              .from(aiProviderInvocations)
              .where(eq(aiProviderInvocations.id, run.providerInvocationId))
              .limit(1)
          : [null];
        const [output] = await database
          .select()
          .from(aiReviewOutputs)
          .where(
            and(
              eq(aiReviewOutputs.tenantId, context.tenantId),
              eq(aiReviewOutputs.teamId, context.teamId),
              eq(aiReviewOutputs.runId, run.id),
            ),
          )
          .limit(1);
        const sections = await database
          .select()
          .from(aiReviewSections)
          .where(
            and(
              eq(aiReviewSections.tenantId, context.tenantId),
              eq(aiReviewSections.teamId, context.teamId),
              eq(aiReviewSections.runId, run.id),
            ),
          );
        const validationResults = await database
          .select()
          .from(aiReviewValidationResults)
          .where(
            and(
              eq(aiReviewValidationResults.tenantId, context.tenantId),
              eq(aiReviewValidationResults.teamId, context.teamId),
              eq(aiReviewValidationResults.runId, run.id),
            ),
          );
        const decisions = await database
          .select()
          .from(aiReviewDecisions)
          .where(
            and(
              eq(aiReviewDecisions.tenantId, context.tenantId),
              eq(aiReviewDecisions.teamId, context.teamId),
              eq(aiReviewDecisions.runId, run.id),
            ),
          );
        const feedbackSignals = await database
          .select()
          .from(aiReviewFeedbackSignals)
          .where(
            and(
              eq(aiReviewFeedbackSignals.tenantId, context.tenantId),
              eq(aiReviewFeedbackSignals.teamId, context.teamId),
              eq(aiReviewFeedbackSignals.runId, run.id),
            ),
          );
        const downstreamArtifacts = await database
          .select()
          .from(aiReviewDownstreamArtifacts)
          .where(
            and(
              eq(aiReviewDownstreamArtifacts.tenantId, context.tenantId),
              eq(aiReviewDownstreamArtifacts.teamId, context.teamId),
              eq(aiReviewDownstreamArtifacts.runId, run.id),
            ),
          );

        return {
          run,
          inputSnapshot: inputSnapshot ?? null,
          knowledgeSnapshot: knowledgeSnapshot ?? null,
          promptVersion: promptVersion ?? null,
          providerInvocation: providerInvocation ?? null,
          output: output ?? null,
          sections,
          validationResults,
          decisions,
          feedbackSignals,
          downstreamArtifacts,
        };
      } catch (error) {
        throw toAiReviewRunError(error);
      }
    },

    async listRuns(
      context: DataAccessContext,
      input: ListAiReviewRunsInput = {},
    ): Promise<{ items: AiReviewRunRecord[] }> {
      try {
        const values = parseInput(listRunInputSchema, input);
        const filters = [
          eq(aiReviewRuns.tenantId, context.tenantId),
          eq(aiReviewRuns.teamId, context.teamId),
        ];

        if (values.status && values.status.length > 0) {
          filters.push(inArray(aiReviewRuns.status, values.status));
        }

        const items = await database
          .select()
          .from(aiReviewRuns)
          .where(and(...filters))
          .orderBy(desc(aiReviewRuns.createdAt))
          .limit(values.limit);

        return { items };
      } catch (error) {
        throw toAiReviewRunError(error);
      }
    },
  };
}
