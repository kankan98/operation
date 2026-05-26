import "server-only";

import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";

import type { DatabaseClient } from "../db/client";
import type { DataAccessContext } from "../db/context";
import { createRecordId } from "../db/repository";
import {
  v0TrialFeedback,
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
  actorId: string;
  createdAt: Date;
};

export type V0TrialFeedbackListResult = {
  items: V0TrialFeedbackView[];
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
    actorId: record.actorId,
    createdAt: record.createdAt,
  };
}

export function createV0TrialFeedbackRepository(
  database: V0TrialFeedbackRepositoryDatabase,
) {
  return {
    async createFeedback(
      context: DataAccessContext,
      input: CreateV0TrialFeedbackInput,
    ): Promise<V0TrialFeedbackView> {
      const values = parseInput(createFeedbackInputSchema, input);

      assertReadWorkspace(context);
      assertNoteIsSafe(values.note);

      try {
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
        const records = await database
          .select()
          .from(v0TrialFeedback)
          .where(and(...filters))
          .orderBy(desc(v0TrialFeedback.createdAt))
          .limit(values.limit);

        return {
          items: records.map(toFeedbackView),
        };
      } catch (error) {
        throw mapDatabaseError(error);
      }
    },
  };
}
