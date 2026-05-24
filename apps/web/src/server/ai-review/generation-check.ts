import { z } from "zod";

import {
  AiProviderError,
  isAiProviderError,
  type AiProviderJsonRequest,
  type AiProviderJsonResult,
  type AiProviderPort,
} from "../ai-provider";
import {
  generateAiReview,
  isAiReviewGenerationError,
  type AiReviewGeneratedOutputSection,
  type AiReviewGenerationInput,
} from "./generation";

type FakeProviderScenario = {
  output?: unknown;
  error?: AiProviderError;
};

type GenerationInputOverrides = Partial<
  Omit<AiReviewGenerationInput, "prompt" | "inputSnapshot" | "knowledgeSnapshot">
> & {
  prompt?: Partial<AiReviewGenerationInput["prompt"]>;
  inputSnapshot?: Partial<AiReviewGenerationInput["inputSnapshot"]>;
  knowledgeSnapshot?: Partial<AiReviewGenerationInput["knowledgeSnapshot"]>;
};

class FakeProvider implements AiProviderPort {
  readonly calls: AiProviderJsonRequest<unknown>[] = [];

  constructor(private readonly scenario: FakeProviderScenario) {}

  async generateJson<TData>(
    input: AiProviderJsonRequest<TData>,
  ): Promise<AiProviderJsonResult<TData>> {
    this.calls.push(input as AiProviderJsonRequest<unknown>);

    if (this.scenario.error) {
      throw this.scenario.error;
    }

    const output = this.scenario.output ?? createProviderOutput();
    const parsed = input.schema.safeParse(output);

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
        model: "fake-review-model",
        requestId: input.requestId,
        responseId: "fake_response_id",
        latencyMs: 3,
        tokenUsage: {
          inputTokens: 120,
          outputTokens: 220,
          totalTokens: 340,
        },
        finishReason: "stop",
        retryable: false,
      },
    };
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

    if (isAiReviewGenerationError(error) && error.code === expectedCode) {
      return error;
    }

    if (isAiProviderError(error)) {
      throw new Error(
        `${label} leaked a provider error instead of mapping ${error.code}`,
      );
    }

    throw new Error(`${label} failed with unexpected rejection`);
  }

  throw new Error(`${label} should have been rejected`);
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
      throw new Error(`${label} leaked sensitive generation data`);
    }
  }
}

