import { createDatabaseConnection } from "./client";
import { parseDataAccessContext } from "./context";
import {
  appUsers,
  teamMemberships,
  teams,
  tenantMemberships,
  tenants,
} from "./schema";
import {
  createDataFoundationRepository,
  hashIdempotencyPayload,
  type RepositoryDatabase,
} from "./repository";

class ExpectedRollback extends Error {
  constructor() {
    super("Rollback local data foundation check");
  }
}

async function main() {
  const { client, db } = createDatabaseConnection();
  const checkId = `check_${Date.now()}`;

  try {
    try {
      await db.transaction(async (transaction) => {
        const tenantId = `${checkId}_tenant`;
        const teamId = `${checkId}_team`;
        const actorId = `${checkId}_user`;

        await transaction.insert(tenants).values({
          id: tenantId,
          name: "Local data foundation check",
        });

        await transaction.insert(teams).values({
          id: teamId,
          tenantId,
          name: "Local operations team",
          createdBy: actorId,
        });

        await transaction.insert(appUsers).values({
          id: actorId,
          displayName: "Local Check",
          primaryEmail: `${checkId}@example.invalid`,
          status: "active",
        });

        await transaction.insert(tenantMemberships).values({
          id: `${checkId}_tenant_membership`,
          tenantId,
          userId: actorId,
          status: "active",
          tenantRole: "admin",
          joinedAt: new Date(),
        });

        await transaction.insert(teamMemberships).values({
          id: `${checkId}_team_membership`,
          tenantId,
          teamId,
          userId: actorId,
          status: "active",
          role: "admin",
          joinedAt: new Date(),
        });

        const context = parseDataAccessContext({
          requestId: `${checkId}_request`,
          actorId,
          tenantId,
          teamId,
          role: "admin",
          permissions: ["read_workspace", "admin_settings"],
        });

        const repository = createDataFoundationRepository(
          transaction as unknown as RepositoryDatabase,
        );
        await repository.recordAuditEvent(context, {
          eventType: "db_check_started",
          targetType: "data_foundation",
          targetId: checkId,
          metadata: {
            operation: "db:check",
            databaseUrl: process.env.DATABASE_URL,
            prompt: "must be redacted",
          },
        });

        const idempotencyKey = `${checkId}_key`;
        await repository.createIdempotencyRecord(context, {
          idempotencyKey,
          requestHash: hashIdempotencyPayload({ checkId, operation: "db:check" }),
          targetType: "data_foundation",
          targetId: checkId,
          expiresAt: new Date(Date.now() + 60_000),
        });

        const record = await repository.getIdempotencyRecord(context, idempotencyKey);

        if (!record) {
          throw new Error("Idempotency record was not readable by scoped repository");
        }

        throw new ExpectedRollback();
      });
    } catch (error) {
      if (!(error instanceof ExpectedRollback)) {
        throw error;
      }
    }

    console.log("Data foundation local repository check passed; transaction rolled back.");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Unknown db:check failure");
  process.exitCode = 1;
});
