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
  type RacketProductView,
} from "./repository";

class ExpectedRollback extends Error {
  constructor() {
    super("Rollback local racket source review publish check");
  }
}

type RegisterRacketSourceInput = {
  productId: string;
  sourceType: "official_site" | "brand_catalog" | "commerce_page" | "team_note" | "manual_review";
  title: string;
  url?: string;
  retrievedAt: Date;
  trustLevel: "official" | "commerce" | "team" | "unknown";
  refreshPolicy: "manual" | "monthly" | "quarterly" | "on_demand";
};

type RacketSourceView = {
  id: string;
  productId: string;
  reviewState: "pending" | "approved" | "rejected" | "stale";
};

type ReviewDecisionInput = {
  productId: string;
  targetType: "product" | "source";
  targetId: string;
  decision: "approve" | "reject" | "request_source" | "mark_conflict" | "archive";
  reason: string;
};

type ReviewQueueResult = {
  items: Array<{
    product: RacketProductView;
    sourceSummary: {
      total: number;
      approved: number;
      pending: number;
      rejected: number;
      stale: number;
    };
  }>;
};

type SourceReviewRepository = ReturnType<typeof createRacketProductRepository> & {
  registerRacketSource: (
    context: DataAccessContext,
    input: RegisterRacketSourceInput,
  ) => Promise<RacketSourceView>;
  submitRacketProductForReview: (
    context: DataAccessContext,
    input: { productId: string },
  ) => Promise<RacketProductView>;
  recordRacketReviewDecision: (
    context: DataAccessContext,
    input: ReviewDecisionInput,
  ) => Promise<RacketProductView | RacketSourceView>;
  publishRacketProduct: (
    context: DataAccessContext,
    input: { productId: string; changeReason: string },
  ) => Promise<RacketProductView>;
  listRacketReviewQueue: (
    context: DataAccessContext,
    input?: { limit?: number },
  ) => Promise<ReviewQueueResult>;
};

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

    throw new Error(
      `${label} failed with unexpected rejection: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }

  throw new Error(`${label} should have been rejected`);
}

function createProductInput(model: string) {
  return {
    brand: "Yonex",
    series: "Astrox",
    model,
    aliases: [
      {
        alias: model.replace(/\s+/g, ""),
        aliasType: "official_en" as const,
        confidence: "high" as const,
      },
    ],
    specs: {
      weightClasses: ["4U"],
      balancePoint: "",
      balanceType: "head_heavy" as const,
      shaftStiffness: "extra stiff",
      recommendedTension: "20-28 lb",
    },
    positioning: {
      playerLevels: ["advanced"],
      playStyles: ["rear-court attack"],
      priceBand: "premium",
      sellingFocus: ["Steep smash with fast recovery"],
      limitations: ["Requires stronger timing"],
    },
    sourceIds: [],
  };
}

function createSourceInput(productId: string, titleSuffix = "") {
  return {
    productId,
    sourceType: "official_site" as const,
    title: `Yonex Astrox source${titleSuffix}`,
    url: `https://www.yonex.com/example/astrox${titleSuffix}`,
    retrievedAt: new Date("2026-05-23T08:00:00.000Z"),
    trustLevel: "official" as const,
    refreshPolicy: "quarterly" as const,
  };
}

function assertPublished(product: RacketProductView) {
  if (product.status !== "published") {
    throw new Error("Product should be published after source-backed approval");
  }

  const blockedWorkflows = product.downstreamReadiness.filter(
    (entry) => !entry.ready || entry.blockedBy.length > 0,
  );

  if (blockedWorkflows.length > 0) {
    throw new Error("Published product should be ready for downstream workflows");
  }

  if (product.sourceIds.length !== 1) {
    throw new Error("Published product should summarize approved source IDs");
  }
}

