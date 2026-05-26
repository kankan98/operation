import "server-only";

import { createHash } from "node:crypto";

import { and, eq, inArray } from "drizzle-orm";

import {
  createAiReviewRunRepository,
  type AiReviewRunRepositoryDatabase,
} from "../ai-review/repository";
import { executeAiReviewRun } from "../ai-review/execution";
import { createLocalV0AiReviewFakeProvider } from "../ai-review/operator-v0";
import type { DatabaseClient } from "../db/client";
import type { DataAccessContext } from "../db/context";
import {
  aiReviewPromptVersions,
  aiReviewRuns,
  extractedKnowledgeClaims,
  knowledgeSources,
  liveSessionCaptures,
  nextSessionTasks,
  publishedKnowledgeVersions,
  racketProductSources,
  racketProducts,
  talkTrackAssets,
  teamKnowledgeNotes,
  type AiReviewPromptVersionRecord,
  type AiReviewRunRecord,
  type ExtractedKnowledgeClaimRecord,
  type KnowledgeSourceRecord,
  type LiveSessionCaptureRecord,
  type NextSessionTaskRecord,
  type PublishedKnowledgeVersionRecord,
  type RacketProductRecord,
  type RacketProductSourceRecord,
  type TalkTrackAssetRecord,
  type TeamKnowledgeNoteRecord,
} from "../db/schema";
import {
  createKnowledgeLifecycleRepository,
  type KnowledgeLifecycleRepositoryDatabase,
} from "../knowledge/repository";
import {
  createNextSessionTaskRepository,
  type NextSessionTaskRepositoryDatabase,
} from "../next-actions/repository";
import {
  createRacketProductRepository,
  type RacketProductRepositoryDatabase,
} from "../rackets/repository";
import {
  createSessionCaptureRepository,
  type SessionCaptureRepositoryDatabase,
  type SessionCaptureView,
} from "../sessions/repository";
import {
  createTalkTrackAssetRepository,
  type TalkTrackAssetRepositoryDatabase,
} from "../talk-tracks/repository";
import type { AuthPermission } from "./types";

export type V0TrialDemoDataDatabase = Pick<
  DatabaseClient,
  "insert" | "select" | "update"
>;

export type V0TrialDemoDataScope = {
  actorId: string;
  teamId: string;
  tenantId: string;
};

const demoRequestId = "operator_v0_trial_demo_seed";
const demoSessionTitle = "V0 演示样例｜高端进攻拍直播复盘";
const demoSessionDate = new Date("2026-05-24T12:00:00.000Z");
const demoProductModel = "V0-DEMO-ATTACK-900";
const demoKnowledgeTitle = "V0 演示资料｜进攻拍规格与适用人群";
const demoKnowledgeKey = "v0-demo-attack-racket-fit";
const demoTalkTrackTitle = "V0 演示话术｜高端进攻拍预算异议回应";
const demoTaskTitle = "V0 演示任务｜补齐预算替代与双打后场答疑";
const demoRetrievedAt = new Date("2026-05-24T08:00:00.000Z");
const demoPromptName = "V0 演示 AI 复盘结构化输出";
const demoPromptVersion = "2026-05-27-demo-data";

const demoPermissions: AuthPermission[] = [
  "read_workspace",
  "capture_session",
  "run_ai_review",
  "manage_talk_tracks",
  "manage_next_tasks",
  "manage_products",
  "review_knowledge",
];

const requestedReviewSections = [
  "live_recap",
  "product_diagnosis",
  "question_cluster",
  "objection_pattern",
  "talk_track_candidate",
  "short_video_topic",
  "next_session_action",
] as const;

type DemoRacketSeed = {
  productId: string;
  productVersionId: string;
  sourceId: string;
};

type DemoKnowledgeSeed = {
  claimId: string;
  noteId: string;
  sourceId: string;
  versionId: string;
};

type DemoAiReviewSeed = {
  nextActionSectionId: string;
  promptVersionId: string;
  runId: string;
  talkTrackSectionId: string;
};

function demoContext(scope: V0TrialDemoDataScope): DataAccessContext {
  return {
    requestId: demoRequestId,
    actorId: scope.actorId,
    tenantId: scope.tenantId,
    teamId: scope.teamId,
    role: "operator",
    permissions: demoPermissions,
  };
}

function normalizeLookupValue(value: string): string {
  return value.trim().toLocaleLowerCase().replace(/[\s_-]+/g, "");
}

function normalizeSourceIdentity(value: string): string {
  return value.trim().toLocaleLowerCase().replace(/\/+$/g, "");
}

