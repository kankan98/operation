import { createDatabaseConnection } from "../db/client";
import {
  authSessionCookieName,
  createAuthSessionRepository,
  type AuthSessionRepositoryDatabase,
} from "./index";
import {
  handleOperatorV0SessionRoute,
  OPERATOR_V0_BOOTSTRAP_CSRF_HEADER_NAME,
  OPERATOR_V0_BOOTSTRAP_CSRF_HEADER_VALUE,
  type OperatorV0BootstrapDatabase,
} from "./operator-v0";
import {
  bootstrapBodyToInternalTrialScope,
  scopedInternalTrialApiUrl,
  type InternalTrialBootstrapBody,
} from "../../lib/internal-trial-access";
import {
  buildTrialWorkflowReadinessSummary,
  extractTrialWorkflowCollectionCount,
  type TrialWorkflowCollectionKey,
  type TrialWorkflowStepId,
} from "../../lib/trial-workflow-readiness";
import {
  createAiReviewRunRepository,
  type AiReviewRunRepositoryDatabase,
} from "../ai-review/repository";
import {
  handleAiReviewRunDetailRoute,
  handleAiReviewRunsListRoute,
} from "../ai-review/route";
import {
  createKnowledgeLifecycleRepository,
  type KnowledgeLifecycleRepositoryDatabase,
} from "../knowledge/repository";
import { handleKnowledgeSourcesListRoute } from "../knowledge/route";
import {
  createNextSessionTaskRepository,
  type NextSessionTaskRepositoryDatabase,
} from "../next-actions/repository";
import { handleNextActionTasksListRoute } from "../next-actions/route";
import {
  createRacketProductRepository,
  type RacketProductRepositoryDatabase,
} from "../rackets/repository";
import { handleRacketProductsListRoute } from "../rackets/route";
import {
  createSessionCaptureRepository,
  type SessionCaptureRepositoryDatabase,
} from "../sessions/repository";
import { handleSessionCapturesListRoute } from "../sessions/route";
import {
  createTalkTrackAssetRepository,
  type TalkTrackAssetRepositoryDatabase,
} from "../talk-tracks/repository";
import { handleTalkTrackAssetsListRoute } from "../talk-tracks/route";
import {
  createV0TrialFeedbackRepository,
  type V0TrialFeedbackRepositoryDatabase,
} from "../trial-feedback/repository";
import { handleV0TrialFeedbackListRoute } from "../trial-feedback/route";

class ExpectedRollback extends Error {
  constructor() {
    super("Rollback local V0 trial demo data check");
  }
}

type JsonObject = Record<string, unknown>;

const demoSessionTitleMarker = "V0 演示样例｜高端进攻拍直播复盘";

type WorkbenchCheck = {
  collectionKey: TrialWorkflowCollectionKey;
  expectedMarker: string;
  label: string;
  markerProbe?: (
    body: JsonObject,
    setCookie: string | null,
  ) => Promise<boolean>;
  path: string;
  route: (request: Request) => Promise<Response>;
  stepId: TrialWorkflowStepId;
};

function bootstrapRequest(): Request {
  return new Request("https://operation.local/api/auth/operator-v0-session", {
    method: "POST",
    headers: {
      [OPERATOR_V0_BOOTSTRAP_CSRF_HEADER_NAME]:
        OPERATOR_V0_BOOTSTRAP_CSRF_HEADER_VALUE,
    },
  });
}

function requestWithSetCookie(url: string, setCookie: string | null): Request {
  const cookieValue = setCookie?.split(";")[0] ?? "";

  return new Request(new URL(url, "https://operation.local").toString(), {
    headers: {
      cookie: cookieValue,
    },
  });
}

async function readJson(response: Response): Promise<JsonObject> {
  const body = await response.json();

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new Error("Trial demo data response was not a JSON object");
  }

  return body as JsonObject;
}

function expect(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function expectNoStore(label: string, response: Response) {
  expect(
    response.headers.get("cache-control") === "no-store",
    `${label} did not return Cache-Control: no-store`,
  );
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
    "手机号",
    "电话",
    "订单",
    "私信",
    "供应商",
    "Authorization",
    "Bearer",
    "sk-",
  ]) {
    if (serialized.includes(leaked)) {
      throw new Error(`${label} leaked sensitive metadata`);
    }
  }
}

