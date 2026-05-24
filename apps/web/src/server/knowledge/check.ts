import { createDatabaseConnection } from "../db/client";
import { parseDataAccessContext, type DataAccessContext } from "../db/context";
import {
  appUsers,
  teamMemberships,
  teams,
  tenantMemberships,
  tenants,
} from "../db/schema";
import {
  createKnowledgeLifecycleRepository,
  type KnowledgeLifecycleRepositoryDatabase,
} from "./repository";

class ExpectedRollback extends Error {
  constructor() {
    super("Rollback local knowledge lifecycle persistence check");
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

function createSourceInput() {
  return {
    sourceType: "official_brand" as const,
    title: "ASTROX 100ZZ product page",
    owner: "Yonex",
    url: "https://www.yonex.com/badminton/rackets/astrox-100zz",
    retrievedAt: new Date("2026-05-23T12:00:00.000Z"),
    trustLevel: "official" as const,
    refreshCadence: "monthly" as const,
    intendedUse: ["racket_spec", "talk_track"],
  };
}

async function main() {
  const { client, db } = createDatabaseConnection();
  const checkId = `knowledge_check_${Date.now()}`;

  try {
    try {
      await db.transaction(async (transaction) => {
        const tenantId = `${checkId}_tenant`;
        const teamId = `${checkId}_team`;
        const otherTeamId = `${checkId}_other_team`;
        const reviewerId = `${checkId}_reviewer`;
        const viewerId = `${checkId}_viewer`;

        await transaction.insert(tenants).values({
          id: tenantId,
          name: "Local knowledge lifecycle persistence check",
          defaultTeamId: teamId,
        });

        await transaction.insert(teams).values([
          {
            id: teamId,
            tenantId,
            name: "Knowledge review team",
            createdBy: reviewerId,
          },
          {
            id: otherTeamId,
            tenantId,
            name: "Second knowledge review team",
            createdBy: reviewerId,
          },
        ]);

        await transaction.insert(appUsers).values([
          {
            id: reviewerId,
            displayName: "Knowledge Reviewer",
            primaryEmail: `${reviewerId}@example.invalid`,
            status: "active",
          },
          {
            id: viewerId,
            displayName: "Readonly Viewer",
            primaryEmail: `${viewerId}@example.invalid`,
            status: "active",
          },
        ]);

        await transaction.insert(tenantMemberships).values([
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
            id: `${reviewerId}_team_membership`,
            tenantId,
            teamId,
            userId: reviewerId,
            status: "active",
            role: "reviewer",
            joinedAt: new Date(),
          },
          {
            id: `${reviewerId}_other_team_membership`,
            tenantId,
            teamId: otherTeamId,
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

        const reviewerContext = parseDataAccessContext({
          requestId: `${checkId}_reviewer_request`,
          actorId: reviewerId,
          tenantId,
          teamId,
          role: "reviewer",
          permissions: ["read_workspace", "review_knowledge"],
        });

        const otherTeamContext = parseDataAccessContext({
          ...reviewerContext,
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

        const repository = createKnowledgeLifecycleRepository(
          transaction as unknown as KnowledgeLifecycleRepositoryDatabase,
        );

        const source = await repository.registerKnowledgeSource(
          reviewerContext,
          createSourceInput(),
        );

        if (
          source.title !== "ASTROX 100ZZ product page" ||
          source.reviewState !== "registered"
        ) {
          throw new Error("Registered source view is missing source details");
        }

        await expectRejected(
          "duplicate source",
          () =>
            repository.registerKnowledgeSource(reviewerContext, {
              ...createSourceInput(),
              title: " ASTROX 100ZZ Product Page ",
            }),
          "DUPLICATE_SOURCE",
        );

        await expectRejected(
          "missing permission",
          () =>
            repository.registerKnowledgeSource(
              viewerContext,
              createSourceInput(),
            ),
          "FORBIDDEN_PERMISSION",
        );

        const claim = await repository.addExtractedKnowledgeClaim(
          reviewerContext,
          {
            sourceId: source.id,
            claimType: "racket_spec",
            subject: "ASTROX 100ZZ",
            claimText: "ASTROX 100ZZ 是面向进攻打法的高端球拍。",
            language: "zh",
            confidence: "high",
            extractionMethod: "manual",
            knowledgeKey: "racket:astrox-100zz:positioning",
          },
        );

        const teamNote = await repository.addTeamKnowledgeNote(reviewerContext, {
          noteType: "selling_experience",
          content: "直播讲解时先说明发力门槛，再引导到进攻型球友。",
          sensitiveLevel: "internal",
          sourceIds: [source.id],
          knowledgeKey: "racket:astrox-100zz:positioning",
        });

        const queue = await repository.listKnowledgeReviewQueue(
          reviewerContext,
          { limit: 20 },
        );

        if (queue.items.length < 3) {
          throw new Error("Review queue should include source, claim and note");
        }

        await repository.recordKnowledgeReviewDecision(reviewerContext, {
          targetType: "source",
          targetId: source.id,
          decision: "approve",
          reason: "来源为品牌官方页面。",
        });

        const approvedClaim = await repository.recordKnowledgeReviewDecision(
          reviewerContext,
          {
            targetType: "claim",
            targetId: claim.id,
            decision: "approve",
            reason: "claim 与来源和团队口径一致。",
          },
        );

        await repository.recordKnowledgeReviewDecision(reviewerContext, {
          targetType: "team_note",
          targetId: teamNote.id,
          decision: "approve",
          reason: "团队经验可用于话术准备。",
        });

        if (!("reviewState" in approvedClaim) || approvedClaim.reviewState !== "approved") {
          throw new Error("Approved claim did not return approved state");
        }

        const conflict = await repository.recordKnowledgeConflict(
          reviewerContext,
          {
            knowledgeKey: "racket:astrox-100zz:positioning",
            claimIds: [claim.id],
            conflictType: "team_note_conflict",
            severity: "medium",
          },
        );

        await expectRejected(
          "conflict blocks publish",
          () =>
            repository.publishKnowledgeVersion(reviewerContext, {
              knowledgeKey: "racket:astrox-100zz:positioning",
              claimIds: [claim.id],
              teamNoteIds: [teamNote.id],
              sourceIds: [source.id],
              summary: "ASTROX 100ZZ 适合有发力基础的进攻型球友。",
            }),
          "CONFLICTING_CLAIM",
        );

        await repository.resolveKnowledgeConflict(reviewerContext, {
          conflictId: conflict.id,
          decision: "resolved",
          reason: "团队口径已与来源字段对齐。",
        });

        const published = await repository.publishKnowledgeVersion(
          reviewerContext,
          {
            knowledgeKey: "racket:astrox-100zz:positioning",
            claimIds: [claim.id],
            teamNoteIds: [teamNote.id],
            sourceIds: [source.id],
            summary: "ASTROX 100ZZ 适合有发力基础的进攻型球友。",
          },
        );

        const qaReadiness = published.downstreamReadiness.find(
          (entry) => entry.workflow === "qa_agent",
        );

        if (!qaReadiness?.ready) {
          throw new Error("Published knowledge should be ready for Q&A grounding");
        }

        await repository.registerKnowledgeSource(
          otherTeamContext,
          createSourceInput(),
        );

        const afterOtherTeamCreate = await repository.listKnowledgeSources(
          reviewerContext,
          { limit: 20 },
        );

        if (afterOtherTeamCreate.items.length !== 1) {
          throw new Error("Scoped source list leaked another team's record");
        }

        throw new ExpectedRollback();
      });
    } catch (error) {
      if (!(error instanceof ExpectedRollback)) {
        throw error;
      }
    }

    console.log("Knowledge lifecycle persistence check passed; transaction rolled back.");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(
    error instanceof Error
      ? error.message
      : "Unknown knowledge:check failure",
  );
  process.exitCode = 1;
});
