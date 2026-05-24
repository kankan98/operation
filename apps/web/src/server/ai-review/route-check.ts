import { eq } from "drizzle-orm";

import {
  AiProviderError,
  type AiProviderJsonRequest,
  type AiProviderJsonResult,
  type AiProviderPort,
} from "../ai-provider";
import {
  authSessionCookieName,
  createAuthSessionReference,
  createAuthSessionRepository,
  hashAuthSessionReference,
  type AuthSessionRepositoryDatabase,
} from "../auth";
import { createDatabaseConnection } from "../db/client";
import {
  appUsers,
  authSessions,
  teamMemberships,
  teams,
  tenantMemberships,
  tenants,
} from "../db/schema";
import type { AiReviewGeneratedOutputSection } from "./generation";
import {
  createAiReviewRunRepository,
  type AiReviewRunRepositoryDatabase,
  type PrepareAiReviewRunInput,
} from "./repository";
import {
  AI_REVIEW_MUTATION_CSRF_HEADER_NAME,
  AI_REVIEW_MUTATION_CSRF_HEADER_VALUE,
  handleAiReviewDecisionRoute,
  handleAiReviewDownstreamArtifactRoute,
  handleAiReviewFeedbackSignalRoute,
  handleAiReviewPromptVersionsCreateRoute,
  handleAiReviewRunArchiveRoute,
  handleAiReviewRunDetailRoute,
  handleAiReviewRunExecuteRoute,
  handleAiReviewRunsCreateRoute,
  handleAiReviewRunsListRoute,
} from "./route";

class ExpectedRollback extends Error {
  constructor() {
    super("Rollback local AI review route check");
  }
}

type JsonObject = Record<string, unknown>;

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
        model: "fake-ai-review-route-model",
        requestId: input.requestId,
        responseId: "fake_route_response",
        latencyMs: 3,
        tokenUsage: {
          inputTokens: 160,
          outputTokens: 340,
          totalTokens: 500,
        },
        finishReason: "stop",
        retryable: false,
      },
    };
  }
}

function scopedUrl(
  tenantId: string,
  teamId: string,
  path = "/api/ai-review/runs",
): string {
  return `https://operation.local${path}?tenantId=${tenantId}&teamId=${teamId}`;
}

function requestWithCookie(url: string, sessionReference: string): Request {
  return new Request(url, {
    headers: {
      cookie: `${authSessionCookieName}=${encodeURIComponent(sessionReference)}`,
    },
  });
}

function jsonRequest(input: {
  url: string;
  method?: "POST" | "PATCH";
  sessionReference?: string;
  csrf?: boolean;
  body?: unknown;
}): Request {
  const headers = new Headers({
    "content-type": "application/json",
  });

  if (input.sessionReference) {
    headers.set(
      "cookie",
      `${authSessionCookieName}=${encodeURIComponent(input.sessionReference)}`,
    );
  }

  if (input.csrf) {
    headers.set(
      AI_REVIEW_MUTATION_CSRF_HEADER_NAME,
      AI_REVIEW_MUTATION_CSRF_HEADER_VALUE,
    );
  }

  return new Request(input.url, {
    method: input.method ?? "POST",
    headers,
    body: JSON.stringify(input.body ?? {}),
  });
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

async function readJson(response: Response): Promise<JsonObject> {
  const body = await response.json();

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new Error("AI review route response was not a JSON object");
  }

  return body as JsonObject;
}

function expectStatus(label: string, response: Response, status: number) {
  if (response.status !== status) {
    throw new Error(`${label} returned ${response.status}, expected ${status}`);
  }
}

function expectNoStore(label: string, response: Response) {
  if (response.headers.get("cache-control") !== "no-store") {
    throw new Error(`${label} did not return Cache-Control: no-store`);
  }
}

function expectNoSensitive(label: string, value: unknown, blocked: string[]) {
  const serialized = JSON.stringify(value);

  for (const leaked of [
    ...blocked,
    "raw_cookie_value",
    "raw_session_secret",
    "provider_session_raw",
    "postgres://operation:operation_dev_password@",
    "other_team_hidden_ai_review",
    "完整未脱敏转录",
    "客户手机号",
    "Return one JSON object",
    "Authorization",
    "Bearer",
    "sk-",
  ]) {
    if (serialized.includes(leaked)) {
      throw new Error(`${label} leaked sensitive metadata`);
    }
  }
}

function getNestedObject(
  source: JsonObject,
  key: string,
  label: string,
): JsonObject {
  const value = source[key];

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} did not include ${key}`);
  }

  return value as JsonObject;
}

function getNestedString(
  source: JsonObject,
  key: string,
  label: string,
): string {
  const value = source[key];

  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${label} did not include ${key}`);
  }

  return value;
}

