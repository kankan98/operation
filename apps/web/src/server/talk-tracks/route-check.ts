import { createDatabaseConnection } from "../db/client";
import {
  appUsers,
  authSessions,
  teamMemberships,
  teams,
  tenantMemberships,
  tenants,
} from "../db/schema";
import {
  authSessionCookieName,
  createAuthSessionReference,
  createAuthSessionRepository,
  hashAuthSessionReference,
  type AuthSessionRepositoryDatabase,
} from "../auth";
import {
  createTalkTrackAssetRepository,
  type CreateTalkTrackAssetInput,
  type TalkTrackAssetRepositoryDatabase,
} from "./repository";
import {
  handleTalkTrackAssetArchiveRoute,
  handleTalkTrackAssetDetailRoute,
  handleTalkTrackAssetPublishRoute,
  handleTalkTrackAssetRestoreRoute,
  handleTalkTrackAssetSubmitRoute,
  handleTalkTrackAssetsCreateRoute,
  handleTalkTrackAssetsListRoute,
  handleTalkTrackCandidateReviewRoute,
  handleTalkTrackCandidatesCreateRoute,
  handleTalkTrackReviewDecisionRoute,
  handleTalkTrackUsageSignalRoute,
  TALK_TRACK_ASSET_MUTATION_CSRF_HEADER_NAME,
  TALK_TRACK_ASSET_MUTATION_CSRF_HEADER_VALUE,
} from "./route";

class ExpectedRollback extends Error {
  constructor() {
    super("Rollback local talk-track asset route check");
  }
}

type JsonObject = Record<string, unknown>;

function scopedUrl(
  tenantId: string,
  teamId: string,
  path = "/api/talk-tracks/assets",
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
      TALK_TRACK_ASSET_MUTATION_CSRF_HEADER_NAME,
      TALK_TRACK_ASSET_MUTATION_CSRF_HEADER_VALUE,
    );
  }

  return new Request(input.url, {
    method: input.method ?? "POST",
    headers,
    body: JSON.stringify(input.body ?? {}),
  });
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

function candidateInput(seed: string) {
  return {
    candidateSource: "ai_review" as const,
    aiRunId: `${seed}_ai_run`,
    aiSectionId: `${seed}_talk_track_section`,
    promptVersion: "ai-review-v1",
    sourceIds: [`${seed}_ai_section_source`],
    knowledgeVersionIds: [`${seed}_knowledge_version`],
    racketProductVersionIds: [`${seed}_racket_version`],
    scenario: createAssetInput(seed).scenario,
    proposedBody: "高端进攻拍先讲稳定性，再给预算替代方案。",
    validationState: "passed" as const,
    reviewState: "pending" as const,
  };
}

