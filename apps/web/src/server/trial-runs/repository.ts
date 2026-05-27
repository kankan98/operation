import "server-only";

import { and, asc, count, desc, eq } from "drizzle-orm";
import { z } from "zod";

import type { DatabaseClient } from "../db/client";
import type { DataAccessContext } from "../db/context";
import { createRecordId } from "../db/repository";
import {
  v0TrialRuns,
  v0TrialRunSteps,
  type V0TrialRunRecord,
  type V0TrialRunStepRecord,
} from "../db/schema";

export type V0TrialRunRepositoryDatabase = Pick<
  DatabaseClient,
  "insert" | "select" | "update"
>;

export type V0TrialRunErrorCode =
  | "VALIDATION_ERROR"
  | "LONG_INPUT_LIMIT_EXCEEDED"
  | "FORBIDDEN_PERMISSION"
  | "NOT_FOUND"
  | "SENSITIVE_DATA_BLOCKED"
  | "DATABASE_OPERATION_FAILED";

export class V0TrialRunError extends Error {
  readonly code: V0TrialRunErrorCode;
  readonly details?: Record<string, unknown>;

  constructor(
    code: V0TrialRunErrorCode,
    message: string,
    options?: {
      cause?: unknown;
      details?: Record<string, unknown>;
    },
  ) {
    super(message, { cause: options?.cause });
    this.name = "V0TrialRunError";
    this.code = code;
    this.details = options?.details;
  }
}

const evaluatorRoleSchema = z.enum([
  "live_operator",
  "host_assistant",
  "product_owner",
  "team_lead",
  "reviewer",
  "other",
]);

const trialRunStatusSchema = z.enum([
  "active",
  "completed",
  "abandoned",
  "archived",
]);

const trialRunStepIdSchema = z.enum([
  "sessions",
  "rackets",
  "knowledge",
  "ai_review",
  "talk_tracks",
  "next_actions",
]);

const trialRunStepStatusSchema = z.enum([
  "pending",
  "passed",
  "issue",
  "skipped",
]);

const frictionTypeSchema = z.enum([
  "copy_confusion",
  "missing_data",
  "ai_quality",
  "workflow_break",
  "mobile_layout",
  "source_trust",
  "downstream_action",
  "performance",
  "other",
]);

const noteSchema = z.string().trim().max(500).optional().default("");
const summaryNoteSchema = z.string().trim().max(500).optional().default("");
const metadataSchema = z
  .record(z.string(), z.unknown())
  .optional()
  .default({});

const startRunInputSchema = z.object({
  evaluatorRole: evaluatorRoleSchema,
  metadata: metadataSchema,
});

const listRunsInputSchema = z.object({
  limit: z.number().int().min(1).max(50).default(5),
  status: trialRunStatusSchema.optional(),
});

const updateStepInputSchema = z.object({
  frictionType: frictionTypeSchema.nullish(),
  note: noteSchema,
  status: trialRunStepStatusSchema,
});

const completeRunInputSchema = z.object({
  summaryNote: summaryNoteSchema,
});

export type V0TrialRunStatus = z.infer<typeof trialRunStatusSchema>;
export type V0TrialRunStepId = z.infer<typeof trialRunStepIdSchema>;
export type V0TrialRunStepStatus = z.infer<typeof trialRunStepStatusSchema>;
export type V0TrialRunFrictionType = z.infer<typeof frictionTypeSchema>;
export type StartV0TrialRunInput = z.input<typeof startRunInputSchema>;
export type ListV0TrialRunsInput = z.input<typeof listRunsInputSchema>;
export type UpdateV0TrialRunStepInput = z.input<typeof updateStepInputSchema>;
export type CompleteV0TrialRunInput = z.input<typeof completeRunInputSchema>;

export type V0TrialRunStepView = {
  completedAt: Date | null;
  frictionType: V0TrialRunFrictionType | null;
  id: string;
  note: string;
  runId: string;
  status: V0TrialRunStepStatus;
  stepId: V0TrialRunStepId;
  updatedAt: Date;
};

export type V0TrialRunSummary = {
  activeRunCount: number;
  completedRunCount: number;
  issueStepCount: number;
  latestRunId: string | null;
  nextAction: {
    href: string | null;
    label: string;
    stepId: V0TrialRunStepId | null;
  };
  skippedStepCount: number;
  stepCoverage: Record<V0TrialRunStepId, number>;
  totalRuns: number;
};

