import "server-only";

import { and, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";

import type { DatabaseClient } from "../db/client";
import type { DataAccessContext } from "../db/context";
import { createRecordId } from "../db/repository";
import {
  customerObjections,
  customerQuestions,
  liveSessionCaptures,
  sessionHostRoles,
  sessionNotes,
  sessionProductOrder,
  type CustomerObjectionRecord,
  type CustomerQuestionRecord,
  type LiveSessionCaptureRecord,
  type SessionHostRoleRecord,
  type SessionNoteRecord,
  type SessionProductOrderRecord,
} from "../db/schema";

export type SessionCaptureRepositoryDatabase = Pick<
  DatabaseClient,
  "delete" | "insert" | "select" | "update"
>;

export type SessionCaptureErrorCode =
  | "VALIDATION_ERROR"
  | "LONG_INPUT_LIMIT_EXCEEDED"
  | "FORBIDDEN_PERMISSION"
  | "DUPLICATE_SESSION_LABEL"
  | "STALE_DRAFT_VERSION"
  | "MISSING_REQUIRED_FIELD"
  | "SENSITIVE_DATA_NEEDS_REVIEW"
  | "NOT_FOUND"
  | "STATE_TRANSITION_INVALID"
  | "DATABASE_OPERATION_FAILED";

export class SessionCaptureError extends Error {
  readonly code: SessionCaptureErrorCode;
  readonly details?: Record<string, unknown>;

  constructor(
    code: SessionCaptureErrorCode,
    message: string,
    options?: {
      cause?: unknown;
      details?: Record<string, unknown>;
    },
  ) {
    super(message, { cause: options?.cause });
    this.name = "SessionCaptureError";
    this.code = code;
    this.details = options?.details;
  }
}

const statusSchema = z.enum([
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
const sourceModeSchema = z.enum(["manual", "transcript_import", "mixed"]);
const hostRoleSchema = z.enum([
  "host",
  "assistant",
  "operator",
  "product_specialist",
  "reviewer",
]);
const productRoleSchema = z.enum([
  "opening_compare",
  "main_offer",
  "objection_bridge",
  "alternative",
  "closing_push",
]);
const evidenceStateSchema = z.enum([
  "linked_product",
  "manual_only",
  "needs_review",
]);
const noteTypeSchema = z.enum([
  "opening",
  "product_explanation",
  "customer_question",
  "objection",
  "deal_signal",
  "gap",
  "follow_up",
]);
const noteSourceSchema = z.enum([
  "manual",
  "transcript_excerpt",
  "operator_summary",
]);
const reviewStateSchema = z.enum([
  "unreviewed",
  "reviewed",
  "needs_clarification",
]);
const questionTopicSchema = z.enum([
  "fit",
  "tension",
  "weight",
  "balance",
  "price",
  "durability",
  "comparison",
  "after_sales",
  "other",
]);
const redactionStateSchema = z.enum([
  "not_needed",
  "redacted",
  "needs_review",
]);
const objectionTypeSchema = z.enum([
  "price",
  "skill_level",
  "too_stiff",
  "too_head_heavy",
  "durability",
  "similar_owned",
  "trust",
  "other",
]);
const resolvedStateSchema = z.enum([
  "resolved",
  "partially_resolved",
  "unresolved",
  "unknown",
]);

const stringField = (max: number) => z.string().trim().min(1).max(max);
const optionalIdField = z.string().trim().min(1).max(160).optional();
const boundedStringList = z
  .array(z.string().trim().min(1).max(160))
  .max(24)
  .default([]);
const longTextField = (max: number) => z.string().trim().min(1).max(max);
const optionalLongTextField = (max: number) =>
  z.string().trim().max(max).optional().default("");

const hostRoleInputSchema = z.object({
  userId: optionalIdField,
  displayName: stringField(120),
  role: hostRoleSchema,
  responsibility: optionalLongTextField(2000),
});

const productOrderInputSchema = z.object({
  racketProductId: optionalIdField,
  displayModel: stringField(180),
  orderIndex: z.number().int().min(1).max(200),
  roleInSession: productRoleSchema,
  talkingPoints: boundedStringList,
  customerFit: boundedStringList,
  evidenceState: evidenceStateSchema.default("manual_only"),
});

const noteInputSchema = z.object({
  noteType: noteTypeSchema,
  content: longTextField(5000),
  source: noteSourceSchema.default("manual"),
  sequence: z.number().int().min(1).max(1000),
  reviewState: reviewStateSchema.default("unreviewed"),
});

const questionInputSchema = z.object({
  questionText: longTextField(2000),
  topic: questionTopicSchema.default("other"),
  relatedProductIds: boundedStringList,
  answerGiven: optionalLongTextField(4000),
  needsKnowledge: z.boolean().default(false),
  sensitiveRedactionState: redactionStateSchema.default("not_needed"),
});

const objectionInputSchema = z.object({
  objectionType: objectionTypeSchema.default("other"),
  content: longTextField(3000),
  responseUsed: optionalLongTextField(4000),
  resolvedState: resolvedStateSchema.default("unknown"),
  followUpNeeded: z.boolean().default(false),
});

const createSessionInputSchema = z.object({
  title: stringField(240),
  sessionDate: z.coerce.date(),
  platform: platformSchema,
  sourceMode: sourceModeSchema.default("manual"),
  summary: optionalLongTextField(12000),
  sensitiveRedactionState: redactionStateSchema.default("not_needed"),
  hostRoles: z.array(hostRoleInputSchema).min(1).max(12),
  productOrder: z.array(productOrderInputSchema).min(1).max(100),
  notes: z.array(noteInputSchema).max(200).default([]),
  customerQuestions: z.array(questionInputSchema).max(200).default([]),
  customerObjections: z.array(objectionInputSchema).max(200).default([]),
});

const autosaveSessionInputSchema = z.object({
  sessionId: stringField(160),
  draftVersion: z.number().int().min(1),
  summary: optionalLongTextField(12000),
  sensitiveRedactionState: redactionStateSchema.optional(),
  notes: z.array(noteInputSchema).max(200).optional(),
  customerQuestions: z.array(questionInputSchema).max(200).optional(),
  customerObjections: z.array(objectionInputSchema).max(200).optional(),
});

const submitSessionInputSchema = z.object({
  sessionId: stringField(160),
  draftVersion: z.number().int().min(1),
});

const sessionIdInputSchema = z.object({
  sessionId: stringField(160),
});

const listSessionInputSchema = z.object({
  status: z.array(statusSchema).max(12).optional(),
  search: z.string().trim().min(1).max(180).optional(),
  limit: z.number().int().min(1).max(100).default(20),
});

export type CreateSessionCaptureInput = z.input<
  typeof createSessionInputSchema
>;
export type AutosaveSessionDraftInput = z.input<
  typeof autosaveSessionInputSchema
>;
export type SubmitSessionCaptureInput = z.input<
  typeof submitSessionInputSchema
>;
export type ListSessionCapturesInput = z.input<typeof listSessionInputSchema>;

export type SessionDownstreamWorkflow =
  | "ai_review"
  | "talk_tracks"
  | "next_actions"
  | "knowledge_gap";

export type SessionDownstreamReadiness = {
  workflow: SessionDownstreamWorkflow;
  ready: boolean;
  blockedBy: string[];
};

export type SessionCaptureView = {
  id: string;
  title: string;
  normalizedTitle: string;
  sessionDate: Date;
  platform: z.infer<typeof platformSchema>;
  status: z.infer<typeof statusSchema>;
  summary: string;
  sourceMode: z.infer<typeof sourceModeSchema>;
  draftVersion: number;
  sensitiveRedactionState: z.infer<typeof redactionStateSchema>;
  lastAutosavedAt: Date | null;
  submittedAt: Date | null;
  hostRoles: Array<{
    id: string;
    userId: string | null;
    displayName: string;
    role: z.infer<typeof hostRoleSchema>;
    responsibility: string;
  }>;
  productOrder: Array<{
    id: string;
    racketProductId: string | null;
    displayModel: string;
    orderIndex: number;
    roleInSession: z.infer<typeof productRoleSchema>;
    talkingPoints: string[];
    customerFit: string[];
    evidenceState: z.infer<typeof evidenceStateSchema>;
  }>;
  notes: Array<{
    id: string;
    noteType: z.infer<typeof noteTypeSchema>;
    content: string;
    source: z.infer<typeof noteSourceSchema>;
    sequence: number;
    reviewState: z.infer<typeof reviewStateSchema>;
  }>;
  customerQuestions: Array<{
    id: string;
    questionText: string;
    topic: z.infer<typeof questionTopicSchema>;
    relatedProductIds: string[];
    answerGiven: string;
    needsKnowledge: boolean;
    sensitiveRedactionState: z.infer<typeof redactionStateSchema>;
  }>;
  customerObjections: Array<{
    id: string;
    objectionType: z.infer<typeof objectionTypeSchema>;
    content: string;
    responseUsed: string;
    resolvedState: z.infer<typeof resolvedStateSchema>;
    followUpNeeded: boolean;
  }>;
  downstreamReadiness: SessionDownstreamReadiness[];
  createdAt: Date;
  updatedAt: Date;
};

export type SessionCaptureListResult = {
  items: SessionCaptureView[];
};

type SessionChildren = {
  hostRoles: SessionHostRoleRecord[];
  productOrder: SessionProductOrderRecord[];
  notes: SessionNoteRecord[];
  customerQuestions: CustomerQuestionRecord[];
  customerObjections: CustomerObjectionRecord[];
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
    throw new SessionCaptureError(
      "LONG_INPUT_LIMIT_EXCEEDED",
      "Session capture input exceeds the current length limit",
      { details: { issues } },
    );
  }

  throw new SessionCaptureError(
    "VALIDATION_ERROR",
    "Session capture input is invalid",
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
    throw new SessionCaptureError(
      "FORBIDDEN_PERMISSION",
      "Actor is missing required session capture permission",
      {
        details: {
          requestId: context.requestId,
        },
      },
    );
  }
}

function normalizeLookupValue(value: string): string {
  return value.trim().toLocaleLowerCase().replace(/[\s_-]+/g, "");
}

function sessionDayKey(sessionDate: Date): string {
  return sessionDate.toISOString().slice(0, 10);
}

function createSessionLabelKey(input: {
  title: string;
  sessionDate: Date;
}): string {
  return `${sessionDayKey(input.sessionDate)}:${normalizeLookupValue(input.title)}`;
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

function mapDatabaseError(error: unknown): SessionCaptureError {
  if (error instanceof SessionCaptureError) {
    return error;
  }

  if (error instanceof Error) {
    const constraintName = getDatabaseConstraintName(error);

    if (
      error.message.includes("session_captures_scope_label_unique") ||
      constraintName === "session_captures_scope_label_unique"
    ) {
      return new SessionCaptureError(
        "DUPLICATE_SESSION_LABEL",
        "Session title already exists for this team on the same day",
        { cause: error },
      );
    }

    return new SessionCaptureError(
      "DATABASE_OPERATION_FAILED",
      "Session capture persistence failed",
      { cause: error },
    );
  }

  return new SessionCaptureError(
    "DATABASE_OPERATION_FAILED",
    "Unknown session capture persistence failure",
  );
}

function emptyChildren(): SessionChildren {
  return {
    hostRoles: [],
    productOrder: [],
    notes: [],
    customerQuestions: [],
    customerObjections: [],
  };
}

function readinessBlockers(input: {
  session: LiveSessionCaptureRecord;
  children: SessionChildren;
}): string[] {
  const blockers = new Set<string>();

  if (["draft", "autosaved"].includes(input.session.status)) {
    blockers.add("not_submitted");
  }

  if (input.children.hostRoles.length === 0) {
    blockers.add("missing_host_role");
  }

  if (input.children.productOrder.length === 0) {
    blockers.add("missing_product_order");
  }

  if (input.session.sensitiveRedactionState === "needs_review") {
    blockers.add("needs_redaction_review");
  }

  if (
    input.children.customerQuestions.some(
      (question) => question.sensitiveRedactionState === "needs_review",
    )
  ) {
    blockers.add("needs_redaction_review");
  }

  if (input.session.status === "processing") {
    blockers.add("processing");
  }

  if (input.session.status === "failed") {
    blockers.add("failed");
  }

  if (input.session.status === "archived") {
    blockers.add("archived");
  }

  if (input.session.status === "deleted") {
    blockers.add("deleted");
  }

  return [...blockers];
}

function readinessForSession(input: {
  session: LiveSessionCaptureRecord;
  children: SessionChildren;
}): SessionDownstreamReadiness[] {
  const workflows: SessionDownstreamWorkflow[] = [
    "ai_review",
    "talk_tracks",
    "next_actions",
    "knowledge_gap",
  ];
  const blockers = readinessBlockers(input);
  const readyStatus = ["review_ready", "processed"].includes(
    input.session.status,
  );

  return workflows.map((workflow) => {
    if (readyStatus && blockers.length === 0) {
      return {
        workflow,
        ready: true,
        blockedBy: [],
      };
    }

    if (
      workflow === "knowledge_gap" &&
      ["autosaved", "failed"].includes(input.session.status) &&
      input.children.customerQuestions.some((question) => question.needsKnowledge) &&
      !blockers.includes("needs_redaction_review")
    ) {
      return {
        workflow,
        ready: true,
        blockedBy: [],
      };
    }

    return {
      workflow,
      ready: false,
      blockedBy: blockers.length > 0 ? blockers : ["not_ready"],
    };
  });
}

function toSessionView(
  session: LiveSessionCaptureRecord,
  children: SessionChildren,
): SessionCaptureView {
  return {
    id: session.id,
    title: session.title,
    normalizedTitle: session.normalizedTitle,
    sessionDate: session.sessionDate,
    platform: session.platform,
    status: session.status,
    summary: session.summary,
    sourceMode: session.sourceMode,
    draftVersion: session.draftVersion,
    sensitiveRedactionState: session.sensitiveRedactionState,
    lastAutosavedAt: session.lastAutosavedAt,
    submittedAt: session.submittedAt,
    hostRoles: children.hostRoles
      .sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime())
      .map((role) => ({
        id: role.id,
        userId: role.userId,
        displayName: role.displayName,
        role: role.role,
        responsibility: role.responsibility,
      })),
    productOrder: children.productOrder
      .sort((left, right) => left.orderIndex - right.orderIndex)
      .map((product) => ({
        id: product.id,
        racketProductId: product.racketProductId,
        displayModel: product.displayModel,
        orderIndex: product.orderIndex,
        roleInSession: product.roleInSession,
        talkingPoints: product.talkingPoints,
        customerFit: product.customerFit,
        evidenceState: product.evidenceState,
      })),
    notes: children.notes
      .sort((left, right) => left.sequence - right.sequence)
      .map((note) => ({
        id: note.id,
        noteType: note.noteType,
        content: note.content,
        source: note.source,
        sequence: note.sequence,
        reviewState: note.reviewState,
      })),
    customerQuestions: children.customerQuestions
      .sort((left, right) => left.sequence - right.sequence)
      .map((question) => ({
        id: question.id,
        questionText: question.questionText,
        topic: question.topic,
        relatedProductIds: question.relatedProductIds,
        answerGiven: question.answerGiven,
        needsKnowledge: question.needsKnowledge,
        sensitiveRedactionState: question.sensitiveRedactionState,
      })),
    customerObjections: children.customerObjections
      .sort((left, right) => left.sequence - right.sequence)
      .map((objection) => ({
        id: objection.id,
        objectionType: objection.objectionType,
        content: objection.content,
        responseUsed: objection.responseUsed,
        resolvedState: objection.resolvedState,
        followUpNeeded: objection.followUpNeeded,
      })),
    downstreamReadiness: readinessForSession({ session, children }),
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
  };
}

export function createSessionCaptureRepository(
  database: SessionCaptureRepositoryDatabase,
) {
  async function getScopedSession(
    context: DataAccessContext,
    sessionId: string,
  ): Promise<LiveSessionCaptureRecord> {
    const [session] = await database
      .select()
      .from(liveSessionCaptures)
      .where(
        and(
          eq(liveSessionCaptures.id, sessionId),
          eq(liveSessionCaptures.tenantId, context.tenantId),
          eq(liveSessionCaptures.teamId, context.teamId),
        ),
      )
      .limit(1);

    if (!session) {
      throw new SessionCaptureError(
        "NOT_FOUND",
        "Session capture was not found in this team",
      );
    }

    return session;
  }

  async function listChildrenForSessions(
    context: DataAccessContext,
    sessionIds: string[],
  ): Promise<Record<string, SessionChildren>> {
    if (sessionIds.length === 0) {
      return {};
    }

    const [hostRoles, productOrder, notes, questions, objections] =
      await Promise.all([
        database
          .select()
          .from(sessionHostRoles)
          .where(
            and(
              eq(sessionHostRoles.tenantId, context.tenantId),
              eq(sessionHostRoles.teamId, context.teamId),
              inArray(sessionHostRoles.sessionId, sessionIds),
            ),
          ),
        database
          .select()
          .from(sessionProductOrder)
          .where(
            and(
              eq(sessionProductOrder.tenantId, context.tenantId),
              eq(sessionProductOrder.teamId, context.teamId),
              inArray(sessionProductOrder.sessionId, sessionIds),
            ),
          ),
        database
          .select()
          .from(sessionNotes)
          .where(
            and(
              eq(sessionNotes.tenantId, context.tenantId),
              eq(sessionNotes.teamId, context.teamId),
              inArray(sessionNotes.sessionId, sessionIds),
            ),
          ),
        database
          .select()
          .from(customerQuestions)
          .where(
            and(
              eq(customerQuestions.tenantId, context.tenantId),
              eq(customerQuestions.teamId, context.teamId),
              inArray(customerQuestions.sessionId, sessionIds),
            ),
          ),
        database
          .select()
          .from(customerObjections)
          .where(
            and(
              eq(customerObjections.tenantId, context.tenantId),
              eq(customerObjections.teamId, context.teamId),
              inArray(customerObjections.sessionId, sessionIds),
            ),
          ),
      ]);

    return Object.fromEntries(
      sessionIds.map((sessionId) => [
        sessionId,
        {
          hostRoles: hostRoles.filter((role) => role.sessionId === sessionId),
          productOrder: productOrder.filter(
            (product) => product.sessionId === sessionId,
          ),
          notes: notes.filter((note) => note.sessionId === sessionId),
          customerQuestions: questions.filter(
            (question) => question.sessionId === sessionId,
          ),
          customerObjections: objections.filter(
            (objection) => objection.sessionId === sessionId,
          ),
        },
      ]),
    );
  }

  async function getSessionView(
    context: DataAccessContext,
    session: LiveSessionCaptureRecord,
  ): Promise<SessionCaptureView> {
    const childrenBySession = await listChildrenForSessions(context, [
      session.id,
    ]);

    return toSessionView(session, childrenBySession[session.id] ?? emptyChildren());
  }

  async function insertStructuredChildren(
    context: DataAccessContext,
    sessionId: string,
    values: {
      hostRoles?: Array<z.infer<typeof hostRoleInputSchema>>;
      productOrder?: Array<z.infer<typeof productOrderInputSchema>>;
      notes?: Array<z.infer<typeof noteInputSchema>>;
      customerQuestions?: Array<z.infer<typeof questionInputSchema>>;
      customerObjections?: Array<z.infer<typeof objectionInputSchema>>;
    },
  ) {
    if (values.hostRoles && values.hostRoles.length > 0) {
      await database.insert(sessionHostRoles).values(
        values.hostRoles.map((role) => ({
          id: createRecordId("shost"),
          tenantId: context.tenantId,
          teamId: context.teamId,
          sessionId,
          userId: role.userId,
          displayName: role.displayName,
          role: role.role,
          responsibility: role.responsibility,
        })),
      );
    }

    if (values.productOrder && values.productOrder.length > 0) {
      await database.insert(sessionProductOrder).values(
        values.productOrder.map((product) => ({
          id: createRecordId("sprod"),
          tenantId: context.tenantId,
          teamId: context.teamId,
          sessionId,
          racketProductId: product.racketProductId,
          displayModel: product.displayModel,
          orderIndex: product.orderIndex,
          roleInSession: product.roleInSession,
          talkingPoints: product.talkingPoints,
          customerFit: product.customerFit,
          evidenceState: product.evidenceState,
        })),
      );
    }

    if (values.notes && values.notes.length > 0) {
      await database.insert(sessionNotes).values(
        values.notes.map((note) => ({
          id: createRecordId("snote"),
          tenantId: context.tenantId,
          teamId: context.teamId,
          sessionId,
          noteType: note.noteType,
          content: note.content,
          source: note.source,
          sequence: note.sequence,
          reviewState: note.reviewState,
        })),
      );
    }

    if (values.customerQuestions && values.customerQuestions.length > 0) {
      await database.insert(customerQuestions).values(
        values.customerQuestions.map((question, index) => ({
          id: createRecordId("squestion"),
          tenantId: context.tenantId,
          teamId: context.teamId,
          sessionId,
          questionText: question.questionText,
          topic: question.topic,
          relatedProductIds: question.relatedProductIds,
          answerGiven: question.answerGiven,
          needsKnowledge: question.needsKnowledge,
          sensitiveRedactionState: question.sensitiveRedactionState,
          sequence: index + 1,
        })),
      );
    }

    if (values.customerObjections && values.customerObjections.length > 0) {
      await database.insert(customerObjections).values(
        values.customerObjections.map((objection, index) => ({
          id: createRecordId("sobjection"),
          tenantId: context.tenantId,
          teamId: context.teamId,
          sessionId,
          objectionType: objection.objectionType,
          content: objection.content,
          responseUsed: objection.responseUsed,
          resolvedState: objection.resolvedState,
          followUpNeeded: objection.followUpNeeded,
          sequence: index + 1,
        })),
      );
    }
  }

  async function replaceAutosaveChildren(
    context: DataAccessContext,
    sessionId: string,
    values: {
      notes?: Array<z.infer<typeof noteInputSchema>>;
      customerQuestions?: Array<z.infer<typeof questionInputSchema>>;
      customerObjections?: Array<z.infer<typeof objectionInputSchema>>;
    },
  ) {
    if (values.notes) {
      await database
        .delete(sessionNotes)
        .where(
          and(
            eq(sessionNotes.sessionId, sessionId),
            eq(sessionNotes.tenantId, context.tenantId),
            eq(sessionNotes.teamId, context.teamId),
          ),
        );
      await insertStructuredChildren(context, sessionId, {
        notes: values.notes,
      });
    }

    if (values.customerQuestions) {
      await database
        .delete(customerQuestions)
        .where(
          and(
            eq(customerQuestions.sessionId, sessionId),
            eq(customerQuestions.tenantId, context.tenantId),
            eq(customerQuestions.teamId, context.teamId),
          ),
        );
      await insertStructuredChildren(context, sessionId, {
        customerQuestions: values.customerQuestions,
      });
    }

    if (values.customerObjections) {
      await database
        .delete(customerObjections)
        .where(
          and(
            eq(customerObjections.sessionId, sessionId),
            eq(customerObjections.tenantId, context.tenantId),
            eq(customerObjections.teamId, context.teamId),
          ),
        );
      await insertStructuredChildren(context, sessionId, {
        customerObjections: values.customerObjections,
      });
    }
  }

  return {
    async createSessionCapture(
      context: DataAccessContext,
      input: CreateSessionCaptureInput,
    ): Promise<SessionCaptureView> {
      assertPermission(context, ["capture_session"]);
      const values = parseInput(createSessionInputSchema, input);
      const normalizedTitle = normalizeLookupValue(values.title);
      const sessionLabelKey = createSessionLabelKey(values);

      try {
        const [existingSession] = await database
          .select({ id: liveSessionCaptures.id })
          .from(liveSessionCaptures)
          .where(
            and(
              eq(liveSessionCaptures.tenantId, context.tenantId),
              eq(liveSessionCaptures.teamId, context.teamId),
              eq(liveSessionCaptures.sessionLabelKey, sessionLabelKey),
            ),
          )
          .limit(1);

        if (existingSession) {
          throw new SessionCaptureError(
            "DUPLICATE_SESSION_LABEL",
            "Session title already exists for this team on the same day",
          );
        }

        const sessionId = createRecordId("session");
        const [session] = await database
          .insert(liveSessionCaptures)
          .values({
            id: sessionId,
            tenantId: context.tenantId,
            teamId: context.teamId,
            title: values.title,
            normalizedTitle,
            sessionLabelKey,
            sessionDate: values.sessionDate,
            platform: values.platform,
            status: "draft" as const,
            summary: values.summary,
            sourceMode: values.sourceMode,
            draftVersion: 1,
            sensitiveRedactionState: values.sensitiveRedactionState,
            createdBy: context.actorId,
            updatedBy: context.actorId,
          })
          .returning();

        await insertStructuredChildren(context, sessionId, {
          hostRoles: values.hostRoles,
          productOrder: values.productOrder,
          notes: values.notes,
          customerQuestions: values.customerQuestions,
          customerObjections: values.customerObjections,
        });

        return getSessionView(context, session);
      } catch (error) {
        throw mapDatabaseError(error);
      }
    },

    async listSessionCaptures(
      context: DataAccessContext,
      input?: ListSessionCapturesInput,
    ): Promise<SessionCaptureListResult> {
      assertPermission(context, ["read_workspace", "capture_session"]);
      const values = parseInput(listSessionInputSchema, input ?? {});

      try {
        const sessions = await database
          .select()
          .from(liveSessionCaptures)
          .where(
            and(
              eq(liveSessionCaptures.tenantId, context.tenantId),
              eq(liveSessionCaptures.teamId, context.teamId),
              values.status && values.status.length > 0
                ? inArray(liveSessionCaptures.status, values.status)
                : undefined,
            ),
          )
          .orderBy(desc(liveSessionCaptures.createdAt))
          .limit(values.limit);

        const filteredSessions = values.search
          ? sessions.filter((session) =>
              session.normalizedTitle.includes(
                normalizeLookupValue(values.search ?? ""),
              ),
            )
          : sessions;
        const childrenBySession = await listChildrenForSessions(
          context,
          filteredSessions.map((session) => session.id),
        );

        return {
          items: filteredSessions.map((session) =>
            toSessionView(
              session,
              childrenBySession[session.id] ?? emptyChildren(),
            ),
          ),
        };
      } catch (error) {
        throw mapDatabaseError(error);
      }
    },

    async getSessionCaptureDetail(
      context: DataAccessContext,
      input: z.input<typeof sessionIdInputSchema>,
    ): Promise<SessionCaptureView> {
      assertPermission(context, ["read_workspace", "capture_session"]);
      const values = parseInput(sessionIdInputSchema, input);

      try {
        const session = await getScopedSession(context, values.sessionId);

        return getSessionView(context, session);
      } catch (error) {
        throw mapDatabaseError(error);
      }
    },

    async autosaveSessionDraft(
      context: DataAccessContext,
      input: AutosaveSessionDraftInput,
    ): Promise<SessionCaptureView> {
      assertPermission(context, ["capture_session"]);
      const values = parseInput(autosaveSessionInputSchema, input);

      try {
        const session = await getScopedSession(context, values.sessionId);

        if (!["draft", "autosaved", "failed"].includes(session.status)) {
          throw new SessionCaptureError(
            "STATE_TRANSITION_INVALID",
            "Session capture cannot be autosaved from its current state",
            {
              details: {
                currentStatus: session.status,
              },
            },
          );
        }

        if (session.draftVersion !== values.draftVersion) {
          throw new SessionCaptureError(
            "STALE_DRAFT_VERSION",
            "Session draft has been updated; refresh before saving",
            {
              details: {
                currentDraftVersion: session.draftVersion,
              },
            },
          );
        }

        const autosavedAt = new Date();
        const [updatedSession] = await database
          .update(liveSessionCaptures)
          .set({
            status: "autosaved" as const,
            summary: values.summary,
            sensitiveRedactionState:
              values.sensitiveRedactionState ?? session.sensitiveRedactionState,
            draftVersion: session.draftVersion + 1,
            lastAutosavedAt: autosavedAt,
            updatedBy: context.actorId,
            updatedAt: autosavedAt,
          })
          .where(
            and(
              eq(liveSessionCaptures.id, session.id),
              eq(liveSessionCaptures.tenantId, context.tenantId),
              eq(liveSessionCaptures.teamId, context.teamId),
            ),
          )
          .returning();

        await replaceAutosaveChildren(context, session.id, {
          notes: values.notes,
          customerQuestions: values.customerQuestions,
          customerObjections: values.customerObjections,
        });

        return getSessionView(context, updatedSession);
      } catch (error) {
        throw mapDatabaseError(error);
      }
    },

    async submitSessionCapture(
      context: DataAccessContext,
      input: SubmitSessionCaptureInput,
    ): Promise<SessionCaptureView> {
      assertPermission(context, ["capture_session"]);
      const values = parseInput(submitSessionInputSchema, input);

      try {
        const session = await getScopedSession(context, values.sessionId);

        if (!["draft", "autosaved", "submitted"].includes(session.status)) {
          throw new SessionCaptureError(
            "STATE_TRANSITION_INVALID",
            "Session capture cannot be submitted from its current state",
            {
              details: {
                currentStatus: session.status,
              },
            },
          );
        }

        if (session.draftVersion !== values.draftVersion) {
          throw new SessionCaptureError(
            "STALE_DRAFT_VERSION",
            "Session draft has been updated; refresh before submitting",
            {
              details: {
                currentDraftVersion: session.draftVersion,
              },
            },
          );
        }

        const childrenBySession = await listChildrenForSessions(context, [
          session.id,
        ]);
        const children = childrenBySession[session.id] ?? emptyChildren();
        const blockers = readinessBlockers({
          session: {
            ...session,
            status: "review_ready",
          },
          children,
        });

        if (
          blockers.includes("missing_host_role") ||
          blockers.includes("missing_product_order")
        ) {
          throw new SessionCaptureError(
            "MISSING_REQUIRED_FIELD",
            "Session capture is missing required fields before submission",
            { details: { blockers } },
          );
        }

        if (blockers.includes("needs_redaction_review")) {
          throw new SessionCaptureError(
            "SENSITIVE_DATA_NEEDS_REVIEW",
            "Session capture needs sensitive data review before submission",
            { details: { blockers } },
          );
        }

        const submittedAt = new Date();
        const [updatedSession] = await database
          .update(liveSessionCaptures)
          .set({
            status: "review_ready" as const,
            submittedBy: context.actorId,
            submittedAt,
            updatedBy: context.actorId,
            updatedAt: submittedAt,
          })
          .where(
            and(
              eq(liveSessionCaptures.id, session.id),
              eq(liveSessionCaptures.tenantId, context.tenantId),
              eq(liveSessionCaptures.teamId, context.teamId),
            ),
          )
          .returning();

        return getSessionView(context, updatedSession);
      } catch (error) {
        throw mapDatabaseError(error);
      }
    },
  };
}