async function main() {
  const { client, db } = createDatabaseConnection();
  const checkId = `rackets_source_review_check_${Date.now()}`;

  try {
    try {
      await db.transaction(async (transaction) => {
        const tenantId = `${checkId}_tenant`;
        const teamId = `${checkId}_team`;
        const otherTeamId = `${checkId}_other_team`;
        const managerId = `${checkId}_manager`;
        const reviewerId = `${checkId}_reviewer`;
        const viewerId = `${checkId}_viewer`;

        await transaction.insert(tenants).values({
          id: tenantId,
          name: "Local racket source review publish check",
          defaultTeamId: teamId,
        });

        await transaction.insert(teams).values([
          {
            id: teamId,
            tenantId,
            name: "Racket source review team",
            createdBy: managerId,
          },
          {
            id: otherTeamId,
            tenantId,
            name: "Other source review team",
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
            id: reviewerId,
            displayName: "Reviewer",
            primaryEmail: `${reviewerId}@example.invalid`,
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
            id: `${reviewerId}_tenant_membership`,
            tenantId,
            userId: reviewerId,
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
            id: `${reviewerId}_team_membership`,
            tenantId,
            teamId,
            userId: reviewerId,
            status: "active",
            role: "reviewer",
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

        const reviewerContext = parseDataAccessContext({
          requestId: `${checkId}_reviewer_request`,
          actorId: reviewerId,
          tenantId,
          teamId,
          role: "reviewer",
          permissions: ["read_workspace", "review_knowledge"],
        });

        const viewerContext = parseDataAccessContext({
          requestId: `${checkId}_viewer_request`,
          actorId: viewerId,
          tenantId,
          teamId,
          role: "viewer",
          permissions: ["read_workspace"],
        });

        const otherTeamContext = parseDataAccessContext({
          ...managerContext,
          requestId: `${checkId}_other_team_request`,
          teamId: otherTeamId,
        });

        const repository = createRacketProductRepository(
          transaction as unknown as RacketProductRepositoryDatabase,
        ) as SourceReviewRepository;

        const product = await repository.createRacketProduct(
          managerContext,
          createProductInput("Astrox 100 ZZ Source Review"),
        );

        await expectRejected(
          "publish without source",
          () =>
            repository.publishRacketProduct(reviewerContext, {
              productId: product.id,
              changeReason: "No reviewed source yet",
            }),
          "STATE_TRANSITION_INVALID",
        );

        await expectRejected(
          "submit without source",
          () =>
            repository.submitRacketProductForReview(managerContext, {
              productId: product.id,
            }),
          "MISSING_SOURCE",
        );

        const source = await repository.registerRacketSource(
          managerContext,
          createSourceInput(product.id),
        );

        if (source.productId !== product.id || source.reviewState !== "pending") {
          throw new Error("Registered source view is invalid");
        }

        await expectRejected(
          "duplicate source",
          () =>
            repository.registerRacketSource(
              managerContext,
              createSourceInput(product.id),
            ),
          "SOURCE_CONFLICT",
        );

        const reviewing = await repository.submitRacketProductForReview(
          managerContext,
          { productId: product.id },
        );

        if (reviewing.status !== "reviewing") {
          throw new Error("Product should move to reviewing after source exists");
        }

        await expectRejected(
          "viewer review decision",
          () =>
            repository.recordRacketReviewDecision(viewerContext, {
              productId: product.id,
              targetType: "source",
              targetId: source.id,
              decision: "approve",
              reason: "Viewer cannot approve sources",
            }),
          "FORBIDDEN_PERMISSION",
        );

        const approvedSource = await repository.recordRacketReviewDecision(
          reviewerContext,
          {
            productId: product.id,
            targetType: "source",
            targetId: source.id,
            decision: "approve",
            reason: "Official source matches product specs",
          },
        );

        if ("reviewState" in approvedSource && approvedSource.reviewState !== "approved") {
          throw new Error("Source should become approved");
        }

        const approvedProduct = await repository.recordRacketReviewDecision(
          reviewerContext,
          {
            productId: product.id,
            targetType: "product",
            targetId: product.id,
            decision: "approve",
            reason: "Product has approved source evidence",
          },
        );

        if (!("status" in approvedProduct) || approvedProduct.status !== "approved") {
          throw new Error("Product should become approved");
        }

        const published = await repository.publishRacketProduct(reviewerContext, {
          productId: product.id,
          changeReason: "Approved source and reviewer decision",
        });

        assertPublished(published);

        const otherTeamProduct = await repository.createRacketProduct(
          otherTeamContext,
          createProductInput("Astrox 100 ZZ Source Review"),
        );

        const otherTeamSource = await repository.registerRacketSource(
          otherTeamContext,
          createSourceInput(otherTeamProduct.id, "-other"),
        );

        await repository.submitRacketProductForReview(otherTeamContext, {
          productId: otherTeamProduct.id,
        });

        const queue = await repository.listRacketReviewQueue(reviewerContext, {
          limit: 10,
        });

        if (queue.items.some((item) => item.product.id === otherTeamProduct.id)) {
          throw new Error("Review queue leaked another team's product");
        }

        if (otherTeamSource.productId !== otherTeamProduct.id) {
          throw new Error("Other team source setup failed");
        }

        throw new ExpectedRollback();
      });
    } catch (error) {
      if (!(error instanceof ExpectedRollback)) {
        throw error;
      }
    }

    console.log(
      "Racket source review publish check passed; transaction rolled back.",
    );
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(
    error instanceof Error
      ? error.message
      : "Unknown rackets:source-review-check failure",
  );
  process.exitCode = 1;
});