export type V0TrialRunDetail = {
  actorId: string;
  completedAt: Date | null;
  createdAt: Date;
  evaluatorRole: z.infer<typeof evaluatorRoleSchema>;
  id: string;
  startedAt: Date;
  status: V0TrialRunStatus;
  steps: V0TrialRunStepView[];
  summary: V0TrialRunSummary;
  summaryNote: string;
  teamId: string;
  tenantId: string;
  updatedAt: Date;
};

export type V0TrialRunListResult = {
  items: V0TrialRunDetail[];
  summary: V0TrialRunSummary;
};

const trialStepOrder: V0TrialRunStepId[] = trialRunStepIdSchema.options;

const trialStepHref: Record<V0TrialRunStepId, string> = {
  ai_review: "/ai-review",
  knowledge: "/knowledge",
  next_actions: "/next-actions",
  rackets: "/rackets",
  sessions: "/sessions",
  talk_tracks: "/talk-tracks",
};

const trialStepLabel: Record<V0TrialRunStepId, string> = {
  ai_review: "检查智能复盘",
  knowledge: "检查资料来源",
  next_actions: "检查下场任务",
  rackets: "检查球拍产品",
  sessions: "检查直播场次",
  talk_tracks: "检查话术资产",
};

const sensitiveNotePatterns = [
  /postgres(?:ql)?:\/\/\S+/i,
  /Bearer\s+\S+/i,
  /\b(?:set-cookie|cookie|authorization|database_url)\b/i,
  /\b(?:raw_session|session_reference|provider_session)\b/i,
  /sk-[A-Za-z0-9_-]{6,}/,
];

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
    throw new V0TrialRunError(
      "LONG_INPUT_LIMIT_EXCEEDED",
      "V0 trial run input exceeds the current length limit",
      { details: { issues } },
    );
  }

  throw new V0TrialRunError(
    "VALIDATION_ERROR",
    "V0 trial run input is invalid",
    { details: { issues } },
  );
}

function assertReadWorkspace(context: DataAccessContext) {
  if (!context.permissions.includes("read_workspace")) {
    throw new V0TrialRunError(
      "FORBIDDEN_PERMISSION",
      "Actor is missing workspace read permission for V0 trial runs",
      {
        details: {
          requestId: context.requestId,
        },
      },
    );
  }
}

function assertNoteIsSafe(note: string) {
  if (sensitiveNotePatterns.some((pattern) => pattern.test(note))) {
    throw new V0TrialRunError(
      "SENSITIVE_DATA_BLOCKED",
      "V0 trial run note contains sensitive markers",
    );
  }
}

function assertStepUpdateIsValid(values: z.infer<typeof updateStepInputSchema>) {
  if ((values.status === "issue" || values.status === "skipped") && !values.note) {
    throw new V0TrialRunError(
      "VALIDATION_ERROR",
      "Issue or skipped V0 trial run steps require a concise note",
    );
  }
}

function mapDatabaseError(error: unknown): V0TrialRunError {
  if (error instanceof V0TrialRunError) {
    return error;
  }

  if (error instanceof Error) {
    return new V0TrialRunError(
      "DATABASE_OPERATION_FAILED",
      "V0 trial run persistence failed",
      { cause: error },
    );
  }

  return new V0TrialRunError(
    "DATABASE_OPERATION_FAILED",
    "Unknown V0 trial run persistence failure",
  );
}

function toStepView(record: V0TrialRunStepRecord): V0TrialRunStepView {
  return {
    completedAt: record.completedAt,
    frictionType: record.frictionType,
    id: record.id,
    note: record.note,
    runId: record.runId,
    status: record.status,
    stepId: record.stepId,
    updatedAt: record.updatedAt,
  };
}

function emptyCoverage(): Record<V0TrialRunStepId, number> {
  return {
    ai_review: 0,
    knowledge: 0,
    next_actions: 0,
    rackets: 0,
    sessions: 0,
    talk_tracks: 0,
  };
}

function chooseNextAction(input: {
  latestRun: V0TrialRunRecord | null;
  steps: V0TrialRunStepRecord[];
}): V0TrialRunSummary["nextAction"] {
  if (!input.latestRun) {
    return {
      href: null,
      label: "开始试用运行",
      stepId: null,
    };
  }

  const latestSteps = input.steps.filter((step) => step.runId === input.latestRun?.id);
  const blockerStep = trialStepOrder
    .map((stepId) =>
      latestSteps.find(
        (step) =>
          step.stepId === stepId &&
          (step.status === "issue" || step.status === "skipped"),
      ),
    )
    .find(Boolean);

  if (blockerStep) {
    return {
      href: trialStepHref[blockerStep.stepId],
      label: `处理${trialStepLabel[blockerStep.stepId]}卡点`,
      stepId: blockerStep.stepId,
    };
  }

  const pendingStep = trialStepOrder
    .map((stepId) =>
      latestSteps.find((step) => step.stepId === stepId && step.status === "pending"),
    )
    .find(Boolean);

  if (pendingStep) {
    return {
      href: trialStepHref[pendingStep.stepId],
      label: trialStepLabel[pendingStep.stepId],
      stepId: pendingStep.stepId,
    };
  }

  return {
    href: null,
    label:
      input.latestRun.status === "completed"
        ? "试用运行已完成"
        : "完成本次试用运行",
    stepId: null,
  };
}

