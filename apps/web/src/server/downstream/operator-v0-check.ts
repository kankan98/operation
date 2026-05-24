import {
  authSessionCookieName,
  createAuthSessionRepository,
  type AuthSessionRepositoryDatabase,
} from "../auth";
import {
  handleOperatorV0SessionRoute,
  OPERATOR_V0_BOOTSTRAP_CSRF_HEADER_NAME,
  OPERATOR_V0_BOOTSTRAP_CSRF_HEADER_VALUE,
  operatorV0ActorId,
  operatorV0TeamId,
  operatorV0TenantId,
  type OperatorV0BootstrapDatabase,
} from "../auth/operator-v0";
import { createDatabaseConnection } from "../db/client";
import {
  createAiReviewRunRepository,
  type AiReviewRunRepositoryDatabase,
  type PrepareAiReviewRunInput,
} from "../ai-review/repository";
import {
  AI_REVIEW_MUTATION_CSRF_HEADER_NAME,
  AI_REVIEW_MUTATION_CSRF_HEADER_VALUE,
  handleAiReviewDecisionRoute,
  handleAiReviewDownstreamArtifactRoute,
  handleAiReviewPromptVersionsCreateRoute,
  handleAiReviewRunsCreateRoute,
} from "../ai-review/route";
import { handleOperatorV0AiReviewExecuteRoute } from "../ai-review/operator-v0";
import {
  createTalkTrackAssetRepository,
  type TalkTrackAssetRepositoryDatabase,
} from "../talk-tracks/repository";
import {
  handleTalkTrackAssetsCreateRoute,
  handleTalkTrackAssetsListRoute,
  TALK_TRACK_ASSET_MUTATION_CSRF_HEADER_NAME,
  TALK_TRACK_ASSET_MUTATION_CSRF_HEADER_VALUE,
} from "../talk-tracks/route";
import {
  createNextSessionTaskRepository,
  type NextSessionTaskRepositoryDatabase,
} from "../next-actions/repository";
import {
  handleNextActionTasksCreateRoute,
  handleNextActionTasksListRoute,
  NEXT_SESSION_TASK_MUTATION_CSRF_HEADER_NAME,
  NEXT_SESSION_TASK_MUTATION_CSRF_HEADER_VALUE,
} from "../next-actions/route";

class ExpectedRollback extends Error {
  constructor() {
    super("Rollback local operator V0 downstream workflow check");
  }
}

type JsonObject = Record<string, unknown>;

function bootstrapRequest(csrfHeader: boolean): Request {
  const headers = new Headers();

  if (csrfHeader) {
    headers.set(
      OPERATOR_V0_BOOTSTRAP_CSRF_HEADER_NAME,
      OPERATOR_V0_BOOTSTRAP_CSRF_HEADER_VALUE,
    );
  }

  return new Request("https://operation.local/api/auth/operator-v0-session", {
    method: "POST",
    headers,
  });
}

function scopedUrl(path: string): string {
  return `https://operation.local${path}?tenantId=${operatorV0TenantId}&teamId=${operatorV0TeamId}`;
}

function jsonRequest(input: {
  url: string;
  method?: "POST";
  setCookie?: string | null;
  csrf?: {
    name: string;
    value: string;
  };
  body?: unknown;
}): Request {
  const headers = new Headers({
    "content-type": "application/json",
  });
  const cookieValue = input.setCookie?.split(";")[0] ?? "";

  if (cookieValue) {
    headers.set("cookie", cookieValue);
  }

  if (input.csrf) {
    headers.set(input.csrf.name, input.csrf.value);
  }

  return new Request(input.url, {
    method: input.method ?? "POST",
    headers,
    body: JSON.stringify(input.body ?? {}),
  });
}

function readRequest(setCookie: string | null, url: string): Request {
  const cookieValue = setCookie?.split(";")[0] ?? "";

  return new Request(url, {
    headers: cookieValue ? { cookie: cookieValue } : undefined,
  });
}