function hashPayload(payload: unknown): string {
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

function normalizeIdList(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort();
}

function sessionLabelKey(title: string, sessionDate: Date): string {
  return `${sessionDate.toISOString().slice(0, 10)}:${normalizeLookupValue(title)}`;
}

function racketSourceKey(input: {
  sourceType: "team_note";
  title: string;
  url: string;
}): string {
  const sourceIdentity = input.url.length > 0 ? input.url : input.title;
  const digest = createHash("sha256")
    .update(`${input.sourceType}:${normalizeSourceIdentity(sourceIdentity)}`)
    .digest("hex");

  return `${input.sourceType}:${digest}`;
}

function knowledgeSourceKey(input: {
  owner: string;
  sourceType: "team_note";
  title: string;
  url: string;
}): string {
  const sourceIdentity =
    input.url.length > 0 ? input.url : `${input.owner}:${input.title}`;
  const digest = createHash("sha256")
    .update(`${input.sourceType}:${normalizeSourceIdentity(sourceIdentity)}`)
    .digest("hex");

  return `${input.sourceType}:${digest}`;
}

function talkTrackScenarioFingerprint(input: {
  hostRole: "host";
  liveScene: "objection_handling";
  objectionType: "price";
  playerLevel: "advanced";
  playStyle: "attack";
  priceBand: "premium";
  racketProductIds: string[];
  usageConstraints: string[];
}): string {
  return hashPayload({
    racketProductIds: normalizeIdList(input.racketProductIds),
    playerLevel: input.playerLevel,
    playStyle: input.playStyle,
    priceBand: input.priceBand,
    liveScene: input.liveScene,
    hostRole: input.hostRole,
    objectionType: input.objectionType,
    usageConstraints: normalizeIdList(input.usageConstraints),
  });
}

function nextTaskDuplicateFingerprint(input: {
  ownerId: string;
  relatedRacketProductIds: string[];
  sourceId: string;
  sourceSectionId: string;
  sourceWorkflow: "ai_review";
  targetSessionId: string;
  taskType: "fix_talk_track";
}): string {
  return hashPayload({
    sourceWorkflow: input.sourceWorkflow,
    sourceId: input.sourceId,
    sourceSectionId: input.sourceSectionId,
    taskType: input.taskType,
    ownerId: input.ownerId,
    targetSessionId: input.targetSessionId,
    relatedRacketProductIds: normalizeIdList(input.relatedRacketProductIds),
  });
}

async function findDemoRacketProduct(
  database: V0TrialDemoDataDatabase,
  context: DataAccessContext,
): Promise<RacketProductRecord | null> {
  const [product] = await database
    .select()
    .from(racketProducts)
    .where(
      and(
        eq(racketProducts.tenantId, context.tenantId),
        eq(racketProducts.teamId, context.teamId),
        eq(racketProducts.normalizedModel, normalizeLookupValue(demoProductModel)),
      ),
    )
    .limit(1);

  return product ?? null;
}

async function findDemoRacketSource(
  database: V0TrialDemoDataDatabase,
  context: DataAccessContext,
  productId: string,
): Promise<RacketProductSourceRecord | null> {
  const [source] = await database
    .select()
    .from(racketProductSources)
    .where(
      and(
        eq(racketProductSources.tenantId, context.tenantId),
        eq(racketProductSources.teamId, context.teamId),
        eq(racketProductSources.productId, productId),
        eq(
          racketProductSources.normalizedSourceKey,
          racketSourceKey({
            sourceType: "team_note",
            title: "V0 演示来源｜进攻拍规格确认",
            url: "",
          }),
        ),
      ),
    )
    .limit(1);

  return source ?? null;
}

async function ensureDemoRacketProduct(
  database: V0TrialDemoDataDatabase,
  context: DataAccessContext,
): Promise<DemoRacketSeed> {
  const repository = createRacketProductRepository(
    database as RacketProductRepositoryDatabase,
  );
  let product = await findDemoRacketProduct(database, context);

  if (!product) {
    await repository.createRacketProduct(context, {
      brand: "V0 演示品牌",
      series: "攻防演示系列",
      model: demoProductModel,
      aliases: [
        {
          alias: "演示进攻 900",
          aliasType: "live_spoken",
          confidence: "high",
        },
      ],
      specs: {
        weightClasses: ["4U"],
        balancePoint: "约 300mm",
        balanceType: "head_heavy",
        shaftStiffness: "偏硬",
        recommendedTension: "24-28 磅",
      },
      positioning: {
        playerLevels: ["中高级", "力量基础较好"],
        playStyles: ["后场进攻", "双打后场"],
        priceBand: "高端演示档",
        sellingFocus: ["下压连贯", "后场借力", "进攻落点压迫"],
        limitations: ["新手需要先降低磅数", "连续防守时要说明上手门槛"],
      },
      sourceIds: [],
    });
    product = await findDemoRacketProduct(database, context);
  }

  if (!product) {
    throw new Error("V0 demo racket product was not created");
  }

  let source = await findDemoRacketSource(database, context, product.id);

  if (!source) {
    await repository.registerRacketSource(context, {
      productId: product.id,
      sourceType: "team_note",
      title: "V0 演示来源｜进攻拍规格确认",
      url: "",
      retrievedAt: demoRetrievedAt,
      trustLevel: "team",
      refreshPolicy: "manual",
    });
    source = await findDemoRacketSource(database, context, product.id);
  }

  if (!source) {
    throw new Error("V0 demo racket source was not created");
  }

  if (source.reviewState !== "approved") {
    await repository.recordRacketReviewDecision(context, {
      productId: product.id,
      targetType: "source",
      targetId: source.id,
      decision: "approve",
      reason: "V0 演示资料已脱敏，仅用于内部试用。",
    });
    source = await findDemoRacketSource(database, context, product.id);
  }

  product = await findDemoRacketProduct(database, context);

  if (product && ["draft", "needs_source"].includes(product.status)) {
    await repository.submitRacketProductForReview(context, {
      productId: product.id,
    });
    product = await findDemoRacketProduct(database, context);
  }

  if (product?.status === "reviewing") {
    await repository.recordRacketReviewDecision(context, {
      productId: product.id,
      targetType: "product",
      targetId: product.id,
      decision: "approve",
      reason: "V0 演示球拍规格完整，适合内部试用路径。",
    });
    product = await findDemoRacketProduct(database, context);
  }

  if (product?.status === "approved") {
    await repository.publishRacketProduct(context, {
      productId: product.id,
      changeReason: "发布 V0 演示球拍，支撑试用复盘路径。",
    });
    product = await findDemoRacketProduct(database, context);
  }

  if (!product || !source) {
    throw new Error("V0 demo racket product seed is incomplete");
  }

  return {
    productId: product.id,
    productVersionId: product.publishedVersionId || product.id,
    sourceId: source.id,
  };
}

async function findDemoSession(
  database: V0TrialDemoDataDatabase,
  context: DataAccessContext,
): Promise<LiveSessionCaptureRecord | null> {
  const [session] = await database
    .select()
    .from(liveSessionCaptures)
    .where(
      and(
        eq(liveSessionCaptures.tenantId, context.tenantId),
        eq(liveSessionCaptures.teamId, context.teamId),
        eq(
          liveSessionCaptures.sessionLabelKey,
          sessionLabelKey(demoSessionTitle, demoSessionDate),
        ),
      ),
    )
    .limit(1);

  return session ?? null;
}

async function ensureDemoSession(
  database: V0TrialDemoDataDatabase,
  context: DataAccessContext,
  racket: DemoRacketSeed,
): Promise<SessionCaptureView> {
  const repository = createSessionCaptureRepository(
    database as SessionCaptureRepositoryDatabase,
  );
  let session = await findDemoSession(database, context);

  if (!session) {
    const created = await repository.createSessionCapture(context, {
      title: demoSessionTitle,
      sessionDate: demoSessionDate,
      platform: "douyin",
      sourceMode: "manual",
      summary:
        "本场演示围绕高端进攻拍的适用人群、后场下压、预算异议和双打后场问题做复盘，所有内容均为脱敏样例。",
      sensitiveRedactionState: "not_needed",
      hostRoles: [
        {
          displayName: "演示主播",
          role: "host",
          responsibility: "讲解高端进攻拍定位和适合人群",
        },
        {
          displayName: "V0 运营",
          role: "operator",
          responsibility: "记录高频问题、异议和下场动作",
        },
      ],
      productOrder: [
        {
          racketProductId: racket.productId,
          displayModel: demoProductModel,
          orderIndex: 1,
          roleInSession: "main_offer",
          talkingPoints: ["4U", "约 300mm 平衡点", "偏硬中杆", "24-28 磅"],
          customerFit: ["中高级进攻型", "双打后场", "力量基础较好"],
          evidenceState: "linked_product",
        },
      ],
      notes: [
        {
          noteType: "opening",
          content: "开场先说明演示样例主打后场进攻，不承诺适合所有新手。",
          source: "operator_summary",
          sequence: 1,
          reviewState: "reviewed",
        },
        {
          noteType: "gap",
          content: "预算替代型号和双打后场答疑还需要整理成固定话术。",
          source: "operator_summary",
          sequence: 2,
          reviewState: "reviewed",
        },
      ],
      customerQuestions: [
        {
          questionText: "中高级球友打双打后场，4U 进攻拍会不会太难借力？",
          topic: "fit",
          relatedProductIds: [racket.productId],
          answerGiven: "先确认力量基础，再解释偏硬中杆和较高平衡点的取舍。",
          needsKnowledge: true,
          sensitiveRedactionState: "not_needed",
        },
        {
          questionText: "推荐磅数怎么和偏硬中杆一起解释？",
          topic: "tension",
          relatedProductIds: [racket.productId],
          answerGiven: "建议用 24-28 磅区间说明控制和弹性的区别。",
          needsKnowledge: false,
          sensitiveRedactionState: "not_needed",
        },
      ],
      customerObjections: [
        {
          objectionType: "price",
          content: "预算偏紧，担心高端进攻拍上手成本太高。",
          responseUsed: "先解释适合人群，再给出更易上手的替代选择。",
          resolvedState: "partially_resolved",
          followUpNeeded: true,
        },
      ],
    });
    session = await findDemoSession(database, context);

    if (!session) {
      throw new Error("V0 demo session was not created");
    }

    return repository.submitSessionCapture(context, {
      sessionId: created.id,
      draftVersion: created.draftVersion,
    });
  }

  const detail = await repository.getSessionCaptureDetail(context, {
    sessionId: session.id,
  });

  if (["draft", "autosaved", "submitted"].includes(detail.status)) {
    return repository.submitSessionCapture(context, {
      sessionId: detail.id,
      draftVersion: detail.draftVersion,
    });
  }

  return detail;
}

async function findDemoKnowledgeSource(
  database: V0TrialDemoDataDatabase,
  context: DataAccessContext,
): Promise<KnowledgeSourceRecord | null> {
  const [source] = await database
    .select()
    .from(knowledgeSources)
    .where(
      and(
        eq(knowledgeSources.tenantId, context.tenantId),
        eq(knowledgeSources.teamId, context.teamId),
        eq(
          knowledgeSources.normalizedSourceKey,
          knowledgeSourceKey({
            sourceType: "team_note",
            owner: "V0 演示团队",
            title: demoKnowledgeTitle,
            url: "",
          }),
        ),
      ),
    )
    .limit(1);

  return source ?? null;
}

async function findDemoKnowledgeClaim(
  database: V0TrialDemoDataDatabase,
  context: DataAccessContext,
  sourceId: string,
): Promise<ExtractedKnowledgeClaimRecord | null> {
  const [claim] = await database
    .select()
    .from(extractedKnowledgeClaims)
    .where(
      and(
        eq(extractedKnowledgeClaims.tenantId, context.tenantId),
        eq(extractedKnowledgeClaims.teamId, context.teamId),
        eq(extractedKnowledgeClaims.sourceId, sourceId),
        eq(extractedKnowledgeClaims.knowledgeKey, demoKnowledgeKey),
      ),
    )
    .limit(1);

  return claim ?? null;
}

async function findDemoKnowledgeNote(
  database: V0TrialDemoDataDatabase,
  context: DataAccessContext,
): Promise<TeamKnowledgeNoteRecord | null> {
  const [note] = await database
    .select()
    .from(teamKnowledgeNotes)
    .where(
      and(
        eq(teamKnowledgeNotes.tenantId, context.tenantId),
        eq(teamKnowledgeNotes.teamId, context.teamId),
        eq(teamKnowledgeNotes.knowledgeKey, demoKnowledgeKey),
      ),
    )
    .limit(1);

  return note ?? null;
}

async function findDemoKnowledgeVersion(
  database: V0TrialDemoDataDatabase,
  context: DataAccessContext,
): Promise<PublishedKnowledgeVersionRecord | null> {
  const [version] = await database
    .select()
    .from(publishedKnowledgeVersions)
    .where(
      and(
        eq(publishedKnowledgeVersions.tenantId, context.tenantId),
        eq(publishedKnowledgeVersions.teamId, context.teamId),
        eq(publishedKnowledgeVersions.knowledgeKey, demoKnowledgeKey),
        eq(publishedKnowledgeVersions.status, "published"),
      ),
    )
    .limit(1);

  return version ?? null;
}

async function ensureDemoKnowledge(
  database: V0TrialDemoDataDatabase,
  context: DataAccessContext,
): Promise<DemoKnowledgeSeed> {
  const repository = createKnowledgeLifecycleRepository(
    database as KnowledgeLifecycleRepositoryDatabase,
  );
  let source = await findDemoKnowledgeSource(database, context);

  if (!source) {
    await repository.registerKnowledgeSource(context, {
      sourceType: "team_note",
      title: demoKnowledgeTitle,
      owner: "V0 演示团队",
      url: "",
      retrievedAt: demoRetrievedAt,
      trustLevel: "team",
      refreshCadence: "manual",
      intendedUse: ["ai_review", "talk_tracks", "next_actions"],
    });
    source = await findDemoKnowledgeSource(database, context);
  }

  if (!source) {
    throw new Error("V0 demo knowledge source was not created");
  }

  let claim = await findDemoKnowledgeClaim(database, context, source.id);

  if (!claim) {
    await repository.addExtractedKnowledgeClaim(context, {
      sourceId: source.id,
      claimType: "racket_spec",
      subject: demoProductModel,
      knowledgeKey: demoKnowledgeKey,
      claimText:
        "V0-DEMO-ATTACK-900 为 4U、约 300mm 平衡点、偏硬中杆的演示进攻拍，推荐 24-28 磅，适合中高级进攻型和双打后场演示讲解。",
      language: "mixed",
      confidence: "medium",
      extractionMethod: "manual",
    });
    claim = await findDemoKnowledgeClaim(database, context, source.id);
  }

  let note = await findDemoKnowledgeNote(database, context);

  if (!note) {
    await repository.addTeamKnowledgeNote(context, {
      noteType: "talk_track",
      knowledgeKey: demoKnowledgeKey,
      content:
        "讲解时按“打法场景 -> 规格解释 -> 上手门槛 -> 替代选择”组织，避免只强调进攻卖点。",
      sensitiveLevel: "internal",
      sourceIds: [source.id],
    });
    note = await findDemoKnowledgeNote(database, context);
  }

  if (!claim || !note) {
    throw new Error("V0 demo knowledge content was not created");
  }

  if (source.reviewState !== "approved") {
    await repository.recordKnowledgeReviewDecision(context, {
      targetType: "source",
      targetId: source.id,
      decision: "approve",
      reason: "V0 演示资料已脱敏，可用于内部试用。",
    });
    source = await findDemoKnowledgeSource(database, context);
  }

  if (!source) {
    throw new Error("V0 demo knowledge source approval did not persist");
  }

  if (claim.reviewState !== "approved") {
    await repository.recordKnowledgeReviewDecision(context, {
      targetType: "claim",
      targetId: claim.id,
      decision: "approve",
      reason: "演示规格 claim 可用于 V0 复盘样例。",
    });
    claim = await findDemoKnowledgeClaim(database, context, source.id);
  }

  if (note.reviewState !== "approved") {
    await repository.recordKnowledgeReviewDecision(context, {
      targetType: "team_note",
      targetId: note.id,
      decision: "approve",
      reason: "演示话术笔记可用于 V0 试用路径。",
    });
    note = await findDemoKnowledgeNote(database, context);
  }

  let version = await findDemoKnowledgeVersion(database, context);

  if (!version && claim && note && source) {
    await repository.publishKnowledgeVersion(context, {
      knowledgeKey: demoKnowledgeKey,
      claimIds: [claim.id],
      teamNoteIds: [note.id],
      sourceIds: [source.id],
      summary:
        "V0 演示知识版本：高端进攻拍规格、适用人群和预算异议讲解顺序，供内部试用复盘引用。",
    });
    version = await findDemoKnowledgeVersion(database, context);
  }

  if (!source || !claim || !note || !version) {
    throw new Error("V0 demo knowledge seed is incomplete");
  }

  return {
    sourceId: source.id,
    claimId: claim.id,
    noteId: note.id,
    versionId: version.id,
  };
}

async function ensureDemoPromptVersion(
  database: V0TrialDemoDataDatabase,
  context: DataAccessContext,
): Promise<AiReviewPromptVersionRecord> {
  const [existing] = await database
    .select()
    .from(aiReviewPromptVersions)
    .where(
      and(
        eq(aiReviewPromptVersions.tenantId, context.tenantId),
        eq(aiReviewPromptVersions.teamId, context.teamId),
        eq(aiReviewPromptVersions.name, demoPromptName),
        eq(aiReviewPromptVersions.version, demoPromptVersion),
        eq(aiReviewPromptVersions.purpose, "full_review"),
      ),
    )
    .limit(1);

  if (existing) {
    if (existing.status !== "active" && existing.status !== "reviewed") {
      const [updated] = await database
        .update(aiReviewPromptVersions)
        .set({
          status: "active",
          reviewedBy: context.actorId,
          reviewedAt: new Date(),
          updatedBy: context.actorId,
          updatedAt: new Date(),
        })
        .where(eq(aiReviewPromptVersions.id, existing.id))
        .returning();

      return updated;
    }

    return existing;
  }

  const repository = createAiReviewRunRepository(
    database as AiReviewRunRepositoryDatabase,
  );

  return repository.createPromptVersion(context, {
    name: demoPromptName,
    version: demoPromptVersion,
    purpose: "full_review",
    inputSchemaVersion: "session-review-input-v1",
    outputSchemaVersion: "ai-review-output-v1",
    modelPolicy: "local V0 fake-provider structured output policy",
    status: "active",
  });
}

async function findReusableAiReviewRun(
  database: V0TrialDemoDataDatabase,
  context: DataAccessContext,
  sessionId: string,
): Promise<AiReviewRunRecord | null> {
  const [run] = await database
    .select()
    .from(aiReviewRuns)
    .where(
      and(
        eq(aiReviewRuns.tenantId, context.tenantId),
        eq(aiReviewRuns.teamId, context.teamId),
        eq(aiReviewRuns.sessionId, sessionId),
        inArray(aiReviewRuns.status, [
          "review_ready",
          "reviewing",
          "accepted",
          "partially_accepted",
          "downstream_ready",
        ]),
      ),
    )
    .limit(1);

  return run ?? null;
}

async function acceptDemoAiReviewSections(input: {
  context: DataAccessContext;
  database: V0TrialDemoDataDatabase;
  repository: ReturnType<typeof createAiReviewRunRepository>;
  runId: string;
}): Promise<DemoAiReviewSeed> {
  let detail = await input.repository.getRun(input.context, {
    runId: input.runId,
  });
  const talkTrackSection = detail.sections.find(
    (section) => section.sectionType === "talk_track_candidate",
  );
  const nextActionSection = detail.sections.find(
    (section) => section.sectionType === "next_session_action",
  );

  if (!talkTrackSection || !nextActionSection) {
    throw new Error("V0 demo AI review sections were not created");
  }

  for (const section of [talkTrackSection, nextActionSection]) {
    if (section.reviewState === "pending") {
      await input.repository.recordDecision(input.context, {
        runId: input.runId,
        targetType: "section",
        targetId: section.id,
        decision: "accept",
        reason: "V0 演示区块已人工确认，可用于下游草稿。",
      });
    }
  }

  detail = await input.repository.getRun(input.context, {
    runId: input.runId,
  });

  for (const section of [talkTrackSection, nextActionSection]) {
    const artifactType =
      section.sectionType === "talk_track_candidate"
        ? "talk_track"
        : "next_session_task";
    const exists = detail.downstreamArtifacts.some(
      (artifact) =>
        artifact.sectionId === section.id &&
        artifact.artifactType === artifactType,
    );

    if (!exists) {
      await input.repository.createDownstreamArtifact(input.context, {
        runId: input.runId,
        sectionId: section.id,
        artifactType,
        status: "draft",
      });
    }
  }

  const [run] = await input.database
    .select()
    .from(aiReviewRuns)
    .where(eq(aiReviewRuns.id, input.runId))
    .limit(1);

  if (!run?.promptVersionId) {
    throw new Error("V0 demo AI review prompt metadata is incomplete");
  }

  return {
    runId: input.runId,
    promptVersionId: run.promptVersionId,
    talkTrackSectionId: talkTrackSection.id,
    nextActionSectionId: nextActionSection.id,
  };
}

async function ensureDemoAiReview(input: {
  context: DataAccessContext;
  database: V0TrialDemoDataDatabase;
  knowledge: DemoKnowledgeSeed;
  racket: DemoRacketSeed;
  session: SessionCaptureView;
}): Promise<DemoAiReviewSeed> {
  const repository = createAiReviewRunRepository(
    input.database as AiReviewRunRepositoryDatabase,
  );
  const promptVersion = await ensureDemoPromptVersion(
    input.database,
    input.context,
  );
  const existingRun = await findReusableAiReviewRun(
    input.database,
    input.context,
    input.session.id,
  );

  if (existingRun) {
    return acceptDemoAiReviewSections({
      context: input.context,
      database: input.database,
      repository,
      runId: existingRun.id,
    });
  }

  const run = await repository.prepareRun(input.context, {
    sessionId: input.session.id,
    runType: "initial_review",
    requestedSections: [...requestedReviewSections],
    inputSnapshot: {
      sessionStatus: input.session.status,
      title: input.session.title,
      sessionDate: input.session.sessionDate,
      platform: input.session.platform,
      hostRoles: input.session.hostRoles.map((host) => ({
        id: host.id,
        displayName: host.displayName,
        role: host.role,
        responsibility: host.responsibility,
      })),
      productOrder: input.session.productOrder.map((product) => ({
        id: product.id,
        displayModel: product.displayModel,
        orderIndex: product.orderIndex,
        roleInSession: product.roleInSession,
        talkingPoints: product.talkingPoints,
        customerFit: product.customerFit,
        evidenceState: product.evidenceState,
      })),
      operatorSummary: input.session.summary,
      questionSummaries: input.session.customerQuestions.map((question) => ({
        id: question.id,
        topic: question.topic,
        questionText: question.questionText,
        answerGiven: question.answerGiven,
        needsKnowledge: question.needsKnowledge,
      })),
      objectionSummaries: input.session.customerObjections.map((objection) => ({
        id: objection.id,
        objectionType: objection.objectionType,
        content: objection.content,
        responseUsed: objection.responseUsed,
        resolvedState: objection.resolvedState,
        followUpNeeded: objection.followUpNeeded,
      })),
      noteHighlights: input.session.notes.map((note) => ({
        id: note.id,
        noteType: note.noteType,
        content: note.content,
        source: note.source,
        reviewState: note.reviewState,
      })),
      redactionState: "not_needed",
      longInputPolicy: "within_limit",
    },
    knowledgeSnapshot: {
      knowledgeVersionIds: [input.knowledge.versionId],
      racketProductVersionIds: [input.racket.productVersionId],
      sourceIds: [input.knowledge.sourceId, input.racket.sourceId],
      trustSummary: {
        mode: "local_v0_demo",
        source: demoKnowledgeTitle,
      },
      conflictState: "none",
      freshnessState: "current",
      reviewState: "published_only",
      intendedUse: [...requestedReviewSections],
    },
  });

  await executeAiReviewRun({
    context: input.context,
    repository,
    provider: createLocalV0AiReviewFakeProvider(),
    runId: run.id,
    promptVersionId: promptVersion.id,
    providerPolicy: {
      provider: "local-v0-fake-provider",
      providerApi: "fake-json",
      model: "operator-v0-ai-review",
      structuredOutputRequired: true,
    },
    requestId: demoRequestId,
    maxTokens: 1200,
    temperature: 0.2,
  });

  return acceptDemoAiReviewSections({
    context: input.context,
    database: input.database,
    repository,
    runId: run.id,
  });
}

async function findDemoTalkTrack(
  database: V0TrialDemoDataDatabase,
  context: DataAccessContext,
  scenarioFingerprint: string,
): Promise<TalkTrackAssetRecord | null> {
  const [asset] = await database
    .select()
    .from(talkTrackAssets)
    .where(
      and(
        eq(talkTrackAssets.tenantId, context.tenantId),
        eq(talkTrackAssets.teamId, context.teamId),
        eq(talkTrackAssets.assetType, "objection_reply"),
        eq(talkTrackAssets.scenarioFingerprint, scenarioFingerprint),
        inArray(talkTrackAssets.status, ["draft", "reviewing", "published"]),
      ),
    )
    .limit(1);

  return asset ?? null;
}

async function ensureDemoTalkTrack(input: {
  aiReview: DemoAiReviewSeed;
  context: DataAccessContext;
  database: V0TrialDemoDataDatabase;
  knowledge: DemoKnowledgeSeed;
  racket: DemoRacketSeed;
}): Promise<TalkTrackAssetRecord> {
  const scenario: {
    hostRole: "host";
    liveScene: "objection_handling";
    objectionType: "price";
    playerLevel: "advanced";
    playStyle: "attack";
    priceBand: "premium";
    racketProductIds: string[];
    usageConstraints: string[];
  } = {
    racketProductIds: [input.racket.productId],
    playerLevel: "advanced",
    playStyle: "attack",
    priceBand: "premium",
    liveScene: "objection_handling",
    hostRole: "host",
    objectionType: "price",
    usageConstraints: ["V0 演示样例", "仅用于脱敏试用"],
  };
  const fingerprint = talkTrackScenarioFingerprint(scenario);
  const existing = await findDemoTalkTrack(
    input.database,
    input.context,
    fingerprint,
  );

  if (existing) {
    return existing;
  }

  const repository = createTalkTrackAssetRepository(
    input.database as TalkTrackAssetRepositoryDatabase,
  );
  await repository.createAsset(input.context, {
    asset: {
      assetType: "objection_reply",
      title: demoTalkTrackTitle,
      ownerRole: "operator",
    },
    version: {
      body:
        "如果预算偏紧，先确认打法和力量基础：这支演示进攻拍更适合中高级后场进攻。再解释 4U、约 300mm 平衡点和偏硬中杆带来的下压优势，最后给出更易上手的替代选择，避免直接催促下单。",
      tone: "professional",
      language: "zh_CN",
    },
    scenario,
    segments: [
      {
        segmentType: "hook",
        text: "预算先别急，我们先看你是不是这支进攻拍的适合人群。",
        requiredEvidence: false,
      },
      {
        segmentType: "product_fact",
        text: "4U、约 300mm 平衡点、偏硬中杆，优势在后场下压和连续进攻。",
        requiredEvidence: true,
      },
      {
        segmentType: "objection_reply",
        text: "如果力量基础还在建立，可以先选更容易借力的替代拍，再逐步过渡。",
        requiredEvidence: true,
      },
    ],
    sourceGrounding: {
      sourceType: "ai_review_run",
      sourceIds: [input.aiReview.runId],
      knowledgeVersionIds: [input.knowledge.versionId],
      racketProductIds: [input.racket.productId],
      aiRunId: input.aiReview.runId,
      freshnessState: "current",
      conflictState: "none",
      sensitiveRedactionState: "not_needed",
      claimSummary: "V0 演示复盘建议与已审核演示知识共同支撑该预算异议话术。",
    },
    objectionPattern: {
      objectionType: "price",
      customerQuestionExample: "预算偏紧，高端进攻拍会不会不适合我？",
      replyStrategy: "recommend_alternative",
      riskLevel: "low",
    },
  });

  const created = await findDemoTalkTrack(
    input.database,
    input.context,
    fingerprint,
  );

  if (!created) {
    throw new Error("V0 demo talk-track asset was not created");
  }

  return created;
}

async function findDemoNextTask(
  database: V0TrialDemoDataDatabase,
  context: DataAccessContext,
  duplicateFingerprint: string,
): Promise<NextSessionTaskRecord | null> {
  const [task] = await database
    .select()
    .from(nextSessionTasks)
    .where(
      and(
        eq(nextSessionTasks.tenantId, context.tenantId),
        eq(nextSessionTasks.teamId, context.teamId),
        eq(nextSessionTasks.duplicateFingerprint, duplicateFingerprint),
        inArray(nextSessionTasks.status, [
          "draft",
          "assigned",
          "in_progress",
          "blocked",
          "done",
          "reviewing",
          "closed",
          "reopened",
        ]),
      ),
    )
    .limit(1);

  return task ?? null;
}

async function ensureDemoNextTask(input: {
  aiReview: DemoAiReviewSeed;
  context: DataAccessContext;
  database: V0TrialDemoDataDatabase;
  racket: DemoRacketSeed;
  session: SessionCaptureView;
  talkTrack: TalkTrackAssetRecord;
}): Promise<NextSessionTaskRecord> {
  const fingerprint = nextTaskDuplicateFingerprint({
    sourceWorkflow: "ai_review",
    sourceId: input.aiReview.runId,
    sourceSectionId: input.aiReview.nextActionSectionId,
    taskType: "fix_talk_track",
    ownerId: input.context.actorId,
    targetSessionId: input.session.id,
    relatedRacketProductIds: [input.racket.productId],
  });
  const existing = await findDemoNextTask(
    input.database,
    input.context,
    fingerprint,
  );

  if (existing) {
    return existing;
  }

  const repository = createNextSessionTaskRepository(
    input.database as NextSessionTaskRepositoryDatabase,
  );
  await repository.createNextSessionTask(input.context, {
    task: {
      title: demoTaskTitle,
      summary:
        "下场前补齐预算替代、推荐磅数解释和双打后场答疑，并让主播按三段式顺序试讲。",
      taskType: "fix_talk_track",
      priority: "high",
      ownerId: input.context.actorId,
      targetSessionId: input.session.id,
      deadlinePolicy: "before_next_session",
      reviewRequired: false,
      relatedRacketProductIds: [input.racket.productId],
    },
    source: {
      sourceWorkflow: "ai_review",
      sourceId: input.aiReview.runId,
      sourceVersionId: input.aiReview.promptVersionId,
      sourceSectionId: input.aiReview.nextActionSectionId,
      aiRunId: input.aiReview.runId,
      promptVersion: demoPromptVersion,
      sourceState: "accepted",
      knowledgeVersionIds: [],
      racketProductIds: [input.racket.productId],
      talkTrackAssetIds: [input.talkTrack.id],
      sensitiveRedactionState: "not_needed",
    },
    checklist: [
      {
        title: "整理预算替代型号的对比口径",
        required: true,
      },
      {
        title: "补一段双打后场适用人群答疑",
        required: true,
      },
      {
        title: "让主播开播前按三段式顺序试讲",
        required: false,
      },
    ],
  });

  const created = await findDemoNextTask(
    input.database,
    input.context,
    fingerprint,
  );

  if (!created) {
    throw new Error("V0 demo next-session task was not created");
  }

  return created;
}

export async function ensureV0TrialDemoData(
  database: V0TrialDemoDataDatabase,
  scope: V0TrialDemoDataScope,
): Promise<void> {
  const context = demoContext(scope);
  const racket = await ensureDemoRacketProduct(database, context);
  const session = await ensureDemoSession(database, context, racket);
  const knowledge = await ensureDemoKnowledge(database, context);
  const aiReview = await ensureDemoAiReview({
    context,
    database,
    session,
    racket,
    knowledge,
  });
  const talkTrack = await ensureDemoTalkTrack({
    context,
    database,
    racket,
    knowledge,
    aiReview,
  });
  await ensureDemoNextTask({
    context,
    database,
    session,
    racket,
    aiReview,
    talkTrack,
  });
}
