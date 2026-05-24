import "server-only";

import { createHash } from "node:crypto";

import { and, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";

import type { DatabaseClient } from "../db/client";
import type { DataAccessContext } from "../db/context";
import { createRecordId } from "../db/repository";
import {
  appUsers,
  nextSessionTaskAssignees,
  nextSessionTaskChecklistItems,
  nextSessionTaskDependencies,
  nextSessionTaskFeedbackSignals,
  nextSessionTaskReviewResults,
  nextSessionTaskSources,
  nextSessionTasks,
  teamMemberships,
  type AppUserRecord,
  type NextSessionTaskChecklistItemRecord,
  type NextSessionTaskDependencyRecord,
  type NextSessionTaskFeedbackSignalRecord,
  type NextSessionTaskRecord,
  type NextSessionTaskSourceRecord,
} from "../db/schema";

export type NextSessionTaskRepositoryDatabase = Pick<
  DatabaseClient,
  "insert" | "select" | "update"
>;

export type NextSessionTaskErrorCode =
  | "VALIDATION_ERROR"
  | "LONG_INPUT_LIMIT_EXCEEDED"
  | "FORBIDDEN_PERMISSION"
  | "SOURCE_NOT_REVIEW_READY"
  | "ASSIGNEE_NOT_ACTIVE"
  | "DUE_DATE_INVALID"
  | "DUPLICATE_TASK"
  | "TASK_STATE_CONFLICT"
  | "STATE_TRANSITION_INVALID"
  | "CHECKLIST_REQUIRED_INCOMPLETE"
  | "DEPENDENCY_BLOCKED"
  | "REVIEW_REQUIRED"
  | "SENSITIVE_DATA_BLOCKED"
  | "NOT_FOUND"
  | "DATABASE_OPERATION_FAILED";

export class NextSessionTaskError extends Error {
  readonly code: NextSessionTaskErrorCode;
  readonly details?: Record<string, unknown>;

  constructor(
    code: NextSessionTaskErrorCode,
    message: string,
    options?: {
      cause?: unknown;
      details?: Record<string, unknown>;
    },
  ) {
    super(message, { cause: options?.cause });
    this.name = "NextSessionTaskError";
    this.code = code;
    this.details = options?.details;
  }
}

const taskTypeSchema = z.enum([
  "prepare_product_info",
  "fix_talk_track",
  "review_knowledge_gap",
  "follow_up_question",
  "plan_short_video",
  "update_session_theme",
  "assign_review",
  "export_or_report",
  "other",
]);
const prioritySchema = z.enum(["low", "normal", "high", "urgent"]);
const statusSchema = z.enum([
  "draft",
  "assigned",
  "in_progress",
  "blocked",
  "done",
  "reviewing",
  "closed",
  "reopened",
  "canceled",
  "archived",
]);
const sourceWorkflowSchema = z.enum([
  "session_capture",
  "ai_review",
  "knowledge_gap",
  "talk_track",
  "qa_feedback",
  "manual",
]);
const sourceStateSchema = z.enum([
  "draft",
  "candidate",
  "review_ready",
  "accepted",
  "partially_accepted",
  "manual",
  "rejected",
  "provider_failed",
  "validation_failed",
]);
const deadlinePolicySchema = z.enum([
  "absolute",
  "before_next_session",
  "no_due_date",
]);
const redactionStateSchema = z.enum([
  "not_needed",
  "redacted",
  "needs_review",
  "blocked",
]);
const checklistStatusSchema = z.enum(["todo", "done", "blocked", "canceled"]);
const dependencyTypeSchema = z.enum([
  "task",
  "session",
  "product",
  "knowledge_version",
  "talk_track",
  "review_decision",
]);
const dependencyStateSchema = z.enum([
  "pending",
  "satisfied",
  "blocked",
  "waived",
]);
const reviewDecisionSchema = z.enum([
  "approve_close",
  "request_changes",
  "reject_result",
  "reopen",
  "cancel",
]);
const feedbackSignalSchema = z.enum([
  "completed",
  "reopened",
  "blocked",
  "duplicate",
  "not_useful",
  "helped_next_session",
  "missed_due_date",
  "needs_better_source",
]);
const feedbackRouteSchema = z.enum([
  "team_review",
  "knowledge_review",
  "prompt_review",
  "workflow_review",
  "none",
]);

const stringField = (max: number) => z.string().trim().min(1).max(max);
const optionalStringField = (max: number) =>
  z.string().trim().max(max).optional().default("");
const longTextField = (max: number) => z.string().trim().min(1).max(max);
const optionalLongTextField = (max: number) =>
  z.string().trim().max(max).optional().default("");
const optionalIdField = z.string().trim().min(1).max(180).optional();
const idListSchema = z.array(z.string().trim().min(1).max(180)).max(32).default([]);

const taskInputSchema = z.object({
  title: stringField(240),
  summary: longTextField(5000),
  taskType: taskTypeSchema,
  priority: prioritySchema.default("normal"),
  ownerId: optionalIdField,
  targetSessionId: optionalIdField,
  dueAt: z.coerce.date().optional(),
  deadlinePolicy: deadlinePolicySchema.default("no_due_date"),
  reviewRequired: z.boolean().default(false),
  relatedRacketProductIds: idListSchema,
});

const sourceInputSchema = z.object({
  sourceWorkflow: sourceWorkflowSchema,
  sourceId: stringField(180),
  sourceVersionId: optionalStringField(180),
  sourceSectionId: optionalStringField(180),
  aiRunId: optionalStringField(180),
  promptVersion: optionalStringField(180),
  sourceState: sourceStateSchema,
  knowledgeVersionIds: idListSchema,
  racketProductIds: idListSchema,
  talkTrackAssetIds: idListSchema,
  sensitiveRedactionState: redactionStateSchema.default("not_needed"),
});

const checklistInputSchema = z.object({
  title: stringField(240),
  required: z.boolean().default(false),
});

const createTaskInputSchema = z.object({
  task: taskInputSchema,
  source: sourceInputSchema,
  checklist: z.array(checklistInputSchema).max(50).default([]),
});

const taskIdInputSchema = z.object({
  taskId: stringField(180),
});

const listTaskInputSchema = z.object({
  status: z.array(statusSchema).max(12).optional(),
  ownerId: optionalIdField,
  sourceWorkflow: sourceWorkflowSchema.optional(),
  limit: z.number().int().min(1).max(100).default(20),
});

const updateStatusInputSchema = taskIdInputSchema.extend({
  fromStatus: statusSchema,
  toStatus: statusSchema,
  reason: optionalStringField(800),
});

const updateChecklistInputSchema = taskIdInputSchema.extend({
  itemId: stringField(180),
  status: checklistStatusSchema,
});

const recordDependencyInputSchema = taskIdInputSchema.extend({
  dependsOnType: dependencyTypeSchema,
  dependsOnId: stringField(180),
  dependencyState: dependencyStateSchema.default("pending"),
  reason: stringField(600),
});

const updateDependencyInputSchema = taskIdInputSchema.extend({
  dependencyId: stringField(180),
  dependencyState: dependencyStateSchema,
  reason: optionalStringField(600),
});

const completeTaskInputSchema = taskIdInputSchema.extend({
  fromStatus: statusSchema,
  resultSummary: optionalLongTextField(5000),
});

const reviewResultInputSchema = taskIdInputSchema.extend({
  decision: reviewDecisionSchema,
  reason: stringField(600),
  resultSummary: optionalLongTextField(5000),
});

const feedbackInputSchema = taskIdInputSchema.extend({
  sourceWorkflow: sourceWorkflowSchema,
  signalType: feedbackSignalSchema,
  reason: stringField(600),
  routesTo: feedbackRouteSchema.default("none"),
});

export type CreateNextSessionTaskInput = z.input<typeof createTaskInputSchema>;
export type GetNextSessionTaskInput = z.input<typeof taskIdInputSchema>;
export type ListNextSessionTasksInput = z.input<typeof listTaskInputSchema>;
export type UpdateNextSessionTaskStatusInput = z.input<
  typeof updateStatusInputSchema
>;
export type UpdateTaskChecklistItemInput = z.input<
  typeof updateChecklistInputSchema
>;
export type RecordTaskDependencyInput = z.input<
  typeof recordDependencyInputSchema
>;
export type UpdateTaskDependencyStateInput = z.input<
  typeof updateDependencyInputSchema
>;
export type CompleteNextSessionTaskInput = z.input<
  typeof completeTaskInputSchema
>;
export type RecordTaskReviewResultInput = z.input<
  typeof reviewResultInputSchema
>;
export type RecordTaskFeedbackSignalInput = z.input<typeof feedbackInputSchema>;

export type NextSessionTaskReadiness = {
  ready: boolean;
  blockedBy: string[];
};

export type NextSessionTaskOwnerView = {
  id: string;
  displayName: string;
  active: boolean;
};

export type NextSessionTaskChecklistItemView = {
  id: string;
  title: string;
  status: z.infer<typeof checklistStatusSchema>;
  position: number;
  required: boolean;
  completedBy: string | null;
  completedAt: Date | null;
};

export type NextSessionTaskDependencyView = {
  id: string;
  dependsOnType: z.infer<typeof dependencyTypeSchema>;
  dependsOnId: string;
  dependencyState: z.infer<typeof dependencyStateSchema>;
  reason: string;
};

export type NextSessionTaskSourceTrailView = {
  sourceWorkflow: z.infer<typeof sourceWorkflowSchema>;
  sourceId: string;
  sourceVersionId: string | null;
  sourceSectionId: string | null;
  aiRunId: string | null;
  promptVersion: string | null;
  sourceState: z.infer<typeof sourceStateSchema>;
  knowledgeVersionIds: string[];
  racketProductIds: string[];
  talkTrackAssetIds: string[];
  sensitiveRedactionState: z.infer<typeof redactionStateSchema>;
};

export type NextSessionTaskView = {
  id: string;
  title: string;
  summary: string;
  taskType: z.infer<typeof taskTypeSchema>;
  priority: z.infer<typeof prioritySchema>;
  status: z.infer<typeof statusSchema>;
  owner: NextSessionTaskOwnerView | null;
  dueAt: Date | null;
  targetSessionId: string | null;
  sourceTrail: NextSessionTaskSourceTrailView;
  checklistProgress: {
    total: number;
    completed: number;
    blocked: number;
  };
  checklist: NextSessionTaskChecklistItemView[];
  dependencies: NextSessionTaskDependencyView[];
  readiness: NextSessionTaskReadiness;
  reviewRequired: boolean;
  resultSummary: string | null;
  updatedAt: Date;
  createdAt: Date;
};

export type NextSessionTaskListResult = {
  items: NextSessionTaskView[];
};

export type TaskFeedbackSignalView = {
  id: string;
  taskId: string;
  sourceWorkflow: z.infer<typeof sourceWorkflowSchema>;
  signalType: z.infer<typeof feedbackSignalSchema>;
  reason: string;
  routesTo: z.infer<typeof feedbackRouteSchema>;
  actorId: string;
  createdAt: Date;
};

const activeTaskStatuses: NextSessionTaskRecord["status"][] = [
  "draft",
  "assigned",
  "in_progress",
  "blocked",
  "done",
  "reviewing",
  "reopened",
];

const allowedTransitions: Partial<
  Record<NextSessionTaskRecord["status"], NextSessionTaskRecord["status"][]>
> = {
  draft: ["assigned", "canceled"],
  assigned: ["in_progress", "blocked", "canceled"],
  in_progress: ["blocked", "canceled"],
  blocked: ["in_progress", "canceled"],
  done: ["closed", "reopened"],
  reviewing: ["closed", "reopened", "canceled"],
  closed: ["reopened", "archived"],
  reopened: ["assigned", "canceled"],
  canceled: ["archived"],
};

const ownerProgressTransitions = new Set([
  "assigned->in_progress",
  "in_progress->blocked",
  "blocked->in_progress",
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
    throw new NextSessionTaskError(
      "LONG_INPUT_LIMIT_EXCEEDED",
      "Next-session task input exceeds the current length limit",
      { details: { issues } },
    );
  }

  throw new NextSessionTaskError(
    "VALIDATION_ERROR",
    "Next-session task input is invalid",
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
    throw new NextSessionTaskError(
      "FORBIDDEN_PERMISSION",
      "Actor is missing required next-session task permission",
      {
        details: {
          requestId: context.requestId,
        },
      },
    );
  }
}

function hasPermission(context: DataAccessContext, permission: string): boolean {
  return context.permissions.includes(permission);
}

function toNullable(value: string): string | null {
  return value.length > 0 ? value : null;
}

function normalizeIdList(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort();
}

function duplicateFingerprint(input: {
  source: z.infer<typeof sourceInputSchema>;
  task: z.infer<typeof taskInputSchema>;
}): string {
  const payload = {
    sourceWorkflow: input.source.sourceWorkflow,
    sourceId: input.source.sourceId,
    sourceSectionId: input.source.sourceSectionId,
    taskType: input.task.taskType,
    ownerId: input.task.ownerId ?? "",
    targetSessionId: input.task.targetSessionId ?? "",
    relatedRacketProductIds: normalizeIdList(input.task.relatedRacketProductIds),
  };

  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

function assertSourceCreatable(source: z.infer<typeof sourceInputSchema>) {
  if (source.sensitiveRedactionState === "blocked") {
    throw new NextSessionTaskError(
      "SENSITIVE_DATA_BLOCKED",
      "Next-session task source contains blocked sensitive data",
    );
  }

  const readyStatesByWorkflow: Record<
    z.infer<typeof sourceWorkflowSchema>,
    z.infer<typeof sourceStateSchema>[]
  > = {
    manual: ["manual"],
    ai_review: ["accepted", "partially_accepted"],
    session_capture: ["review_ready", "accepted", "partially_accepted", "manual"],
    knowledge_gap: ["review_ready", "accepted", "partially_accepted", "manual"],
    talk_track: ["review_ready", "accepted", "partially_accepted", "manual"],
    qa_feedback: ["review_ready", "accepted", "partially_accepted", "manual"],
  };

  if (!readyStatesByWorkflow[source.sourceWorkflow].includes(source.sourceState)) {
    throw new NextSessionTaskError(
      "SOURCE_NOT_REVIEW_READY",
      "Next-session task source is not ready for task creation",
      {
        details: {
          sourceWorkflow: source.sourceWorkflow,
          sourceState: source.sourceState,
        },
      },
    );
  }
}

function mapDatabaseError(error: unknown): NextSessionTaskError {
  if (error instanceof NextSessionTaskError) {
    return error;
  }

  if (error instanceof Error) {
    return new NextSessionTaskError(
      "DATABASE_OPERATION_FAILED",
      "Next-session task persistence failed",
      { cause: error },
    );
  }

  return new NextSessionTaskError(
    "DATABASE_OPERATION_FAILED",
    "Unknown next-session task persistence failure",
  );
}

function assertValidDueDate(input: z.infer<typeof taskInputSchema>) {
  if (input.deadlinePolicy === "absolute" && !input.dueAt) {
    throw new NextSessionTaskError(
      "DUE_DATE_INVALID",
      "Absolute next-session task deadlines require dueAt",
    );
  }

  if (input.deadlinePolicy === "no_due_date" && input.dueAt) {
    throw new NextSessionTaskError(
      "DUE_DATE_INVALID",
      "No-due-date tasks cannot include dueAt",
    );
  }
}

function canOwnerProgress(input: {
  context: DataAccessContext;
  task: NextSessionTaskRecord;
  fromStatus: NextSessionTaskRecord["status"];
  toStatus: NextSessionTaskRecord["status"];
}): boolean {
  const transition = `${input.fromStatus}->${input.toStatus}`;

  return (
    input.task.ownerId === input.context.actorId &&
    hasPermission(input.context, "read_workspace") &&
    ownerProgressTransitions.has(transition)
  );
}

function assertCanManageOrProgress(input: {
  context: DataAccessContext;
  task: NextSessionTaskRecord;
  fromStatus: NextSessionTaskRecord["status"];
  toStatus: NextSessionTaskRecord["status"];
}) {
  if (hasPermission(input.context, "manage_next_tasks")) {
    return;
  }

  if (canOwnerProgress(input)) {
    return;
  }

  throw new NextSessionTaskError(
    "FORBIDDEN_PERMISSION",
    "Actor cannot update this next-session task",
    {
      details: {
        requestId: input.context.requestId,
      },
    },
  );
}

function assertAllowedTransition(input: {
  fromStatus: NextSessionTaskRecord["status"];
  toStatus: NextSessionTaskRecord["status"];
}) {
  if (!allowedTransitions[input.fromStatus]?.includes(input.toStatus)) {
    throw new NextSessionTaskError(
      "STATE_TRANSITION_INVALID",
      "Next-session task status transition is invalid",
      {
        details: {
          fromStatus: input.fromStatus,
          toStatus: input.toStatus,
        },
      },
    );
  }
}

function checklistProgress(items: NextSessionTaskChecklistItemRecord[]) {
  return {
    total: items.length,
    completed: items.filter((item) => item.status === "done").length,
    blocked: items.filter((item) => item.status === "blocked").length,
  };
}

function toChecklistView(
  item: NextSessionTaskChecklistItemRecord,
): NextSessionTaskChecklistItemView {
  return {
    id: item.id,
    title: item.title,
    status: item.status,
    position: item.position,
    required: item.required,
    completedBy: item.completedBy,
    completedAt: item.completedAt,
  };
}

function toDependencyView(
  dependency: NextSessionTaskDependencyRecord,
): NextSessionTaskDependencyView {
  return {
    id: dependency.id,
    dependsOnType: dependency.dependsOnType,
    dependsOnId: dependency.dependsOnId,
    dependencyState: dependency.dependencyState,
    reason: dependency.reason,
  };
}

function toSourceTrailView(
  source: NextSessionTaskSourceRecord,
): NextSessionTaskSourceTrailView {
  return {
    sourceWorkflow: source.sourceWorkflow,
    sourceId: source.sourceId,
    sourceVersionId: toNullable(source.sourceVersionId),
    sourceSectionId: toNullable(source.sourceSectionId),
    aiRunId: toNullable(source.aiRunId),
    promptVersion: toNullable(source.promptVersion),
    sourceState: source.sourceState,
    knowledgeVersionIds: source.knowledgeVersionIds,
    racketProductIds: source.racketProductIds,
    talkTrackAssetIds: source.talkTrackAssetIds,
    sensitiveRedactionState: source.sensitiveRedactionState,
  };
}

function deriveReadiness(input: {
  task: NextSessionTaskRecord;
  source: NextSessionTaskSourceRecord;
  checklist: NextSessionTaskChecklistItemRecord[];
  dependencies: NextSessionTaskDependencyRecord[];
}): NextSessionTaskReadiness {
  const blockers = new Set<string>();

  if (input.source.sensitiveRedactionState === "needs_review") {
    blockers.add("sensitive_data_needs_review");
  }

  if (!input.task.ownerId) {
    blockers.add("missing_owner");
  }

  if (input.task.status === "draft") {
    blockers.add("draft");
  }

  if (input.task.status === "blocked") {
    blockers.add("task_blocked");
  }

  if (["canceled", "archived"].includes(input.task.status)) {
    blockers.add(input.task.status);
  }

  if (
    input.checklist.some(
      (item) => item.required && !["done", "canceled"].includes(item.status),
    )
  ) {
    blockers.add("checklist_incomplete");
  }

  if (
    input.dependencies.some((dependency) =>
      ["pending", "blocked"].includes(dependency.dependencyState),
    )
  ) {
    blockers.add("dependency_blocked");
  }

  if (input.task.status === "reviewing") {
    blockers.add("review_required");
  }

  if (
    !["done", "closed"].includes(input.task.status) &&
    !["canceled", "archived"].includes(input.task.status)
  ) {
    blockers.add("not_completed");
  }

  const blockedBy = [...blockers];

  return {
    ready: blockedBy.length === 0,
    blockedBy,
  };
}

function toFeedbackView(
  feedback: NextSessionTaskFeedbackSignalRecord,
): TaskFeedbackSignalView {
  return {
    id: feedback.id,
    taskId: feedback.taskId,
    sourceWorkflow: feedback.sourceWorkflow,
    signalType: feedback.signalType,
    reason: feedback.reason,
    routesTo: feedback.routesTo,
    actorId: feedback.actorId,
    createdAt: feedback.createdAt,
  };
}

export function createNextSessionTaskRepository(
  database: NextSessionTaskRepositoryDatabase,
) {
  async function getScopedTask(
    context: DataAccessContext,
    taskId: string,
  ): Promise<NextSessionTaskRecord> {
    const [task] = await database
      .select()
      .from(nextSessionTasks)
      .where(
        and(
          eq(nextSessionTasks.id, taskId),
          eq(nextSessionTasks.tenantId, context.tenantId),
          eq(nextSessionTasks.teamId, context.teamId),
        ),
      )
      .limit(1);

    if (!task) {
      throw new NextSessionTaskError(
        "NOT_FOUND",
        "Next-session task was not found in this team",
      );
    }

    return task;
  }

  async function getScopedSource(
    context: DataAccessContext,
    taskId: string,
  ): Promise<NextSessionTaskSourceRecord> {
    const [source] = await database
      .select()
      .from(nextSessionTaskSources)
      .where(
        and(
          eq(nextSessionTaskSources.taskId, taskId),
          eq(nextSessionTaskSources.tenantId, context.tenantId),
          eq(nextSessionTaskSources.teamId, context.teamId),
        ),
      )
      .limit(1);

    if (!source) {
      throw new NextSessionTaskError(
        "NOT_FOUND",
        "Next-session task source was not found in this team",
      );
    }

    return source;
  }

  async function listChecklist(
    context: DataAccessContext,
    taskId: string,
  ): Promise<NextSessionTaskChecklistItemRecord[]> {
    return database
      .select()
      .from(nextSessionTaskChecklistItems)
      .where(
        and(
          eq(nextSessionTaskChecklistItems.taskId, taskId),
          eq(nextSessionTaskChecklistItems.tenantId, context.tenantId),
          eq(nextSessionTaskChecklistItems.teamId, context.teamId),
        ),
      );
  }

  async function listDependencies(
    context: DataAccessContext,
    taskId: string,
  ): Promise<NextSessionTaskDependencyRecord[]> {
    return database
      .select()
      .from(nextSessionTaskDependencies)
      .where(
        and(
          eq(nextSessionTaskDependencies.taskId, taskId),
          eq(nextSessionTaskDependencies.tenantId, context.tenantId),
          eq(nextSessionTaskDependencies.teamId, context.teamId),
        ),
      );
  }

  async function getOwnerView(
    context: DataAccessContext,
    ownerId: string | null,
  ): Promise<NextSessionTaskOwnerView | null> {
    if (!ownerId) {
      return null;
    }

    const [user] = await database
      .select()
      .from(appUsers)
      .where(eq(appUsers.id, ownerId))
      .limit(1);

    if (!user) {
      return {
        id: ownerId,
        displayName: ownerId,
        active: false,
      };
    }

    const [membership] = await database
      .select()
      .from(teamMemberships)
      .where(
        and(
          eq(teamMemberships.tenantId, context.tenantId),
          eq(teamMemberships.teamId, context.teamId),
          eq(teamMemberships.userId, ownerId),
        ),
      )
      .limit(1);

    return {
      id: ownerId,
      displayName: user.displayName,
      active: user.status === "active" && membership?.status === "active",
    };
  }

  async function assertActiveTeamMember(
    context: DataAccessContext,
    userId: string,
  ): Promise<AppUserRecord> {
    const [user] = await database
      .select()
      .from(appUsers)
      .where(eq(appUsers.id, userId))
      .limit(1);

    const [membership] = await database
      .select()
      .from(teamMemberships)
      .where(
        and(
          eq(teamMemberships.tenantId, context.tenantId),
          eq(teamMemberships.teamId, context.teamId),
          eq(teamMemberships.userId, userId),
          eq(teamMemberships.status, "active"),
        ),
      )
      .limit(1);

    if (!user || user.status !== "active" || !membership) {
      throw new NextSessionTaskError(
        "ASSIGNEE_NOT_ACTIVE",
        "Next-session task owner must be an active member of this team",
      );
    }

    return user;
  }

  async function toTaskView(
    context: DataAccessContext,
    task: NextSessionTaskRecord,
  ): Promise<NextSessionTaskView> {
    const [source, checklist, dependencies, owner] = await Promise.all([
      getScopedSource(context, task.id),
      listChecklist(context, task.id),
      listDependencies(context, task.id),
      getOwnerView(context, task.ownerId),
    ]);
    const checklistViews = checklist
      .map(toChecklistView)
      .sort((left, right) => left.position - right.position);
    const dependencyViews = dependencies.map(toDependencyView);

    return {
      id: task.id,
      title: task.title,
      summary: task.summary,
      taskType: task.taskType,
      priority: task.priority,
      status: task.status,
      owner,
      dueAt: task.dueAt,
      targetSessionId: task.targetSessionId,
      sourceTrail: toSourceTrailView(source),
      checklistProgress: checklistProgress(checklist),
      checklist: checklistViews,
      dependencies: dependencyViews,
      readiness: deriveReadiness({
        task,
        source,
        checklist,
        dependencies,
      }),
      reviewRequired: task.reviewRequired,
      resultSummary: toNullable(task.resultSummary),
      updatedAt: task.updatedAt,
      createdAt: task.createdAt,
    };
  }

  async function getScopedChecklistItem(input: {
    context: DataAccessContext;
    taskId: string;
    itemId: string;
  }): Promise<NextSessionTaskChecklistItemRecord> {
    const [item] = await database
      .select()
      .from(nextSessionTaskChecklistItems)
      .where(
        and(
          eq(nextSessionTaskChecklistItems.id, input.itemId),
          eq(nextSessionTaskChecklistItems.taskId, input.taskId),
          eq(nextSessionTaskChecklistItems.tenantId, input.context.tenantId),
          eq(nextSessionTaskChecklistItems.teamId, input.context.teamId),
        ),
      )
      .limit(1);

    if (!item) {
      throw new NextSessionTaskError(
        "NOT_FOUND",
        "Next-session task checklist item was not found in this team",
      );
    }

    return item;
  }

  async function getScopedDependency(input: {
    context: DataAccessContext;
    taskId: string;
    dependencyId: string;
  }): Promise<NextSessionTaskDependencyRecord> {
    const [dependency] = await database
      .select()
      .from(nextSessionTaskDependencies)
      .where(
        and(
          eq(nextSessionTaskDependencies.id, input.dependencyId),
          eq(nextSessionTaskDependencies.taskId, input.taskId),
          eq(nextSessionTaskDependencies.tenantId, input.context.tenantId),
          eq(nextSessionTaskDependencies.teamId, input.context.teamId),
        ),
      )
      .limit(1);

    if (!dependency) {
      throw new NextSessionTaskError(
        "NOT_FOUND",
        "Next-session task dependency was not found in this team",
      );
    }

    return dependency;
  }

  return {
    async createNextSessionTask(
      context: DataAccessContext,
      input: CreateNextSessionTaskInput,
    ): Promise<NextSessionTaskView> {
      assertPermission(context, ["manage_next_tasks"]);
      const values = parseInput(createTaskInputSchema, input);
      assertValidDueDate(values.task);
      assertSourceCreatable(values.source);

      try {
        if (values.task.ownerId) {
          await assertActiveTeamMember(context, values.task.ownerId);
        }

        const fingerprint = duplicateFingerprint(values);
        const [existingTask] = await database
          .select({ id: nextSessionTasks.id })
          .from(nextSessionTasks)
          .where(
            and(
              eq(nextSessionTasks.tenantId, context.tenantId),
              eq(nextSessionTasks.teamId, context.teamId),
              eq(nextSessionTasks.duplicateFingerprint, fingerprint),
              inArray(nextSessionTasks.status, activeTaskStatuses),
            ),
          )
          .limit(1);

        if (existingTask) {
          throw new NextSessionTaskError(
            "DUPLICATE_TASK",
            "Active next-session task already exists for this source and owner",
            {
              details: {
                duplicateOfTaskId: existingTask.id,
              },
            },
          );
        }

        const status =
          values.source.sensitiveRedactionState === "needs_review" ||
          !values.task.ownerId
            ? "draft"
            : "assigned";
        const taskId = createRecordId("ntask");
        const [task] = await database
          .insert(nextSessionTasks)
          .values({
            id: taskId,
            tenantId: context.tenantId,
            teamId: context.teamId,
            title: values.task.title,
            summary: values.task.summary,
            taskType: values.task.taskType,
            priority: values.task.priority,
            status,
            ownerId: values.task.ownerId,
            targetSessionId: values.task.targetSessionId,
            sourceWorkflow: values.source.sourceWorkflow,
            deadlinePolicy: values.task.deadlinePolicy,
            dueAt: values.task.dueAt,
            reviewRequired: values.task.reviewRequired,
            duplicateFingerprint: fingerprint,
            relatedRacketProductIds: normalizeIdList(
              values.task.relatedRacketProductIds,
            ),
            createdBy: context.actorId,
            updatedBy: context.actorId,
          })
          .returning();

        await database.insert(nextSessionTaskSources).values({
          id: createRecordId("ntsource"),
          tenantId: context.tenantId,
          teamId: context.teamId,
          taskId: task.id,
          sourceWorkflow: values.source.sourceWorkflow,
          sourceId: values.source.sourceId,
          sourceVersionId: values.source.sourceVersionId,
          sourceSectionId: values.source.sourceSectionId,
          aiRunId: values.source.aiRunId,
          promptVersion: values.source.promptVersion,
          sourceState: values.source.sourceState,
          knowledgeVersionIds: normalizeIdList(values.source.knowledgeVersionIds),
          racketProductIds: normalizeIdList([
            ...values.source.racketProductIds,
            ...values.task.relatedRacketProductIds,
          ]),
          talkTrackAssetIds: normalizeIdList(values.source.talkTrackAssetIds),
          sensitiveRedactionState: values.source.sensitiveRedactionState,
        });

        if (values.task.ownerId) {
          await database.insert(nextSessionTaskAssignees).values({
            id: createRecordId("ntassignee"),
            tenantId: context.tenantId,
            teamId: context.teamId,
            taskId: task.id,
            userId: values.task.ownerId,
            role: "owner",
            assignmentState: "active",
            assignedBy: context.actorId,
          });
        }

        if (values.checklist.length > 0) {
          await database.insert(nextSessionTaskChecklistItems).values(
            values.checklist.map((item, index) => ({
              id: createRecordId("ntcheck"),
              tenantId: context.tenantId,
              teamId: context.teamId,
              taskId: task.id,
              title: item.title,
              status: "todo" as const,
              position: index + 1,
              required: item.required,
            })),
          );
        }

        return toTaskView(context, task);
      } catch (error) {
        throw mapDatabaseError(error);
      }
    },

    async getNextSessionTask(
      context: DataAccessContext,
      input: GetNextSessionTaskInput,
    ): Promise<NextSessionTaskView> {
      assertPermission(context, ["read_workspace", "manage_next_tasks"]);
      const values = parseInput(taskIdInputSchema, input);

      try {
        return toTaskView(context, await getScopedTask(context, values.taskId));
      } catch (error) {
        throw mapDatabaseError(error);
      }
    },

    async listNextSessionTasks(
      context: DataAccessContext,
      input?: ListNextSessionTasksInput,
    ): Promise<NextSessionTaskListResult> {
      assertPermission(context, ["read_workspace", "manage_next_tasks"]);
      const values = parseInput(listTaskInputSchema, input ?? {});

      try {
        const predicates = [
          eq(nextSessionTasks.tenantId, context.tenantId),
          eq(nextSessionTasks.teamId, context.teamId),
        ];

        if (values.status?.length) {
          predicates.push(inArray(nextSessionTasks.status, values.status));
        }

        if (values.ownerId) {
          predicates.push(eq(nextSessionTasks.ownerId, values.ownerId));
        }

        if (values.sourceWorkflow) {
          predicates.push(
            eq(nextSessionTasks.sourceWorkflow, values.sourceWorkflow),
          );
        }

        const tasks = await database
          .select()
          .from(nextSessionTasks)
          .where(and(...predicates))
          .orderBy(desc(nextSessionTasks.updatedAt))
          .limit(values.limit);

        return {
          items: await Promise.all(
            tasks.map((task) => toTaskView(context, task)),
          ),
        };
      } catch (error) {
        throw mapDatabaseError(error);
      }
    },

    async updateNextSessionTaskStatus(
      context: DataAccessContext,
      input: UpdateNextSessionTaskStatusInput,
    ): Promise<NextSessionTaskView> {
      const values = parseInput(updateStatusInputSchema, input);
      const now = new Date();

      try {
        const task = await getScopedTask(context, values.taskId);
        assertCanManageOrProgress({
          context,
          task,
          fromStatus: values.fromStatus,
          toStatus: values.toStatus,
        });

        if (task.status !== values.fromStatus) {
          throw new NextSessionTaskError(
            "TASK_STATE_CONFLICT",
            "Next-session task status has changed",
            {
              details: {
                currentStatus: task.status,
                requestedFromStatus: values.fromStatus,
              },
            },
          );
        }

        assertAllowedTransition({
          fromStatus: values.fromStatus,
          toStatus: values.toStatus,
        });

        if (values.toStatus === "assigned" && !task.ownerId) {
          throw new NextSessionTaskError(
            "ASSIGNEE_NOT_ACTIVE",
            "Assigned next-session tasks require an active owner",
          );
        }

        const [updatedTask] = await database
          .update(nextSessionTasks)
          .set({
            status: values.toStatus,
            blockedReason: values.toStatus === "blocked" ? values.reason : "",
            updatedBy: context.actorId,
            updatedAt: now,
          })
          .where(
            and(
              eq(nextSessionTasks.id, task.id),
              eq(nextSessionTasks.tenantId, context.tenantId),
              eq(nextSessionTasks.teamId, context.teamId),
            ),
          )
          .returning();

        return toTaskView(context, updatedTask);
      } catch (error) {
        throw mapDatabaseError(error);
      }
    },

    async updateTaskChecklistItem(
      context: DataAccessContext,
      input: UpdateTaskChecklistItemInput,
    ): Promise<NextSessionTaskView> {
      const values = parseInput(updateChecklistInputSchema, input);
      const now = new Date();

      try {
        const task = await getScopedTask(context, values.taskId);

        if (
          !hasPermission(context, "manage_next_tasks") &&
          task.ownerId !== context.actorId
        ) {
          throw new NextSessionTaskError(
            "FORBIDDEN_PERMISSION",
            "Actor cannot update checklist for this next-session task",
          );
        }

        await getScopedChecklistItem({
          context,
          taskId: task.id,
          itemId: values.itemId,
        });

        await database
          .update(nextSessionTaskChecklistItems)
          .set({
            status: values.status,
            completedBy: values.status === "done" ? context.actorId : null,
            completedAt: values.status === "done" ? now : null,
            updatedAt: now,
          })
          .where(
            and(
              eq(nextSessionTaskChecklistItems.id, values.itemId),
              eq(nextSessionTaskChecklistItems.taskId, task.id),
              eq(nextSessionTaskChecklistItems.tenantId, context.tenantId),
              eq(nextSessionTaskChecklistItems.teamId, context.teamId),
            ),
          );

        await database
          .update(nextSessionTasks)
          .set({
            updatedBy: context.actorId,
            updatedAt: now,
          })
          .where(eq(nextSessionTasks.id, task.id));

        return toTaskView(context, await getScopedTask(context, task.id));
      } catch (error) {
        throw mapDatabaseError(error);
      }
    },

    async recordTaskDependency(
      context: DataAccessContext,
      input: RecordTaskDependencyInput,
    ): Promise<NextSessionTaskDependencyView> {
      assertPermission(context, ["manage_next_tasks"]);
      const values = parseInput(recordDependencyInputSchema, input);

      try {
        const task = await getScopedTask(context, values.taskId);
        const [dependency] = await database
          .insert(nextSessionTaskDependencies)
          .values({
            id: createRecordId("ntdep"),
            tenantId: context.tenantId,
            teamId: context.teamId,
            taskId: task.id,
            dependsOnType: values.dependsOnType,
            dependsOnId: values.dependsOnId,
            dependencyState: values.dependencyState,
            reason: values.reason,
            createdBy: context.actorId,
            updatedBy: context.actorId,
          })
          .returning();

        return toDependencyView(dependency);
      } catch (error) {
        throw mapDatabaseError(error);
      }
    },

    async updateTaskDependencyState(
      context: DataAccessContext,
      input: UpdateTaskDependencyStateInput,
    ): Promise<NextSessionTaskDependencyView> {
      assertPermission(context, ["manage_next_tasks"]);
      const values = parseInput(updateDependencyInputSchema, input);
      const now = new Date();

      try {
        await getScopedTask(context, values.taskId);
        await getScopedDependency({
          context,
          taskId: values.taskId,
          dependencyId: values.dependencyId,
        });

        const [dependency] = await database
          .update(nextSessionTaskDependencies)
          .set({
            dependencyState: values.dependencyState,
            reason: values.reason,
            updatedBy: context.actorId,
            updatedAt: now,
          })
          .where(
            and(
              eq(nextSessionTaskDependencies.id, values.dependencyId),
              eq(nextSessionTaskDependencies.taskId, values.taskId),
              eq(nextSessionTaskDependencies.tenantId, context.tenantId),
              eq(nextSessionTaskDependencies.teamId, context.teamId),
            ),
          )
          .returning();

        return toDependencyView(dependency);
      } catch (error) {
        throw mapDatabaseError(error);
      }
    },

    async completeNextSessionTask(
      context: DataAccessContext,
      input: CompleteNextSessionTaskInput,
    ): Promise<NextSessionTaskView> {
      const values = parseInput(completeTaskInputSchema, input);
      const now = new Date();

      try {
        const task = await getScopedTask(context, values.taskId);

        if (
          !hasPermission(context, "manage_next_tasks") &&
          task.ownerId !== context.actorId
        ) {
          throw new NextSessionTaskError(
            "FORBIDDEN_PERMISSION",
            "Actor cannot complete this next-session task",
          );
        }

        if (task.status !== values.fromStatus) {
          throw new NextSessionTaskError(
            "TASK_STATE_CONFLICT",
            "Next-session task status has changed",
            {
              details: {
                currentStatus: task.status,
                requestedFromStatus: values.fromStatus,
              },
            },
          );
        }

        if (task.status !== "in_progress") {
          throw new NextSessionTaskError(
            "STATE_TRANSITION_INVALID",
            "Only in-progress next-session tasks can be completed",
          );
        }

        const [checklist, dependencies] = await Promise.all([
          listChecklist(context, task.id),
          listDependencies(context, task.id),
        ]);

        if (
          checklist.some(
            (item) => item.required && !["done", "canceled"].includes(item.status),
          )
        ) {
          throw new NextSessionTaskError(
            "CHECKLIST_REQUIRED_INCOMPLETE",
            "Required next-session task checklist items are incomplete",
          );
        }

        if (
          dependencies.some((dependency) =>
            ["pending", "blocked"].includes(dependency.dependencyState),
          )
        ) {
          throw new NextSessionTaskError(
            "DEPENDENCY_BLOCKED",
            "Next-session task has unresolved dependencies",
          );
        }

        const nextStatus = task.reviewRequired ? "reviewing" : "done";
        const [updatedTask] = await database
          .update(nextSessionTasks)
          .set({
            status: nextStatus,
            resultSummary: values.resultSummary,
            completedBy: context.actorId,
            completedAt: now,
            updatedBy: context.actorId,
            updatedAt: now,
          })
          .where(
            and(
              eq(nextSessionTasks.id, task.id),
              eq(nextSessionTasks.tenantId, context.tenantId),
              eq(nextSessionTasks.teamId, context.teamId),
            ),
          )
          .returning();

        return toTaskView(context, updatedTask);
      } catch (error) {
        throw mapDatabaseError(error);
      }
    },

    async recordTaskReviewResult(
      context: DataAccessContext,
      input: RecordTaskReviewResultInput,
    ): Promise<NextSessionTaskView> {
      assertPermission(context, ["manage_next_tasks"]);
      const values = parseInput(reviewResultInputSchema, input);
      const now = new Date();

      try {
        const task = await getScopedTask(context, values.taskId);

        if (
          values.decision === "approve_close" &&
          !["reviewing", "done"].includes(task.status)
        ) {
          throw new NextSessionTaskError(
            "STATE_TRANSITION_INVALID",
            "Only reviewing or done next-session tasks can be closed",
          );
        }

        const statusByDecision: Record<
          z.infer<typeof reviewDecisionSchema>,
          NextSessionTaskRecord["status"]
        > = {
          approve_close: "closed",
          request_changes: "reopened",
          reject_result: "reopened",
          reopen: "reopened",
          cancel: "canceled",
        };
        const nextStatus = statusByDecision[values.decision];

        const [review] = await database
          .insert(nextSessionTaskReviewResults)
          .values({
            id: createRecordId("ntreview"),
            tenantId: context.tenantId,
            teamId: context.teamId,
            taskId: task.id,
            decision: values.decision,
            reason: values.reason,
            resultSummary: values.resultSummary,
            reviewedBy: context.actorId,
            reviewedAt: now,
          })
          .returning();

        const [updatedTask] = await database
          .update(nextSessionTasks)
          .set({
            status: nextStatus,
            resultSummary: values.resultSummary || task.resultSummary,
            closedBy: nextStatus === "closed" ? context.actorId : task.closedBy,
            closedAt: nextStatus === "closed" ? now : task.closedAt,
            updatedBy: context.actorId,
            updatedAt: now,
          })
          .where(
            and(
              eq(nextSessionTasks.id, review.taskId),
              eq(nextSessionTasks.tenantId, context.tenantId),
              eq(nextSessionTasks.teamId, context.teamId),
            ),
          )
          .returning();

        return toTaskView(context, updatedTask);
      } catch (error) {
        throw mapDatabaseError(error);
      }
    },

    async recordTaskFeedbackSignal(
      context: DataAccessContext,
      input: RecordTaskFeedbackSignalInput,
    ): Promise<TaskFeedbackSignalView> {
      assertPermission(context, ["manage_next_tasks"]);
      const values = parseInput(feedbackInputSchema, input);

      try {
        const task = await getScopedTask(context, values.taskId);

        if (task.status === "draft" || task.status === "archived") {
          throw new NextSessionTaskError(
            "STATE_TRANSITION_INVALID",
            "Draft or archived next-session tasks cannot record feedback signals",
          );
        }

        const [feedback] = await database
          .insert(nextSessionTaskFeedbackSignals)
          .values({
            id: createRecordId("ntfeedback"),
            tenantId: context.tenantId,
            teamId: context.teamId,
            taskId: task.id,
            sourceWorkflow: values.sourceWorkflow,
            signalType: values.signalType,
            reason: values.reason,
            routesTo: values.routesTo,
            actorId: context.actorId,
          })
          .returning();

        return toFeedbackView(feedback);
      } catch (error) {
        throw mapDatabaseError(error);
      }
    },
  };
}