async function readJson(response: Response): Promise<JsonObject> {
  const body = await response.json();

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new Error("Operator V0 downstream response was not a JSON object");
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

function expectNoSensitive(label: string, value: unknown) {
  const serialized = JSON.stringify(value);

  for (const leaked of [
    authSessionCookieName,
    "raw_cookie_value",
    "raw_session_secret",
    "provider_session_raw",
    "postgres://operation:operation_dev_password@",
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

function getObject(source: JsonObject, key: string, label: string): JsonObject {
  const value = source[key];

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} did not include ${key}`);
  }

  return value as JsonObject;
}

function getString(source: JsonObject, key: string, label: string): string {
  const value = source[key];

  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${label} did not include ${key}`);
  }

  return value;
}

function getArray(source: JsonObject, key: string, label: string): JsonObject[] {
  const value = source[key];

  if (!Array.isArray(value)) {
    throw new Error(`${label} did not include ${key}`);
  }

  return value as JsonObject[];
}

function createRunInput(): PrepareAiReviewRunInput {
  return {
    sessionId: "operator_v0_downstream_session",
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
      title: "V0 下游资产复盘",
      sessionDate: new Date("2026-05-24T12:00:00.000Z"),
      platform: "douyin",
      hostRoles: [
        {
          displayName: "V0 主讲",
          role: "host",
          responsibility: "讲解进攻拍和适用人群",
        },
      ],
      productOrder: [
        {
          displayModel: "进攻型高端拍",
          roleInSession: "main_offer",
          orderIndex: 1,
          talkingPoints: ["后场进攻", "中杆硬度", "推荐磅数"],
          customerFit: ["中高级", "后场进攻"],
        },
      ],
      operatorSummary: "观众集中询问双打后场、预算替代和推荐磅数。",
      questionSummaries: [
        {
          topic: "fit",
          questionText: "双打后场能不能用",
          answerGiven: "适合力量较好的后场进攻型球友。",
        },
      ],
      objectionSummaries: [
        {
          objectionType: "price",
          content: "预算超过预期",
          responseUsed: "先讲适用人群，再给替代型号。",
        },
      ],
      noteHighlights: [
        {
          noteType: "gap",
          content: "平衡点解释不够清楚，需要补充对比话术。",
        },
      ],
      redactionState: "redacted",
      longInputPolicy: "within_limit",
    },
    knowledgeSnapshot: {
      knowledgeVersionIds: ["operator_v0_knowledge_downstream_baseline"],
      racketProductVersionIds: ["operator_v0_racket_downstream_baseline"],
      sourceIds: ["operator_v0_source_downstream_baseline"],
      trustSummary: {
        mode: "local_v0_downstream_baseline",
      },
      conflictState: "none",
      freshnessState: "current",
      reviewState: "published_only",
      intendedUse: [
        "live_recap",
        "product_diagnosis",
        "question_cluster",
        "objection_pattern",
        "talk_track_candidate",
        "short_video_topic",
        "next_session_action",
      ],
    },
  };
}

function findSectionId(
  sections: JsonObject[],
  sectionType: string,
  label: string,
): string {
  const section = sections.find((item) => item.sectionType === sectionType);

  if (!section) {
    throw new Error(`${label} did not include ${sectionType}`);
  }

  return getString(section, "id", label);
}