function collectionCount(
  label: string,
  body: JsonObject,
  collectionKey: TrialWorkflowCollectionKey,
): number {
  const count = extractTrialWorkflowCollectionCount(body, collectionKey);

  if (count === null) {
    throw new Error(`${label} did not expose ${collectionKey} collection`);
  }

  return count;
}

async function expectWorkbenchCounts(
  checks: WorkbenchCheck[],
  setCookie: string | null,
): Promise<Record<TrialWorkflowStepId, number>> {
  const counts = {} as Record<TrialWorkflowStepId, number>;

  for (const check of checks) {
    const response = await check.route(requestWithSetCookie(check.path, setCookie));
    expectNoStore(check.label, response);
    const body = await readJson(response);

    expect(
      response.status === 200 && body.ok === true,
      `${check.label} was not accessible under a verified trial session`,
    );
    expectNoSensitive(check.label, body);

    const count = collectionCount(check.label, body, check.collectionKey);
    expect(count > 0, `${check.label} did not include seeded demo records`);
    const includesMarker =
      JSON.stringify(body).includes(check.expectedMarker) ||
      (check.markerProbe
        ? await check.markerProbe(body, setCookie)
        : false);
    expect(
      includesMarker,
      `${check.label} did not include the expected V0 demo marker`,
    );
    counts[check.stepId] = count;
  }

  const readiness = buildTrialWorkflowReadinessSummary(
    Object.entries(counts).map(([id, count]) => ({
      id: id as TrialWorkflowStepId,
      ok: true,
      count,
    })),
  );
  expect(readiness.status === "complete", "Seeded demo data did not complete V0 readiness");
  expectNoSensitive("seeded readiness summary", readiness);

  return counts;
}

function expectStableCounts(
  first: Record<TrialWorkflowStepId, number>,
  second: Record<TrialWorkflowStepId, number>,
) {
  for (const stepId of Object.keys(first) as TrialWorkflowStepId[]) {
    expect(
      first[stepId] === second[stepId],
      `${stepId} count changed after repeated bootstrap`,
    );
  }
}

