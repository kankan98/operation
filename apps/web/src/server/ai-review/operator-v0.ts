import "server-only";

import { randomUUID } from "node:crypto";

import {
  AiProviderError,
  type AiProviderJsonRequest,
  type AiProviderJsonResult,
  type AiProviderPort,
} from "../ai-provider";
import type { AuthSessionRepository } from "../auth";
import { isOperatorV0BootstrapEnabled } from "../auth/operator-v0";
import type { AiReviewRunRepositoryDatabase } from "./repository";
import { createAiReviewRunRepository } from "./repository";
import { handleAiReviewRunExecuteRoute } from "./route";

type AiReviewRouteRepository = ReturnType<typeof createAiReviewRunRepository>;

type RouteRunParams = {
  runId?: string | null;
};

type OperatorV0AiReviewRouteOptions = {
  enabled?: boolean;
};

type OperatorV0AiReviewRouteErrorBody = {
  ok: false;
  code: "OPERATOR_V0_AI_REVIEW_DISABLED";
  requestId: string;
  retryable: false;
  userMessage: string;
};

type GeneratedSection = {
  sectionType:
    | "live_recap"
    | "product_diagnosis"
    | "question_cluster"
    | "objection_pattern"
    | "talk_track_candidate"
    | "short_video_topic"
    | "next_session_action";
  title: string;
  summary: string;
  items: Array<Record<string, unknown>>;
  sourceRefs: string[];
  confidence: "medium";
};

function getRequestId(request: Request): string {
  const requestId = request.headers.get("x-request-id")?.trim();

  if (requestId) {
    return requestId;
  }

  return `operator_v0_ai_review_${randomUUID()}`;
}

function createJsonResponse(
  body: OperatorV0AiReviewRouteErrorBody,
  status: number,
): Response {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

function createSection(
  sectionType: GeneratedSection["sectionType"],
  title: string,
  summary: string,
  action: string,
): GeneratedSection {
  return {
    sectionType,
    title,
    summary,
    items: [
      {
        action,
        reviewState: "needs_human_review",
      },
    ],
    sourceRefs: [
      "operator_v0_source_review_baseline",
      "operator_v0_knowledge_review_baseline",
    ],
    confidence: "medium",
  };
}

function createLocalV0Output() {
  return {
    schemaVersion: "ai-review-output-v1",
    overallConfidence: "medium",
    evidenceSummary: {
      mode: "local_v0_fake_provider",
      inputSnapshotRefs: ["operator_summary", "questions", "objections"],
      knowledgeSnapshotRefs: [
        "operator_v0_source_review_baseline",
        "operator_v0_knowledge_review_baseline",
      ],
    },
    sections: [
      createSection(
        "live_recap",
        "本场复盘摘要",
        "本场围绕高端进攻拍的适用人群、预算异议和双打后场问题展开，后续需要把规格解释和场景推荐讲得更连续。",
        "整理主播开场、商品主推顺序和观众高频问题。",
      ),
      createSection(
        "product_diagnosis",
        "商品讲解诊断",
        "进攻优势已经被强调，但平衡点、中杆硬度和推荐磅数需要和中高级球友的力量水平一起解释。",
        "补充规格解释与打法适配的对照句。",
      ),
      createSection(
        "question_cluster",
        "观众问题聚类",
        "问题集中在双打后场能否使用、推荐磅数、预算替代和上手门槛，可以沉淀为下场固定答疑卡。",
        "把同类问题合并成复用答疑。",
      ),
      createSection(
        "objection_pattern",
        "购买异议模式",
        "预算超过预期是主要阻力，需要先解释适合人群和使用收益，再给出更易上手的替代型号。",
        "为价格异议准备分层回应。",
      ),
      createSection(
        "talk_track_candidate",
        "话术改进候选",
        "建议用“打法场景 -> 规格解释 -> 替代选择”的顺序组织话术，避免只讲进攻卖点。",
        "生成可人工编辑的话术草案。",
      ),
      createSection(
        "short_video_topic",
        "短视频选题草案",
        "可拆成“高端进攻拍适不适合双打后场”和“预算不够如何选替代拍”两个短视频主题。",
        "把高频问题转成短视频选题。",
      ),
      createSection(
        "next_session_action",
        "下场任务草案",
        "下场前补齐平衡点解释、预算替代型号和双打后场答疑，开播前让主播确认三段式讲解顺序。",
        "形成下场准备清单。",
      ),
    ],
  };
}

export function createLocalV0AiReviewFakeProvider(): AiProviderPort {
  return {
    async generateJson<TData>(
      input: AiProviderJsonRequest<TData>,
    ): Promise<AiProviderJsonResult<TData>> {
      const parsed = input.schema.safeParse(createLocalV0Output());

      if (!parsed.success) {
        throw new AiProviderError(
          "AI_PROVIDER_SCHEMA_MISMATCH",
          "Local V0 AI review output failed schema validation",
          {
            requestId: input.requestId,
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
          provider: "local-v0-fake-provider",
          providerApi: "fake-json",
          model: "operator-v0-ai-review",
          requestId: input.requestId,
          responseId: `local_v0_${randomUUID()}`,
          latencyMs: 1,
          tokenUsage: {
            inputTokens: 0,
            outputTokens: 0,
            totalTokens: 0,
          },
          finishReason: "stop",
          retryable: false,
        },
      };
    },
  };
}

export async function handleOperatorV0AiReviewExecuteRoute(
  authRepository: AuthSessionRepository | null,
  aiReviewRepository: AiReviewRouteRepository | null,
  request: Request,
  params: RouteRunParams,
  options: OperatorV0AiReviewRouteOptions = {},
): Promise<Response> {
  const enabled = options.enabled ?? isOperatorV0BootstrapEnabled();

  if (!enabled) {
    return createJsonResponse(
      {
        ok: false,
        code: "OPERATOR_V0_AI_REVIEW_DISABLED",
        requestId: getRequestId(request),
        retryable: false,
        userMessage: "本地 V0 复盘入口未开启",
      },
      404,
    );
  }

  return handleAiReviewRunExecuteRoute(
    authRepository,
    aiReviewRepository,
    createLocalV0AiReviewFakeProvider(),
    request,
    params,
  );
}

export type OperatorV0AiReviewRepositoryDatabase =
  AiReviewRunRepositoryDatabase;