function summarizeRuns(input: {
  runs: V0TrialRunRecord[];
  steps: V0TrialRunStepRecord[];
  totalRuns: number;
}): V0TrialRunSummary {
  const stepCoverage = emptyCoverage();
  let issueStepCount = 0;
  let skippedStepCount = 0;
  let activeRunCount = 0;
  let completedRunCount = 0;

  for (const run of input.runs) {
    if (run.status === "active") {
      activeRunCount += 1;
    }

    if (run.status === "completed") {
      completedRunCount += 1;
    }
  }

  for (const step of input.steps) {
    if (step.status !== "pending") {
      stepCoverage[step.stepId] += 1;
    }

    if (step.status === "issue") {
      issueStepCount += 1;
    }

    if (step.status === "skipped") {
      skippedStepCount += 1;
    }
  }

  const latestRun = input.runs[0] ?? null;

  return {
    activeRunCount,
    completedRunCount,
    issueStepCount,
    latestRunId: latestRun?.id ?? null,
    nextAction: chooseNextAction({
      latestRun,
      steps: input.steps,
    }),
    skippedStepCount,
    stepCoverage,
    totalRuns: input.totalRuns,
  };
}

function toRunDetail(input: {
  run: V0TrialRunRecord;
  steps: V0TrialRunStepRecord[];
  summary: V0TrialRunSummary;
}): V0TrialRunDetail {
  return {
    actorId: input.run.actorId,
    completedAt: input.run.completedAt,
    createdAt: input.run.createdAt,
    evaluatorRole: input.run.evaluatorRole,
    id: input.run.id,
    startedAt: input.run.startedAt,
    status: input.run.status,
    steps: input.steps
      .filter((step) => step.runId === input.run.id)
      .sort(
        (left, right) =>
          trialStepOrder.indexOf(left.stepId) - trialStepOrder.indexOf(right.stepId),
      )
      .map(toStepView),
    summary: input.summary,
    summaryNote: input.run.summaryNote,
    teamId: input.run.teamId,
    tenantId: input.run.tenantId,
    updatedAt: input.run.updatedAt,
  };
}

function scopedRunFilters(context: DataAccessContext) {
  return [
    eq(v0TrialRuns.tenantId, context.tenantId),
    eq(v0TrialRuns.teamId, context.teamId),
    eq(v0TrialRuns.actorId, context.actorId),
  ];
}

function scopedStepFilters(context: DataAccessContext) {
  return [
    eq(v0TrialRunSteps.tenantId, context.tenantId),
    eq(v0TrialRunSteps.teamId, context.teamId),
    eq(v0TrialRunSteps.actorId, context.actorId),
  ];
}