function getNestedArray(
  source: JsonObject,
  key: string,
  label: string,
): JsonObject[] {
  const value = source[key];

  if (!Array.isArray(value)) {
    throw new Error(`${label} did not include ${key}`);
  }

  return value as JsonObject[];
}

async function main() {
  const { client, db } = createDatabaseConnection();
  const checkId = `ai_review_route_check_${Date.now()}`;
  let rollbackTenantId = "";

  try {
    try {
      await db.transaction(async (transaction) => {
        const tenantId = `${checkId}_tenant`;
        const teamId = `${checkId}_team`;
        const otherTeamId = `${checkId}_other_team`;
        const operatorId = `${checkId}_operator`;
        const viewerId = `${checkId}_viewer`;
        const operatorReference = createAuthSessionReference();
        const viewerReference = createAuthSessionReference();
        const now = new Date();
        const future = new Date(Date.now() + 60 * 60 * 1000);

        rollbackTenantId = tenantId;

        await transaction.insert(tenants).values({
          id: tenantId,
          name: "Local AI review route check",
          defaultTeamId: teamId,
        });

        await transaction.insert(teams).values([
          {
            id: teamId,
            tenantId,
            name: "AI review route team",
            createdBy: operatorId,
          },
          {
            id: otherTeamId,
            tenantId,
            name: "Other AI review route team",
            createdBy: operatorId,
          },
        ]);

        await transaction.insert(appUsers).values([
          {
            id: operatorId,
            displayName: "AI Review Route Operator",
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
            joinedAt: now,
          })),
        );

        await transaction.insert(teamMemberships).values([
          {
            id: `${operatorId}_team_membership`,
            tenantId,
            teamId,
            userId: operatorId,
            status: "active",
            role: "reviewer",
            joinedAt: now,
          },
          {
            id: `${operatorId}_other_team_membership`,
            tenantId,
            teamId: otherTeamId,
            userId: operatorId,
            status: "active",
            role: "reviewer",
            joinedAt: now,
          },
          {
            id: `${viewerId}_team_membership`,
            tenantId,
            teamId,
            userId: viewerId,
            status: "active",
            role: "viewer",
            joinedAt: now,
          },
        ]);

        await transaction.insert(authSessions).values([
          {
            id: `${checkId}_operator_session`,
            userId: operatorId,
            sessionReferenceHash: hashAuthSessionReference(operatorReference),
            status: "active",
            issuedAt: now,
            expiresAt: future,
          },
          {
            id: `${checkId}_viewer_session`,
            userId: viewerId,
            sessionReferenceHash: hashAuthSessionReference(viewerReference),
            status: "active",
            issuedAt: now,
            expiresAt: future,
          },
        ]);

        const authRepository = createAuthSessionRepository(
          transaction as AuthSessionRepositoryDatabase,
        );
        const aiReviewRepository = createAiReviewRunRepository(
          transaction as AiReviewRunRepositoryDatabase,
        );

        const noCookie = await handleAiReviewRunsListRoute(
          authRepository,
          aiReviewRepository,
          new Request(scopedUrl(tenantId, teamId)),
        );
        expectStatus("no-cookie list", noCookie, 401);
        expectNoStore("no-cookie list", noCookie);

        const missingScope = await handleAiReviewRunsListRoute(
          authRepository,
          aiReviewRepository,
          requestWithCookie("https://operation.local/api/ai-review/runs", operatorReference),
        );
        expectStatus("missing-scope list", missingScope, 400);

        const noCsrf = await handleAiReviewRunsCreateRoute(
          authRepository,
          aiReviewRepository,
          jsonRequest({
            url: scopedUrl(tenantId, teamId),
            sessionReference: operatorReference,
            body: createRunInput(checkId),
          }),
        );
        expectStatus("run create without csrf", noCsrf, 403);

        const viewerCreate = await handleAiReviewRunsCreateRoute(
          authRepository,
          aiReviewRepository,
          jsonRequest({
            url: scopedUrl(tenantId, teamId),
            sessionReference: viewerReference,
            csrf: true,
            body: createRunInput(`${checkId}_viewer`),
          }),
        );
        expectStatus("viewer run create", viewerCreate, 403);

        const promptResponse = await handleAiReviewPromptVersionsCreateRoute(
          authRepository,
          aiReviewRepository,
          jsonRequest({
            url: scopedUrl(tenantId, teamId, "/api/ai-review/prompt-versions"),
            sessionReference: operatorReference,
            csrf: true,
            body: {
              name: "AI 复盘结构化输出",
              version: "2026-05-24",
              purpose: "full_review",
              inputSchemaVersion: "session-review-input-v1",
              outputSchemaVersion: "ai-review-output-v1",
              modelPolicy: "provider-neutral structured output policy",
              status: "active",
            },
          }),
        );
        expectStatus("prompt version create", promptResponse, 201);
        expectNoStore("prompt version create", promptResponse);
        const promptBody = await readJson(promptResponse);
        const promptVersionId = getNestedString(
          getNestedObject(promptBody, "promptVersion", "prompt version create"),
          "id",
          "prompt version create",
        );

        const createResponse = await handleAiReviewRunsCreateRoute(
          authRepository,
          aiReviewRepository,
          jsonRequest({
            url: scopedUrl(tenantId, teamId),
            sessionReference: operatorReference,
            csrf: true,
            body: createRunInput(checkId),
          }),
        );
        expectStatus("run create", createResponse, 201);
        const createBody = await readJson(createResponse);
        const runId = getNestedString(
          getNestedObject(createBody, "run", "run create"),
          "id",
          "run create",
        );

        const listResponse = await handleAiReviewRunsListRoute(
          authRepository,
          aiReviewRepository,
          requestWithCookie(scopedUrl(tenantId, teamId), operatorReference),
        );
        expectStatus("run list", listResponse, 200);
        expectNoStore("run list", listResponse);

        const detailResponse = await handleAiReviewRunDetailRoute(
          authRepository,
          aiReviewRepository,
          requestWithCookie(
            scopedUrl(tenantId, teamId, `/api/ai-review/runs/${runId}`),
            operatorReference,
          ),
          { runId },
        );
        expectStatus("run detail", detailResponse, 200);
        expectNoStore("run detail", detailResponse);

        const nullProvider = await handleAiReviewRunExecuteRoute(
          authRepository,
          aiReviewRepository,
          null,
          jsonRequest({
            url: scopedUrl(tenantId, teamId, `/api/ai-review/runs/${runId}/execute`),
            sessionReference: operatorReference,
            csrf: true,
            body: {
              promptVersionId,
              providerPolicy: {
                provider: "deepseek",
                providerApi: "chat_completions",
                model: "deepseek-v4-pro",
                structuredOutputRequired: true,
              },
            },
          }),
          { runId },
        );
        expectStatus("execute without provider config", nullProvider, 503);

        const fakeProvider = new FakeProvider();
        const executeResponse = await handleAiReviewRunExecuteRoute(
          authRepository,
          aiReviewRepository,
          fakeProvider,
          jsonRequest({
            url: scopedUrl(tenantId, teamId, `/api/ai-review/runs/${runId}/execute`),
            sessionReference: operatorReference,
            csrf: true,
            body: {
              promptVersionId,
              providerPolicy: {
                provider: "deepseek",
                providerApi: "chat_completions",
                model: "deepseek-v4-pro",
                structuredOutputRequired: true,
              },
            },
          }),
          { runId },
        );
        expectStatus("run execute", executeResponse, 200);
        const executeBody = await readJson(executeResponse);

        if (fakeProvider.calls.length !== 1) {
          throw new Error("route execute should call the fake provider once");
        }

        const result = getNestedObject(executeBody, "result", "run execute");
        const detail = getNestedObject(result, "detail", "run execute");
        const run = getNestedObject(detail, "run", "run execute");

        if (run.status !== "review_ready") {
          throw new Error("execute response should include review_ready run");
        }

        const sections = getNestedArray(detail, "sections", "run execute");
        const acceptedSectionId = getNestedString(
          sections.find((section) => section.sectionType === "talk_track_candidate") ??
            sections[0],
          "id",
          "run execute",
        );

        const pendingDownstream = await handleAiReviewDownstreamArtifactRoute(
          authRepository,
          aiReviewRepository,
          jsonRequest({
            url: scopedUrl(
              tenantId,
              teamId,
              `/api/ai-review/runs/${runId}/downstream-artifacts`,
            ),
            sessionReference: operatorReference,
            csrf: true,
            body: {
              sectionId: acceptedSectionId,
              artifactType: "talk_track",
              status: "draft",
            },
          }),
          { runId },
        );
        expectStatus("pending downstream artifact", pendingDownstream, 409);

        const decisionResponse = await handleAiReviewDecisionRoute(
          authRepository,
          aiReviewRepository,
          jsonRequest({
            url: scopedUrl(tenantId, teamId, `/api/ai-review/runs/${runId}/decisions`),
            sessionReference: operatorReference,
            csrf: true,
            body: {
              targetType: "section",
              targetId: acceptedSectionId,
              decision: "accept",
              reason: "该话术候选可进入下游草案。",
            },
          }),
          { runId },
        );
        expectStatus("review decision", decisionResponse, 201);

        const feedbackResponse = await handleAiReviewFeedbackSignalRoute(
          authRepository,
          aiReviewRepository,
          jsonRequest({
            url: scopedUrl(
              tenantId,
              teamId,
              `/api/ai-review/runs/${runId}/feedback-signals`,
            ),
            sessionReference: operatorReference,
            csrf: true,
            body: {
              sectionId: acceptedSectionId,
              signalType: "accepted",
              reason: "审核后可复用到话术资产。",
              reviewPriority: "normal",
              routesTo: "evaluation_set",
            },
          }),
          { runId },
        );
        expectStatus("feedback signal", feedbackResponse, 201);

        const downstreamResponse = await handleAiReviewDownstreamArtifactRoute(
          authRepository,
          aiReviewRepository,
          jsonRequest({
            url: scopedUrl(
              tenantId,
              teamId,
              `/api/ai-review/runs/${runId}/downstream-artifacts`,
            ),
            sessionReference: operatorReference,
            csrf: true,
            body: {
              sectionId: acceptedSectionId,
              artifactType: "talk_track",
              status: "draft",
            },
          }),
          { runId },
        );
        expectStatus("downstream artifact", downstreamResponse, 201);

        const otherTeamDetail = await handleAiReviewRunDetailRoute(
          authRepository,
          aiReviewRepository,
          requestWithCookie(
            scopedUrl(tenantId, otherTeamId, `/api/ai-review/runs/${runId}`),
            operatorReference,
          ),
          { runId },
        );
        expectStatus("cross-team detail", otherTeamDetail, 404);

        const failureRunResponse = await handleAiReviewRunsCreateRoute(
          authRepository,
          aiReviewRepository,
          jsonRequest({
            url: scopedUrl(tenantId, teamId),
            sessionReference: operatorReference,
            csrf: true,
            body: createRunInput(`${checkId}_provider_failure`),
          }),
        );
        expectStatus("provider failure run create", failureRunResponse, 201);
        const failureRunId = getNestedString(
          getNestedObject(await readJson(failureRunResponse), "run", "failure run create"),
          "id",
          "failure run create",
        );
        const providerFailure = await handleAiReviewRunExecuteRoute(
          authRepository,
          aiReviewRepository,
          new FakeProvider({
            error: new AiProviderError(
              "AI_PROVIDER_TIMEOUT",
              "synthetic provider timeout with Bearer synthetic_secret",
              {
                retryable: true,
                details: {
                  authorization: "Bearer synthetic_secret",
                },
              },
            ),
          }),
          jsonRequest({
            url: scopedUrl(
              tenantId,
              teamId,
              `/api/ai-review/runs/${failureRunId}/execute`,
            ),
            sessionReference: operatorReference,
            csrf: true,
            body: {
              promptVersionId,
              providerPolicy: {
                provider: "deepseek",
                providerApi: "chat_completions",
                model: "deepseek-v4-pro",
                structuredOutputRequired: true,
              },
            },
          }),
          { runId: failureRunId },
        );
        expectStatus("provider failure execute", providerFailure, 503);

        const archiveResponse = await handleAiReviewRunArchiveRoute(
          authRepository,
          aiReviewRepository,
          jsonRequest({
            url: scopedUrl(tenantId, teamId, `/api/ai-review/runs/${runId}/archive`),
            sessionReference: operatorReference,
            csrf: true,
          }),
          { runId },
        );
        expectStatus("run archive", archiveResponse, 200);

        expectNoSensitive("execute response", executeBody, [
          operatorReference,
          viewerReference,
        ]);
        expectNoSensitive("provider failure response", await readJson(providerFailure), [
          operatorReference,
          viewerReference,
        ]);
        expectNoSensitive("downstream response", await readJson(downstreamResponse), [
          operatorReference,
          viewerReference,
        ]);

        throw new ExpectedRollback();
      });
    } catch (error) {
      if (error instanceof ExpectedRollback) {
        const remaining = await db
          .select()
          .from(tenants)
          .where(eq(tenants.id, rollbackTenantId))
          .limit(1);

        if (remaining.length > 0) {
          throw new Error("AI review route check did not roll back fixtures");
        }

        console.log("AI review route check passed with rollback");
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
