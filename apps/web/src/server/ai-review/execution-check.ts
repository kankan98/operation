import { z } from "zod";

import {
  AiProviderError,
  isAiProviderError,
  type AiProviderJsonRequest,
  type AiProviderJsonResult,
  type AiProviderPort,
} from "../ai-provider";
import { createDatabaseConnection } from "../db/client";
import { parseDataAccessContext, type DataAccessContext } from "../db/context";
import {
  appUsers,
  teamMemberships,
  teams,
  tenantMemberships,
  tenants,
} from "../db/schema";
import type { AiReviewGeneratedOutputSection } from "./generation";
import {
  executeAiReviewRun,
  isAiReviewExecutionError,
} from "./execution";
import {
  createAiReviewRunRepository,
  type AiReviewRunRepositoryDatabase,
  type PrepareAiReviewRunInput,
} from "./repository";

class ExpectedRollback extends Error {
  constructor() {
    super("Rollback local AI review execution check");
  }
}

type FakeProviderScenario = {
  output?: unknown;
  error?: AiProviderError;
};

class FakeProvider implements AiProviderPort {
  readonly calls: AiProviderJsonRequest<unknown>[] = [];

  constructor(private readonly scenario: FakeProviderScenario = {}) {}

  async generateJson<TData>(
    input: AiProviderJsonRequest<TData>,
  ): Promise<AiProviderJsonResult<TData>> {
    this.calls.push(input as AiProviderJsonRequest<unknown>);

    if (this.scenario.error) {
      throw this.scenario.error;
    }

    const parsed = input.schema.safeParse(
      this.scenario.output ?? createProviderOutput(),
    );

    if (!parsed.success) {
      throw new AiProviderError(
        "AI_PROVIDER_SCHEMA_MISMATCH",
        "Fake provider output failed schema validation",
        {
          retryable: true,
          details: {
            schemaName: input.schemaName,
            issues: parsed.error.issues.map((issue) => ({
              path: issue.path.join("."),
              message: issue.message,
            })),
          },
        },
      );
    }

    return {
      data: parsed.data,
      content: JSON.stringify(parsed.data),
      metadata: {
        provider: "fake-provider",
        providerApi: "fake-json",
        model: "fake-execution-model",
        requestId: input.requestId,
        responseId: "fake_execution_response",
        latencyMs: 4,
        tokenUsage: {
          inputTokens: 180,
          outputTokens: 320,
          totalTokens: 500,
        },
        finishReason: "stop",
        retryable: false,
      },
    };
  }
}

