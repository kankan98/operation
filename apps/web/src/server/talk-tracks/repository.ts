import "server-only";

import { createHash } from "node:crypto";

import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";

import type { DatabaseClient } from "../db/client";
import type { DataAccessContext } from "../db/context";
import { createRecordId } from "../db/repository";
import {
  talkTrackAssets,
  talkTrackCandidates,
  talkTrackObjectionPatterns,
  talkTrackReviewDecisions,
  talkTrackScenarios,
  talkTrackSegments,
  talkTrackSourceGroundings,
  talkTrackUsageSignals,
  talkTrackVersions,
  type TalkTrackAssetRecord,
  type TalkTrackCandidateRecord,
  type TalkTrackObjectionPatternRecord,
  type TalkTrackReviewDecisionRecord,
  type TalkTrackScenarioRecord,
  type TalkTrackSegmentRecord,
  type TalkTrackSourceGroundingRecord,
  type TalkTrackVersionRecord,
} from "../db/schema";

export type TalkTrackAssetRepositoryDatabase = Pick<
  DatabaseClient,
  "insert" | "select" | "update"
>;

export type TalkTrackAssetErrorCode =
  | "VALIDATION_ERROR"
  | "LONG_INPUT_LIMIT_EXCEEDED"
  | "FORBIDDEN_PERMISSION"
  | "SOURCE_REQUIRED"
  | "SOURCE_STALE"
  | "SOURCE_CONFLICT"
  | "AI_CANDIDATE_NOT_REVIEWED"
  | "DUPLICATE_SCENARIO"
  | "UNSAFE_CLAIM"
  | "SENSITIVE_DATA_BLOCKED"
  | "VERSION_CONFLICT"
  | "REVIEW_REQUIRED"
  | "NOT_FOUND"
  | "STATE_TRANSITION_INVALID"
  | "DATABASE_OPERATION_FAILED";

export class TalkTrackAssetError extends Error {
  readonly code: TalkTrackAssetErrorCode;
  readonly details?: Record<string, unknown>;

  constructor(
    code: TalkTrackAssetErrorCode,
    message: string,
    options?: {
      cause?: unknown;
      details?: Record<string, unknown>;
    },
  ) {
    super(message, { cause: options?.cause });
    this.name = "TalkTrackAssetError";
    this.code = code;
    this.details = options?.details;
  }
}

const assetTypeSchema = z.enum([
  "product_intro",
  "feature_benefit",
  "comparison",
  "objection_reply",
  "closing_prompt",
  "short_video_hook",
  "transition",
  "qa_reply",
]);
const statusSchema = z.enum([
  "draft",
  "reviewing",
  "published",
  "deprecated",
  "archived",
  "rejected",
]);
const ownerRoleSchema = z.enum([
  "operator",
  "host",
  "product_owner",
  "reviewer",
  "admin",
]);
const toneSchema = z.enum([
  "professional",
  "friendly",
  "urgent",
  "educational",
  "comparison",
]);
const languageSchema = z.enum(["zh_CN", "mixed_zh_en"]);
const playerLevelSchema = z.enum([
  "beginner",
  "intermediate",
  "advanced",
  "professional",
  "unknown",
]);
const playStyleSchema = z.enum([
  "control",
  "attack",
  "defense",
  "doubles",
  "singles",
  "all_round",
  "unknown",
]);
const priceBandSchema = z.enum(["entry", "mid", "premium", "unknown"]);
const liveSceneSchema = z.enum([
  "opening",
  "product_demo",
  "comparison",
  "objection_handling",
  "closing",
  "short_video",
  "qa",
]);
const hostRoleSchema = z.enum(["host", "assistant", "operator"]);
const segmentTypeSchema = z.enum([
  "hook",
  "product_fact",
  "benefit",
  "demo_step",
  "comparison_point",
  "objection_reply",
  "cta",
  "transition",
]);
const objectionTypeSchema = z.enum([
  "price",
  "beginner_fit",
  "durability",
  "weight",
  "stiffness",
  "string_tension",
  "authenticity",
  "comparison",
  "after_sales",
]);
const replyStrategySchema = z.enum([
  "clarify_need",
  "compare_options",
  "explain_tradeoff",
  "recommend_alternative",
  "defer_to_review",
]);
const riskLevelSchema = z.enum(["low", "medium", "high"]);
const sourceTypeSchema = z.enum([
  "racket_product_version",
  "knowledge_version",
  "session_example",
  "ai_review_run",
  "team_experience",
]);
const freshnessStateSchema = z.enum([
  "current",
  "stale_warning",
  "stale_blocked",
  "unknown",
]);
const conflictStateSchema = z.enum(["none", "needs_review", "blocked"]);
const reviewDecisionSchema = z.enum([
  "approve",
  "approve_with_edits",
  "reject",
  "request_changes",
  "deprecate",
]);
const candidateSourceSchema = z.enum([
  "ai_review",
  "session_capture",
  "manual",
  "qa_feedback",
]);
const validationStateSchema = z.enum([
  "unchecked",
  "passed",
  "warning",
  "blocked",
]);
const candidateReviewStateSchema = z.enum([
  "pending",
  "accepted",
  "edited",
  "rejected",
  "published",
  "archived",
]);
const usageWorkflowSchema = z.enum([
  "live_session",
  "ai_review",
  "qa_answer",
  "short_video",
  "manual",
]);
const usageSignalSchema = z.enum([
  "used",
  "edited_before_use",
  "rejected_in_use",
  "reported_wrong",
  "needs_update",
]);
const redactionStateSchema = z.enum([
  "not_needed",
  "redacted",
  "needs_review",
  "blocked",
]);

const stringField = (max: number) => z.string().trim().min(1).max(max);
const optionalStringField = (max: number) =>
  z.string().trim().max(max).optional().default("");
const longTextField = (max: number) => z.string().trim().min(1).max(max);
const optionalLongTextField = (max: number) =>
  z.string().trim().max(max).optional().default("");
const optionalIdField = z.string().trim().min(1).max(180).optional();
const idListSchema = z.array(z.string().trim().min(1).max(180)).max(32).default([]);
const boundedStringList = z
  .array(z.string().trim().min(1).max(240))
  .max(32)
  .default([]);

