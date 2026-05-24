import "server-only";

import { createHash } from "node:crypto";

import { and, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";

import type { DatabaseClient } from "../db/client";
import type { DataAccessContext } from "../db/context";
import { createRecordId } from "../db/repository";
import {
  extractedKnowledgeClaims,
  knowledgeConflicts,
  knowledgeReviewDecisions,
  knowledgeSources,
  publishedKnowledgeVersions,
  teamKnowledgeNotes,
  type ExtractedKnowledgeClaimRecord,
  type KnowledgeConflictRecord,
  type KnowledgeSourceRecord,
  type PublishedKnowledgeVersionRecord,
  type TeamKnowledgeNoteRecord,
} from "../db/schema";

export type KnowledgeLifecycleRepositoryDatabase = Pick<
  DatabaseClient,
  "insert" | "select" | "update"
>;

export type KnowledgeLifecycleErrorCode =
  | "VALIDATION_ERROR"
  | "LONG_INPUT_LIMIT_EXCEEDED"
  | "FORBIDDEN_PERMISSION"
  | "DUPLICATE_SOURCE"
  | "CONFLICTING_CLAIM"
  | "SENSITIVE_DATA_NEEDS_REVIEW"
  | "NOT_FOUND"
  | "STATE_TRANSITION_INVALID"
  | "DATABASE_OPERATION_FAILED";

export class KnowledgeLifecycleError extends Error {
  readonly code: KnowledgeLifecycleErrorCode;
  readonly details?: Record<string, unknown>;

  constructor(
    code: KnowledgeLifecycleErrorCode,
    message: string,
    options?: {
      cause?: unknown;
      details?: Record<string, unknown>;
    },
  ) {
    super(message, { cause: options?.cause });
    this.name = "KnowledgeLifecycleError";
    this.code = code;
    this.details = options?.details;
  }
}

const sourceTypeSchema = z.enum([
  "official_brand",
  "official_platform",
  "official_sport_rule",
  "authorized_retailer",
  "academic_research",
  "team_note",
  "web_discovery",
]);
const trustLevelSchema = z.enum([
  "official",
  "authorized",
  "research",
  "team",
  "unknown",
]);
const refreshCadenceSchema = z.enum([
  "manual",
  "monthly",
  "quarterly",
  "on_demand",
]);
const claimTypeSchema = z.enum([
  "racket_spec",
  "platform_rule",
  "sales_guidance",
  "customer_question",
  "objection_reply",
  "metric_definition",
  "team_experience",
]);
const languageSchema = z.enum(["zh", "en", "mixed", "unknown"]);
const confidenceSchema = z.enum(["high", "medium", "low", "unknown"]);
const extractionMethodSchema = z.enum(["manual", "ai_candidate", "imported"]);
const noteTypeSchema = z.enum([
  "selling_experience",
  "talk_track",
  "objection_reply",
  "after_sales",
  "pricing_guidance",
  "workflow_note",
]);
const sensitiveLevelSchema = z.enum(["internal", "restricted", "high"]);
const reviewTargetTypeSchema = z.enum(["source", "claim", "team_note"]);
const reviewDecisionSchema = z.enum([
  "approve",
  "reject",
  "request_source",
  "mark_conflict",
  "mark_stale",
  "archive",
]);
const conflictTypeSchema = z.enum([
  "spec_mismatch",
  "rule_change",
  "source_priority",
  "team_note_conflict",
  "stale_source",
]);
const conflictSeveritySchema = z.enum(["low", "medium", "high"]);
const conflictResolutionStateSchema = z.enum([
  "open",
  "reviewing",
  "resolved",
  "ignored",
]);

const stringField = (max: number) => z.string().trim().min(1).max(max);
const optionalStringField = (max: number) =>
  z.string().trim().max(max).optional().default("");
const longTextField = (max: number) => z.string().trim().min(1).max(max);
const boundedStringList = z
  .array(z.string().trim().min(1).max(160))
  .max(32)
  .default([]);
const idListSchema = z.array(z.string().trim().min(1).max(180)).max(32).default([]);

const registerSourceInputSchema = z.object({
  sourceType: sourceTypeSchema,
  title: stringField(240),
  owner: stringField(160),
  url: optionalStringField(2048),
  retrievedAt: z.coerce.date(),
  trustLevel: trustLevelSchema.default("unknown"),
  refreshCadence: refreshCadenceSchema.default("manual"),
  intendedUse: boundedStringList,
});

const sourceIdInputSchema = z.object({
  sourceId: stringField(180),
});

const addClaimInputSchema = z.object({
  sourceId: stringField(180),
  claimType: claimTypeSchema,
  subject: stringField(240),
  knowledgeKey: stringField(260),
  claimText: longTextField(8000),
  language: languageSchema.default("unknown"),
  confidence: confidenceSchema.default("unknown"),
  extractionMethod: extractionMethodSchema.default("manual"),
});

const addTeamNoteInputSchema = z.object({
  noteType: noteTypeSchema,
  knowledgeKey: stringField(260),
  content: longTextField(8000),
  sensitiveLevel: sensitiveLevelSchema.default("internal"),
  sourceIds: idListSchema,
});

const reviewDecisionInputSchema = z.object({
  targetType: reviewTargetTypeSchema,
  targetId: stringField(180),
  decision: reviewDecisionSchema,
  reason: stringField(600),
});

const recordConflictInputSchema = z.object({
  knowledgeKey: stringField(260),
  claimIds: idListSchema,
  conflictType: conflictTypeSchema,
  severity: conflictSeveritySchema.default("medium"),
});

const resolveConflictInputSchema = z.object({
  conflictId: stringField(180),
  decision: conflictResolutionStateSchema,
  reason: stringField(600),
});

const publishVersionInputSchema = z.object({
  knowledgeKey: stringField(260),
  claimIds: idListSchema,
  teamNoteIds: idListSchema,
  sourceIds: idListSchema,
  summary: longTextField(12000),
  expiresAt: z.coerce.date().optional(),
});

const listInputSchema = z.object({
  limit: z.number().int().min(1).max(100).default(20),
});

export type RegisterKnowledgeSourceInput = z.input<
  typeof registerSourceInputSchema
>;
export type AddExtractedKnowledgeClaimInput = z.input<
  typeof addClaimInputSchema
>;
export type AddTeamKnowledgeNoteInput = z.input<typeof addTeamNoteInputSchema>;
export type KnowledgeReviewDecisionInput = z.input<
  typeof reviewDecisionInputSchema
>;
export type RecordKnowledgeConflictInput = z.input<
  typeof recordConflictInputSchema
>;
export type ResolveKnowledgeConflictInput = z.input<
  typeof resolveConflictInputSchema
>;
export type PublishKnowledgeVersionInput = z.input<
  typeof publishVersionInputSchema
>;
export type ListKnowledgeInput = z.input<typeof listInputSchema>;

export type KnowledgeDownstreamWorkflow =
  | "ai_review"
  | "talk_tracks"
  | "qa_agent"
  | "source_refresh";

export type KnowledgeDownstreamReadiness = {
  workflow: KnowledgeDownstreamWorkflow;
  ready: boolean;
  blockedBy: string[];
};

export type KnowledgeSourceView = {
  id: string;
  sourceType: z.infer<typeof sourceTypeSchema>;
  title: string;
  owner: string;
  url: string | null;
  normalizedSourceKey: string;
  retrievedAt: Date;
  trustLevel: z.infer<typeof trustLevelSchema>;
  reviewState: KnowledgeSourceRecord["reviewState"];
  refreshCadence: z.infer<typeof refreshCadenceSchema>;
  intendedUse: string[];
  lastCheckedAt: Date | null;
  downstreamReadiness: KnowledgeDownstreamReadiness[];
  createdAt: Date;
  updatedAt: Date;
};

export type ExtractedKnowledgeClaimView = {
  id: string;
  sourceId: string;
  claimType: z.infer<typeof claimTypeSchema>;
  subject: string;
  knowledgeKey: string;
  claimText: string;
  language: z.infer<typeof languageSchema>;
  confidence: z.infer<typeof confidenceSchema>;
  extractionMethod: z.infer<typeof extractionMethodSchema>;
  reviewState: ExtractedKnowledgeClaimRecord["reviewState"];
  reviewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type TeamKnowledgeNoteView = {
  id: string;
  noteType: z.infer<typeof noteTypeSchema>;
  knowledgeKey: string;
  content: string;
  sensitiveLevel: z.infer<typeof sensitiveLevelSchema>;
  reviewState: TeamKnowledgeNoteRecord["reviewState"];
  sourceIds: string[];
  reviewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type KnowledgeConflictView = {
  id: string;
  knowledgeKey: string;
  claimIds: string[];
  conflictType: z.infer<typeof conflictTypeSchema>;
  severity: z.infer<typeof conflictSeveritySchema>;
  resolutionState: z.infer<typeof conflictResolutionStateSchema>;
  createdAt: Date;
  updatedAt: Date;
};

export type PublishedKnowledgeVersionView = {
  id: string;
  knowledgeKey: string;
  version: number;
  status: PublishedKnowledgeVersionRecord["status"];
  summary: string;
  claimIds: string[];
  teamNoteIds: string[];
  sourceIds: string[];
  publishedAt: Date;
  expiresAt: Date | null;
  downstreamReadiness: KnowledgeDownstreamReadiness[];
  createdAt: Date;
  updatedAt: Date;
};

export type KnowledgeReviewQueueItem =
  | {
      targetType: "source";
      targetId: string;
      label: string;
      reviewState: KnowledgeSourceView["reviewState"];
      createdAt: Date;
      source: KnowledgeSourceView;
    }
  | {
      targetType: "claim";
      targetId: string;
      label: string;
      reviewState: ExtractedKnowledgeClaimView["reviewState"];
      createdAt: Date;
      claim: ExtractedKnowledgeClaimView;
    }
  | {
      targetType: "team_note";
      targetId: string;
      label: string;
      reviewState: TeamKnowledgeNoteView["reviewState"];
      createdAt: Date;
      teamNote: TeamKnowledgeNoteView;
    };

export type KnowledgeReviewQueueResult = {
  items: KnowledgeReviewQueueItem[];
};

export type KnowledgeSourceListResult = {
  items: KnowledgeSourceView[];
};

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
    throw new KnowledgeLifecycleError(
      "LONG_INPUT_LIMIT_EXCEEDED",
      "Knowledge lifecycle input exceeds the current length limit",
      { details: { issues } },
    );
  }

  throw new KnowledgeLifecycleError(
    "VALIDATION_ERROR",
    "Knowledge lifecycle input is invalid",
    { details: { issues } },
  );
}

function assertPermission(
  context: DataAccessContext,
  allowedPermissions: string[],
) {
  if (
    !allowedPermissions.some((permission) =>
      context.permissions.includes(permission),
    )
  ) {
    throw new KnowledgeLifecycleError(
      "FORBIDDEN_PERMISSION",
      "Actor is missing required knowledge lifecycle permission",
      {
        details: {
          requestId: context.requestId,
        },
      },
    );
  }
}

function toNullable(value: string): string | null {
  return value.length > 0 ? value : null;
}

function normalizeSourceIdentity(value: string): string {
  return value.trim().toLocaleLowerCase().replace(/\/+$/g, "");
}

function normalizeSourceKey(input: {
  sourceType: z.infer<typeof sourceTypeSchema>;
  title: string;
  owner: string;
  url: string;
}): string {
  const sourceIdentity =
    input.url.length > 0 ? input.url : `${input.owner}:${input.title}`;
  const digest = createHash("sha256")
    .update(`${input.sourceType}:${normalizeSourceIdentity(sourceIdentity)}`)
    .digest("hex");

  return `${input.sourceType}:${digest}`;
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

function mapDatabaseError(error: unknown): KnowledgeLifecycleError {
  if (error instanceof KnowledgeLifecycleError) {
    return error;
  }

  if (error instanceof Error) {
    const constraintName = getDatabaseConstraintName(error);

    if (
      error.message.includes("knowledge_sources_scope_key_unique") ||
      constraintName === "knowledge_sources_scope_key_unique"
    ) {
      return new KnowledgeLifecycleError(
        "DUPLICATE_SOURCE",
        "Knowledge source already exists in this team",
        { cause: error },
      );
    }

    return new KnowledgeLifecycleError(
      "DATABASE_OPERATION_FAILED",
      "Knowledge lifecycle persistence failed",
      { cause: error },
    );
  }

  return new KnowledgeLifecycleError(
    "DATABASE_OPERATION_FAILED",
    "Unknown knowledge lifecycle persistence failure",
  );
}

function sourceReadiness(
  source: KnowledgeSourceRecord,
): KnowledgeDownstreamReadiness[] {
  const workflows: KnowledgeDownstreamWorkflow[] = [
    "ai_review",
    "talk_tracks",
    "qa_agent",
    "source_refresh",
  ];

  if (source.reviewState === "approved") {
    return workflows.map((workflow) => ({
      workflow,
      ready: workflow === "source_refresh",
      blockedBy: workflow === "source_refresh" ? [] : ["not_published"],
    }));
  }

  const blockerByState: Record<KnowledgeSourceRecord["reviewState"], string> = {
    registered: "source_registered",
    extracting: "source_extracting",
    reviewing: "source_reviewing",
    approved: "not_published",
    rejected: "source_rejected",
    stale: "source_stale",
    conflict: "source_conflict",
    archived: "source_archived",
  };

  return workflows.map((workflow) => ({
    workflow,
    ready: false,
    blockedBy: [blockerByState[source.reviewState]],
  }));
}

function publishedReadiness(
  version: PublishedKnowledgeVersionRecord,
): KnowledgeDownstreamReadiness[] {
  const workflows: KnowledgeDownstreamWorkflow[] = [
    "ai_review",
    "talk_tracks",
    "qa_agent",
    "source_refresh",
  ];
  const blockers = new Set<string>();
  const now = Date.now();

  if (version.status !== "published") {
    blockers.add(version.status);
  }

  if (version.expiresAt && version.expiresAt.getTime() <= now) {
    blockers.add("expired");
  }

  if (version.claimIds.length === 0 && version.teamNoteIds.length === 0) {
    blockers.add("missing_reviewed_content");
  }

  const blockedBy = [...blockers];

  return workflows.map((workflow) => ({
    workflow,
    ready: blockedBy.length === 0,
    blockedBy,
  }));
}

function toSourceView(source: KnowledgeSourceRecord): KnowledgeSourceView {
  return {
    id: source.id,
    sourceType: source.sourceType,
    title: source.title,
    owner: source.owner,
    url: toNullable(source.url),
    normalizedSourceKey: source.normalizedSourceKey,
    retrievedAt: source.retrievedAt,
    trustLevel: source.trustLevel,
    reviewState: source.reviewState,
    refreshCadence: source.refreshCadence,
    intendedUse: source.intendedUse,
    lastCheckedAt: source.lastCheckedAt,
    downstreamReadiness: sourceReadiness(source),
    createdAt: source.createdAt,
    updatedAt: source.updatedAt,
  };
}

function toClaimView(
  claim: ExtractedKnowledgeClaimRecord,
): ExtractedKnowledgeClaimView {
  return {
    id: claim.id,
    sourceId: claim.sourceId,
    claimType: claim.claimType,
    subject: claim.subject,
    knowledgeKey: claim.knowledgeKey,
    claimText: claim.claimText,
    language: claim.language,
    confidence: claim.confidence,
    extractionMethod: claim.extractionMethod,
    reviewState: claim.reviewState,
    reviewedAt: claim.reviewedAt,
    createdAt: claim.createdAt,
    updatedAt: claim.updatedAt,
  };
}

function toTeamNoteView(note: TeamKnowledgeNoteRecord): TeamKnowledgeNoteView {
  return {
    id: note.id,
    noteType: note.noteType,
    knowledgeKey: note.knowledgeKey,
    content: note.content,
    sensitiveLevel: note.sensitiveLevel,
    reviewState: note.reviewState,
    sourceIds: note.sourceIds,
    reviewedAt: note.reviewedAt,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
  };
}

function toConflictView(conflict: KnowledgeConflictRecord): KnowledgeConflictView {
  return {
    id: conflict.id,
    knowledgeKey: conflict.knowledgeKey,
    claimIds: conflict.claimIds,
    conflictType: conflict.conflictType,
    severity: conflict.severity,
    resolutionState: conflict.resolutionState,
    createdAt: conflict.createdAt,
    updatedAt: conflict.updatedAt,
  };
}

function toPublishedVersionView(
  version: PublishedKnowledgeVersionRecord,
): PublishedKnowledgeVersionView {
  return {
    id: version.id,
    knowledgeKey: version.knowledgeKey,
    version: version.version,
    status: version.status,
    summary: version.summary,
    claimIds: version.claimIds,
    teamNoteIds: version.teamNoteIds,
    sourceIds: version.sourceIds,
    publishedAt: version.publishedAt,
    expiresAt: version.expiresAt,
    downstreamReadiness: publishedReadiness(version),
    createdAt: version.createdAt,
    updatedAt: version.updatedAt,
  };
}

function assertAllowedDecision(input: {
  supported: string[];
  decision: string;
  currentState: string;
}) {
  if (!input.supported.includes(input.decision)) {
    throw new KnowledgeLifecycleError(
      "STATE_TRANSITION_INVALID",
      "Knowledge target does not support this review decision",
      {
        details: {
          decision: input.decision,
          currentState: input.currentState,
        },
      },
    );
  }
}

function conflictResolutionReviewDecision(
  resolutionState: z.infer<typeof conflictResolutionStateSchema>,
): "approve" | "archive" | "mark_conflict" {
  if (resolutionState === "resolved") {
    return "approve";
  }

  if (resolutionState === "ignored") {
    return "archive";
  }

  return "mark_conflict";
}

function sourceStateForDecision(
  decision: "approve" | "reject" | "mark_conflict" | "mark_stale" | "archive",
): KnowledgeSourceRecord["reviewState"] {
  if (decision === "approve") {
    return "approved";
  }

  if (decision === "reject") {
    return "rejected";
  }

  if (decision === "mark_conflict") {
    return "conflict";
  }

  if (decision === "mark_stale") {
    return "stale";
  }

  return "archived";
}

function claimStateForDecision(
  decision: "approve" | "reject" | "mark_conflict" | "request_source",
): ExtractedKnowledgeClaimRecord["reviewState"] {
  if (decision === "approve") {
    return "approved";
  }

  if (decision === "reject") {
    return "rejected";
  }

  if (decision === "mark_conflict") {
    return "conflict";
  }

  return "needs_source";
}

function teamNoteStateForDecision(
  decision: "approve" | "reject" | "mark_conflict" | "archive",
): TeamKnowledgeNoteRecord["reviewState"] {
  if (decision === "approve") {
    return "approved";
  }

  if (decision === "archive") {
    return "archived";
  }

  return "rejected";
}

export function createKnowledgeLifecycleRepository(
  database: KnowledgeLifecycleRepositoryDatabase,
) {
  async function getScopedSource(
    context: DataAccessContext,
    sourceId: string,
  ): Promise<KnowledgeSourceRecord> {
    const [source] = await database
      .select()
      .from(knowledgeSources)
      .where(
        and(
          eq(knowledgeSources.id, sourceId),
          eq(knowledgeSources.tenantId, context.tenantId),
          eq(knowledgeSources.teamId, context.teamId),
        ),
      )
      .limit(1);

    if (!source) {
      throw new KnowledgeLifecycleError(
        "NOT_FOUND",
        "Knowledge source was not found in this team",
      );
    }

    return source;
  }

  async function getScopedClaim(
    context: DataAccessContext,
    claimId: string,
  ): Promise<ExtractedKnowledgeClaimRecord> {
    const [claim] = await database
      .select()
      .from(extractedKnowledgeClaims)
      .where(
        and(
          eq(extractedKnowledgeClaims.id, claimId),
          eq(extractedKnowledgeClaims.tenantId, context.tenantId),
          eq(extractedKnowledgeClaims.teamId, context.teamId),
        ),
      )
      .limit(1);

    if (!claim) {
      throw new KnowledgeLifecycleError(
        "NOT_FOUND",
        "Knowledge claim was not found in this team",
      );
    }

    return claim;
  }

  async function getScopedTeamNote(
    context: DataAccessContext,
    noteId: string,
  ): Promise<TeamKnowledgeNoteRecord> {
    const [note] = await database
      .select()
      .from(teamKnowledgeNotes)
      .where(
        and(
          eq(teamKnowledgeNotes.id, noteId),
          eq(teamKnowledgeNotes.tenantId, context.tenantId),
          eq(teamKnowledgeNotes.teamId, context.teamId),
        ),
      )
      .limit(1);

    if (!note) {
      throw new KnowledgeLifecycleError(
        "NOT_FOUND",
        "Team knowledge note was not found in this team",
      );
    }

    return note;
  }

  async function getScopedConflict(
    context: DataAccessContext,
    conflictId: string,
  ): Promise<KnowledgeConflictRecord> {
    const [conflict] = await database
      .select()
      .from(knowledgeConflicts)
      .where(
        and(
          eq(knowledgeConflicts.id, conflictId),
          eq(knowledgeConflicts.tenantId, context.tenantId),
          eq(knowledgeConflicts.teamId, context.teamId),
        ),
      )
      .limit(1);

    if (!conflict) {
      throw new KnowledgeLifecycleError(
        "NOT_FOUND",
        "Knowledge conflict was not found in this team",
      );
    }

    return conflict;
  }

  async function assertScopedSources(
    context: DataAccessContext,
    sourceIds: string[],
  ): Promise<KnowledgeSourceRecord[]> {
    if (sourceIds.length === 0) {
      return [];
    }

    const sources = await database
      .select()
      .from(knowledgeSources)
      .where(
        and(
          eq(knowledgeSources.tenantId, context.tenantId),
          eq(knowledgeSources.teamId, context.teamId),
          inArray(knowledgeSources.id, sourceIds),
        ),
      );

    if (sources.length !== new Set(sourceIds).size) {
      throw new KnowledgeLifecycleError(
        "NOT_FOUND",
        "One or more knowledge sources were not found in this team",
      );
    }

    return sources;
  }

  async function insertReviewDecision(input: {
    context: DataAccessContext;
    targetType: "source" | "claim" | "team_note" | "conflict";
    targetId: string;
    decision:
      | "approve"
      | "reject"
      | "request_source"
      | "mark_conflict"
      | "mark_stale"
      | "archive"
      | "publish";
    reason: string;
    reviewedAt: Date;
  }) {
    await database.insert(knowledgeReviewDecisions).values({
      id: createRecordId("kreview"),
      tenantId: input.context.tenantId,
      teamId: input.context.teamId,
      targetType: input.targetType,
      targetId: input.targetId,
      decision: input.decision,
      reason: input.reason,
      reviewedBy: input.context.actorId,
      requestId: input.context.requestId,
      reviewedAt: input.reviewedAt,
    });
  }

  return {
    async registerKnowledgeSource(
      context: DataAccessContext,
      input: RegisterKnowledgeSourceInput,
    ): Promise<KnowledgeSourceView> {
      assertPermission(context, ["review_knowledge"]);
      const values = parseInput(registerSourceInputSchema, input);
      const normalizedSourceKey = normalizeSourceKey(values);

      try {
        const [existingSource] = await database
          .select({ id: knowledgeSources.id })
          .from(knowledgeSources)
          .where(
            and(
              eq(knowledgeSources.tenantId, context.tenantId),
              eq(knowledgeSources.teamId, context.teamId),
              eq(knowledgeSources.normalizedSourceKey, normalizedSourceKey),
            ),
          )
          .limit(1);

        if (existingSource) {
          throw new KnowledgeLifecycleError(
            "DUPLICATE_SOURCE",
            "Knowledge source already exists in this team",
          );
        }

        const [source] = await database
          .insert(knowledgeSources)
          .values({
            id: createRecordId("ksource"),
            tenantId: context.tenantId,
            teamId: context.teamId,
            sourceType: values.sourceType,
            title: values.title,
            owner: values.owner,
            url: values.url,
            normalizedSourceKey,
            retrievedAt: values.retrievedAt,
            trustLevel: values.trustLevel,
            reviewState: "registered" as const,
            refreshCadence: values.refreshCadence,
            intendedUse: values.intendedUse,
            createdBy: context.actorId,
            updatedBy: context.actorId,
          })
          .returning();

        return toSourceView(source);
      } catch (error) {
        throw mapDatabaseError(error);
      }
    },

    async getKnowledgeSource(
      context: DataAccessContext,
      input: z.input<typeof sourceIdInputSchema>,
    ): Promise<KnowledgeSourceView> {
      assertPermission(context, ["read_workspace", "review_knowledge"]);
      const values = parseInput(sourceIdInputSchema, input);

      try {
        return toSourceView(await getScopedSource(context, values.sourceId));
      } catch (error) {
        throw mapDatabaseError(error);
      }
    },

    async listKnowledgeSources(
      context: DataAccessContext,
      input?: ListKnowledgeInput,
    ): Promise<KnowledgeSourceListResult> {
      assertPermission(context, ["read_workspace", "review_knowledge"]);
      const values = parseInput(listInputSchema, input ?? {});

      try {
        const sources = await database
          .select()
          .from(knowledgeSources)
          .where(
            and(
              eq(knowledgeSources.tenantId, context.tenantId),
              eq(knowledgeSources.teamId, context.teamId),
            ),
          )
          .orderBy(desc(knowledgeSources.createdAt))
          .limit(values.limit);

        return {
          items: sources.map(toSourceView),
        };
      } catch (error) {
        throw mapDatabaseError(error);
      }
    },

    async addExtractedKnowledgeClaim(
      context: DataAccessContext,
      input: AddExtractedKnowledgeClaimInput,
    ): Promise<ExtractedKnowledgeClaimView> {
      assertPermission(context, ["review_knowledge"]);
      const values = parseInput(addClaimInputSchema, input);

      try {
        await getScopedSource(context, values.sourceId);

        const [claim] = await database
          .insert(extractedKnowledgeClaims)
          .values({
            id: createRecordId("kclaim"),
            tenantId: context.tenantId,
            teamId: context.teamId,
            sourceId: values.sourceId,
            claimType: values.claimType,
            subject: values.subject,
            knowledgeKey: values.knowledgeKey,
            claimText: values.claimText,
            language: values.language,
            confidence: values.confidence,
            extractionMethod: values.extractionMethod,
            reviewState: "pending" as const,
            createdBy: context.actorId,
            updatedBy: context.actorId,
          })
          .returning();

        return toClaimView(claim);
      } catch (error) {
        throw mapDatabaseError(error);
      }
    },

    async addTeamKnowledgeNote(
      context: DataAccessContext,
      input: AddTeamKnowledgeNoteInput,
    ): Promise<TeamKnowledgeNoteView> {
      assertPermission(context, ["review_knowledge"]);
      const values = parseInput(addTeamNoteInputSchema, input);

      try {
        await assertScopedSources(context, values.sourceIds);

        const [note] = await database
          .insert(teamKnowledgeNotes)
          .values({
            id: createRecordId("knote"),
            tenantId: context.tenantId,
            teamId: context.teamId,
            noteType: values.noteType,
            knowledgeKey: values.knowledgeKey,
            content: values.content,
            sensitiveLevel: values.sensitiveLevel,
            reviewState: "draft" as const,
            sourceIds: values.sourceIds,
            createdBy: context.actorId,
            updatedBy: context.actorId,
          })
          .returning();

        return toTeamNoteView(note);
      } catch (error) {
        throw mapDatabaseError(error);
      }
    },

    async listKnowledgeReviewQueue(
      context: DataAccessContext,
      input?: ListKnowledgeInput,
    ): Promise<KnowledgeReviewQueueResult> {
      assertPermission(context, ["read_workspace", "review_knowledge"]);
      const values = parseInput(listInputSchema, input ?? {});

      try {
        const [sources, claims, notes] = await Promise.all([
          database
            .select()
            .from(knowledgeSources)
            .where(
              and(
                eq(knowledgeSources.tenantId, context.tenantId),
                eq(knowledgeSources.teamId, context.teamId),
                inArray(knowledgeSources.reviewState, [
                  "registered",
                  "extracting",
                  "reviewing",
                  "stale",
                  "conflict",
                ]),
              ),
            )
            .orderBy(desc(knowledgeSources.createdAt))
            .limit(values.limit),
          database
            .select()
            .from(extractedKnowledgeClaims)
            .where(
              and(
                eq(extractedKnowledgeClaims.tenantId, context.tenantId),
                eq(extractedKnowledgeClaims.teamId, context.teamId),
                inArray(extractedKnowledgeClaims.reviewState, [
                  "pending",
                  "conflict",
                  "needs_source",
                ]),
              ),
            )
            .orderBy(desc(extractedKnowledgeClaims.createdAt))
            .limit(values.limit),
          database
            .select()
            .from(teamKnowledgeNotes)
            .where(
              and(
                eq(teamKnowledgeNotes.tenantId, context.tenantId),
                eq(teamKnowledgeNotes.teamId, context.teamId),
                inArray(teamKnowledgeNotes.reviewState, [
                  "draft",
                  "reviewing",
                ]),
              ),
            )
            .orderBy(desc(teamKnowledgeNotes.createdAt))
            .limit(values.limit),
        ]);

        const items: KnowledgeReviewQueueItem[] = [
          ...sources.map((source) => ({
            targetType: "source" as const,
            targetId: source.id,
            label: source.title,
            reviewState: source.reviewState,
            createdAt: source.createdAt,
            source: toSourceView(source),
          })),
          ...claims.map((claim) => ({
            targetType: "claim" as const,
            targetId: claim.id,
            label: claim.subject,
            reviewState: claim.reviewState,
            createdAt: claim.createdAt,
            claim: toClaimView(claim),
          })),
          ...notes.map((note) => ({
            targetType: "team_note" as const,
            targetId: note.id,
            label: note.knowledgeKey,
            reviewState: note.reviewState,
            createdAt: note.createdAt,
            teamNote: toTeamNoteView(note),
          })),
        ];

        return {
          items: items
            .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
            .slice(0, values.limit),
        };
      } catch (error) {
        throw mapDatabaseError(error);
      }
    },

    async recordKnowledgeReviewDecision(
      context: DataAccessContext,
      input: KnowledgeReviewDecisionInput,
    ): Promise<KnowledgeSourceView | ExtractedKnowledgeClaimView | TeamKnowledgeNoteView> {
      assertPermission(context, ["review_knowledge"]);
      const values = parseInput(reviewDecisionInputSchema, input);
      const reviewedAt = new Date();

      try {
        if (values.targetType === "source") {
          const source = await getScopedSource(context, values.targetId);
          assertAllowedDecision({
            supported: [
              "approve",
              "reject",
              "mark_conflict",
              "mark_stale",
              "archive",
            ],
            decision: values.decision,
            currentState: source.reviewState,
          });

          const nextState = sourceStateForDecision(
            values.decision as
              | "approve"
              | "reject"
              | "mark_conflict"
              | "mark_stale"
              | "archive",
          );

          const [updatedSource] = await database
            .update(knowledgeSources)
            .set({
              reviewState: nextState,
              reviewedBy: context.actorId,
              reviewedAt,
              updatedBy: context.actorId,
              updatedAt: reviewedAt,
            })
            .where(
              and(
                eq(knowledgeSources.id, source.id),
                eq(knowledgeSources.tenantId, context.tenantId),
                eq(knowledgeSources.teamId, context.teamId),
              ),
            )
            .returning();

          await insertReviewDecision({
            context,
            targetType: values.targetType,
            targetId: values.targetId,
            decision: values.decision,
            reason: values.reason,
            reviewedAt,
          });

          return toSourceView(updatedSource);
        }

        if (values.targetType === "claim") {
          const claim = await getScopedClaim(context, values.targetId);
          assertAllowedDecision({
            supported: ["approve", "reject", "mark_conflict", "request_source"],
            decision: values.decision,
            currentState: claim.reviewState,
          });

          if (
            values.decision === "approve" &&
            !["pending", "needs_source"].includes(claim.reviewState)
          ) {
            throw new KnowledgeLifecycleError(
              "STATE_TRANSITION_INVALID",
              "Only pending knowledge claims can be approved",
              {
                details: {
                  currentState: claim.reviewState,
                },
              },
            );
          }

          const nextState = claimStateForDecision(
            values.decision as
              | "approve"
              | "reject"
              | "mark_conflict"
              | "request_source",
          );

          const [updatedClaim] = await database
            .update(extractedKnowledgeClaims)
            .set({
              reviewState: nextState,
              reviewedBy: context.actorId,
              reviewedAt,
              updatedBy: context.actorId,
              updatedAt: reviewedAt,
            })
            .where(
              and(
                eq(extractedKnowledgeClaims.id, claim.id),
                eq(extractedKnowledgeClaims.tenantId, context.tenantId),
                eq(extractedKnowledgeClaims.teamId, context.teamId),
              ),
            )
            .returning();

          await insertReviewDecision({
            context,
            targetType: values.targetType,
            targetId: values.targetId,
            decision: values.decision,
            reason: values.reason,
            reviewedAt,
          });

          return toClaimView(updatedClaim);
        }

        const note = await getScopedTeamNote(context, values.targetId);
        assertAllowedDecision({
          supported: ["approve", "reject", "mark_conflict", "archive"],
          decision: values.decision,
          currentState: note.reviewState,
        });

        if (
          values.decision === "approve" &&
          !["draft", "reviewing"].includes(note.reviewState)
        ) {
          throw new KnowledgeLifecycleError(
            "STATE_TRANSITION_INVALID",
            "Only draft or reviewing team knowledge notes can be approved",
            {
              details: {
                currentState: note.reviewState,
              },
            },
          );
        }

        const nextState = teamNoteStateForDecision(
          values.decision as "approve" | "reject" | "mark_conflict" | "archive",
        );

        const [updatedNote] = await database
          .update(teamKnowledgeNotes)
          .set({
            reviewState: nextState,
            reviewedBy: context.actorId,
            reviewedAt,
            updatedBy: context.actorId,
            updatedAt: reviewedAt,
          })
          .where(
            and(
              eq(teamKnowledgeNotes.id, note.id),
              eq(teamKnowledgeNotes.tenantId, context.tenantId),
              eq(teamKnowledgeNotes.teamId, context.teamId),
            ),
          )
          .returning();

        await insertReviewDecision({
          context,
          targetType: values.targetType,
          targetId: values.targetId,
          decision: values.decision,
          reason: values.reason,
          reviewedAt,
        });

        return toTeamNoteView(updatedNote);
      } catch (error) {
        throw mapDatabaseError(error);
      }
    },

    async recordKnowledgeConflict(
      context: DataAccessContext,
      input: RecordKnowledgeConflictInput,
    ): Promise<KnowledgeConflictView> {
      assertPermission(context, ["review_knowledge"]);
      const values = parseInput(recordConflictInputSchema, input);

      try {
        if (values.claimIds.length > 0) {
          const claims = await database
            .select()
            .from(extractedKnowledgeClaims)
            .where(
              and(
                eq(extractedKnowledgeClaims.tenantId, context.tenantId),
                eq(extractedKnowledgeClaims.teamId, context.teamId),
                inArray(extractedKnowledgeClaims.id, values.claimIds),
              ),
            );

          if (claims.length !== new Set(values.claimIds).size) {
            throw new KnowledgeLifecycleError(
              "NOT_FOUND",
              "One or more knowledge claims were not found in this team",
            );
          }
        }

        const [conflict] = await database
          .insert(knowledgeConflicts)
          .values({
            id: createRecordId("kconflict"),
            tenantId: context.tenantId,
            teamId: context.teamId,
            knowledgeKey: values.knowledgeKey,
            claimIds: values.claimIds,
            conflictType: values.conflictType,
            severity: values.severity,
            resolutionState: "open" as const,
            createdBy: context.actorId,
            updatedBy: context.actorId,
          })
          .returning();

        return toConflictView(conflict);
      } catch (error) {
        throw mapDatabaseError(error);
      }
    },

    async resolveKnowledgeConflict(
      context: DataAccessContext,
      input: ResolveKnowledgeConflictInput,
    ): Promise<KnowledgeConflictView> {
      assertPermission(context, ["review_knowledge"]);
      const values = parseInput(resolveConflictInputSchema, input);
      const reviewedAt = new Date();

      try {
        const conflict = await getScopedConflict(context, values.conflictId);

        if (
          conflict.resolutionState === "resolved" ||
          conflict.resolutionState === "ignored"
        ) {
          throw new KnowledgeLifecycleError(
            "STATE_TRANSITION_INVALID",
            "Resolved knowledge conflict cannot be resolved again",
            {
              details: {
                currentState: conflict.resolutionState,
              },
            },
          );
        }

        await insertReviewDecision({
          context,
          targetType: "conflict",
          targetId: conflict.id,
          decision: conflictResolutionReviewDecision(values.decision),
          reason: values.reason,
          reviewedAt,
        });

        const [decision] = await database
          .select({ id: knowledgeReviewDecisions.id })
          .from(knowledgeReviewDecisions)
          .where(
            and(
              eq(knowledgeReviewDecisions.tenantId, context.tenantId),
              eq(knowledgeReviewDecisions.teamId, context.teamId),
              eq(knowledgeReviewDecisions.targetType, "conflict"),
              eq(knowledgeReviewDecisions.targetId, conflict.id),
            ),
          )
          .orderBy(desc(knowledgeReviewDecisions.reviewedAt))
          .limit(1);

        const [updatedConflict] = await database
          .update(knowledgeConflicts)
          .set({
            resolutionState: values.decision,
            resolutionDecisionId: decision?.id,
            updatedBy: context.actorId,
            updatedAt: reviewedAt,
          })
          .where(
            and(
              eq(knowledgeConflicts.id, conflict.id),
              eq(knowledgeConflicts.tenantId, context.tenantId),
              eq(knowledgeConflicts.teamId, context.teamId),
            ),
          )
          .returning();

        return toConflictView(updatedConflict);
      } catch (error) {
        throw mapDatabaseError(error);
      }
    },

    async publishKnowledgeVersion(
      context: DataAccessContext,
      input: PublishKnowledgeVersionInput,
    ): Promise<PublishedKnowledgeVersionView> {
      assertPermission(context, ["review_knowledge"]);
      const values = parseInput(publishVersionInputSchema, input);

      try {
        const [openConflict] = await database
          .select({ id: knowledgeConflicts.id })
          .from(knowledgeConflicts)
          .where(
            and(
              eq(knowledgeConflicts.tenantId, context.tenantId),
              eq(knowledgeConflicts.teamId, context.teamId),
              eq(knowledgeConflicts.knowledgeKey, values.knowledgeKey),
              inArray(knowledgeConflicts.resolutionState, ["open", "reviewing"]),
            ),
          )
          .limit(1);

        if (openConflict) {
          throw new KnowledgeLifecycleError(
            "CONFLICTING_CLAIM",
            "Open knowledge conflict blocks publication",
          );
        }

        const selectedClaims =
          values.claimIds.length > 0
            ? await database
                .select()
                .from(extractedKnowledgeClaims)
                .where(
                  and(
                    eq(extractedKnowledgeClaims.tenantId, context.tenantId),
                    eq(extractedKnowledgeClaims.teamId, context.teamId),
                    inArray(extractedKnowledgeClaims.id, values.claimIds),
                  ),
                )
            : [];
        const selectedNotes =
          values.teamNoteIds.length > 0
            ? await database
                .select()
                .from(teamKnowledgeNotes)
                .where(
                  and(
                    eq(teamKnowledgeNotes.tenantId, context.tenantId),
                    eq(teamKnowledgeNotes.teamId, context.teamId),
                    inArray(teamKnowledgeNotes.id, values.teamNoteIds),
                  ),
                )
            : [];

        if (selectedClaims.length !== new Set(values.claimIds).size) {
          throw new KnowledgeLifecycleError(
            "NOT_FOUND",
            "One or more knowledge claims were not found in this team",
          );
        }

        if (selectedNotes.length !== new Set(values.teamNoteIds).size) {
          throw new KnowledgeLifecycleError(
            "NOT_FOUND",
            "One or more team knowledge notes were not found in this team",
          );
        }

        if (
          selectedClaims.some(
            (claim) =>
              claim.knowledgeKey !== values.knowledgeKey ||
              claim.reviewState !== "approved",
          ) ||
          selectedNotes.some(
            (note) =>
              note.knowledgeKey !== values.knowledgeKey ||
              note.reviewState !== "approved",
          )
        ) {
          throw new KnowledgeLifecycleError(
            "STATE_TRANSITION_INVALID",
            "Only approved knowledge content for the same key can be published",
          );
        }

        if (selectedNotes.some((note) => note.sensitiveLevel === "high")) {
          throw new KnowledgeLifecycleError(
            "SENSITIVE_DATA_NEEDS_REVIEW",
            "High-sensitive team knowledge cannot be published in this slice",
          );
        }

        if (selectedClaims.length === 0 && selectedNotes.length === 0) {
          throw new KnowledgeLifecycleError(
            "STATE_TRANSITION_INVALID",
            "Published knowledge needs at least one approved claim or team note",
          );
        }

        const sourceIds = [
          ...new Set([
            ...values.sourceIds,
            ...selectedClaims.map((claim) => claim.sourceId),
            ...selectedNotes.flatMap((note) => note.sourceIds),
          ]),
        ];
        const sources = await assertScopedSources(context, sourceIds);

        if (sources.some((source) => source.reviewState !== "approved")) {
          throw new KnowledgeLifecycleError(
            "STATE_TRANSITION_INVALID",
            "Published knowledge needs approved source records",
          );
        }

        const [latestVersion] = await database
          .select({ version: publishedKnowledgeVersions.version })
          .from(publishedKnowledgeVersions)
          .where(
            and(
              eq(publishedKnowledgeVersions.tenantId, context.tenantId),
              eq(publishedKnowledgeVersions.teamId, context.teamId),
              eq(publishedKnowledgeVersions.knowledgeKey, values.knowledgeKey),
            ),
          )
          .orderBy(desc(publishedKnowledgeVersions.version))
          .limit(1);

        const publishedAt = new Date();
        const [version] = await database
          .insert(publishedKnowledgeVersions)
          .values({
            id: createRecordId("kpub"),
            tenantId: context.tenantId,
            teamId: context.teamId,
            knowledgeKey: values.knowledgeKey,
            version: (latestVersion?.version ?? 0) + 1,
            status: "published" as const,
            summary: values.summary,
            claimIds: selectedClaims.map((claim) => claim.id),
            teamNoteIds: selectedNotes.map((note) => note.id),
            sourceIds,
            publishedBy: context.actorId,
            publishedAt,
            expiresAt: values.expiresAt,
          })
          .returning();

        await insertReviewDecision({
          context,
          targetType: "claim",
          targetId: version.id,
          decision: "publish",
          reason: `Published knowledge key ${values.knowledgeKey}`,
          reviewedAt: publishedAt,
        });

        return toPublishedVersionView(version);
      } catch (error) {
        throw mapDatabaseError(error);
      }
    },
  };
}
