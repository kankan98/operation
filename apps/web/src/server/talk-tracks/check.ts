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
  createTalkTrackAssetRepository,
  type CreateTalkTrackAssetInput,
  type TalkTrackAssetRepositoryDatabase,
} from "./repository";

class ExpectedRollback extends Error {
  constructor() {
    super("Rollback local talk-track asset persistence check");
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

function createAssetInput(
  seed: string,
  candidateId?: string,
): CreateTalkTrackAssetInput {
  return {
    asset: {
      assetType: "objection_reply",
      title: "高端进攻拍价格异议回应",
      ownerRole: "host",
    },
    version: {
      body: "这支拍适合想提升连续进攻的中阶用户，预算有限时可以对比同系列中端款。",
      tone: "professional",
      language: "zh_CN",
      candidateId,
    },
    scenario: {
      racketProductIds: [`${seed}_racket_astrox_100zz`],
      playerLevel: "intermediate",
      playStyle: "attack",
      priceBand: "premium",
      liveScene: "objection_handling",
      hostRole: "host",
      objectionType: "price",
      usageConstraints: ["只用于已核对规格和价格带的场次"],
    },
    segments: [
      {
        segmentType: "objection_reply",
        text: "先承认预算，再解释高端拍适合连续进攻的稳定性。",
        requiredEvidence: true,
      },
      {
        segmentType: "cta",
        text: "如果预算更紧，可以先看同系列中端款。",
        requiredEvidence: false,
      },
    ],
    sourceGrounding: {
      sourceType: "knowledge_version",
      sourceIds: [`${seed}_knowledge_source`],
      knowledgeVersionIds: [`${seed}_knowledge_version`],
      racketProductIds: [`${seed}_racket_astrox_100zz`],
      freshnessState: "current",
      conflictState: "none",
      sensitiveRedactionState: "not_needed",
      claimSummary: "已审核知识支持高端进攻拍适用人群和价格带表达。",
    },
    objectionPattern: {
      objectionType: "price",
      customerQuestionExample: "这支拍是不是太贵了？",
      replyStrategy: "explain_tradeoff",
      riskLevel: "medium",
    },
  };
}

function createMissingSourceAssetInput(seed: string): CreateTalkTrackAssetInput {
  return {
    ...createAssetInput(seed),
    asset: {
      assetType: "feature_benefit",
      title: "高端进攻拍卖点解释",
      ownerRole: "host",
    },
    scenario: {
      racketProductIds: [`${seed}_racket_astrox_100zz`],
      playerLevel: "intermediate",
      playStyle: "attack",
      priceBand: "premium",
      liveScene: "product_demo",
      hostRole: "host",
      usageConstraints: ["需要补来源后才能发布"],
    },
    sourceGrounding: undefined,
    objectionPattern: undefined,
  };
}

async function main() {
  const { client, db } = createDatabaseConnection();
  const checkId = `talk_tracks_check_${Date.now()}`;

  try {
    try {
      await db.transaction(async (transaction) => {
        const tenantId = `${checkId}_tenant`;
        const teamId = `${checkId}_team`;
        const otherTeamId = `${checkId}_other_team`;
        const hostId = `${checkId}_host`;
        const reviewerId = `${checkId}_reviewer`;
        const viewerId = `${checkId}_viewer`;

        await transaction.insert(tenants).values({
          id: tenantId,
          name: "Local talk-track asset persistence check",
          defaultTeamId: teamId,
        });

        await transaction.insert(teams).values([
          {
            id: teamId,
            tenantId,
            name: "Talk-track team",
            createdBy: hostId,
          },
          {
            id: otherTeamId,
            tenantId,
            name: "Other talk-track team",
            createdBy: hostId,
          },
        ]);

        await transaction.insert(appUsers).values([
          {
            id: hostId,
            displayName: "Talk Track Host",
            primaryEmail: `${hostId}@example.invalid`,
            status: "active",
          },
          {
            id: reviewerId,
            displayName: "Talk Track Reviewer",
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

        await transaction.insert(tenantMemberships).values(
          [hostId, reviewerId, viewerId].map((userId) => ({
            id: `${userId}_tenant_membership`,
            tenantId,
            userId,
            status: "active" as const,
            tenantRole: "member" as const,
            joinedAt: new Date(),
          })),
        );

        await transaction.insert(teamMemberships).values([
          {
            id: `${hostId}_team_membership`,
            tenantId,
            teamId,
            userId: hostId,
            status: "active",
            role: "host",
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
          {
            id: `${hostId}_other_team_membership`,
            tenantId,
            teamId: otherTeamId,
            userId: hostId,
            status: "active",
            role: "host",
            joinedAt: new Date(),
          },
        ]);

        const hostContext = parseDataAccessContext({
          requestId: `${checkId}_host_request`,
          actorId: hostId,
          tenantId,
          teamId,
          role: "host",
          permissions: ["read_workspace", "manage_talk_tracks"],
        });

        const reviewerContext = parseDataAccessContext({
          requestId: `${checkId}_reviewer_request`,
          actorId: reviewerId,
          tenantId,
          teamId,
          role: "reviewer",
          permissions: ["read_workspace", "manage_talk_tracks"],
        });

        const viewerContext: DataAccessContext = parseDataAccessContext({
          requestId: `${checkId}_viewer_request`,
          actorId: viewerId,
          tenantId,
          teamId,
          role: "viewer",
          permissions: ["read_workspace"],
        });

        const otherTeamContext = parseDataAccessContext({
          ...hostContext,
          requestId: `${checkId}_other_team_request`,
          teamId: otherTeamId,
        });

        const repository = createTalkTrackAssetRepository(
          transaction as TalkTrackAssetRepositoryDatabase,
        );

        await expectRejected(
          "viewer create candidate",
          () =>
            repository.createCandidate(viewerContext, {
              candidateSource: "manual",
              proposedBody: "只读角色不能创建候选话术。",
            }),
          "FORBIDDEN_PERMISSION",
        );

        await expectRejected(
          "blocked sensitive candidate",
          () =>
            repository.createCandidate(hostContext, {
              candidateSource: "manual",
              proposedBody: "候选话术包含敏感内容时应阻断。",
              sensitiveRedactionState: "blocked",
            }),
          "SENSITIVE_DATA_BLOCKED",
        );

        const candidate = await repository.createCandidate(hostContext, {
          candidateSource: "ai_review",
          aiRunId: `${checkId}_ai_run`,
          aiSectionId: `${checkId}_talk_track_section`,
          promptVersion: "ai-review-v1",
          sourceIds: [`${checkId}_ai_section_source`],
          knowledgeVersionIds: [`${checkId}_knowledge_version`],
          racketProductVersionIds: [`${checkId}_racket_version`],
          scenario: createAssetInput(checkId).scenario,
          proposedBody: "高端进攻拍先讲稳定性，再给预算替代方案。",
          validationState: "passed",
          reviewState: "pending",
        });

        const asset = await repository.createAsset(
          hostContext,
          createAssetInput(checkId, candidate.id),
        );
        const versionId = asset.currentVersion?.id;

        if (!versionId) {
          throw new Error("created talk-track asset should have a version");
        }

        await repository.submitForReview(hostContext, {
          assetId: asset.id,
          versionId,
        });

        await expectRejected(
          "host publish",
          () =>
            repository.publishVersion(hostContext, {
              assetId: asset.id,
              versionId,
            }),
          "FORBIDDEN_PERMISSION",
        );

        await repository.recordReviewDecision(reviewerContext, {
          assetId: asset.id,
          versionId,
          decision: "approve",
          reason: "已核对产品适用人群和价格带表达。",
        });

        await expectRejected(
          "pending AI candidate publish",
          () =>
            repository.publishVersion(reviewerContext, {
              assetId: asset.id,
              versionId,
            }),
          "AI_CANDIDATE_NOT_REVIEWED",
        );

        await repository.reviewCandidate(reviewerContext, {
          candidateId: candidate.id,
          reviewState: "accepted",
        });

        const publishedAsset = await repository.publishVersion(reviewerContext, {
          assetId: asset.id,
          versionId,
        });

        if (
          publishedAsset.status !== "published" ||
          !publishedAsset.currentVersion?.readiness.ready
        ) {
          throw new Error("published talk-track asset should be ready");
        }

        await expectRejected(
          "duplicate scenario",
          () => repository.createAsset(hostContext, createAssetInput(checkId)),
          "DUPLICATE_SCENARIO",
        );

        await expectRejected(
          "cross team read",
          () => repository.getAsset(otherTeamContext, { assetId: asset.id }),
          "NOT_FOUND",
        );

        const signal = await repository.recordUsageSignal(hostContext, {
          assetId: asset.id,
          versionId,
          sourceWorkflow: "live_session",
          signalType: "used",
          reason: "主播在下场直播中直接复用了该价格异议回应。",
        });

        if (signal.assetId !== asset.id || signal.versionId !== versionId) {
          throw new Error("usage signal should reference the published version");
        }

        const missingSourceAsset = await repository.createAsset(
          hostContext,
          createMissingSourceAssetInput(checkId),
        );
        const missingSourceVersionId = missingSourceAsset.currentVersion?.id;

        if (!missingSourceVersionId) {
          throw new Error("missing-source asset should have a version");
        }

        await repository.submitForReview(hostContext, {
          assetId: missingSourceAsset.id,
          versionId: missingSourceVersionId,
        });
        await repository.recordReviewDecision(reviewerContext, {
          assetId: missingSourceAsset.id,
          versionId: missingSourceVersionId,
          decision: "approve",
          reason: "验证缺来源发布阻断。",
        });
        await expectRejected(
          "missing source publish",
          () =>
            repository.publishVersion(reviewerContext, {
              assetId: missingSourceAsset.id,
              versionId: missingSourceVersionId,
            }),
          "SOURCE_REQUIRED",
        );

        const list = await repository.listAssets(hostContext, {
          status: ["published"],
        });

        if (!list.items.some((item) => item.id === asset.id)) {
          throw new Error("published talk-track asset should be listed");
        }

        throw new ExpectedRollback();
      });
    } catch (error) {
      if (error instanceof ExpectedRollback) {
        console.log("Talk-track asset persistence check passed with rollback");
        return;
      }

      throw error;
    }
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
