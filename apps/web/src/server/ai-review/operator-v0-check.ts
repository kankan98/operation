import type { AiProviderPort } from "../ai-provider";
import {
  summarizeAiReviewEvidenceConfidence,
  summarizeAiReviewQualityTriage,
  summarizeAiReviewRemediationPlan,
  summarizeAiReviewSectionEvidence,
  type AiReviewRunDetail,
} from "../../lib/ai-review-v0-workflow";
import {
  authSessionCookieName,
  createAuthSessionRepository,
  type AuthSessionRepositoryDatabase,
} from "../auth";
import {
  handleOperatorV0SessionRoute,
  OPERATOR_V0_BOOTSTRAP_CSRF_HEADER_NAME,
  OPERATOR_V0_BOOTSTRAP_CSRF_HEADER_VALUE,
  operatorV0TeamId,
  operatorV0TenantId,
  type OperatorV0BootstrapDatabase,
} from "../auth/operator-v0";
import { createDatabaseConnection } from "../db/client";
import {
  createAiReviewRunRepository,
  type AiReviewRunRepositoryDatabase,
  type PrepareAiReviewRunInput,
} from "./repository";
import {
  AI_REVIEW_MUTATION_CSRF_HEADER_NAME,
  AI_REVIEW_MUTATION_CSRF_HEADER_VALUE,
  handleAiReviewDecisionRoute,
  handleAiReviewFeedbackSignalRoute,
  handleAiReviewPromptVersionsCreateRoute,
  handleAiReviewRunDetailRoute,
  handleAiReviewRunsCreateRoute,
} from "./route";
import { handleOperatorV0AiReviewExecuteRoute } from "./operator-v0";