const scenarioInputSchema = z.object({
  racketProductIds: idListSchema,
  playerLevel: playerLevelSchema.default("unknown"),
  playStyle: playStyleSchema.default("unknown"),
  priceBand: priceBandSchema.default("unknown"),
  liveScene: liveSceneSchema,
  hostRole: hostRoleSchema.default("host"),
  objectionType: objectionTypeSchema.optional(),
  usageConstraints: boundedStringList,
});

const segmentInputSchema = z.object({
  segmentType: segmentTypeSchema,
  text: longTextField(3000),
  requiredEvidence: z.boolean().default(false),
});

const sourceGroundingInputSchema = z.object({
  sourceType: sourceTypeSchema,
  sourceIds: idListSchema,
  knowledgeVersionIds: idListSchema,
  racketProductIds: idListSchema,
  aiRunId: optionalStringField(180),
  freshnessState: freshnessStateSchema.default("unknown"),
  conflictState: conflictStateSchema.default("none"),
  sensitiveRedactionState: redactionStateSchema.default("not_needed"),
  claimSummary: longTextField(2000),
});

const objectionPatternInputSchema = z.object({
  objectionType: objectionTypeSchema,
  customerQuestionExample: optionalLongTextField(2000),
  replyStrategy: replyStrategySchema,
  riskLevel: riskLevelSchema.default("medium"),
});

const createAssetInputSchema = z.object({
  asset: z.object({
    assetType: assetTypeSchema,
    title: stringField(240),
    ownerRole: ownerRoleSchema,
  }),
  version: z.object({
    body: longTextField(12000),
    tone: toneSchema.default("professional"),
    language: languageSchema.default("zh_CN"),
    candidateId: optionalIdField,
  }),
  scenario: scenarioInputSchema,
  segments: z.array(segmentInputSchema).min(1).max(80),
  sourceGrounding: sourceGroundingInputSchema.optional(),
  objectionPattern: objectionPatternInputSchema.optional(),
});

const candidateInputSchema = z.object({
  candidateSource: candidateSourceSchema,
  aiRunId: optionalStringField(180),
  aiSectionId: optionalStringField(180),
  promptVersion: optionalStringField(180),
  sourceIds: idListSchema,
  knowledgeVersionIds: idListSchema,
  racketProductVersionIds: idListSchema,
  scenario: scenarioInputSchema.optional(),
  proposedBody: longTextField(12000),
  validationState: validationStateSchema.default("unchecked"),
  reviewState: candidateReviewStateSchema.default("pending"),
  sensitiveRedactionState: redactionStateSchema.default("not_needed"),
});

const assetIdInputSchema = z.object({
  assetId: stringField(180),
});

const versionIdInputSchema = assetIdInputSchema.extend({
  versionId: stringField(180).optional(),
});

const listAssetInputSchema = z.object({
  status: z.array(statusSchema).max(8).optional(),
  assetType: assetTypeSchema.optional(),
  limit: z.number().int().min(1).max(100).default(20),
});

const candidateReviewInputSchema = z.object({
  candidateId: stringField(180),
  reviewState: z.enum(["accepted", "edited", "rejected"]),
  editedBody: optionalLongTextField(12000),
});

const reviewDecisionInputSchema = versionIdInputSchema.extend({
  decision: reviewDecisionSchema,
  reason: stringField(600),
  editedBody: optionalLongTextField(12000),
});

const usageSignalInputSchema = versionIdInputSchema.extend({
  sourceWorkflow: usageWorkflowSchema,
  signalType: usageSignalSchema,
  reason: stringField(600),
});

export type CreateTalkTrackAssetInput = z.input<typeof createAssetInputSchema>;
export type CreateTalkTrackCandidateInput = z.input<typeof candidateInputSchema>;
export type GetTalkTrackAssetInput = z.input<typeof assetIdInputSchema>;
export type ListTalkTrackAssetsInput = z.input<typeof listAssetInputSchema>;
export type SubmitTalkTrackVersionInput = z.input<typeof versionIdInputSchema>;
export type ReviewTalkTrackCandidateInput = z.input<
  typeof candidateReviewInputSchema
>;
export type RecordTalkTrackReviewDecisionInput = z.input<
  typeof reviewDecisionInputSchema
>;
export type PublishTalkTrackVersionInput = z.input<typeof versionIdInputSchema>;
export type RecordTalkTrackUsageSignalInput = z.input<
  typeof usageSignalInputSchema
>;

export type TalkTrackReadiness = {
  ready: boolean;
  blockedBy: string[];
};

export type TalkTrackScenarioView = {
  id: string;
  racketProductIds: string[];
  playerLevel: z.infer<typeof playerLevelSchema>;
  playStyle: z.infer<typeof playStyleSchema>;
  priceBand: z.infer<typeof priceBandSchema>;
  liveScene: z.infer<typeof liveSceneSchema>;
  hostRole: z.infer<typeof hostRoleSchema>;
  objectionType: z.infer<typeof objectionTypeSchema> | null;
  usageConstraints: string[];
  scenarioFingerprint: string;
};

export type TalkTrackSegmentView = {
  id: string;
  segmentType: z.infer<typeof segmentTypeSchema>;
  text: string;
  requiredEvidence: boolean;
  position: number;
};

export type TalkTrackSourceGroundingView = {
  id: string;
  sourceType: z.infer<typeof sourceTypeSchema>;
  sourceIds: string[];
  knowledgeVersionIds: string[];
  racketProductIds: string[];
  aiRunId: string | null;
  freshnessState: z.infer<typeof freshnessStateSchema>;
  conflictState: z.infer<typeof conflictStateSchema>;
  sensitiveRedactionState: z.infer<typeof redactionStateSchema>;
  claimSummary: string;
};

export type TalkTrackCandidateView = {
  id: string;
  candidateSource: z.infer<typeof candidateSourceSchema>;
  aiRunId: string | null;
  aiSectionId: string | null;
  promptVersion: string | null;
  validationState: z.infer<typeof validationStateSchema>;
  reviewState: z.infer<typeof candidateReviewStateSchema>;
  sensitiveRedactionState: z.infer<typeof redactionStateSchema>;
  proposedBody: string;
  createdAt: Date;
  updatedAt: Date;
};