async function main() {
  const { client, db } = createDatabaseConnection();

  try {
    try {
      await db.transaction(async (transaction) => {
        const authRepository = createAuthSessionRepository(
          transaction as unknown as AuthSessionRepositoryDatabase,
        );
        const sessionRepository = createSessionCaptureRepository(
          transaction as unknown as SessionCaptureRepositoryDatabase,
        );
        const racketRepository = createRacketProductRepository(
          transaction as unknown as RacketProductRepositoryDatabase,
        );
        const knowledgeRepository = createKnowledgeLifecycleRepository(
          transaction as unknown as KnowledgeLifecycleRepositoryDatabase,
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
        const trialFeedbackRepository = createV0TrialFeedbackRepository(
          transaction as unknown as V0TrialFeedbackRepositoryDatabase,
        );

        const bootstrapResponse = await handleOperatorV0SessionRoute(
          transaction as unknown as OperatorV0BootstrapDatabase,
          bootstrapRequest(),
          { enabled: true },
        );
        expectNoStore("bootstrap", bootstrapResponse);
        const setCookie = bootstrapResponse.headers.get("set-cookie");
        const bootstrapBody = (await readJson(
          bootstrapResponse,
        )) as InternalTrialBootstrapBody;
        expect(
          bootstrapResponse.status === 200 &&
            bootstrapBody.ok === true &&
            Boolean(setCookie?.includes(`${authSessionCookieName}=`)),
          "Trial demo bootstrap did not issue a safe session",
        );
        expectNoSensitive("bootstrap", bootstrapBody);

        const scope = bootstrapBodyToInternalTrialScope(
          bootstrapBody as Extract<InternalTrialBootstrapBody, { ok: true }>,
        );
        const scopedPath = (path: string) =>
          scopedInternalTrialApiUrl(path, scope);
        const checks: WorkbenchCheck[] = [
          {
            collectionKey: "sessions",
            expectedMarker: demoSessionTitleMarker,
            label: "sessions demo API",
            path: scopedPath("/api/sessions/captures"),
            route: (request) =>
              handleSessionCapturesListRoute(authRepository, sessionRepository, request),
            stepId: "sessions",
          },
          {
            collectionKey: "products",
            expectedMarker: "V0-DEMO-ATTACK-900",
            label: "rackets demo API",
            path: scopedPath("/api/rackets/products"),
            route: (request) =>
              handleRacketProductsListRoute(authRepository, racketRepository, request),
            stepId: "rackets",
          },
          {
            collectionKey: "sources",
            expectedMarker: "V0 演示资料｜进攻拍规格与适用人群",
            label: "knowledge demo API",
            path: scopedPath("/api/knowledge/sources"),
            route: (request) =>
              handleKnowledgeSourcesListRoute(
                authRepository,
                knowledgeRepository,
                request,
              ),
            stepId: "knowledge",
          },
          {
            collectionKey: "runs",
            expectedMarker: demoSessionTitleMarker,
            label: "ai review demo API",
            markerProbe: async (body, activeSetCookie) => {
              const runs = Array.isArray(body.runs) ? body.runs : [];

              for (const run of runs) {
                if (!run || typeof run !== "object") {
                  continue;
                }

                const runId = (run as Record<string, unknown>).id;

                if (typeof runId !== "string") {
                  continue;
                }

                const detailResponse = await handleAiReviewRunDetailRoute(
                  authRepository,
                  aiReviewRepository,
                  requestWithSetCookie(
                    scopedPath(`/api/ai-review/runs/${runId}`),
                    activeSetCookie,
                  ),
                  { runId },
                );
                expectNoStore("ai review demo detail API", detailResponse);
                const detailBody = await readJson(detailResponse);
                expectNoSensitive("ai review demo detail API", detailBody);

                if (JSON.stringify(detailBody).includes(demoSessionTitleMarker)) {
                  return true;
                }
              }

              return false;
            },
            path: scopedPath("/api/ai-review/runs"),
            route: (request) =>
              handleAiReviewRunsListRoute(authRepository, aiReviewRepository, request),
            stepId: "ai-review",
          },
          {
            collectionKey: "assets",
            expectedMarker: "V0 演示话术｜高端进攻拍预算异议回应",
            label: "talk tracks demo API",
            path: scopedPath("/api/talk-tracks/assets"),
            route: (request) =>
              handleTalkTrackAssetsListRoute(
                authRepository,
                talkTrackRepository,
                request,
              ),
            stepId: "talk-tracks",
          },
          {
            collectionKey: "tasks",
            expectedMarker: "V0 演示任务｜补齐预算替代与双打后场答疑",
            label: "next actions demo API",
            path: scopedPath("/api/next-actions/tasks"),
            route: (request) =>
              handleNextActionTasksListRoute(
                authRepository,
                nextActionRepository,
                request,
              ),
            stepId: "next-actions",
          },
        ];

        const firstCounts = await expectWorkbenchCounts(checks, setCookie);

        const secondBootstrapResponse = await handleOperatorV0SessionRoute(
          transaction as unknown as OperatorV0BootstrapDatabase,
          bootstrapRequest(),
          { enabled: true },
        );
        expectNoStore("second bootstrap", secondBootstrapResponse);
        const secondSetCookie = secondBootstrapResponse.headers.get("set-cookie");
        const secondBody = await readJson(secondBootstrapResponse);
        expect(
          secondBootstrapResponse.status === 200 && secondBody.ok === true,
          "Repeated trial demo bootstrap did not succeed",
        );
        expectNoSensitive("second bootstrap", secondBody);

        const secondCounts = await expectWorkbenchCounts(checks, secondSetCookie);
        expectStableCounts(firstCounts, secondCounts);

        const feedbackResponse = await handleV0TrialFeedbackListRoute(
          authRepository,
          trialFeedbackRepository,
          requestWithSetCookie(
            scopedInternalTrialApiUrl("/api/trial-feedback", scope),
            secondSetCookie,
          ),
        );
        expectNoStore("trial feedback compatibility", feedbackResponse);
        const feedbackBody = await readJson(feedbackResponse);
        expect(
          feedbackResponse.status === 200 &&
            feedbackBody.ok === true &&
            Array.isArray(feedbackBody.feedback) &&
            typeof feedbackBody.summary === "object",
          "Trial feedback API was not compatible with seeded demo session",
        );
        expectNoSensitive("trial feedback compatibility", feedbackBody);

        throw new ExpectedRollback();
      });
    } catch (error) {
      if (!(error instanceof ExpectedRollback)) {
        throw error;
      }
    }

    console.log("V0 trial demo data check passed; transaction rolled back.");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(
    error instanceof Error
      ? error.message
      : "Unknown V0 trial demo data check failure",
  );
  process.exitCode = 1;
});
