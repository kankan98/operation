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
  createAiReviewRunRepository,
  type AiReviewRunRepositoryDatabase,
  type PrepareAiReviewRunInput,
  type RecordAiReviewOutputInput,
} from "./repository";

class ExpectedRollback extends Error {
  constructor() {
    super("Rollback local AI review run persistence check");
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

function createRunInput(seed: string): PrepareAiReviewRunInput {
  return {
    sessionId: `${seed}_session`,
    runType: "initial_review",
    requestedSections: [
      "live_recap",
      "product_diagnosis",
      "question_cluster",
      "objection_pattern",
      "talk_track_candidate",
      "short_video_topic",
      "next_session_action",
    ],
    inputSnapshot: {
      sessionStatus: "review_ready",
      title: "高端进攻拍对比与中高级球友选择",
      sessionDate: new Date("2026-05-01T12:00:00.000Z"),
      platform: "douyin",
      hostRoles: [
        {
          displayName: "主播 A",
          role: "host",
          responsibility: "讲解高端进攻拍对比",
        },
      ],
      productOrder: [
        {
          displayModel: "ASTROX 100ZZ",
          roleInSession: "main_offer",
          orderIndex: 1,
        },
      ],
      operatorSummary: "观众集中询问进攻拍是否适合中级双打和预算替代。",
      questionSummaries: [
        {
          topic: "fit",
          summary: "中级球友担心高端进攻拍上手门槛。",
          relatedProductIds: [`${seed}_racket_astrox_100zz`],
        },
      ],
      objectionSummaries: [
        {
          objectionType: "price",
          summary: "价格偏高，需要解释预算和性能取舍。",
        },
      ],
      noteHighlights: [
        {
          noteType: "product_explanation",
          summary: "主播先讲杀球优势，缺少防守和双打适配说明。",
        },
      ],
      redactionState: "redacted",
      longInputPolicy: "within_limit",
    },
    knowledgeSnapshot: {
      knowledgeVersionIds: [`${seed}_knowledge_version`],
      racketProductVersionIds: [`${seed}_racket_version`],
      sourceIds: [`${seed}_source_official`],
      trustSummary: {
        official: 1,
        team: 1,
      },
      conflictState: "none",
      freshnessState: "current",
      reviewState: "published_only",
      intendedUse: [
        "recap",
        "product_diagnosis",
        "objection_reply",
        "talk_track",
        "short_video_topic",
        "next_action",
      ],
    },
  };
}

function createOutputInput(runId: string): RecordAiReviewOutputInput {
  return {
    runId,
    schemaVersion: "ai-review-output-v1",
    overallConfidence: "medium",
    evidenceSummary: {
      inputSnapshotRefs: ["session_summary", "customer_question_summary"],
      knowledgeSnapshotRefs: ["knowledge_version", "official_source"],
    },
    sections: [
      {
        sectionType: "talk_track_candidate",
        title: "价格异议回应",
        summary: "先承认预算，再解释高端进攻拍的稳定性和替代方案。",
        items: [
          {
            text: "如果预算更紧，可以先看同系列中端款。",
          },
        ],
        sourceRefs: ["session_question_price", "knowledge_version"],
        confidence: "medium",
      },
      {
        sectionType: "next_session_action",
        title: "补充双打适配说明",
        summary: "下场前补齐中高级双打用户的打法适配话术。",
        items: [
          {
            text: "准备双打用户的防守和连贯优势解释。",
          },
        ],
        sourceRefs: ["session_note_product_explanation"],
        confidence: "medium",
      },
    ],
  };
}

async function main() {
  const { client, db } = createDatabaseConnection();
  const checkId = `ai_review_check_${Date.now()}`;

  try {
    try {
      await db.transaction(async (transaction) => {
        const tenantId = `${checkId}_tenant`;
        const teamId = `${checkId}_team`;
        const otherTeamId = `${checkId}_other_team`;
        const operatorId = `${checkId}_operator`;
        const reviewerId = `${checkId}_reviewer`;
        const viewerId = `${checkId}_viewer`;

        await transaction.insert(tenants).values({
          id: tenantId,
          name: "Local AI review run persistence check",
          defaultTeamId: teamId,
        });

        await transaction.insert(teams).values([
          {
            id: teamId,
            tenantId,
            name: "AI review team",
            createdBy: operatorId,
          },
          {
            id: otherTeamId,
            tenantId,
            name: "Other AI review team",
            createdBy: operatorId,
          },
        ]);

        await transaction.insert(appUsers).values([
          {
            id: operatorId,
            displayName: "AI Review Operator",
            primaryEmail: `${operatorId}@example.invalid`,
            status: "active",
          },
          {
            id: reviewerId,
            displayName: "AI Review Reviewer",
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
          [operatorId, reviewerId, viewerId].map((userId) => ({
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
            id: `${operatorId}_team_membership`,
            tenantId,
            teamId,
            userId: operatorId,
            status: "active",
            role: "operator",
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
            id: `${operatorId}_other_team_membership`,
            tenantId,
            teamId: otherTeamId,
            userId: operatorId,
            status: "active",
            role: "operator",
            joinedAt: new Date(),
          },
        ]);

        const operatorContext = parseDataAccessContext({
          requestId: `${checkId}_operator_request`,
          actorId: operatorId,
          tenantId,
          teamId,
          role: "operator",
          permissions: ["read_workspace", "run_ai_review"],
        });

        const reviewerContext = parseDataAccessContext({
          requestId: `${checkId}_reviewer_request`,
          actorId: reviewerId,
          tenantId,
          teamId,
          role: "reviewer",
          permissions: ["read_workspace", "run_ai_review"],
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
          ...operatorContext,
          requestId: `${checkId}_other_team_request`,
          teamId: otherTeamId,
        });

        const repository = createAiReviewRunRepository(
          transaction as AiReviewRunRepositoryDatabase,
        );

        const activePromptVersion = await repository.createPromptVersion(
          reviewerContext,
          {
            name: "AI 复盘结构化输出",
            version: "2026-05-24",
            purpose: "full_review",
            inputSchemaVersion: "session-review-input-v1",
            outputSchemaVersion: "ai-review-output-v1",
            modelPolicy: "provider-neutral structured output policy",
            status: "active",
          },
        );

        const draftPromptVersion = await repository.createPromptVersion(
          reviewerContext,
          {
            name: "未审核 prompt",
            version: "draft",
            purpose: "full_review",
            inputSchemaVersion: "session-review-input-v1",
            outputSchemaVersion: "ai-review-output-v1",
            modelPolicy: "draft policy",
            status: "draft",
          },
        );

        await expectRejected(
          "viewer prepare run",
          () => repository.prepareRun(viewerContext, createRunInput(checkId)),
          "FORBIDDEN_PERMISSION",
        );

        await expectRejected(
          "blocked input snapshot",
          () =>
            repository.prepareRun(operatorContext, {
              ...createRunInput(checkId),
              inputSnapshot: {
                ...createRunInput(checkId).inputSnapshot,
                redactionState: "blocked",
              },
            }),
          "SENSITIVE_DATA_NEEDS_REVIEW",
        );

        await expectRejected(
          "blocked knowledge snapshot",
          () =>
            repository.prepareRun(operatorContext, {
              ...createRunInput(checkId),
              sessionId: `${checkId}_blocked_knowledge_session`,
              knowledgeSnapshot: {
                ...createRunInput(checkId).knowledgeSnapshot,
                freshnessState: "stale_blocked",
              },
            }),
          "STALE_KNOWLEDGE_BLOCKED",
        );

        const run = await repository.prepareRun(
          operatorContext,
          createRunInput(checkId),
        );

        if (run.status !== "input_ready" || run.sessionId !== `${checkId}_session`) {
          throw new Error("prepared AI review run should be input_ready");
        }

        await expectRejected(
          "inactive prompt start",
          () =>
            repository.startRun(operatorContext, {
              runId: run.id,
              promptVersionId: draftPromptVersion.id,
              providerPolicy: {
                provider: "deepseek",
                providerApi: "chat_completions",
                model: "deepseek-v4-pro",
                structuredOutputRequired: true,
              },
            }),
          "PROMPT_VERSION_INACTIVE",
        );

        const queuedRun = await repository.startRun(operatorContext, {
          runId: run.id,
          promptVersionId: activePromptVersion.id,
          providerPolicy: {
            provider: "deepseek",
            providerApi: "chat_completions",
            model: "deepseek-v4-pro",
            structuredOutputRequired: true,
          },
        });

        if (queuedRun.status !== "queued") {
          throw new Error("started AI review run should be queued");
        }

        const providerInvocation = await repository.recordProviderInvocation(
          operatorContext,
          {
            runId: run.id,
            provider: "deepseek",
            providerApi: "chat_completions",
            model: "deepseek-v4-pro",
            requestId: `${checkId}_provider_request`,
            responseId: `${checkId}_provider_response`,
            latencyMs: 1200,
            tokenUsage: {
              input: 1200,
              output: 800,
            },
            finishReason: "stop",
            redactionState: "redacted",
          },
        );

        if (providerInvocation.errorCode !== "") {
          throw new Error("successful provider metadata should not contain error");
        }

        const output = await repository.recordOutput(
          operatorContext,
          createOutputInput(run.id),
        );

        if (output.sections.length !== 2) {
          throw new Error("AI review output should include two sections");
        }

        await repository.recordValidationResult(operatorContext, {
          runId: run.id,
          checkType: "schema",
          status: "passed",
          message: "结构化输出符合当前 schema。",
          affectedSectionIds: [],
          recoverable: false,
        });

        await repository.recordValidationResult(operatorContext, {
          runId: run.id,
          checkType: "source_grounding",
          status: "warning",
          message: "部分建议需要审核人员确认来源强度。",
          affectedSectionIds: [output.sections[0].id],
          recoverable: true,
        });

        const reviewReadyRun = await repository.markReviewReady(operatorContext, {
          runId: run.id,
        });

        if (reviewReadyRun.status !== "review_ready") {
          throw new Error("AI review run should become review_ready");
        }

        const acceptedDecision = await repository.recordDecision(
          reviewerContext,
          {
            runId: run.id,
            targetType: "section",
            targetId: output.sections[0].id,
            decision: "edit_accept",
            reason: "保留建议结构，调整成主播更自然的表达。",
            editedContent: {
              summary: "先承认预算，再用双打连贯和预算替代方案解释。",
            },
          },
        );

        if (acceptedDecision.decision !== "edit_accept") {
          throw new Error("review decision should be recorded");
        }

        await repository.recordDecision(reviewerContext, {
          runId: run.id,
          targetType: "section",
          targetId: output.sections[1].id,
          decision: "reject",
          reason: "下场任务缺少明确负责人和完成标准。",
        });

        await expectRejected(
          "rejected section downstream artifact",
          () =>
            repository.createDownstreamArtifact(operatorContext, {
              runId: run.id,
              sectionId: output.sections[1].id,
              artifactType: "next_session_task",
              status: "draft",
            }),
          "REVIEW_REQUIRED",
        );

        const downstreamArtifact = await repository.createDownstreamArtifact(
          operatorContext,
          {
            runId: run.id,
            sectionId: output.sections[0].id,
            artifactType: "talk_track",
            status: "draft",
          },
        );

        if (downstreamArtifact.sectionId !== output.sections[0].id) {
          throw new Error("downstream artifact should reference accepted section");
        }

        const feedback = await repository.recordFeedbackSignal(operatorContext, {
          runId: run.id,
          sectionId: output.sections[0].id,
          signalType: "downstream_used",
          reason: "审核后创建成价格异议话术草案。",
          reviewPriority: "normal",
          routesTo: "evaluation_set",
        });

        if (feedback.routesTo !== "evaluation_set") {
          throw new Error("feedback should preserve routing target");
        }

        await expectRejected(
          "cross team read",
          () => repository.getRun(otherTeamContext, { runId: run.id }),
          "NOT_FOUND",
        );

        const detail = await repository.getRun(reviewerContext, { runId: run.id });

        if (
          detail.run.status !== "downstream_ready" ||
          detail.sections.length !== 2 ||
          detail.downstreamArtifacts.length !== 1
        ) {
          throw new Error("run detail should include reviewed sections and artifact");
        }

        const list = await repository.listRuns(operatorContext, {
          status: ["downstream_ready"],
        });

        if (!list.items.some((item) => item.id === run.id)) {
          throw new Error("downstream-ready AI review run should be listed");
        }

        throw new ExpectedRollback();
      });
    } catch (error) {
      if (error instanceof ExpectedRollback) {
        console.log("AI review run persistence check passed with rollback");
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