export type TalkTrackVersionView = {
  id: string;
  version: number;
  status: z.infer<typeof statusSchema>;
  body: string;
  tone: z.infer<typeof toneSchema>;
  language: z.infer<typeof languageSchema>;
  reviewDecisionId: string | null;
  sourceGroundingId: string | null;
  candidateId: string | null;
  segments: TalkTrackSegmentView[];
  sourceGrounding: TalkTrackSourceGroundingView | null;
  candidate: TalkTrackCandidateView | null;
  readiness: TalkTrackReadiness;
  createdAt: Date;
  updatedAt: Date;
};

export type TalkTrackObjectionPatternView = {
  id: string;
  objectionType: z.infer<typeof objectionTypeSchema>;
  customerQuestionExample: string | null;
  replyStrategy: z.infer<typeof replyStrategySchema>;
  riskLevel: z.infer<typeof riskLevelSchema>;
};

export type TalkTrackAssetView = {
  id: string;
  assetType: z.infer<typeof assetTypeSchema>;
  title: string;
  status: z.infer<typeof statusSchema>;
  ownerRole: z.infer<typeof ownerRoleSchema>;
  currentVersionId: string | null;
  scenario: TalkTrackScenarioView | null;
  currentVersion: TalkTrackVersionView | null;
  objectionPattern: TalkTrackObjectionPatternView | null;
  createdAt: Date;
  updatedAt: Date;
};

export type TalkTrackUsageSignalView = {
  id: string;
  assetId: string;
  versionId: string;
  sourceWorkflow: z.infer<typeof usageWorkflowSchema>;
  signalType: z.infer<typeof usageSignalSchema>;
  reason: string;
  actorId: string;
  createdAt: Date;
};

export type TalkTrackAssetListResult = {
  items: TalkTrackAssetView[];
};

const activeScenarioStatuses: TalkTrackAssetRecord["status"][] = [
  "draft",
  "reviewing",
  "published",
  "deprecated",
];

const reviewerRoles = new Set<DataAccessContext["role"]>([
  "product_owner",
  "reviewer",
  "admin",
]);

function parseInput<T>(schema: z.ZodType<T>, input: unknown): T {
  const parsed = schema.safeParse(input);

  if (parsed.success) {
    return parsed.data;
  }

  const issues = parsed.error.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
  }));
  const hasLongInputIssue = parsed.error.issues.some(
    (issue) => issue.code === "too_big",
  );

  if (hasLongInputIssue) {
    throw new TalkTrackAssetError(
      "LONG_INPUT_LIMIT_EXCEEDED",
      "Talk-track asset input exceeds the current length limit",
      { details: { issues } },
    );
  }

  throw new TalkTrackAssetError(
    "VALIDATION_ERROR",
    "Talk-track asset input is invalid",
    { details: { issues } },
  );
}

function assertManagePermission(context: DataAccessContext) {
  if (!context.permissions.includes("manage_talk_tracks")) {
    throw new TalkTrackAssetError(
      "FORBIDDEN_PERMISSION",
      "Actor is missing required talk-track permission",
      {
        details: {
          requestId: context.requestId,
        },
      },
    );
  }
}

function assertReviewer(context: DataAccessContext) {
  assertManagePermission(context);

  if (!reviewerRoles.has(context.role)) {
    throw new TalkTrackAssetError(
      "FORBIDDEN_PERMISSION",
      "Actor cannot review or publish talk-track assets",
      {
        details: {
          requestId: context.requestId,
          role: context.role,
        },
      },
    );
  }
}

function toNullable(value: string): string | null {
  return value.length > 0 ? value : null;
}

function normalizeIdList(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort();
}

function normalizeTitle(value: string): string {
  return value.trim().toLocaleLowerCase().replace(/\s+/g, " ");
}