export function createV0TrialRunRepository(
  database: V0TrialRunRepositoryDatabase,
) {
  async function listRuns(
    context: DataAccessContext,
    input: ListV0TrialRunsInput = {},
  ): Promise<V0TrialRunListResult> {
    const values = parseInput(listRunsInputSchema, input);

    assertReadWorkspace(context);

    const filters = scopedRunFilters(context);

    if (values.status) {
      filters.push(eq(v0TrialRuns.status, values.status));
    }

    try {
      const [total] = await database
        .select({ value: count() })
        .from(v0TrialRuns)
        .where(and(...filters));
      const runs = await database
        .select()
        .from(v0TrialRuns)
        .where(and(...filters))
        .orderBy(desc(v0TrialRuns.createdAt))
        .limit(values.limit);
      const steps = await database
        .select()
        .from(v0TrialRunSteps)
        .where(and(...scopedStepFilters(context)))
        .orderBy(asc(v0TrialRunSteps.createdAt));
      const summary = summarizeRuns({
        runs,
        steps,
        totalRuns: Number(total?.value ?? 0),
      });

      return {
        items: runs.map((run) =>
          toRunDetail({
            run,
            steps,
            summary,
          }),
        ),
        summary,
      };
    } catch (error) {
      throw mapDatabaseError(error);
    }
  }

  async function getRun(
    context: DataAccessContext,
    runId: string,
  ): Promise<V0TrialRunDetail> {
    assertReadWorkspace(context);

    try {
      const [run] = await database
        .select()
        .from(v0TrialRuns)
        .where(
          and(
            ...scopedRunFilters(context),
            eq(v0TrialRuns.id, runId),
          ),
        )
        .limit(1);

      if (!run) {
        throw new V0TrialRunError("NOT_FOUND", "V0 trial run was not found");
      }

      const steps = await database
        .select()
        .from(v0TrialRunSteps)
        .where(
          and(
            ...scopedStepFilters(context),
            eq(v0TrialRunSteps.runId, run.id),
          ),
        )
        .orderBy(asc(v0TrialRunSteps.createdAt));
      const summary = summarizeRuns({
        runs: [run],
        steps,
        totalRuns: 1,
      });

      return toRunDetail({
        run,
        steps,
        summary,
      });
    } catch (error) {
      throw mapDatabaseError(error);
    }
  }

  return {
    async completeRun(
      context: DataAccessContext,
      runId: string,
      input: CompleteV0TrialRunInput = {},
    ): Promise<V0TrialRunDetail> {
      const values = parseInput(completeRunInputSchema, input);

      assertNoteIsSafe(values.summaryNote);

      const detail = await getRun(context, runId);

      if (detail.steps.some((step) => step.status === "pending")) {
        throw new V0TrialRunError(
          "VALIDATION_ERROR",
          "V0 trial run cannot be completed with pending steps",
        );
      }

      try {
        const [run] = await database
          .update(v0TrialRuns)
          .set({
            completedAt: new Date(),
            status: "completed",
            summaryNote: values.summaryNote,
            updatedAt: new Date(),
          })
          .where(
            and(
              ...scopedRunFilters(context),
              eq(v0TrialRuns.id, runId),
            ),
          )
          .returning();

        if (!run) {
          throw new V0TrialRunError("NOT_FOUND", "V0 trial run was not found");
        }

        return await getRun(context, run.id);
      } catch (error) {
        throw mapDatabaseError(error);
      }
    },

    getRun,

    listRuns,

    async startRun(
      context: DataAccessContext,
      input: StartV0TrialRunInput,
    ): Promise<V0TrialRunDetail> {
      const values = parseInput(startRunInputSchema, input);

      assertReadWorkspace(context);

      try {
        const [run] = await database
          .insert(v0TrialRuns)
          .values({
            actorId: context.actorId,
            evaluatorRole: values.evaluatorRole,
            id: createRecordId("trialrun"),
            metadata: {
              ...values.metadata,
              requestId: context.requestId,
            },
            teamId: context.teamId,
            tenantId: context.tenantId,
          })
          .returning();

        await database.insert(v0TrialRunSteps).values(
          trialStepOrder.map((stepId) => ({
            actorId: context.actorId,
            id: createRecordId("trialstep"),
            runId: run.id,
            stepId,
            teamId: context.teamId,
            tenantId: context.tenantId,
          })),
        );

        return await getRun(context, run.id);
      } catch (error) {
        throw mapDatabaseError(error);
      }
    },

    async updateStep(
      context: DataAccessContext,
      runId: string,
      stepId: V0TrialRunStepId,
      input: UpdateV0TrialRunStepInput,
    ): Promise<V0TrialRunDetail> {
      const values = parseInput(updateStepInputSchema, input);

      assertStepUpdateIsValid(values);
      assertNoteIsSafe(values.note);

      const detail = await getRun(context, runId);

      if (detail.status === "completed") {
        throw new V0TrialRunError(
          "VALIDATION_ERROR",
          "Completed V0 trial runs cannot be edited",
        );
      }

      try {
        const completedAt =
          values.status === "pending" ? null : new Date();
        const [step] = await database
          .update(v0TrialRunSteps)
          .set({
            completedAt,
            frictionType: values.status === "issue" ? (values.frictionType ?? "other") : null,
            note: values.note,
            status: values.status,
            updatedAt: new Date(),
          })
          .where(
            and(
              ...scopedStepFilters(context),
              eq(v0TrialRunSteps.runId, runId),
              eq(v0TrialRunSteps.stepId, stepId),
            ),
          )
          .returning();

        if (!step) {
          throw new V0TrialRunError("NOT_FOUND", "V0 trial run step was not found");
        }

        await database
          .update(v0TrialRuns)
          .set({
            updatedAt: new Date(),
          })
          .where(
            and(
              ...scopedRunFilters(context),
              eq(v0TrialRuns.id, runId),
            ),
          );

        return await getRun(context, runId);
      } catch (error) {
        throw mapDatabaseError(error);
      }
    },
  };
}
