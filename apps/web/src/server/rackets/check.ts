import { createDatabaseConnection } from "../db/client";
import {
  appUsers,
  teamMemberships,
  teams,
  tenantMemberships,
  tenants,
} from "../db/schema";
import { parseDataAccessContext, type DataAccessContext } from "../db/context";
import {
  createRacketProductRepository,
  type RacketProductRepositoryDatabase,
} from "./repository";

class ExpectedRollback extends Error {
  constructor() {
    super("Rollback local racket product persistence check");
  }
}

async function expectRejected(
  label: string,
  action: () => Promise<unknown>,
  expectedCode: string,
) {
  try {
    await action();
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      error.code === expectedCode
    ) {
      return;
    }

    throw new Error(`${label} failed with unexpected rejection`);
  }

  throw new Error(`${label} should have been rejected`);
}

function createProductInput(model: string, aliases: string[] = []) {
  return {
    brand: "Yonex",
    series: "Astrox",
    model,
    aliases: aliases.map((alias) => ({
      alias,
      aliasType: "official_en" as const,
      confidence: "high" as const,
    })),
    specs: {
      weightClasses: ["4U", "3U"],
      balancePoint: "",
      balanceType: "head_heavy" as const,
      shaftStiffness: "extra stiff",
      recommendedTension: "20-28 lb",
    },
    positioning: {
      playerLevels: ["advanced"],
      playStyles: ["rear-court attack"],
      priceBand: "premium",
      sellingFocus: ["Fast recovery after a steep smash"],
      limitations: ["Requires stronger swing timing"],
    },
    sourceIds: [],
  };
}

function assertReadyBlocked(context: string, blockedBy: string[]) {
  if (!blockedBy.includes("not_published")) {
    throw new Error(`${context} should not be downstream-ready before publish`);
  }
}

async function main() {
  const { client, db } = createDatabaseConnection();
  const checkId = `rackets_check_${Date.now()}`;

  try {
    try {
      await db.transaction(async (transaction) => {
        const tenantId = `${checkId}_tenant`;
        const teamId = `${checkId}_team`;
        const otherTeamId = `${checkId}_other_team`;
        const managerId = `${checkId}_manager`;
        const viewerId = `${checkId}_viewer`;

        await transaction.insert(tenants).values({
          id: tenantId,
          name: "Local racket product persistence check",
          defaultTeamId: teamId,
        });

        await transaction.insert(teams).values([
          {
            id: teamId,
            tenantId,
            name: "Racket product team",
            createdBy: managerId,
          },
          {
            id: otherTeamId,
            tenantId,
            name: "Second product team",
            createdBy: managerId,
          },
        ]);

        await transaction.insert(appUsers).values([
          {
            id: managerId,
            displayName: "Product Manager",
            primaryEmail: `${managerId}@example.invalid`,
            status: "active",
          },
          {
            id: viewerId,
            displayName: "Viewer",
            primaryEmail: `${viewerId}@example.invalid`,
            status: "active",
          },
        ]);

        await transaction.insert(tenantMemberships).values([
          {
            id: `${managerId}_tenant_membership`,
            tenantId,
            userId: managerId,
            status: "active",
            tenantRole: "member",
            joinedAt: new Date(),
          },
          {
            id: `${viewerId}_tenant_membership`,
            tenantId,
            userId: viewerId,
            status: "active",
            tenantRole: "viewer",
            joinedAt: new Date(),
          },
        ]);

        await transaction.insert(teamMemberships).values([
          {
            id: `${managerId}_team_membership`,
            tenantId,
            teamId,
            userId: managerId,
            status: "active",
            role: "product_owner",
            joinedAt: new Date(),
          },
          {
            id: `${managerId}_other_team_membership`,
            tenantId,
            teamId: otherTeamId,
            userId: managerId,
            status: "active",
            role: "product_owner",
            joinedAt: new Date(),
          },
          {
            id: `${viewerId}_team_membership`,
            tenantId,
            teamId,
            userId: viewerId,
            status: "active",
            role: "viewer",
            joinedAt: new Date(),
          },
        ]);

        const managerContext = parseDataAccessContext({
          requestId: `${checkId}_manager_request`,
          actorId: managerId,
          tenantId,
          teamId,
          role: "product_owner",
          permissions: ["read_workspace", "manage_products"],
        });

        const otherTeamContext = parseDataAccessContext({
          ...managerContext,
          requestId: `${checkId}_other_team_request`,
          teamId: otherTeamId,
        });

        const viewerContext: DataAccessContext = parseDataAccessContext({
          requestId: `${checkId}_viewer_request`,
          actorId: viewerId,
          tenantId,
          teamId,
          role: "viewer",
          permissions: ["read_workspace"],
        });

        const repository = createRacketProductRepository(
          transaction as unknown as RacketProductRepositoryDatabase,
        );

        const created = await repository.createRacketProduct(
          managerContext,
          createProductInput("Astrox 100 ZZ", ["AX100ZZ", "Astrox 100ZZ"]),
        );

        if (created.model !== "Astrox 100 ZZ" || created.aliases.length !== 2) {
          throw new Error("Created racket product view is missing aliases");
        }

        assertReadyBlocked(
          "created product",
          created.downstreamReadiness.find((entry) => entry.workflow === "qa_agent")
            ?.blockedBy ?? [],
        );

        const listed = await repository.listRacketProducts(managerContext, {
          limit: 10,
        });

        if (listed.items.length !== 1 || listed.items[0]?.id !== created.id) {
          throw new Error("Scoped list did not return the created product");
        }

        await expectRejected(
          "duplicate model",
          () =>
            repository.createRacketProduct(
              managerContext,
              createProductInput(" ASTROX100zz "),
            ),
          "DUPLICATE_MODEL",
        );

        await expectRejected(
          "alias conflict",
          () =>
            repository.createRacketProduct(
              managerContext,
              createProductInput("Astrox 99 Pro", ["AX100ZZ"]),
            ),
          "ALIAS_CONFLICT",
        );

        await expectRejected(
          "missing permission",
          () =>
            repository.createRacketProduct(
              viewerContext,
              createProductInput("Nanoflare 1000 Z"),
            ),
          "FORBIDDEN_PERMISSION",
        );

        await repository.createRacketProduct(
          otherTeamContext,
          createProductInput("Astrox 100 ZZ", ["AX100ZZ"]),
        );

        const afterOtherTeamCreate = await repository.listRacketProducts(
          managerContext,
          { limit: 10 },
        );

        if (afterOtherTeamCreate.items.length !== 1) {
          throw new Error("Scoped list leaked another team's product");
        }

        throw new ExpectedRollback();
      });
    } catch (error) {
      if (!(error instanceof ExpectedRollback)) {
        throw error;
      }
    }

    console.log("Racket product persistence check passed; transaction rolled back.");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Unknown rackets:check failure");
  process.exitCode = 1;
});