class ExpectedRollback extends Error {
  constructor() {
    super("Rollback local operator V0 AI review workflow check");
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

function requestWithSetCookie(url: string, setCookie: string | null): Request {
  const cookieValue = setCookie?.split(";")[0] ?? "";

  return new Request(url, {
    headers: {
      cookie: cookieValue,
    },
  });
}

function jsonRequest(input: {
  url: string;
  method?: "POST";
  setCookie?: string | null;
  csrf?: boolean;
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

async function readJson(response: Response): Promise<JsonObject> {
  const body = await response.json();

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new Error("Operator V0 AI review response was not a JSON object");
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
    sessionId: "operator_v0_ai_review_session",
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
      title: "V0 高端进攻拍复盘",
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
      knowledgeVersionIds: ["operator_v0_knowledge_review_baseline"],
      racketProductVersionIds: ["operator_v0_racket_review_baseline"],
      sourceIds: ["operator_v0_source_review_baseline"],
      trustSummary: {
        mode: "local_v0_review_baseline",
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

function assertFakeProvider(provider: unknown): asserts provider is AiProviderPort {
  if (
    !provider ||
    typeof provider !== "object" ||
    typeof (provider as AiProviderPort).generateJson !== "function"
  ) {
    throw new Error("Operator V0 fake provider is not available");
  }
}

async function main() {
  const { client, db } = createDatabaseConnection();

  try {
    try {
      await db.transaction(async (transaction) => {
        const checkPromptVersion = `2026-05-24-v0-check-${Date.now().toString(36)}`;

        const disabledResponse = await handleOperatorV0AiReviewExecuteRoute(
          null,
          null,
          jsonRequest({
            url: scopedUrl("/api/ai-review/runs/missing/execute-v0"),
            csrf: true,
          }),
          { runId: "missing" },
          { enabled: false },
        );
        expectStatus("disabled V0 execute", disabledResponse, 404);
        expectNoStore("disabled V0 execute", disabledResponse);

        const bootstrapResponse = await handleOperatorV0SessionRoute(
          transaction as unknown as OperatorV0BootstrapDatabase,
          bootstrapRequest(true),
          { enabled: true },
        );
        expectStatus("bootstrap", bootstrapResponse, 200);
        const setCookie = bootstrapResponse.headers.get("set-cookie");
        const bootstrapBody = await readJson(bootstrapResponse);
        const membership = getObject(bootstrapBody, "membership", "bootstrap");
        const permissions = membership.permissions;
        if (!Array.isArray(permissions) || !permissions.includes("run_ai_review")) {
          throw new Error("Operator V0 bootstrap did not grant AI review permission");
        }

        const authRepository = createAuthSessionRepository(
          transaction as unknown as AuthSessionRepositoryDatabase,
        );
        const aiReviewRepository = createAiReviewRunRepository(
          transaction as unknown as AiReviewRunRepositoryDatabase,
        );

        const missingCsrf = await handleOperatorV0AiReviewExecuteRoute(
          authRepository,
          aiReviewRepository,
          jsonRequest({
            url: scopedUrl("/api/ai-review/runs/missing/execute-v0"),
            setCookie,
          }),
          { runId: "missing" },
          { enabled: true },
        );
        expectStatus("missing csrf", missingCsrf, 403);

        const missingAuth = await handleOperatorV0AiReviewExecuteRoute(
          authRepository,
          aiReviewRepository,
          jsonRequest({
            url: scopedUrl("/api/ai-review/runs/missing/execute-v0"),
            csrf: true,
          }),
          { runId: "missing" },
          { enabled: true },
        );
        expectStatus("missing auth", missingAuth, 401);

        const promptResponse = await handleAiReviewPromptVersionsCreateRoute(
          authRepository,
          aiReviewRepository,
          jsonRequest({
            url: scopedUrl("/api/ai-review/prompt-versions"),
            setCookie,
            csrf: true,
            body: {
              name: "V0 AI 复盘结构化输出",
              version: checkPromptVersion,
              purpose: "full_review",
              inputSchemaVersion: "session-review-input-v1",
              outputSchemaVersion: "ai-review-output-v1",
              modelPolicy: "local V0 fake-provider structured output policy",
              status: "active",
            },
          }),
        );
        expectStatus("prompt create", promptResponse, 201);
        const promptBody = await readJson(promptResponse);
        const promptVersionId = getString(
          getObject(promptBody, "promptVersion", "prompt create"),
          "id",
          "prompt create",
        );

        const createResponse = await handleAiReviewRunsCreateRoute(
          authRepository,
          aiReviewRepository,
          jsonRequest({
            url: scopedUrl("/api/ai-review/runs"),
            setCookie,
            csrf: true,
            body: createRunInput(),
          }),
        );
        expectStatus("run create", createResponse, 201);
        const createBody = await readJson(createResponse);
        const runId = getString(
          getObject(createBody, "run", "run create"),
          "id",
          "run create",
        );

        const executeResponse = await handleOperatorV0AiReviewExecuteRoute(
          authRepository,
          aiReviewRepository,
          jsonRequest({
            url: scopedUrl(`/api/ai-review/runs/${runId}/execute-v0`),
            setCookie,
            csrf: true,
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
        expectStatus("V0 fake execute", executeResponse, 200);
        expectNoStore("V0 fake execute", executeResponse);
        const executeBody = await readJson(executeResponse);
        expectNoSensitive("V0 fake execute", executeBody);
        const result = getObject(executeBody, "result", "V0 fake execute");
        const detail = getObject(result, "detail", "V0 fake execute");
        const sections = getArray(detail, "sections", "V0 fake execute");
        if (result.reviewReady !== true || sections.length < 7) {
          throw new Error("V0 fake execution did not create review-ready sections");
        }
        const executedDetail = detail as unknown as AiReviewRunDetail;

        assertFakeProvider({ generateJson: async () => ({}) });

        const firstSectionId = getString(sections[0], "id", "V0 fake execute");
        const decisionResponse = await handleAiReviewDecisionRoute(
          authRepository,
          aiReviewRepository,
          jsonRequest({
            url: scopedUrl(`/api/ai-review/runs/${runId}/decisions`),
            setCookie,
            csrf: true,
            body: {
              targetType: "section",
              targetId: firstSectionId,
              decision: "accept",
              reason: "V0 workflow check accepts the first review section",
            },
          }),
          { runId },
        );
        expectStatus("decision create", decisionResponse, 201);

        const feedbackResponse = await handleAiReviewFeedbackSignalRoute(
          authRepository,
          aiReviewRepository,
          jsonRequest({
            url: scopedUrl(`/api/ai-review/runs/${runId}/feedback-signals`),
            setCookie,
            csrf: true,
            body: {
              sectionId: firstSectionId,
              signalType: "missing_knowledge",
              reason: "V0 workflow check marks a knowledge gap for review",
              reviewPriority: "high",
              routesTo: "knowledge_review",
            },
          }),
          { runId },
        );
        expectStatus("feedback create", feedbackResponse, 201);
        expectNoSensitive("feedback create", await readJson(feedbackResponse));

        const detailResponse = await handleAiReviewRunDetailRoute(
          authRepository,
          aiReviewRepository,
          requestWithSetCookie(
            scopedUrl(`/api/ai-review/runs/${runId}`),
            setCookie,
          ),
          { runId },
        );
        expectStatus("detail after decision", detailResponse, 200);
        const detailBody = await readJson(detailResponse);
        const afterDetail = getObject(detailBody, "detail", "detail after decision");
        const decisions = getArray(afterDetail, "decisions", "detail after decision");
        if (decisions.length === 0) {
          throw new Error("V0 decision was not persisted in run detail");
        }
        const feedbackSignals = getArray(
          afterDetail,
          "feedbackSignals",
          "detail after decision",
        );
        if (
          !feedbackSignals.some(
            (signal) =>
              signal.signalType === "missing_knowledge" &&
              signal.routesTo === "knowledge_review",
          )
        ) {
          throw new Error("V0 feedback was not persisted in run detail");
        }
        expectNoSensitive("detail after feedback", detailBody);

        const evidenceConfidence = summarizeAiReviewEvidenceConfidence(
          afterDetail as unknown as AiReviewRunDetail,
        );
        if (evidenceConfidence.sourceCoverage.totalSections < sections.length) {
          throw new Error("Evidence confidence did not include all generated sections");
        }
        if (evidenceConfidence.feedback.hotspotLabel !== "缺知识") {
          throw new Error("Evidence confidence did not surface feedback hotspot");
        }
        if (evidenceConfidence.nextAction.tone === "success") {
          throw new Error("Evidence confidence incorrectly marked knowledge gap as ready");
        }

        const sectionEvidence = summarizeAiReviewSectionEvidence(
          afterDetail as unknown as AiReviewRunDetail,
          sections[0] as unknown as AiReviewRunDetail["sections"][number],
        );
        if (!sectionEvidence.issueLabels.includes("缺知识")) {
          throw new Error("Section evidence did not surface missing knowledge issue");
        }
        if (sectionEvidence.downstreamState === "ready") {
          throw new Error("Section evidence ignored unresolved feedback issue");
        }

        const qualityTriage = summarizeAiReviewQualityTriage(
          afterDetail as unknown as AiReviewRunDetail,
        );
        if (qualityTriage.priority.label !== "先补知识") {
          throw new Error("Quality triage did not prioritize missing knowledge");
        }
        if (qualityTriage.repairRoute !== "knowledge_review") {
          throw new Error("Quality triage did not route missing knowledge correctly");
        }
        if (qualityTriage.downstreamReady) {
          throw new Error("Quality triage incorrectly allowed downstream reuse");
        }
        const firstSectionTriage = qualityTriage.sections.find(
          (section) => section.sectionId === firstSectionId,
        );
        if (!firstSectionTriage) {
          throw new Error("Quality triage did not include generated section");
        }
        if (!firstSectionTriage.repairReasons.includes("缺知识")) {
          throw new Error("Quality triage did not surface section repair reason");
        }
        if (firstSectionTriage.repairRoute !== "knowledge_review") {
          throw new Error("Quality triage did not route section repair correctly");
        }

        const remediationPlan = summarizeAiReviewRemediationPlan(
          afterDetail as unknown as AiReviewRunDetail,
        );
        if (remediationPlan.priorityLabel !== "先补知识") {
          throw new Error("Remediation plan did not prioritize missing knowledge");
        }
        if (remediationPlan.actions[0]?.route !== "knowledge_review") {
          throw new Error("Remediation plan did not route first action to knowledge review");
        }
        if (remediationPlan.actions[0]?.affectedSections !== 1) {
          throw new Error("Remediation plan did not count affected sections");
        }
        if (remediationPlan.downstreamState !== "blocked") {
          throw new Error("Remediation plan did not block downstream reuse");
        }
        if (!remediationPlan.nextCheck.includes("知识复核")) {
          throw new Error("Remediation plan did not explain the next check");
        }
        expectNoSensitive("remediation plan", remediationPlan);

        const notGeneratedPlan = summarizeAiReviewRemediationPlan({
          ...executedDetail,
          sections: [],
          validationResults: [],
          feedbackSignals: [],
        });
        if (
          notGeneratedPlan.priorityKey !== "not_generated" ||
          notGeneratedPlan.actions[0]?.route !== "generate_review"
        ) {
          throw new Error("Remediation plan did not handle not-generated state");
        }

        const validationBlockedPlan = summarizeAiReviewRemediationPlan({
          ...executedDetail,
          validationResults: [
            {
              id: "local_validation_blocker",
              checkType: "sensitive_data",
              status: "blocked",
              message: "Local verifier synthetic validation blocker",
              recoverable: true,
            },
          ],
          feedbackSignals: [],
        });
        if (
          validationBlockedPlan.priorityKey !== "validation_blocked" ||
          validationBlockedPlan.downstreamState !== "blocked"
        ) {
          throw new Error("Remediation plan did not prioritize validation blockers");
        }

        const pendingReviewPlan = summarizeAiReviewRemediationPlan({
          ...executedDetail,
          feedbackSignals: [],
        });
        if (
          pendingReviewPlan.priorityKey !== "human_review" ||
          pendingReviewPlan.downstreamState !== "not_ready"
        ) {
          throw new Error("Remediation plan did not require human review");
        }

        const downstreamSection = executedDetail.sections.find(
          (section) => section.sectionType === "talk_track_candidate",
        );
        if (!downstreamSection) {
          throw new Error("V0 fake output did not include a downstream-capable section");
        }
        const downstreamReadyPlan = summarizeAiReviewRemediationPlan({
          ...executedDetail,
          sections: [
            {
              ...downstreamSection,
              reviewState: "accepted",
            },
          ],
          validationResults: [],
          feedbackSignals: [],
        });
        if (
          downstreamReadyPlan.priorityKey !== "downstream_ready" ||
          downstreamReadyPlan.downstreamState !== "available"
        ) {
          throw new Error("Remediation plan did not allow clean accepted downstream drafts");
        }

        const reviewOnlySection = executedDetail.sections.find(
          (section) => section.sectionType === "live_recap",
        );
        if (!reviewOnlySection) {
          throw new Error("V0 fake output did not include a review-only section");
        }
        const reviewCompletePlan = summarizeAiReviewRemediationPlan({
          ...executedDetail,
          sections: [
            {
              ...reviewOnlySection,
              reviewState: "accepted",
            },
          ],
          validationResults: [],
          feedbackSignals: [],
        });
        if (
          reviewCompletePlan.priorityKey !== "review_complete" ||
          reviewCompletePlan.downstreamState !== "not_applicable"
        ) {
          throw new Error("Remediation plan did not handle review-complete state");
        }

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