function createGenerationInput(
  overrides: GenerationInputOverrides = {},
): AiReviewGenerationInput {
  const base: AiReviewGenerationInput = {
    requestId: "ai_review_generation_check_request",
    sessionId: "session_2026_05_01_premium_attack",
    requestedSections: [
      "live_recap",
      "product_diagnosis",
      "question_cluster",
      "objection_pattern",
      "talk_track_candidate",
      "short_video_topic",
      "next_session_action",
    ],
    prompt: {
      name: "AI 复盘结构化生成",
      version: "2026-05-24",
      purpose: "full_review",
      inputSchemaVersion: "session-review-input-v1",
      outputSchemaVersion: "ai-review-output-v1",
      modelPolicy: "structured review suggestions; no automatic publication",
    },
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
          relatedProductIds: ["racket_astrox_100zz"],
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
      knowledgeVersionIds: ["knowledge_version_attack_racket"],
      racketProductVersionIds: ["racket_version_astrox_100zz"],
      sourceIds: ["source_official_catalog"],
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

  return {
    ...base,
    ...overrides,
    prompt: {
      ...base.prompt,
      ...overrides.prompt,
    },
    inputSnapshot: {
      ...base.inputSnapshot,
      ...overrides.inputSnapshot,
    },
    knowledgeSnapshot: {
      ...base.knowledgeSnapshot,
      ...overrides.knowledgeSnapshot,
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

async function runSuccessCheck() {
  const provider = new FakeProvider({});
  const result = await generateAiReview({
    provider,
    input: createGenerationInput(),
  });

  if (!result.reviewReady) {
    throw new Error("successful generation should be review-ready");
  }

  if (result.output.sections.length !== 7) {
    throw new Error("generation should return all requested section types");
  }

  if (
    !result.metadata.promptFingerprint ||
    result.metadata.promptFingerprint.length < 16
  ) {
    throw new Error("generation should include a prompt fingerprint");
  }

  if (result.metadata.provider.provider !== "fake-provider") {
    throw new Error("generation should preserve safe provider metadata");
  }

  if (
    !provider.calls[0]?.messages.some((message) =>
      message.content.includes("JSON"),
    )
  ) {
    throw new Error("generation prompt should explicitly request JSON output");
  }

  assertNoSensitiveLeak(result, "successful generation result");
}

async function runInputGateChecks() {
  const blockedRedactionProvider = new FakeProvider({});
  await expectRejected(
    "blocked redaction",
    () =>
      generateAiReview({
        provider: blockedRedactionProvider,
        input: createGenerationInput({
          inputSnapshot: {
            redactionState: "blocked",
          },
        }),
      }),
    "SENSITIVE_DATA_NEEDS_REVIEW",
  );

  if (blockedRedactionProvider.calls.length !== 0) {
    throw new Error("blocked redaction should not call the provider");
  }

  const longInputProvider = new FakeProvider({});
  await expectRejected(
    "blocked long input",
    () =>
      generateAiReview({
        provider: longInputProvider,
        input: createGenerationInput({
          inputSnapshot: {
            longInputPolicy: "blocked",
          },
        }),
      }),
    "LONG_INPUT_LIMIT_EXCEEDED",
  );

  if (longInputProvider.calls.length !== 0) {
    throw new Error("blocked long input should not call the provider");
  }

  await expectRejected(
    "insufficient evidence",
    () =>
      generateAiReview({
        provider: new FakeProvider({}),
        input: createGenerationInput({
          knowledgeSnapshot: {
            knowledgeVersionIds: [],
            sourceIds: [],
          },
        }),
      }),
    "INSUFFICIENT_EVIDENCE",
  );

  await expectRejected(
    "weak session input",
    () =>
      generateAiReview({
        provider: new FakeProvider({}),
        input: createGenerationInput({
          inputSnapshot: {
            operatorSummary: "",
            questionSummaries: [],
            objectionSummaries: [],
            noteHighlights: [],
          },
        }),
      }),
    "WEAK_SESSION_INPUT",
  );
}

async function runProviderFailureChecks() {
  const failureScenarios: Array<[string, AiProviderError, string]> = [
    [
      "provider timeout",
      new AiProviderError("AI_PROVIDER_TIMEOUT", "timeout token=synthetic_secret", {
        retryable: true,
      }),
      "PROVIDER_TIMEOUT",
    ],
    [
      "provider rate limit",
      new AiProviderError("AI_PROVIDER_RATE_LIMITED", "rate limited", {
        retryable: true,
      }),
      "PROVIDER_RATE_LIMITED",
    ],
    [
      "provider refusal",
      new AiProviderError("AI_PROVIDER_REFUSAL", "model refused", {
        retryable: false,
      }),
      "MODEL_REFUSAL",
    ],
    [
      "partial output",
      new AiProviderError("PARTIAL_MODEL_OUTPUT", "partial output", {
        retryable: true,
      }),
      "PARTIAL_MODEL_OUTPUT",
    ],
    [
      "malformed provider output",
      new AiProviderError("AI_PROVIDER_MALFORMED_JSON", "malformed json", {
        retryable: true,
      }),
      "AI_OUTPUT_MALFORMED",
    ],
    [
      "schema mismatch",
      new AiProviderError("AI_PROVIDER_SCHEMA_MISMATCH", "schema mismatch", {
        retryable: true,
        details: {
          prompt: "Return one JSON object with schema details",
        },
      }),
      "AI_OUTPUT_SCHEMA_MISMATCH",
    ],
  ];

  for (const [label, error, expectedCode] of failureScenarios) {
    await expectRejected(
      label,
      () =>
        generateAiReview({
          provider: new FakeProvider({ error }),
          input: createGenerationInput(),
        }),
      expectedCode,
    );
  }
}

async function runOutputValidationChecks() {
  const sensitiveResult = await generateAiReview({
    provider: new FakeProvider({
      output: createProviderOutput([
        createProviderSection("talk_track_candidate", 1, {
          summary: "客户手机号 13800138000 出现在建议里，需要阻断。",
        }),
      ]),
    }),
    input: createGenerationInput({
      requestedSections: ["talk_track_candidate"],
    }),
  });

  if (sensitiveResult.reviewReady) {
    throw new Error("sensitive output should not be review-ready");
  }

  if (
    !sensitiveResult.validationResults.some(
      (result) =>
        result.checkType === "sensitive_data" && result.status === "blocked",
    )
  ) {
    throw new Error("sensitive output should record a blocked validation result");
  }

  const groundingResult = await generateAiReview({
    provider: new FakeProvider({
      output: createProviderOutput([
        createProviderSection("next_session_action", 1, {
          sourceRefs: [],
        }),
      ]),
    }),
    input: createGenerationInput({
      requestedSections: ["next_session_action"],
    }),
  });

  if (!groundingResult.reviewReady) {
    throw new Error("source-grounding warning should remain reviewable");
  }

  if (
    !groundingResult.validationResults.some(
      (result) =>
        result.checkType === "source_grounding" &&
        result.status === "warning",
    )
  ) {
    throw new Error("missing source refs should record a warning");
  }

  await expectRejected(
    "provider schema mismatch from fake schema validation",
    () =>
      generateAiReview({
        provider: new FakeProvider({
          output: {
            schemaVersion: "ai-review-output-v1",
            overallConfidence: "certain",
            sections: [],
          },
        }),
        input: createGenerationInput(),
      }),
    "AI_OUTPUT_SCHEMA_MISMATCH",
  );
}

async function main() {
  z.object({ sanity: z.literal("ok") }).parse({ sanity: "ok" });
  await runSuccessCheck();
  await runInputGateChecks();
  await runProviderFailureChecks();
  await runOutputValidationChecks();
  console.log("AI review generation check passed");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
