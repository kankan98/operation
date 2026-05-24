import { createHash, randomUUID } from "node:crypto";

import { and, eq } from "drizzle-orm";
import { z } from "zod";

import type { DataAccessContext } from "./context";
import { assertTenantTeamScope } from "./context";
import { DataFoundationError, redactMetadata, toDataFoundationError } from "./errors";
import {
  dataAuditEvents,
  idempotencyRecords,
  type DataAuditEventRecord,
  type IdempotencyRecord,
} from "./schema";
import type { DatabaseClient } from "./client";

export type RepositoryDatabase = Pick<DatabaseClient, "insert" | "select">;

const metadataSchema = z.record(z.string(), z.unknown()).optional();

const auditEventInputSchema = z.object({
  eventType: z.string().min(1).max(80),
  targetType: z.string().min(1).max(80).optional(),
  targetId: z.string().min(1).optional(),
  metadata: metadataSchema,
});

const idempotencyInputSchema = z.object({
  idempotencyKey: z.string().min(1).max(160),
  requestHash: z.string().min(32).max(128),
  targetType: z.string().min(1).max(80).optional(),
  targetId: z.string().min(1).optional(),
  expiresAt: z.date(),
});

export type AuditEventInput = z.infer<typeof auditEventInputSchema>;
export type IdempotencyInput = z.infer<typeof idempotencyInputSchema>;

export function createRecordId(prefix: string): string {
  return `${prefix}_${randomUUID().replaceAll("-", "")}`;
}

export function hashIdempotencyPayload(payload: unknown): string {
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

function parseInput<T>(schema: z.ZodType<T>, input: unknown): T {
  const parsed = schema.safeParse(input);

  if (parsed.success) {
    return parsed.data;
  }

  throw new DataFoundationError("VALIDATION_FAILED", "Repository input is invalid", {
    details: {
      issues: parsed.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    },
  });
}

export function createDataFoundationRepository(database: RepositoryDatabase) {
  return {
    async recordAuditEvent(
      context: DataAccessContext,
      input: AuditEventInput,
    ): Promise<DataAuditEventRecord> {
      const values = parseInput(auditEventInputSchema, input);

      try {
        const [event] = await database
          .insert(dataAuditEvents)
          .values({
            id: createRecordId("audit"),
            eventType: values.eventType,
            actorId: context.actorId,
            tenantId: context.tenantId,
            teamId: context.teamId,
            targetType: values.targetType,
            targetId: values.targetId,
            requestId: context.requestId,
            metadata: redactMetadata(values.metadata),
          })
          .returning();

        return event;
      } catch (error) {
        throw toDataFoundationError(error);
      }
    },

    async createIdempotencyRecord(
      context: DataAccessContext,
      input: IdempotencyInput,
    ): Promise<IdempotencyRecord> {
      const values = parseInput(idempotencyInputSchema, input);

      try {
        const [record] = await database
          .insert(idempotencyRecords)
          .values({
            id: createRecordId("idem"),
            idempotencyKey: values.idempotencyKey,
            requestHash: values.requestHash,
            tenantId: context.tenantId,
            teamId: context.teamId,
            actorId: context.actorId,
            targetType: values.targetType,
            targetId: values.targetId,
            status: "pending",
            expiresAt: values.expiresAt,
          })
          .returning();

        return record;
      } catch (error) {
        throw toDataFoundationError(error);
      }
    },

    async getIdempotencyRecord(
      context: DataAccessContext,
      idempotencyKey: string,
    ): Promise<IdempotencyRecord | null> {
      try {
        const [record] = await database
          .select()
          .from(idempotencyRecords)
          .where(
            and(
              eq(idempotencyRecords.tenantId, context.tenantId),
              eq(idempotencyRecords.teamId, context.teamId),
              eq(idempotencyRecords.actorId, context.actorId),
              eq(idempotencyRecords.idempotencyKey, idempotencyKey),
            ),
          )
          .limit(1);

        if (record) {
          assertTenantTeamScope(context, {
            tenantId: record.tenantId,
            teamId: record.teamId,
          });
        }

        return record ?? null;
      } catch (error) {
        throw toDataFoundationError(error);
      }
    },
  };
}