async function readJson(response: Response): Promise<JsonObject> {
  const body = await response.json();

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new Error("Talk-track route response was not a JSON object");
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
    "other_team_hidden_talk_track",
    "Bearer",
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

async function main() {
  const { client, db } = createDatabaseConnection();
  const checkId = `talk_tracks_route_check_${Date.now()}`;

  try {
    try {
      await db.transaction(async (transaction) => {
        const tenantId = `${checkId}_tenant`;
        const teamId = `${checkId}_team`;
        const otherTeamId = `${checkId}_other_team`;
        const hostId = `${checkId}_host`;
        const reviewerId = `${checkId}_reviewer`;
        const viewerId = `${checkId}_viewer`;
        const hostReference = createAuthSessionReference();
        const reviewerReference = createAuthSessionReference();
        const viewerReference = createAuthSessionReference();
        const now = new Date();
        const future = new Date(Date.now() + 60 * 60 * 1000);

        await transaction.insert(tenants).values({
          id: tenantId,
          name: "Local talk-track route check",
          defaultTeamId: teamId,
        });

        await transaction.insert(teams).values([
          {
            id: teamId,
            tenantId,
            name: "Talk-track route team",
            createdBy: hostId,
          },
          {
            id: otherTeamId,
            tenantId,
            name: "Other talk-track route team",
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
            joinedAt: now,
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
            joinedAt: now,
          },
          {
            id: `${hostId}_other_team_membership`,
            tenantId,
            teamId: otherTeamId,
            userId: hostId,
            status: "active",
            role: "host",
            joinedAt: now,
          },
          {
            id: `${reviewerId}_team_membership`,
            tenantId,
            teamId,
            userId: reviewerId,
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
            id: `${checkId}_host_session`,
            userId: hostId,
            sessionReferenceHash: hashAuthSessionReference(hostReference),
            status: "active",
            issuedAt: now,
            expiresAt: future,
          },
          {
            id: `${checkId}_reviewer_session`,
            userId: reviewerId,
            sessionReferenceHash: hashAuthSessionReference(reviewerReference),
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
        const talkTrackRepository = createTalkTrackAssetRepository(
          transaction as TalkTrackAssetRepositoryDatabase,
        );

        const noCookie = await handleTalkTrackAssetsListRoute(
          authRepository,
          talkTrackRepository,
          new Request(scopedUrl(tenantId, teamId)),
        );
        expectStatus("no-cookie list", noCookie, 401);
        expectNoStore("no-cookie list", noCookie);

        const missingScope = await handleTalkTrackAssetsListRoute(
          authRepository,
          talkTrackRepository,
          requestWithCookie("https://operation.local/api/talk-tracks/assets", hostReference),
        );
        expectStatus("missing-scope list", missingScope, 400);

        const noCsrf = await handleTalkTrackCandidatesCreateRoute(
          authRepository,
          talkTrackRepository,
          jsonRequest({
            url: scopedUrl(tenantId, teamId, "/api/talk-tracks/candidates"),
            sessionReference: hostReference,
            body: candidateInput(checkId),
          }),
        );
        expectStatus("candidate create without csrf", noCsrf, 403);

        const viewerCreate = await handleTalkTrackCandidatesCreateRoute(
          authRepository,
          talkTrackRepository,
          jsonRequest({
            url: scopedUrl(tenantId, teamId, "/api/talk-tracks/candidates"),
            sessionReference: viewerReference,
            csrf: true,
            body: {
              candidateSource: "manual",
              proposedBody: "只读角色不能创建候选话术。",
            },
          }),
        );
        expectStatus("viewer candidate create", viewerCreate, 403);

        const candidateResponse = await handleTalkTrackCandidatesCreateRoute(
          authRepository,
          talkTrackRepository,
          jsonRequest({
            url: scopedUrl(tenantId, teamId, "/api/talk-tracks/candidates"),
            sessionReference: hostReference,
            csrf: true,
            body: candidateInput(checkId),
          }),
        );
        expectStatus("candidate create", candidateResponse, 201);
        const candidateBody = await readJson(candidateResponse);
        const candidateId = getNestedString(
          getNestedObject(candidateBody, "candidate", "candidate create"),
          "id",
          "candidate create",
        );

        const assetResponse = await handleTalkTrackAssetsCreateRoute(
          authRepository,
          talkTrackRepository,
          jsonRequest({
            url: scopedUrl(tenantId, teamId),
            sessionReference: hostReference,
            csrf: true,
            body: createAssetInput(checkId, candidateId),
          }),
        );
        expectStatus("asset create", assetResponse, 201);
        const assetBody = await readJson(assetResponse);
        const asset = getNestedObject(assetBody, "asset", "asset create");
        const assetId = getNestedString(asset, "id", "asset create");
        const version = getNestedObject(asset, "currentVersion", "asset create");
        const versionId = getNestedString(version, "id", "asset create");

        const listResponse = await handleTalkTrackAssetsListRoute(
          authRepository,
          talkTrackRepository,
          requestWithCookie(scopedUrl(tenantId, teamId), hostReference),
        );
        expectStatus("asset list", listResponse, 200);
        expectNoStore("asset list", listResponse);

        const detailResponse = await handleTalkTrackAssetDetailRoute(
          authRepository,
          talkTrackRepository,
          requestWithCookie(
            scopedUrl(tenantId, teamId, `/api/talk-tracks/assets/${assetId}`),
            hostReference,
          ),
          { assetId },
        );
        expectStatus("asset detail", detailResponse, 200);

        const submitResponse = await handleTalkTrackAssetSubmitRoute(
          authRepository,
          talkTrackRepository,
          jsonRequest({
            url: scopedUrl(tenantId, teamId, `/api/talk-tracks/assets/${assetId}/submit`),
            sessionReference: hostReference,
            csrf: true,
            body: { versionId },
          }),
          { assetId },
        );
        expectStatus("asset submit", submitResponse, 200);

        const decisionResponse = await handleTalkTrackReviewDecisionRoute(
          authRepository,
          talkTrackRepository,
          jsonRequest({
            url: scopedUrl(tenantId, teamId, "/api/talk-tracks/review-decisions"),
            sessionReference: reviewerReference,
            csrf: true,
            body: {
              assetId,
              versionId,
              decision: "approve",
              reason: "已核对产品适用人群和价格带表达。",
            },
          }),
        );
        expectStatus("review decision", decisionResponse, 201);

        const pendingPublish = await handleTalkTrackAssetPublishRoute(
          authRepository,
          talkTrackRepository,
          jsonRequest({
            url: scopedUrl(tenantId, teamId, `/api/talk-tracks/assets/${assetId}/publish`),
            sessionReference: reviewerReference,
            csrf: true,
            body: { versionId },
          }),
          { assetId },
        );
        expectStatus("pending candidate publish", pendingPublish, 422);

        const candidateReview = await handleTalkTrackCandidateReviewRoute(
          authRepository,
          talkTrackRepository,
          jsonRequest({
            url: scopedUrl(tenantId, teamId, "/api/talk-tracks/candidate-reviews"),
            sessionReference: reviewerReference,
            csrf: true,
            body: {
              candidateId,
              reviewState: "accepted",
            },
          }),
        );
        expectStatus("candidate review", candidateReview, 200);

        const publishResponse = await handleTalkTrackAssetPublishRoute(
          authRepository,
          talkTrackRepository,
          jsonRequest({
            url: scopedUrl(tenantId, teamId, `/api/talk-tracks/assets/${assetId}/publish`),
            sessionReference: reviewerReference,
            csrf: true,
            body: { versionId },
          }),
          { assetId },
        );
        expectStatus("asset publish", publishResponse, 200);
        const publishBody = await readJson(publishResponse);
        const publishedAsset = getNestedObject(publishBody, "asset", "asset publish");

        if (publishedAsset.status !== "published") {
          throw new Error("published asset response should be published");
        }

        const duplicateResponse = await handleTalkTrackAssetsCreateRoute(
          authRepository,
          talkTrackRepository,
          jsonRequest({
            url: scopedUrl(tenantId, teamId),
            sessionReference: hostReference,
            csrf: true,
            body: createAssetInput(checkId),
          }),
        );
        expectStatus("duplicate scenario", duplicateResponse, 409);

        const otherTeamDetail = await handleTalkTrackAssetDetailRoute(
          authRepository,
          talkTrackRepository,
          requestWithCookie(
            scopedUrl(tenantId, otherTeamId, `/api/talk-tracks/assets/${assetId}`),
            hostReference,
          ),
          { assetId },
        );
        expectStatus("cross-team detail", otherTeamDetail, 404);

        const usageResponse = await handleTalkTrackUsageSignalRoute(
          authRepository,
          talkTrackRepository,
          jsonRequest({
            url: scopedUrl(tenantId, teamId, "/api/talk-tracks/usage-signals"),
            sessionReference: hostReference,
            csrf: true,
            body: {
              assetId,
              versionId,
              sourceWorkflow: "live_session",
              signalType: "used",
              reason: "主播在下场直播中直接复用了该价格异议回应。",
            },
          }),
        );
        expectStatus("usage signal", usageResponse, 201);

        const archiveResponse = await handleTalkTrackAssetArchiveRoute(
          authRepository,
          talkTrackRepository,
          jsonRequest({
            url: scopedUrl(tenantId, teamId, `/api/talk-tracks/assets/${assetId}/archive`),
            sessionReference: reviewerReference,
            csrf: true,
          }),
          { assetId },
        );
        expectStatus("asset archive", archiveResponse, 200);

        const restoreResponse = await handleTalkTrackAssetRestoreRoute(
          authRepository,
          talkTrackRepository,
          jsonRequest({
            url: scopedUrl(tenantId, teamId, `/api/talk-tracks/assets/${assetId}/restore`),
            sessionReference: reviewerReference,
            csrf: true,
          }),
          { assetId },
        );
        expectStatus("asset restore", restoreResponse, 200);

        expectNoSensitive("published asset response", publishBody, [
          hostReference,
          reviewerReference,
          viewerReference,
        ]);
        expectNoSensitive("usage response", await readJson(usageResponse), [
          hostReference,
          reviewerReference,
          viewerReference,
        ]);

        throw new ExpectedRollback();
      });
    } catch (error) {
      if (error instanceof ExpectedRollback) {
        console.log("Talk-track asset route check passed with rollback");
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