function scenarioFingerprint(input: z.infer<typeof scenarioInputSchema>): string {
  const payload = {
    racketProductIds: normalizeIdList(input.racketProductIds),
    playerLevel: input.playerLevel,
    playStyle: input.playStyle,
    priceBand: input.priceBand,
    liveScene: input.liveScene,
    hostRole: input.hostRole,
    objectionType: input.objectionType ?? "",
    usageConstraints: normalizeIdList(input.usageConstraints),
  };

  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

function assertSourceSafe(source?: z.infer<typeof sourceGroundingInputSchema>) {
  if (source?.sensitiveRedactionState === "blocked") {
    throw new TalkTrackAssetError(
      "SENSITIVE_DATA_BLOCKED",
      "Talk-track source grounding contains blocked sensitive data",
    );
  }
}

function assertCandidateSafe(candidate: z.infer<typeof candidateInputSchema>) {
  if (candidate.sensitiveRedactionState === "blocked") {
    throw new TalkTrackAssetError(
      "SENSITIVE_DATA_BLOCKED",
      "Talk-track candidate contains blocked sensitive data",
    );
  }

  if (candidate.validationState === "blocked") {
    throw new TalkTrackAssetError(
      "UNSAFE_CLAIM",
      "Talk-track candidate validation is blocked",
    );
  }

  if (
    candidate.candidateSource === "ai_review" &&
    (candidate.aiRunId.length === 0 ||
      candidate.aiSectionId.length === 0 ||
      candidate.promptVersion.length === 0)
  ) {
    throw new TalkTrackAssetError(
      "VALIDATION_ERROR",
      "AI review candidates require run, section, and prompt version metadata",
    );
  }
}

function getDatabaseConstraintName(error: unknown): string {
  let current: unknown = error;

  while (current && typeof current === "object") {
    const record = current as Record<string, unknown>;
    const constraint =
      record.constraint_name ?? record.constraint ?? record.constraintName;

    if (typeof constraint === "string") {
      return constraint;
    }

    current = record.cause;
  }

  return "";
}

function mapDatabaseError(error: unknown): TalkTrackAssetError {
  if (error instanceof TalkTrackAssetError) {
    return error;
  }

  if (error instanceof Error) {
    const constraintName = getDatabaseConstraintName(error);

    if (
      error.message.includes("talk_track_segments_version_position_unique") ||
      constraintName === "talk_track_segments_version_position_unique"
    ) {
      return new TalkTrackAssetError(
        "VERSION_CONFLICT",
        "Talk-track segment positions conflict for this version",
        { cause: error },
      );
    }

    return new TalkTrackAssetError(
      "DATABASE_OPERATION_FAILED",
      "Talk-track asset persistence failed",
      { cause: error },
    );
  }

  return new TalkTrackAssetError(
    "DATABASE_OPERATION_FAILED",
    "Unknown talk-track asset persistence failure",
  );
}

function toScenarioView(
  scenario: TalkTrackScenarioRecord,
): TalkTrackScenarioView {
  return {
    id: scenario.id,
    racketProductIds: scenario.racketProductIds,
    playerLevel: scenario.playerLevel,
    playStyle: scenario.playStyle,
    priceBand: scenario.priceBand,
    liveScene: scenario.liveScene,
    hostRole: scenario.hostRole,
    objectionType: scenario.objectionType,
    usageConstraints: scenario.usageConstraints,
    scenarioFingerprint: scenario.scenarioFingerprint,
  };
}

function toSegmentView(segment: TalkTrackSegmentRecord): TalkTrackSegmentView {
  return {
    id: segment.id,
    segmentType: segment.segmentType,
    text: segment.text,
    requiredEvidence: segment.requiredEvidence,
    position: segment.position,
  };
}

function toSourceGroundingView(
  source: TalkTrackSourceGroundingRecord,
): TalkTrackSourceGroundingView {
  return {
    id: source.id,
    sourceType: source.sourceType,
    sourceIds: source.sourceIds,
    knowledgeVersionIds: source.knowledgeVersionIds,
    racketProductIds: source.racketProductIds,
    aiRunId: toNullable(source.aiRunId),
    freshnessState: source.freshnessState,
    conflictState: source.conflictState,
    sensitiveRedactionState: source.sensitiveRedactionState,
    claimSummary: source.claimSummary,
  };
}

function toCandidateView(
  candidate: TalkTrackCandidateRecord,
): TalkTrackCandidateView {
  return {
    id: candidate.id,
    candidateSource: candidate.candidateSource,
    aiRunId: toNullable(candidate.aiRunId),
    aiSectionId: toNullable(candidate.aiSectionId),
    promptVersion: toNullable(candidate.promptVersion),
    validationState: candidate.validationState,
    reviewState: candidate.reviewState,
    sensitiveRedactionState: candidate.sensitiveRedactionState,
    proposedBody: candidate.proposedBody,
    createdAt: candidate.createdAt,
    updatedAt: candidate.updatedAt,
  };
}

function toObjectionPatternView(
  pattern: TalkTrackObjectionPatternRecord,
): TalkTrackObjectionPatternView {
  return {
    id: pattern.id,
    objectionType: pattern.objectionType,
    customerQuestionExample: toNullable(pattern.customerQuestionExample),
    replyStrategy: pattern.replyStrategy,
    riskLevel: pattern.riskLevel,
  };
}

function sourceHasEvidence(source: TalkTrackSourceGroundingRecord): boolean {
  return (
    source.sourceIds.length > 0 ||
    source.knowledgeVersionIds.length > 0 ||
    source.racketProductIds.length > 0 ||
    source.aiRunId.length > 0
  );
}

function versionReadiness(input: {
  version: TalkTrackVersionRecord;
  segments: TalkTrackSegmentRecord[];
  source: TalkTrackSourceGroundingRecord | null;
  candidate: TalkTrackCandidateRecord | null;
}): TalkTrackReadiness {
  const blockers = new Set<string>();
  const needsEvidence = input.segments.some((segment) => segment.requiredEvidence);

  if (input.version.status !== "published") {
    blockers.add("not_published");
  }

  if (needsEvidence && !input.source) {
    blockers.add("missing_source");
  }

  if (input.source) {
    if (input.source.sensitiveRedactionState === "blocked") {
      blockers.add("sensitive_data_blocked");
    }

    if (input.source.freshnessState === "stale_blocked") {
      blockers.add("source_stale_blocked");
    }

    if (input.source.conflictState !== "none") {
      blockers.add(`source_${input.source.conflictState}`);
    }

    if (needsEvidence && !sourceHasEvidence(input.source)) {
      blockers.add("missing_source");
    }
  }

  if (input.candidate) {
    if (input.candidate.validationState === "blocked") {
      blockers.add("candidate_validation_blocked");
    }

    if (
      input.candidate.candidateSource === "ai_review" &&
      !["accepted", "edited", "published"].includes(input.candidate.reviewState)
    ) {
      blockers.add("ai_candidate_not_reviewed");
    }
  }

  const blockedBy = [...blockers];

  return {
    ready: blockedBy.length === 0,
    blockedBy,
  };
}

function toVersionView(input: {
  version: TalkTrackVersionRecord;
  segments: TalkTrackSegmentRecord[];
  source: TalkTrackSourceGroundingRecord | null;
  candidate: TalkTrackCandidateRecord | null;
}): TalkTrackVersionView {
  return {
    id: input.version.id,
    version: input.version.version,
    status: input.version.status,
    body: input.version.body,
    tone: input.version.tone,
    language: input.version.language,
    reviewDecisionId: toNullable(input.version.reviewDecisionId),
    sourceGroundingId: toNullable(input.version.sourceGroundingId),
    candidateId: toNullable(input.version.candidateId),
    segments: input.segments.map(toSegmentView),
    sourceGrounding: input.source ? toSourceGroundingView(input.source) : null,
    candidate: input.candidate ? toCandidateView(input.candidate) : null,
    readiness: versionReadiness(input),
    createdAt: input.version.createdAt,
    updatedAt: input.version.updatedAt,
  };
}

function assertPublishable(input: {
  version: TalkTrackVersionRecord;
  reviewDecision: TalkTrackReviewDecisionRecord | null;
  segments: TalkTrackSegmentRecord[];
  source: TalkTrackSourceGroundingRecord | null;
  candidate: TalkTrackCandidateRecord | null;
}) {
  if (input.version.status !== "reviewing") {
    throw new TalkTrackAssetError(
      "STATE_TRANSITION_INVALID",
      "Only reviewing talk-track versions can be published",
      { details: { status: input.version.status } },
    );
  }

  if (
    !input.reviewDecision ||
    !["approve", "approve_with_edits"].includes(input.reviewDecision.decision)
  ) {
    throw new TalkTrackAssetError(
      "REVIEW_REQUIRED",
      "Talk-track publication requires an approving review decision",
    );
  }

  const needsEvidence = input.segments.some((segment) => segment.requiredEvidence);

  if (needsEvidence && !input.source) {
    throw new TalkTrackAssetError(
      "SOURCE_REQUIRED",
      "Talk-track publication requires source grounding",
    );
  }

  if (input.source) {
    if (input.source.sensitiveRedactionState === "blocked") {
      throw new TalkTrackAssetError(
        "SENSITIVE_DATA_BLOCKED",
        "Talk-track source grounding contains blocked sensitive data",
      );
    }

    if (input.source.freshnessState === "stale_blocked") {
      throw new TalkTrackAssetError(
        "SOURCE_STALE",
        "Talk-track source grounding is stale-blocked",
      );
    }

    if (input.source.conflictState !== "none") {
      throw new TalkTrackAssetError(
        "SOURCE_CONFLICT",
        "Talk-track source grounding has unresolved conflicts",
      );
    }

    if (needsEvidence && !sourceHasEvidence(input.source)) {
      throw new TalkTrackAssetError(
        "SOURCE_REQUIRED",
        "Talk-track publication requires at least one source reference",
      );
    }
  }

  if (input.candidate) {
    if (input.candidate.sensitiveRedactionState === "blocked") {
      throw new TalkTrackAssetError(
        "SENSITIVE_DATA_BLOCKED",
        "Talk-track candidate contains blocked sensitive data",
      );
    }

    if (input.candidate.validationState === "blocked") {
      throw new TalkTrackAssetError(
        "UNSAFE_CLAIM",
        "Talk-track candidate validation is blocked",
      );
    }

    if (
      input.candidate.candidateSource === "ai_review" &&
      !["accepted", "edited", "published"].includes(input.candidate.reviewState)
    ) {
      throw new TalkTrackAssetError(
        "AI_CANDIDATE_NOT_REVIEWED",
        "AI-generated talk-track candidates require human review",
      );
    }
  }
}

export function createTalkTrackAssetRepository(
  database: TalkTrackAssetRepositoryDatabase,
) {
  async function findAsset(
    context: DataAccessContext,
    assetId: string,
  ): Promise<TalkTrackAssetRecord> {
    const [asset] = await database
      .select()
      .from(talkTrackAssets)
      .where(
        and(
          eq(talkTrackAssets.tenantId, context.tenantId),
          eq(talkTrackAssets.teamId, context.teamId),
          eq(talkTrackAssets.id, assetId),
        ),
      )
      .limit(1);

    if (!asset) {
      throw new TalkTrackAssetError(
        "NOT_FOUND",
        "Talk-track asset was not found in this team",
      );
    }

    return asset;
  }

  async function findVersion(
    context: DataAccessContext,
    input: {
      assetId: string;
      versionId?: string;
    },
  ): Promise<TalkTrackVersionRecord> {
    const asset = await findAsset(context, input.assetId);
    const targetVersionId = input.versionId ?? asset.currentVersionId;

    if (!targetVersionId) {
      throw new TalkTrackAssetError(
        "NOT_FOUND",
        "Talk-track asset has no current version",
      );
    }

    const [version] = await database
      .select()
      .from(talkTrackVersions)
      .where(
        and(
          eq(talkTrackVersions.tenantId, context.tenantId),
          eq(talkTrackVersions.teamId, context.teamId),
          eq(talkTrackVersions.assetId, input.assetId),
          eq(talkTrackVersions.id, targetVersionId),
        ),
      )
      .limit(1);

    if (!version) {
      throw new TalkTrackAssetError(
        "NOT_FOUND",
        "Talk-track version was not found in this team",
      );
    }

    return version;
  }

  async function getVersionParts(
    context: DataAccessContext,
    version: TalkTrackVersionRecord,
  ) {
    const [segments, sourceRows, candidateRows] = await Promise.all([
      database
        .select()
        .from(talkTrackSegments)
        .where(
          and(
            eq(talkTrackSegments.tenantId, context.tenantId),
            eq(talkTrackSegments.teamId, context.teamId),
            eq(talkTrackSegments.versionId, version.id),
          ),
        )
        .orderBy(asc(talkTrackSegments.position)),
      database
        .select()
        .from(talkTrackSourceGroundings)
        .where(
          and(
            eq(talkTrackSourceGroundings.tenantId, context.tenantId),
            eq(talkTrackSourceGroundings.teamId, context.teamId),
            eq(talkTrackSourceGroundings.versionId, version.id),
          ),
        )
        .limit(1),
      version.candidateId
        ? database
            .select()
            .from(talkTrackCandidates)
            .where(
              and(
                eq(talkTrackCandidates.tenantId, context.tenantId),
                eq(talkTrackCandidates.teamId, context.teamId),
                eq(talkTrackCandidates.id, version.candidateId),
              ),
            )
            .limit(1)
        : Promise.resolve([] as TalkTrackCandidateRecord[]),
    ]);

    return {
      segments,
      source: sourceRows[0] ?? null,
      candidate: candidateRows[0] ?? null,
    };
  }

  async function toAssetView(asset: TalkTrackAssetRecord): Promise<TalkTrackAssetView> {
    const [scenarioRows, versionRows, objectionRows] = await Promise.all([
      database
        .select()
        .from(talkTrackScenarios)
        .where(
          and(
            eq(talkTrackScenarios.tenantId, asset.tenantId),
            eq(talkTrackScenarios.teamId, asset.teamId),
            eq(talkTrackScenarios.assetId, asset.id),
          ),
        )
        .limit(1),
      asset.currentVersionId
        ? database
            .select()
            .from(talkTrackVersions)
            .where(
              and(
                eq(talkTrackVersions.tenantId, asset.tenantId),
                eq(talkTrackVersions.teamId, asset.teamId),
                eq(talkTrackVersions.id, asset.currentVersionId),
              ),
            )
            .limit(1)
        : Promise.resolve([] as TalkTrackVersionRecord[]),
      database
        .select()
        .from(talkTrackObjectionPatterns)
        .where(
          and(
            eq(talkTrackObjectionPatterns.tenantId, asset.tenantId),
            eq(talkTrackObjectionPatterns.teamId, asset.teamId),
            eq(talkTrackObjectionPatterns.assetId, asset.id),
          ),
        )
        .limit(1),
    ]);

    const currentVersion = versionRows[0] ?? null;
    const parts = currentVersion
      ? await getVersionParts(
          {
            requestId: "asset_view",
            actorId: asset.updatedBy,
            tenantId: asset.tenantId,
            teamId: asset.teamId,
            role: "admin",
            permissions: ["manage_talk_tracks"],
          },
          currentVersion,
        )
      : null;

    return {
      id: asset.id,
      assetType: asset.assetType,
      title: asset.title,
      status: asset.status,
      ownerRole: asset.ownerRole,
      currentVersionId: toNullable(asset.currentVersionId),
      scenario: scenarioRows[0] ? toScenarioView(scenarioRows[0]) : null,
      currentVersion:
        currentVersion && parts
          ? toVersionView({
              version: currentVersion,
              segments: parts.segments,
              source: parts.source,
              candidate: parts.candidate,
            })
          : null,
      objectionPattern: objectionRows[0]
        ? toObjectionPatternView(objectionRows[0])
        : null,
      createdAt: asset.createdAt,
      updatedAt: asset.updatedAt,
    };
  }

  return {
    async createCandidate(
      context: DataAccessContext,
      input: CreateTalkTrackCandidateInput,
    ): Promise<TalkTrackCandidateView> {
      assertManagePermission(context);
      const values = parseInput(candidateInputSchema, input);
      assertCandidateSafe(values);

      const [candidate] = await database
        .insert(talkTrackCandidates)
        .values({
          id: createRecordId("talk_track_candidate"),
          tenantId: context.tenantId,
          teamId: context.teamId,
          candidateSource: values.candidateSource,
          aiRunId: values.aiRunId,
          aiSectionId: values.aiSectionId,
          promptVersion: values.promptVersion,
          sourceIds: normalizeIdList(values.sourceIds),
          knowledgeVersionIds: normalizeIdList(values.knowledgeVersionIds),
          racketProductVersionIds: normalizeIdList(
            values.racketProductVersionIds,
          ),
          scenarioFingerprint: values.scenario
            ? scenarioFingerprint(values.scenario)
            : "",
          proposedBody: values.proposedBody,
          validationState: values.validationState,
          reviewState: values.reviewState,
          sensitiveRedactionState: values.sensitiveRedactionState,
          createdBy: context.actorId,
          updatedBy: context.actorId,
        })
        .returning();

      return toCandidateView(candidate);
    },

    async reviewCandidate(
      context: DataAccessContext,
      input: ReviewTalkTrackCandidateInput,
    ): Promise<TalkTrackCandidateView> {
      assertReviewer(context);
      const values = parseInput(candidateReviewInputSchema, input);

      const [candidate] = await database
        .select()
        .from(talkTrackCandidates)
        .where(
          and(
            eq(talkTrackCandidates.tenantId, context.tenantId),
            eq(talkTrackCandidates.teamId, context.teamId),
            eq(talkTrackCandidates.id, values.candidateId),
          ),
        )
        .limit(1);

      if (!candidate) {
        throw new TalkTrackAssetError(
          "NOT_FOUND",
          "Talk-track candidate was not found in this team",
        );
      }

      const [updated] = await database
        .update(talkTrackCandidates)
        .set({
          reviewState: values.reviewState,
          proposedBody:
            values.reviewState === "edited" && values.editedBody.length > 0
              ? values.editedBody
              : candidate.proposedBody,
          updatedBy: context.actorId,
          updatedAt: new Date(),
        })
        .where(eq(talkTrackCandidates.id, candidate.id))
        .returning();

      return toCandidateView(updated);
    },

    async createAsset(
      context: DataAccessContext,
      input: CreateTalkTrackAssetInput,
    ): Promise<TalkTrackAssetView> {
      assertManagePermission(context);
      const values = parseInput(createAssetInputSchema, input);
      assertSourceSafe(values.sourceGrounding);

      try {
        const fingerprint = scenarioFingerprint(values.scenario);
        const duplicate = await database
          .select()
          .from(talkTrackAssets)
          .where(
            and(
              eq(talkTrackAssets.tenantId, context.tenantId),
              eq(talkTrackAssets.teamId, context.teamId),
              eq(talkTrackAssets.assetType, values.asset.assetType),
              eq(talkTrackAssets.scenarioFingerprint, fingerprint),
              inArray(talkTrackAssets.status, activeScenarioStatuses),
            ),
          )
          .limit(1);

        if (duplicate.length > 0) {
          throw new TalkTrackAssetError(
            "DUPLICATE_SCENARIO",
            "An active talk-track asset already exists for this scenario",
          );
        }

        if (values.version.candidateId) {
          const [candidate] = await database
            .select()
            .from(talkTrackCandidates)
            .where(
              and(
                eq(talkTrackCandidates.tenantId, context.tenantId),
                eq(talkTrackCandidates.teamId, context.teamId),
                eq(talkTrackCandidates.id, values.version.candidateId),
              ),
            )
            .limit(1);

          if (!candidate) {
            throw new TalkTrackAssetError(
              "NOT_FOUND",
              "Talk-track candidate was not found in this team",
            );
          }
        }

        const assetId = createRecordId("talk_track_asset");
        const versionId = createRecordId("talk_track_version");
        const [asset] = await database
          .insert(talkTrackAssets)
          .values({
            id: assetId,
            tenantId: context.tenantId,
            teamId: context.teamId,
            assetType: values.asset.assetType,
            title: values.asset.title,
            normalizedTitle: normalizeTitle(values.asset.title),
            status: "draft",
            ownerRole: values.asset.ownerRole,
            currentVersionId: versionId,
            scenarioFingerprint: fingerprint,
            createdBy: context.actorId,
            updatedBy: context.actorId,
          })
          .returning();

        await database.insert(talkTrackVersions).values({
          id: versionId,
          tenantId: context.tenantId,
          teamId: context.teamId,
          assetId,
          version: 1,
          status: "draft",
          body: values.version.body,
          tone: values.version.tone,
          language: values.version.language,
          candidateId: values.version.candidateId ?? "",
          createdBy: context.actorId,
          updatedBy: context.actorId,
        });

        await database.insert(talkTrackScenarios).values({
          id: createRecordId("talk_track_scenario"),
          tenantId: context.tenantId,
          teamId: context.teamId,
          assetId,
          racketProductIds: normalizeIdList(values.scenario.racketProductIds),
          playerLevel: values.scenario.playerLevel,
          playStyle: values.scenario.playStyle,
          priceBand: values.scenario.priceBand,
          liveScene: values.scenario.liveScene,
          hostRole: values.scenario.hostRole,
          objectionType: values.scenario.objectionType,
          usageConstraints: normalizeIdList(values.scenario.usageConstraints),
          scenarioFingerprint: fingerprint,
        });

        await database.insert(talkTrackSegments).values(
          values.segments.map((segment, index) => ({
            id: createRecordId("talk_track_segment"),
            tenantId: context.tenantId,
            teamId: context.teamId,
            versionId,
            segmentType: segment.segmentType,
            text: segment.text,
            requiredEvidence: segment.requiredEvidence,
            position: index + 1,
          })),
        );

        if (values.objectionPattern) {
          await database.insert(talkTrackObjectionPatterns).values({
            id: createRecordId("talk_track_objection"),
            tenantId: context.tenantId,
            teamId: context.teamId,
            assetId,
            objectionType: values.objectionPattern.objectionType,
            customerQuestionExample:
              values.objectionPattern.customerQuestionExample,
            replyStrategy: values.objectionPattern.replyStrategy,
            riskLevel: values.objectionPattern.riskLevel,
          });
        }

        if (values.sourceGrounding) {
          const sourceGroundingId = createRecordId("talk_track_source");

          await database.insert(talkTrackSourceGroundings).values({
            id: sourceGroundingId,
            tenantId: context.tenantId,
            teamId: context.teamId,
            assetId,
            versionId,
            sourceType: values.sourceGrounding.sourceType,
            sourceIds: normalizeIdList(values.sourceGrounding.sourceIds),
            knowledgeVersionIds: normalizeIdList(
              values.sourceGrounding.knowledgeVersionIds,
            ),
            racketProductIds: normalizeIdList(
              values.sourceGrounding.racketProductIds,
            ),
            aiRunId: values.sourceGrounding.aiRunId,
            freshnessState: values.sourceGrounding.freshnessState,
            conflictState: values.sourceGrounding.conflictState,
            sensitiveRedactionState:
              values.sourceGrounding.sensitiveRedactionState,
            claimSummary: values.sourceGrounding.claimSummary,
            createdBy: context.actorId,
          });

          await database
            .update(talkTrackVersions)
            .set({
              sourceGroundingId,
              updatedBy: context.actorId,
              updatedAt: new Date(),
            })
            .where(eq(talkTrackVersions.id, versionId));
        }

        if (values.version.candidateId) {
          await database
            .update(talkTrackCandidates)
            .set({
              assetId,
              versionId,
              updatedBy: context.actorId,
              updatedAt: new Date(),
            })
            .where(eq(talkTrackCandidates.id, values.version.candidateId));
        }

        return toAssetView(asset);
      } catch (error) {
        throw mapDatabaseError(error);
      }
    },

    async getAsset(
      context: DataAccessContext,
      input: GetTalkTrackAssetInput,
    ): Promise<TalkTrackAssetView> {
      const values = parseInput(assetIdInputSchema, input);
      const asset = await findAsset(context, values.assetId);

      return toAssetView(asset);
    },

    async listAssets(
      context: DataAccessContext,
      input: ListTalkTrackAssetsInput = {},
    ): Promise<TalkTrackAssetListResult> {
      const values = parseInput(listAssetInputSchema, input);
      const filters = [
        eq(talkTrackAssets.tenantId, context.tenantId),
        eq(talkTrackAssets.teamId, context.teamId),
      ];

      if (values.status) {
        filters.push(inArray(talkTrackAssets.status, values.status));
      }

      if (values.assetType) {
        filters.push(eq(talkTrackAssets.assetType, values.assetType));
      }

      const assets = await database
        .select()
        .from(talkTrackAssets)
        .where(and(...filters))
        .orderBy(desc(talkTrackAssets.updatedAt))
        .limit(values.limit);

      return {
        items: await Promise.all(assets.map((asset) => toAssetView(asset))),
      };
    },

    async submitForReview(
      context: DataAccessContext,
      input: SubmitTalkTrackVersionInput,
    ): Promise<TalkTrackAssetView> {
      assertManagePermission(context);
      const values = parseInput(versionIdInputSchema, input);
      const asset = await findAsset(context, values.assetId);
      const version = await findVersion(context, values);

      if (version.status !== "draft") {
        throw new TalkTrackAssetError(
          "STATE_TRANSITION_INVALID",
          "Only draft talk-track versions can be submitted for review",
          { details: { status: version.status } },
        );
      }

      await database
        .update(talkTrackVersions)
        .set({
          status: "reviewing",
          updatedBy: context.actorId,
          updatedAt: new Date(),
        })
        .where(eq(talkTrackVersions.id, version.id));
      const [updatedAsset] = await database
        .update(talkTrackAssets)
        .set({
          status: "reviewing",
          updatedBy: context.actorId,
          updatedAt: new Date(),
        })
        .where(eq(talkTrackAssets.id, asset.id))
        .returning();

      return toAssetView(updatedAsset);
    },

    async recordReviewDecision(
      context: DataAccessContext,
      input: RecordTalkTrackReviewDecisionInput,
    ): Promise<TalkTrackReviewDecisionRecord> {
      assertReviewer(context);
      const values = parseInput(reviewDecisionInputSchema, input);
      const asset = await findAsset(context, values.assetId);
      const version = await findVersion(context, values);

      if (
        !["reviewing", "published", "deprecated"].includes(version.status) &&
        values.decision !== "request_changes"
      ) {
        throw new TalkTrackAssetError(
          "STATE_TRANSITION_INVALID",
          "Talk-track version is not ready for this review decision",
          { details: { status: version.status } },
        );
      }

      const [decision] = await database
        .insert(talkTrackReviewDecisions)
        .values({
          id: createRecordId("talk_track_review"),
          tenantId: context.tenantId,
          teamId: context.teamId,
          assetId: asset.id,
          versionId: version.id,
          decision: values.decision,
          reason: values.reason,
          editedBody: values.editedBody,
          reviewedBy: context.actorId,
          requestId: context.requestId,
        })
        .returning();

      const nextStatusByDecision: Partial<
        Record<
          TalkTrackReviewDecisionRecord["decision"],
          TalkTrackVersionRecord["status"]
        >
      > = {
        reject: "rejected",
        request_changes: "draft",
        deprecate: "deprecated",
      };
      const nextStatus = nextStatusByDecision[decision.decision];
      const nextBody =
        decision.decision === "approve_with_edits" &&
        values.editedBody.length > 0
          ? values.editedBody
          : version.body;

      await database
        .update(talkTrackVersions)
        .set({
          reviewDecisionId: decision.id,
          body: nextBody,
          status: nextStatus ?? version.status,
          updatedBy: context.actorId,
          updatedAt: new Date(),
        })
        .where(eq(talkTrackVersions.id, version.id));

      if (nextStatus && nextStatus !== "draft") {
        await database
          .update(talkTrackAssets)
          .set({
            status: nextStatus,
            updatedBy: context.actorId,
            updatedAt: new Date(),
          })
          .where(eq(talkTrackAssets.id, asset.id));
      }

      if (nextStatus === "draft") {
        await database
          .update(talkTrackAssets)
          .set({
            status: "draft",
            updatedBy: context.actorId,
            updatedAt: new Date(),
          })
          .where(eq(talkTrackAssets.id, asset.id));
      }

      return decision;
    },

    async publishVersion(
      context: DataAccessContext,
      input: PublishTalkTrackVersionInput,
    ): Promise<TalkTrackAssetView> {
      assertReviewer(context);
      const values = parseInput(versionIdInputSchema, input);
      const asset = await findAsset(context, values.assetId);
      const version = await findVersion(context, values);
      const parts = await getVersionParts(context, version);
      const reviewDecision = version.reviewDecisionId
        ? (
            await database
              .select()
              .from(talkTrackReviewDecisions)
              .where(
                and(
                  eq(talkTrackReviewDecisions.tenantId, context.tenantId),
                  eq(talkTrackReviewDecisions.teamId, context.teamId),
                  eq(talkTrackReviewDecisions.id, version.reviewDecisionId),
                ),
              )
              .limit(1)
          )[0] ?? null
        : null;

      assertPublishable({
        version,
        reviewDecision,
        segments: parts.segments,
        source: parts.source,
        candidate: parts.candidate,
      });

      await database
        .update(talkTrackVersions)
        .set({
          status: "published",
          publishedBy: context.actorId,
          publishedAt: new Date(),
          updatedBy: context.actorId,
          updatedAt: new Date(),
        })
        .where(eq(talkTrackVersions.id, version.id));

      if (parts.candidate) {
        await database
          .update(talkTrackCandidates)
          .set({
            reviewState: "published",
            updatedBy: context.actorId,
            updatedAt: new Date(),
          })
          .where(eq(talkTrackCandidates.id, parts.candidate.id));
      }

      const [updatedAsset] = await database
        .update(talkTrackAssets)
        .set({
          status: "published",
          currentVersionId: version.id,
          updatedBy: context.actorId,
          updatedAt: new Date(),
        })
        .where(eq(talkTrackAssets.id, asset.id))
        .returning();

      return toAssetView(updatedAsset);
    },

    async archiveAsset(
      context: DataAccessContext,
      input: GetTalkTrackAssetInput,
    ): Promise<TalkTrackAssetView> {
      assertReviewer(context);
      const values = parseInput(assetIdInputSchema, input);
      const asset = await findAsset(context, values.assetId);

      if (asset.status === "archived") {
        throw new TalkTrackAssetError(
          "STATE_TRANSITION_INVALID",
          "Talk-track asset is already archived",
        );
      }

      const [updated] = await database
        .update(talkTrackAssets)
        .set({
          status: "archived",
          archivedBy: context.actorId,
          archivedAt: new Date(),
          updatedBy: context.actorId,
          updatedAt: new Date(),
        })
        .where(eq(talkTrackAssets.id, asset.id))
        .returning();

      return toAssetView(updated);
    },

    async restoreAsset(
      context: DataAccessContext,
      input: GetTalkTrackAssetInput,
    ): Promise<TalkTrackAssetView> {
      assertReviewer(context);
      const values = parseInput(assetIdInputSchema, input);
      const asset = await findAsset(context, values.assetId);

      if (asset.status !== "archived") {
        throw new TalkTrackAssetError(
          "STATE_TRANSITION_INVALID",
          "Only archived talk-track assets can be restored",
        );
      }

      const [updated] = await database
        .update(talkTrackAssets)
        .set({
          status: "draft",
          archivedBy: null,
          archivedAt: null,
          updatedBy: context.actorId,
          updatedAt: new Date(),
        })
        .where(eq(talkTrackAssets.id, asset.id))
        .returning();

      return toAssetView(updated);
    },

    async recordUsageSignal(
      context: DataAccessContext,
      input: RecordTalkTrackUsageSignalInput,
    ): Promise<TalkTrackUsageSignalView> {
      assertManagePermission(context);
      const values = parseInput(usageSignalInputSchema, input);
      const asset = await findAsset(context, values.assetId);
      const version = await findVersion(context, values);

      if (version.status !== "published" || asset.status !== "published") {
        throw new TalkTrackAssetError(
          "STATE_TRANSITION_INVALID",
          "Talk-track usage signals require a published asset version",
        );
      }

      const [signal] = await database
        .insert(talkTrackUsageSignals)
        .values({
          id: createRecordId("talk_track_usage"),
          tenantId: context.tenantId,
          teamId: context.teamId,
          assetId: asset.id,
          versionId: version.id,
          sourceWorkflow: values.sourceWorkflow,
          signalType: values.signalType,
          reason: values.reason,
          actorId: context.actorId,
        })
        .returning();

      return {
        id: signal.id,
        assetId: signal.assetId,
        versionId: signal.versionId,
        sourceWorkflow: signal.sourceWorkflow,
        signalType: signal.signalType,
        reason: signal.reason,
        actorId: signal.actorId,
        createdAt: signal.createdAt,
      };
    },
  };
}