function assertNoSensitiveLeak(value: unknown, label: string) {
  const serialized = JSON.stringify(value);
  const blockedFragments = [
    "synthetic_secret",
    "Authorization",
    "Bearer",
    "完整未脱敏转录",
    "客户手机号",
    "Return one JSON object",
  ];

  for (const fragment of blockedFragments) {
    if (serialized.includes(fragment)) {
      throw new Error(`${label} leaked sensitive execution data`);
    }
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
    assertNoSensitiveLeak(error, label);

    if (
      (isAiReviewExecutionError(error) || isAiProviderError(error)) &&
      error.code === expectedCode
    ) {
      return error;
    }

    if (
      error instanceof Error &&
      "code" in error &&
      error.code === expectedCode
    ) {
      return error;
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

function createProviderSection(
  sectionType: AiReviewGeneratedOutputSection["sectionType"],
  index: number,
  overrides: Partial<AiReviewGeneratedOutputSection> = {},
): AiReviewGeneratedOutputSection {
  return {
    sectionType,
    title: `${index}. ${sectionType}`,
    summary: `围绕 ${sectionType} 生成一条可审核的运营建议。`,
    items: [
      {
        text: `${sectionType} 建议 ${index}`,
        action: "review_before_use",
      },
    ],
    sourceRefs: ["source_official_catalog", "knowledge_version_attack_racket"],
    confidence: "medium",
    ...overrides,
  };
}

function createProviderOutput(
  sections: AiReviewGeneratedOutputSection[] = [
    createProviderSection("live_recap", 1),
    createProviderSection("product_diagnosis", 2),
    createProviderSection("question_cluster", 3),
    createProviderSection("objection_pattern", 4),
    createProviderSection("talk_track_candidate", 5),
    createProviderSection("short_video_topic", 6),
    createProviderSection("next_session_action", 7),
  ],
) {
  return {
    schemaVersion: "ai-review-output-v1",
    overallConfidence: "medium",
    evidenceSummary: {
      inputSnapshotRefs: ["operator_summary", "customer_questions"],
      knowledgeSnapshotRefs: [
        "knowledge_version_attack_racket",
        "source_official_catalog",
      ],
    },
    sections,
  };
}

async function main() {
  z.object({ sanity: z.literal("ok") }).parse({ sanity: "ok" });

  const { client, db } = createDatabaseConnection();
  const checkId = `ai_review_execution_${Date.now()}`;

  try {
    try {
      await db.transaction(async (transaction) => {
        const tenantId = `${checkId}_tenant`;
        const teamId = `${checkId}_team`;
        const otherTeamId = `${checkId}_other_team`;
        const operatorId = `${checkId}_operator`;
        const viewerId = `${checkId}_viewer`;

        await transaction.insert(tenants).values({
          id: tenantId,
          name: "Local AI review execution check",
          defaultTeamId: teamId,
        });

        await transaction.insert(teams).values([
          {
            id: teamId,
            tenantId,
            name: "AI review execution team",
            createdBy: operatorId,
          },
          {
            id: otherTeamId,
            tenantId,
            name: "Other AI review execution team",
            createdBy: operatorId,
          },
        ]);

        await transaction.insert(appUsers).values([
          {
            id: operatorId,
            displayName: "AI Review Execution Operator",
            primaryEmail: `${operatorId}@example.invalid`,
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
          [operatorId, viewerId].map((userId) => ({
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

        const promptVersion = await repository.createPromptVersion(
          operatorContext,
          {
            name: "AI 复盘结构化执行",
            version: "2026-05-24",
            purpose: "full_review",
            inputSchemaVersion: "session-review-input-v1",
            outputSchemaVersion: "ai-review-output-v1",
            modelPolicy: "provider-neutral structured output policy",
            status: "active",
          },
        );

        const providerPolicy = {
          provider: "deepseek",
          providerApi: "chat_completions",
          model: "deepseek-v4-pro",
          structuredOutputRequired: true,
        };

        const successRun = await repository.prepareRun(
          operatorContext,
          createRunInput(`${checkId}_success`),
        );
        const successProvider = new FakeProvider();
        const success = await executeAiReviewRun({
          context: operatorContext,
          repository,
          provider: successProvider,
          runId: successRun.id,
          promptVersionId: promptVersion.id,
          providerPolicy,
          requestId: `${checkId}_success_execution`,
        });

        if (success.status !== "review_ready" || !success.reviewReady) {
          throw new Error("successful execution should mark the run review-ready");
        }

        if (successProvider.calls.length !== 1) {
          throw new Error("successful execution should call the provider once");
        }

        const successDetail = await repository.getRun(operatorContext, {
          runId: successRun.id,
        });

        if (
          successDetail.run.status !== "review_ready" ||
          successDetail.sections.length !== 7 ||
          successDetail.validationResults.length === 0 ||
          successDetail.providerInvocation?.provider !== "fake-provider"
        ) {
          throw new Error("successful execution should persist review detail");
        }

        assertNoSensitiveLeak(success, "successful execution result");

        const viewerRun = await repository.prepareRun(
          operatorContext,
          createRunInput(`${checkId}_viewer`),
        );

        await expectRejected(
          "viewer execute run",
          () =>
            executeAiReviewRun({
              context: viewerContext,
              repository,
              provider: new FakeProvider(),
              runId: viewerRun.id,
              promptVersionId: promptVersion.id,
              providerPolicy,
              requestId: `${checkId}_viewer_execution`,
            }),
          "FORBIDDEN_PERMISSION",
        );

        const crossTeamProvider = new FakeProvider();
        await expectRejected(
          "cross-team execute run",
          () =>
            executeAiReviewRun({
              context: otherTeamContext,
              repository,
              provider: crossTeamProvider,
              runId: successRun.id,
              promptVersionId: promptVersion.id,
              providerPolicy,
              requestId: `${checkId}_cross_team_execution`,
            }),
          "NOT_FOUND",
        );

        if (crossTeamProvider.calls.length !== 0) {
          throw new Error("cross-team execution should not call the provider");
        }

        const blockedRun = await repository.prepareRun(
          operatorContext,
          createRunInput(`${checkId}_blocked`),
        );
        const blockedResult = await executeAiReviewRun({
          context: operatorContext,
          repository,
          provider: new FakeProvider({
            output: createProviderOutput([
              createProviderSection("talk_track_candidate", 1, {
                summary: "客户手机号 13800138000 出现在建议里，需要阻断。",
              }),
            ]),
          }),
          runId: blockedRun.id,
          promptVersionId: promptVersion.id,
          providerPolicy,
          requestId: `${checkId}_blocked_execution`,
        });

        if (
          blockedResult.status !== "validation_failed" ||
          blockedResult.reviewReady
        ) {
          throw new Error("blocked validation should keep run non-review-ready");
        }

        const blockedDetail = await repository.getRun(operatorContext, {
          runId: blockedRun.id,
        });

        if (
          blockedDetail.run.status !== "validation_failed" ||
          !blockedDetail.validationResults.some(
            (result) =>
              result.checkType === "sensitive_data" &&
              result.status === "blocked",
          ) ||
          blockedDetail.output === null
        ) {
          throw new Error("blocked execution should persist output and validation");
        }

        const failedRun = await repository.prepareRun(
          operatorContext,
          createRunInput(`${checkId}_failed`),
        );
        await expectRejected(
          "provider timeout execution",
          () =>
            executeAiReviewRun({
              context: operatorContext,
              repository,
              provider: new FakeProvider({
                error: new AiProviderError(
                  "AI_PROVIDER_TIMEOUT",
                  "timeout token=synthetic_secret",
                  {
                    retryable: true,
                  },
                ),
              }),
              runId: failedRun.id,
              promptVersionId: promptVersion.id,
              providerPolicy,
              requestId: `${checkId}_failed_execution`,
            }),
          "PROVIDER_TIMEOUT",
        );

        const failedDetail = await repository.getRun(operatorContext, {
          runId: failedRun.id,
        });

        if (
          failedDetail.run.status !== "provider_failed" ||
          failedDetail.output !== null ||
          failedDetail.providerInvocation?.errorCode !== "PROVIDER_TIMEOUT"
        ) {
          throw new Error("provider failure should persist safe failure metadata");
        }

        throw new ExpectedRollback();
      });
    } catch (error) {
      if (error instanceof ExpectedRollback) {
        console.log("AI review execution check passed with rollback");
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
