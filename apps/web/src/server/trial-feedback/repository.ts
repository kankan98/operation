import "server-only";

import { and, count, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";

import type { DatabaseClient } from "../db/client";
import type { DataAccessContext } from "../db/context";
import { createRecordId } from "../db/repository";
import {
  v0TrialFeedback,
  v0TrialRuns,
  v0TrialRunSteps,
  type V0TrialFeedbackRecord,
} from "../db/schema";

export type V0TrialFeedbackRepositoryDatabase = Pick<
  DatabaseClient,
  "insert" | "select"
>;

export type V0TrialFeedbackErrorCode =
  | "VALIDATION_ERROR"
  | "LONG_INPUT_LIMIT_EXCEEDED"
  | "FORBIDDEN_PERMISSION"
  | "SENSITIVE_DATA_BLOCKED"
  | "DATABASE_OPERATION_FAILED";

export class V0TrialFeedbackError extends Error {
  readonly code: V0TrialFeedbackErrorCode;
  readonly details?: Record<string, unknown>;

  constructor(
    code: V0TrialFeedbackErrorCode,
    message: string,
    options?: {
      cause?: unknown;
      details?: Record<string, unknown>;
    },
  ) {
    super(message, { cause: options?.cause });
    this.name = "V0TrialFeedbackError";
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

const workbenchSchema = z.enum([
  "overview",
  "trial",
  "sessions",
  "rackets",
  "knowledge",
  "ai_review",
  "talk_tracks",
  "next_actions",
]);

const issueTypeSchema = z.enum([
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

const realWorkSignalSchema = z.enum(["yes", "maybe", "no", "not_sure"]);

const ratingSchema = z.number().int().min(1).max(5);
const pagePathSchema = z
  .string()
  .trim()
  .max(160)
  .optional()
  .default("");
const noteSchema = z.string().trim().min(1).max(800);
const metadataSchema = z
  .record(z.string(), z.unknown())
  .optional()
  .default({});

const createFeedbackInputSchema = z.object({
  evaluatorRole: evaluatorRoleSchema,
  workbench: workbenchSchema,
  pagePath: pagePathSchema,
  usefulnessRating: ratingSchema,
  clarityRating: ratingSchema,
  issueType: issueTypeSchema,
  note: noteSchema,
  realWorkSignal: realWorkSignalSchema.nullish(),
  trialRunId: z.string().trim().min(1).nullish(),
  trialRunStepId: z.string().trim().min(1).nullish(),
  metadata: metadataSchema,
});

const listFeedbackInputSchema = z.object({
  workbench: workbenchSchema.optional(),
  issueType: issueTypeSchema.optional(),
  limit: z.number().int().min(1).max(50).default(10),
});

export type CreateV0TrialFeedbackInput = z.input<
  typeof createFeedbackInputSchema
>;
export type ListV0TrialFeedbackInput = z.input<typeof listFeedbackInputSchema>;

export type V0TrialFeedbackView = {
  id: string;
  evaluatorRole: z.infer<typeof evaluatorRoleSchema>;
  workbench: z.infer<typeof workbenchSchema>;
  pagePath: string;
  usefulnessRating: number;
  clarityRating: number;
  issueType: z.infer<typeof issueTypeSchema>;
  note: string;
  realWorkSignal: z.infer<typeof realWorkSignalSchema> | null;
  trialRunId: string | null;
  trialRunStepId: string | null;
  actorId: string;
  createdAt: Date;
};

export type V0TrialFeedbackEvidenceFocus =
  | "collect_more_feedback"
  | "experience_polish"
  | "sample_data"
  | "ai_quality"
  | "source_trust"
  | "downstream_workflow"
  | "production_readiness";

export type V0TrialFeedbackCountBucket = {
  count: number;
  value: string;
};

export type V0TrialFeedbackHotspot = {
  count: number;
  issueType: z.infer<typeof issueTypeSchema>;
  lowRatingCount: number;
  realWorkBlockerCount: number;
  workbench: z.infer<typeof workbenchSchema>;
};

export type V0TrialFeedbackRecentNote = {
  clarityRating: number;
  createdAt: Date;
  id: string;
  issueType: z.infer<typeof issueTypeSchema>;
  note: string;
  realWorkSignal: z.infer<typeof realWorkSignalSchema> | null;
  trialRunId: string | null;
  trialRunStepId: string | null;
  usefulnessRating: number;
  workbench: z.infer<typeof workbenchSchema>;
};

export type V0TrialFeedbackEvidenceRecommendation = {
  focus: V0TrialFeedbackEvidenceFocus;
  issueType: z.infer<typeof issueTypeSchema> | null;
  rationale: string;
  workbench: z.infer<typeof workbenchSchema> | null;
};

export type V0TrialFeedbackEvidenceSummary = {
  completedRunFeedbackCount: number;
  hotspots: V0TrialFeedbackHotspot[];
  includedCount: number;
  issueTypeCounts: V0TrialFeedbackCountBucket[];
  linkedRunFeedbackCount: number;
  lowClarityCount: number;
  lowUsefulnessCount: number;
  realWorkSignals: Record<
    z.infer<typeof realWorkSignalSchema> | "unknown",
    number
  >;
  recentNotes: V0TrialFeedbackRecentNote[];
  recommendation: V0TrialFeedbackEvidenceRecommendation;
  totalCount: number;
  workbenchCounts: V0TrialFeedbackCountBucket[];
};

export type V0TrialFeedbackListResult = {
  items: V0TrialFeedbackView[];
  summary: V0TrialFeedbackEvidenceSummary;
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
    (issue) => issue.code === "too_big" && issue.path.join(".") === "note",
  );

  if (hasLongInputIssue) {
    throw new V0TrialFeedbackError(
      "LONG_INPUT_LIMIT_EXCEEDED",
      "V0 trial feedback input exceeds the current length limit",
      { details: { issues } },
    );
  }

  throw new V0TrialFeedbackError(
    "VALIDATION_ERROR",
    "V0 trial feedback input is invalid",
    { details: { issues } },
  );
}

function assertReadWorkspace(context: DataAccessContext) {
  if (!context.permissions.includes("read_workspace")) {
    throw new V0TrialFeedbackError(
      "FORBIDDEN_PERMISSION",
      "Actor is missing workspace read permission for V0 trial feedback",
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
    throw new V0TrialFeedbackError(
      "SENSITIVE_DATA_BLOCKED",
      "V0 trial feedback note contains sensitive markers",
    );
  }
}

function mapDatabaseError(error: unknown): V0TrialFeedbackError {
  if (error instanceof V0TrialFeedbackError) {
    return error;
  }

  if (error instanceof Error) {
    return new V0TrialFeedbackError(
      "DATABASE_OPERATION_FAILED",
      "V0 trial feedback persistence failed",
      { cause: error },
    );
  }

  return new V0TrialFeedbackError(
    "DATABASE_OPERATION_FAILED",
    "Unknown V0 trial feedback persistence failure",
  );
}

function toFeedbackView(record: V0TrialFeedbackRecord): V0TrialFeedbackView {
  return {
    id: record.id,
    evaluatorRole: record.evaluatorRole,
    workbench: record.workbench,
    pagePath: record.pagePath,
    usefulnessRating: record.usefulnessRating,
    clarityRating: record.clarityRating,
    issueType: record.issueType,
    note: record.note,
    realWorkSignal: record.realWorkSignal,
    trialRunId: record.trialRunId,
    trialRunStepId: record.trialRunStepId,
    actorId: record.actorId,
    createdAt: record.createdAt,
  };
}

function incrementCounter<T extends string>(
  counter: Map<T, number>,
  key: T,
  amount = 1,
) {
  counter.set(key, (counter.get(key) ?? 0) + amount);
}

function sortedBuckets<T extends string>(
  counter: Map<T, number>,
  limit: number,
): V0TrialFeedbackCountBucket[] {
  return [...counter.entries()]
    .map(([value, itemCount]) => ({
      count: itemCount,
      value,
    }))
    .sort((left, right) => right.count - left.count || left.value.localeCompare(right.value))
    .slice(0, limit);
}

function isLowUsefulness(record: V0TrialFeedbackRecord): boolean {
  return record.usefulnessRating <= 2;
}

function isLowClarity(record: V0TrialFeedbackRecord): boolean {
  return record.clarityRating <= 2;
}

function isRealWorkBlocker(record: V0TrialFeedbackRecord): boolean {
  return record.realWorkSignal === "no";
}

function issueTypeToFocus(
  issueType: z.infer<typeof issueTypeSchema> | null,
): V0TrialFeedbackEvidenceFocus {
  switch (issueType) {
    case "missing_data":
      return "sample_data";
    case "ai_quality":
      return "ai_quality";
    case "source_trust":
      return "source_trust";
    case "downstream_action":
      return "downstream_workflow";
    case "copy_confusion":
    case "workflow_break":
    case "mobile_layout":
    case "performance":
    case "other":
      return "experience_polish";
    case null:
      return "production_readiness";
  }
}

function focusRationale(input: {
  focus: V0TrialFeedbackEvidenceFocus;
  issueType: z.infer<typeof issueTypeSchema> | null;
  lowClarityCount: number;
  lowUsefulnessCount: number;
  totalCount: number;
  workbench: z.infer<typeof workbenchSchema> | null;
}): string {
  switch (input.focus) {
    case "collect_more_feedback":
      return "反馈样本还不足，先跑完 2-3 条完整试用路径再确定下一轮优先级。";
    case "sample_data":
      return "缺少数据是当前主要卡点，优先补充演示数据和可理解的样例。";
    case "ai_quality":
      return "AI 复盘质量或可用性正在影响真实工作信心，优先打磨复盘输出和验证。";
    case "source_trust":
      return "来源信任阻碍使用，优先强化资料审核状态、引用和可信边界。";
    case "downstream_workflow":
      return "反馈集中在下游动作，优先打通话术资产和下场任务的承接体验。";
    case "experience_polish":
      return `低有用或低清晰反馈共 ${input.lowUsefulnessCount + input.lowClarityCount} 条，优先修正最影响试用理解的界面和流程卡点。`;
    case "production_readiness":
      return `已有 ${input.totalCount} 条反馈且严重卡点较少，可以开始梳理生产登录、HTTPS、备份和真实数据边界。`;
  }
}

function chooseRecommendation(input: {
  hotspots: V0TrialFeedbackHotspot[];
  issueTypeCounts: V0TrialFeedbackCountBucket[];
  lowClarityCount: number;
  lowUsefulnessCount: number;
  totalCount: number;
}): V0TrialFeedbackEvidenceRecommendation {
  if (input.totalCount < 3) {
    return {
      focus: "collect_more_feedback",
      issueType: null,
      rationale: focusRationale({
        focus: "collect_more_feedback",
        issueType: null,
        lowClarityCount: input.lowClarityCount,
        lowUsefulnessCount: input.lowUsefulnessCount,
        totalCount: input.totalCount,
        workbench: null,
      }),
      workbench: null,
    };
  }

  const severeHotspots = input.hotspots.filter(
    (hotspot) => hotspot.lowRatingCount > 0 || hotspot.realWorkBlockerCount > 0,
  );
  const priorityOrder: Array<z.infer<typeof issueTypeSchema>> = [
    "ai_quality",
    "source_trust",
    "downstream_action",
    "missing_data",
    "workflow_break",
    "mobile_layout",
    "copy_confusion",
    "performance",
    "other",
  ];
  const selectedHotspot =
    priorityOrder
      .map((issueType) =>
        severeHotspots.find((hotspot) => hotspot.issueType === issueType),
      )
      .find(Boolean) ??
    input.hotspots[0] ??
    null;

  const selectedIssue =
    selectedHotspot?.issueType ??
    (input.issueTypeCounts[0]?.value as z.infer<typeof issueTypeSchema> | undefined) ??
    null;
  const focus =
    selectedHotspot || input.lowClarityCount > 0 || input.lowUsefulnessCount > 0
      ? issueTypeToFocus(selectedIssue)
      : "production_readiness";

  return {
    focus,
    issueType: selectedIssue,
    rationale: focusRationale({
      focus,
      issueType: selectedIssue,
      lowClarityCount: input.lowClarityCount,
      lowUsefulnessCount: input.lowUsefulnessCount,
      totalCount: input.totalCount,
      workbench: selectedHotspot?.workbench ?? null,
    }),
    workbench: selectedHotspot?.workbench ?? null,
  };
}

function summarizeFeedback(input: {
  completedTrialRunIds?: Set<string>;
  records: V0TrialFeedbackRecord[];
  totalCount: number;
}): V0TrialFeedbackEvidenceSummary {
  const issueTypeCounter = new Map<z.infer<typeof issueTypeSchema>, number>();
  const workbenchCounter = new Map<z.infer<typeof workbenchSchema>, number>();
  const hotspotCounter = new Map<
    string,
    {
      count: number;
      issueType: z.infer<typeof issueTypeSchema>;
      lowRatingCount: number;
      realWorkBlockerCount: number;
      workbench: z.infer<typeof workbenchSchema>;
    }
  >();
  const realWorkSignals: V0TrialFeedbackEvidenceSummary["realWorkSignals"] = {
    maybe: 0,
    no: 0,
    not_sure: 0,
    unknown: 0,
    yes: 0,
  };
  let lowUsefulnessCount = 0;
  let lowClarityCount = 0;
  let linkedRunFeedbackCount = 0;
  let completedRunFeedbackCount = 0;

  for (const record of input.records) {
    incrementCounter(issueTypeCounter, record.issueType);
    incrementCounter(workbenchCounter, record.workbench);
    realWorkSignals[record.realWorkSignal ?? "unknown"] += 1;

    if (isLowUsefulness(record)) {
      lowUsefulnessCount += 1;
    }

    if (isLowClarity(record)) {
      lowClarityCount += 1;
    }

    const hotspotKey = `${record.workbench}:${record.issueType}`;
    const existing = hotspotCounter.get(hotspotKey) ?? {
      count: 0,
      issueType: record.issueType,
      lowRatingCount: 0,
      realWorkBlockerCount: 0,
      workbench: record.workbench,
    };
    existing.count += 1;

    if (isLowUsefulness(record) || isLowClarity(record)) {
      existing.lowRatingCount += 1;
    }

    if (isRealWorkBlocker(record)) {
      existing.realWorkBlockerCount += 1;
    }

    if (record.trialRunId) {
      linkedRunFeedbackCount += 1;

      if (input.completedTrialRunIds?.has(record.trialRunId)) {
        completedRunFeedbackCount += 1;
      }
    }

    hotspotCounter.set(hotspotKey, existing);
  }

  const hotspots = [...hotspotCounter.values()]
    .sort(
      (left, right) =>
        right.lowRatingCount +
          right.realWorkBlockerCount -
          (left.lowRatingCount + left.realWorkBlockerCount) ||
        right.count - left.count ||
        left.workbench.localeCompare(right.workbench) ||
        left.issueType.localeCompare(right.issueType),
    )
    .slice(0, 5);
  const issueTypeCounts = sortedBuckets(issueTypeCounter, 8);
  const recommendation = chooseRecommendation({
    hotspots,
    issueTypeCounts,
    lowClarityCount,
    lowUsefulnessCount,
    totalCount: input.totalCount,
  });

  return {
    completedRunFeedbackCount,
    hotspots,
    includedCount: input.records.length,
    issueTypeCounts,
    linkedRunFeedbackCount,
    lowClarityCount,
    lowUsefulnessCount,
    realWorkSignals,
    recentNotes: input.records.slice(0, 5).map((record) => ({
      clarityRating: record.clarityRating,
      createdAt: record.createdAt,
      id: record.id,
      issueType: record.issueType,
      note: record.note,
      realWorkSignal: record.realWorkSignal,
      trialRunId: record.trialRunId,
      trialRunStepId: record.trialRunStepId,
      usefulnessRating: record.usefulnessRating,
      workbench: record.workbench,
    })),
    recommendation,
    totalCount: input.totalCount,
    workbenchCounts: sortedBuckets(workbenchCounter, 8),
  };
}

export function createV0TrialFeedbackRepository(
  database: V0TrialFeedbackRepositoryDatabase,
) {
  async function assertTrialRunLinkScope(
    context: DataAccessContext,
    input: {
      trialRunId: string | null | undefined;
      trialRunStepId: string | null | undefined;
    },
  ): Promise<{
    trialRunId: string | null;
    trialRunStepId: string | null;
  }> {
    if (!input.trialRunId && !input.trialRunStepId) {
      return {
        trialRunId: null,
        trialRunStepId: null,
      };
    }

    if (!input.trialRunId || !input.trialRunStepId) {
      throw new V0TrialFeedbackError(
        "VALIDATION_ERROR",
        "Linked V0 trial feedback requires both trial run and step ids",
      );
    }

    const [run] = await database
      .select()
      .from(v0TrialRuns)
      .where(
        and(
          eq(v0TrialRuns.id, input.trialRunId),
          eq(v0TrialRuns.tenantId, context.tenantId),
          eq(v0TrialRuns.teamId, context.teamId),
          eq(v0TrialRuns.actorId, context.actorId),
        ),
      )
      .limit(1);

    if (!run) {
      throw new V0TrialFeedbackError(
        "FORBIDDEN_PERMISSION",
        "Linked V0 trial run is outside the current scope",
      );
    }

    const [step] = await database
      .select()
      .from(v0TrialRunSteps)
      .where(
        and(
          eq(v0TrialRunSteps.id, input.trialRunStepId),
          eq(v0TrialRunSteps.runId, input.trialRunId),
          eq(v0TrialRunSteps.tenantId, context.tenantId),
          eq(v0TrialRunSteps.teamId, context.teamId),
          eq(v0TrialRunSteps.actorId, context.actorId),
        ),
      )
      .limit(1);

    if (!step) {
      throw new V0TrialFeedbackError(
        "FORBIDDEN_PERMISSION",
        "Linked V0 trial run step is outside the current scope",
      );
    }

    return {
      trialRunId: run.id,
      trialRunStepId: step.id,
    };
  }

  return {
    async createFeedback(
      context: DataAccessContext,
      input: CreateV0TrialFeedbackInput,
    ): Promise<V0TrialFeedbackView> {
      const values = parseInput(createFeedbackInputSchema, input);

      assertReadWorkspace(context);
      assertNoteIsSafe(values.note);

      try {
        const link = await assertTrialRunLinkScope(context, {
          trialRunId: values.trialRunId,
          trialRunStepId: values.trialRunStepId,
        });
        const [record] = await database
          .insert(v0TrialFeedback)
          .values({
            id: createRecordId("trialfb"),
            tenantId: context.tenantId,
            teamId: context.teamId,
            actorId: context.actorId,
            evaluatorRole: values.evaluatorRole,
            workbench: values.workbench,
            pagePath: values.pagePath,
            usefulnessRating: values.usefulnessRating,
            clarityRating: values.clarityRating,
            issueType: values.issueType,
            note: values.note,
            realWorkSignal: values.realWorkSignal ?? null,
            trialRunId: link.trialRunId,
            trialRunStepId: link.trialRunStepId,
            metadata: {
              ...values.metadata,
              requestId: context.requestId,
            },
          })
          .returning();

        return toFeedbackView(record);
      } catch (error) {
        throw mapDatabaseError(error);
      }
    },

    async listFeedback(
      context: DataAccessContext,
      input: ListV0TrialFeedbackInput = {},
    ): Promise<V0TrialFeedbackListResult> {
      const values = parseInput(listFeedbackInputSchema, input);

      assertReadWorkspace(context);

      const filters = [
        eq(v0TrialFeedback.tenantId, context.tenantId),
        eq(v0TrialFeedback.teamId, context.teamId),
      ];

      if (values.workbench) {
        filters.push(eq(v0TrialFeedback.workbench, values.workbench));
      }

      if (values.issueType) {
        filters.push(eq(v0TrialFeedback.issueType, values.issueType));
      }

      try {
        const [total] = await database
          .select({ value: count() })
          .from(v0TrialFeedback)
          .where(and(...filters));
        const records = await database
          .select()
          .from(v0TrialFeedback)
          .where(and(...filters))
          .orderBy(desc(v0TrialFeedback.createdAt))
          .limit(values.limit);
        const evidenceRecords = await database
          .select()
          .from(v0TrialFeedback)
          .where(and(...filters))
          .orderBy(desc(v0TrialFeedback.createdAt))
          .limit(200);
        const linkedRunIds = [
          ...new Set(
            evidenceRecords
              .map((record) => record.trialRunId)
              .filter((id): id is string => Boolean(id)),
          ),
        ];
        const completedTrialRunIds =
          linkedRunIds.length > 0
            ? new Set(
                (
                  await database
                    .select({ id: v0TrialRuns.id })
                    .from(v0TrialRuns)
                    .where(
                      and(
                        eq(v0TrialRuns.tenantId, context.tenantId),
                        eq(v0TrialRuns.teamId, context.teamId),
                        eq(v0TrialRuns.actorId, context.actorId),
                        eq(v0TrialRuns.status, "completed"),
                        inArray(v0TrialRuns.id, linkedRunIds),
                      ),
                    )
                ).map((record) => record.id),
              )
            : new Set<string>();

        return {
          items: records.map(toFeedbackView),
          summary: summarizeFeedback({
            completedTrialRunIds,
            records: evidenceRecords,
            totalCount: Number(total?.value ?? 0),
          }),
        };
      } catch (error) {
        throw mapDatabaseError(error);
      }
    },
  };
}