async function main() {
  const { client, db } = createDatabaseConnection();

  try {
    try {
      await db.transaction(async (transaction) => {
        const bootstrapResponse = await handleOperatorV0SessionRoute(
          transaction as unknown as OperatorV0BootstrapDatabase,
          bootstrapRequest(true),
          { enabled: true },
        );
        expectStatus("bootstrap", bootstrapResponse, 200);
        expectNoStore("bootstrap", bootstrapResponse);

        const setCookie = bootstrapResponse.headers.get("set-cookie");
        const bootstrapBody = await readJson(bootstrapResponse);
        const permissions = getObject(
          bootstrapBody,
          "membership",
          "bootstrap",
        ).permissions;

        if (
          !Array.isArray(permissions) ||
          !permissions.includes("manage_talk_tracks") ||
          !permissions.includes("manage_next_tasks")
        ) {
          throw new Error("V0 bootstrap did not grant downstream permissions");
        }

        const authRepository = createAuthSessionRepository(
          transaction as unknown as AuthSessionRepositoryDatabase,
        );
        const aiReviewRepository = createAiReviewRunRepository(
          transaction as unknown as AiReviewRunRepositoryDatabase,
        );
        const talkTrackRepository = createTalkTrackAssetRepository(
          transaction as unknown as TalkTrackAssetRepositoryDatabase,
        );
        const nextActionRepository = createNextSessionTaskRepository(
          transaction as unknown as NextSessionTaskRepositoryDatabase,
        );

        const missingScope = await handleTalkTrackAssetsListRoute(
          authRepository,
          talkTrackRepository,
          readRequest(setCookie, "https://operation.local/api/talk-tracks/assets"),
        );
        expectStatus("missing talk-track scope", missingScope, 400);

        const missingAuth = await handleNextActionTasksListRoute(
          authRepository,
          nextActionRepository,
          new Request(scopedUrl("/api/next-actions/tasks")),
        );
        expectStatus("missing next-action auth", missingAuth, 401);

        const missingCsrf = await handleTalkTrackAssetsCreateRoute(
          authRepository,
          talkTrackRepository,
          jsonRequest({
            url: scopedUrl("/api/talk-tracks/assets"),
            setCookie,
            body: {},
          }),
        );
        expectStatus("missing talk-track csrf", missingCsrf, 403);

        const promptResponse = await handleAiReviewPromptVersionsCreateRoute(
          authRepository,
          aiReviewRepository,
          jsonRequest({
            url: scopedUrl("/api/ai-review/prompt-versions"),
            setCookie,
            csrf: {
              name: AI_REVIEW_MUTATION_CSRF_HEADER_NAME,
              value: AI_REVIEW_MUTATION_CSRF_HEADER_VALUE,
            },
            body: {
              name: "V0 下游资产复盘结构化输出",
              version: `2026-05-24-v0-downstream-${Date.now().toString(36)}`,
              purpose: "full_review",
              inputSchemaVersion: "session-review-input-v1",
              outputSchemaVersion: "ai-review-output-v1",
              modelPolicy: "local V0 fake-provider downstream output policy",
              status: "active",
            },
          }),
        );
        expectStatus("prompt create", promptResponse, 201);

        const promptVersionId = getString(
          getObject(await readJson(promptResponse), "promptVersion", "prompt create"),
          "id",
          "prompt create",
        );

        const createRunResponse = await handleAiReviewRunsCreateRoute(
          authRepository,
          aiReviewRepository,
          jsonRequest({
            url: scopedUrl("/api/ai-review/runs"),
            setCookie,
            csrf: {
              name: AI_REVIEW_MUTATION_CSRF_HEADER_NAME,
              value: AI_REVIEW_MUTATION_CSRF_HEADER_VALUE,
            },
            body: createRunInput(),
          }),
        );
        expectStatus("run create", createRunResponse, 201);

        const runId = getString(
          getObject(await readJson(createRunResponse), "run", "run create"),
          "id",
          "run create",
        );

        const executeResponse = await handleOperatorV0AiReviewExecuteRoute(
          authRepository,
          aiReviewRepository,
          jsonRequest({
            url: scopedUrl(`/api/ai-review/runs/${runId}/execute-v0`),
            setCookie,
            csrf: {
              name: AI_REVIEW_MUTATION_CSRF_HEADER_NAME,
              value: AI_REVIEW_MUTATION_CSRF_HEADER_VALUE,
            },
            body: {
              promptVersionId,
              providerPolicy: {
                provider: "local-v0-fake-provider",
                providerApi: "fake-json",
                model: "operator-v0-ai-review",
                structuredOutputRequired: true,
              },
            },
          }),
          { runId },
          { enabled: true },
        );
        expectStatus("run execute", executeResponse, 200);

        const executeBody = await readJson(executeResponse);
        const detail = getObject(
          getObject(executeBody, "result", "run execute"),
          "detail",
          "run execute",
        );
        const sections = getArray(detail, "sections", "run execute");
        const talkSectionId = findSectionId(
          sections,
          "talk_track_candidate",
          "run execute",
        );
        const taskSectionId = findSectionId(
          sections,
          "next_session_action",
          "run execute",
        );

        for (const [sectionId, reason] of [
          [talkSectionId, "该话术候选可进入话术草稿。"],
          [taskSectionId, "该下场动作可进入任务。"],
        ] as const) {
          const decisionResponse = await handleAiReviewDecisionRoute(
            authRepository,
            aiReviewRepository,
            jsonRequest({
              url: scopedUrl(`/api/ai-review/runs/${runId}/decisions`),
              setCookie,
              csrf: {
                name: AI_REVIEW_MUTATION_CSRF_HEADER_NAME,
                value: AI_REVIEW_MUTATION_CSRF_HEADER_VALUE,
              },
              body: {
                targetType: "section",
                targetId: sectionId,
                decision: "accept",
                reason,
              },
            }),
            { runId },
          );
          expectStatus("review decision", decisionResponse, 201);
        }

        const downstreamTalkResponse = await handleAiReviewDownstreamArtifactRoute(
          authRepository,
          aiReviewRepository,
          jsonRequest({
            url: scopedUrl(`/api/ai-review/runs/${runId}/downstream-artifacts`),
            setCookie,
            csrf: {
              name: AI_REVIEW_MUTATION_CSRF_HEADER_NAME,
              value: AI_REVIEW_MUTATION_CSRF_HEADER_VALUE,
            },
            body: {
              sectionId: talkSectionId,
              artifactType: "talk_track",
              status: "draft",
            },
          }),
          { runId },
        );
        expectStatus("downstream talk-track reference", downstreamTalkResponse, 201);

        const downstreamTaskResponse = await handleAiReviewDownstreamArtifactRoute(
          authRepository,
          aiReviewRepository,
          jsonRequest({
            url: scopedUrl(`/api/ai-review/runs/${runId}/downstream-artifacts`),
            setCookie,
            csrf: {
              name: AI_REVIEW_MUTATION_CSRF_HEADER_NAME,
              value: AI_REVIEW_MUTATION_CSRF_HEADER_VALUE,
            },
            body: {
              sectionId: taskSectionId,
              artifactType: "next_session_task",
              status: "draft",
            },
          }),
          { runId },
        );
        expectStatus("downstream task reference", downstreamTaskResponse, 201);

        const createTalkAssetResponse = await handleTalkTrackAssetsCreateRoute(
          authRepository,
          talkTrackRepository,
          jsonRequest({
            url: scopedUrl("/api/talk-tracks/assets"),
            setCookie,
            csrf: {
              name: TALK_TRACK_ASSET_MUTATION_CSRF_HEADER_NAME,
              value: TALK_TRACK_ASSET_MUTATION_CSRF_HEADER_VALUE,
            },
            body: {
              asset: {
                assetType: "objection_reply",
                title: "AI 复盘采纳：预算异议回应",
                ownerRole: "operator",
              },
              version: {
                body: "先确认球友打法，再解释高端进攻拍的稳定性和替代选择。",
                tone: "professional",
                language: "zh_CN",
              },
              scenario: {
                racketProductIds: ["operator_v0_racket_downstream_baseline"],
                playerLevel: "intermediate",
                playStyle: "attack",
                priceBand: "premium",
                liveScene: "objection_handling",
                hostRole: "host",
                objectionType: "price",
                usageConstraints: ["仅作为本地 V0 草稿，发布前需复核"],
              },
              segments: [
                {
                  segmentType: "objection_reply",
                  text: "先讲适合人群，再给预算替代型号。",
                  requiredEvidence: false,
                },
              ],
              sourceGrounding: {
                sourceType: "ai_review_run",
                sourceIds: [runId],
                knowledgeVersionIds: ["operator_v0_knowledge_downstream_baseline"],
                racketProductIds: ["operator_v0_racket_downstream_baseline"],
                aiRunId: runId,
                freshnessState: "current",
                conflictState: "none",
                sensitiveRedactionState: "redacted",
                claimSummary: "来自已采纳 AI 复盘话术候选区块。",
              },
            },
          }),
        );
        expectStatus("talk-track draft create", createTalkAssetResponse, 201);
        expectNoSensitive(
          "talk-track draft create",
          await readJson(createTalkAssetResponse),
        );

        const createTaskResponse = await handleNextActionTasksCreateRoute(
          authRepository,
          nextActionRepository,
          jsonRequest({
            url: scopedUrl("/api/next-actions/tasks"),
            setCookie,
            csrf: {
              name: NEXT_SESSION_TASK_MUTATION_CSRF_HEADER_NAME,
              value: NEXT_SESSION_TASK_MUTATION_CSRF_HEADER_VALUE,
            },
            body: {
              task: {
                title: "补齐预算异议和双打后场答疑",
                summary: "根据已采纳 AI 复盘区块，下场前整理价格回应和双打后场适配说明。",
                taskType: "fix_talk_track",
                priority: "high",
                ownerId: operatorV0ActorId,
                targetSessionId: "operator_v0_next_session",
                deadlinePolicy: "before_next_session",
                reviewRequired: false,
                relatedRacketProductIds: ["operator_v0_racket_downstream_baseline"],
              },
              source: {
                sourceWorkflow: "ai_review",
                sourceId: runId,
                sourceSectionId: taskSectionId,
                aiRunId: runId,
                promptVersion: promptVersionId,
                sourceState: "accepted",
                knowledgeVersionIds: ["operator_v0_knowledge_downstream_baseline"],
                racketProductIds: ["operator_v0_racket_downstream_baseline"],
                sensitiveRedactionState: "redacted",
              },
              checklist: [
                {
                  title: "整理两句预算异议回应",
                  required: true,
                },
                {
                  title: "补充双打后场适用条件",
                  required: false,
                },
              ],
            },
          }),
        );
        expectStatus("next-action task create", createTaskResponse, 201);
        expectNoSensitive("next-action task create", await readJson(createTaskResponse));

        const listTalkResponse = await handleTalkTrackAssetsListRoute(
          authRepository,
          talkTrackRepository,
          readRequest(setCookie, scopedUrl("/api/talk-tracks/assets")),
        );
        expectStatus("talk-track list", listTalkResponse, 200);

        const listTaskResponse = await handleNextActionTasksListRoute(
          authRepository,
          nextActionRepository,
          readRequest(setCookie, scopedUrl("/api/next-actions/tasks")),
        );
        expectStatus("next-action list", listTaskResponse, 200);

        throw new ExpectedRollback();
      });
    } catch (error) {
      if (error instanceof ExpectedRollback) {
        return;
      }

      throw error;
    }
  } finally {
    await client.end();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
