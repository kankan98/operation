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
  createKnowledgeLifecycleRepository,
  type KnowledgeLifecycleRepositoryDatabase,
} from "./repository";
import {
  handleKnowledgeClaimsCreateRoute,
  handleKnowledgeConflictResolveRoute,
  handleKnowledgeConflictsCreateRoute,
  handleKnowledgeReviewDecisionRoute,
  handleKnowledgeReviewQueueRoute,
  handleKnowledgeSourceDetailRoute,
  handleKnowledgeSourcesCreateRoute,
  handleKnowledgeSourcesListRoute,
  handleKnowledgeTeamNotesCreateRoute,
  handleKnowledgeVersionsCreateRoute,
  KNOWLEDGE_LIFECYCLE_MUTATION_CSRF_HEADER_NAME,
  KNOWLEDGE_LIFECYCLE_MUTATION_CSRF_HEADER_VALUE,
} from "./route";

class ExpectedRollback extends Error {
  constructor() {
    super("Rollback local knowledge lifecycle route check");
  }
}

type JsonObject = Record<string, unknown>;

function scopedUrl(
  tenantId: string,
  teamId: string,
  path = "/api/knowledge/sources",
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
  method: "POST" | "PATCH";
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
      KNOWLEDGE_LIFECYCLE_MUTATION_CSRF_HEADER_NAME,
      KNOWLEDGE_LIFECYCLE_MUTATION_CSRF_HEADER_VALUE,
    );
  }

  return new Request(input.url, {
    method: input.method,
    headers,
    body: JSON.stringify(input.body ?? {}),
  });
}

function sourceInput(input?: { title?: string; url?: string }) {
  return {
    sourceType: "official_brand" as const,
    title: input?.title ?? "ASTROX 100ZZ product page",
    owner: "Yonex",
    url:
      input?.url ??
      "https://www.yonex.com/badminton/rackets/astrox-100zz",
    retrievedAt: "2026-05-23T12:00:00.000Z",
    trustLevel: "official" as const,
    refreshCadence: "monthly" as const,
    intendedUse: ["racket_spec", "talk_track"],
  };
}

async function readJson(response: Response): Promise<JsonObject> {
  const body = await response.json();

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new Error("Knowledge lifecycle route response was not a JSON object");
  }

  return body as JsonObject;
}

function expectNoStore(label: string, response: Response) {
  if (response.headers.get("cache-control") !== "no-store") {
    throw new Error(`${label} did not return Cache-Control: no-store`);
  }
}

function expectNoSensitive(label: string, value: unknown) {
  const serialized = JSON.stringify(value);

  for (const leaked of [
    "raw_cookie_value",
    "raw_session_secret",
    "provider_session_raw",
    "postgres://operation:operation_dev_password@",
    "other_team_hidden_source",
    "other_team_hidden_claim",
    "other_team_hidden_note",
    "Bearer",
  ]) {
    if (serialized.includes(leaked)) {
      throw new Error(`${label} leaked sensitive metadata`);
    }
  }
}

async function main() {
  const { client, db } = createDatabaseConnection();
  const checkId = `knowledge_route_check_${Date.now()}`;

  try {
    try {
      await db.transaction(async (transaction) => {
        const tenantId = `${checkId}_tenant`;
        const teamId = `${checkId}_team`;
        const otherTeamId = `${checkId}_other_team`;
        const reviewerId = `${checkId}_reviewer`;
        const viewerId = `${checkId}_viewer`;
        const reviewerReference = createAuthSessionReference();
        const viewerReference = createAuthSessionReference();
        const now = new Date();
        const future = new Date(Date.now() + 60 * 60 * 1000);

        await transaction.insert(tenants).values({
          id: tenantId,
          name: "Local knowledge lifecycle route check",
          defaultTeamId: teamId,
        });

        await transaction.insert(teams).values([
          {
            id: teamId,
            tenantId,
            name: "Knowledge review team",
            createdBy: reviewerId,
          },
          {
            id: otherTeamId,
            tenantId,
            name: "Other knowledge team",
            createdBy: reviewerId,
          },
        ]);

        await transaction.insert(appUsers).values([
          {
            id: reviewerId,
            displayName: "Knowledge Reviewer",
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

        await transaction.insert(tenantMemberships).values([
          {
            id: `${reviewerId}_tenant_membership`,
            tenantId,
            userId: reviewerId,
            status: "active",
            tenantRole: "member",
            joinedAt: now,
          },
          {
            id: `${viewerId}_tenant_membership`,
            tenantId,
            userId: viewerId,
            status: "active",
            tenantRole: "viewer",
            joinedAt: now,
          },
        ]);

        await transaction.insert(teamMemberships).values([
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
            id: `${reviewerId}_other_team_membership`,
            tenantId,
            teamId: otherTeamId,
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
          transaction as unknown as AuthSessionRepositoryDatabase,
        );
        const knowledgeRepository = createKnowledgeLifecycleRepository(
          transaction as unknown as KnowledgeLifecycleRepositoryDatabase,
        );
        const url = scopedUrl(tenantId, teamId);

        const missingCookieList = await handleKnowledgeSourcesListRoute(
          null,
          null,
          new Request(url),
        );
        expectNoStore("missing-cookie list", missingCookieList);
        const missingCookieListBody = await readJson(missingCookieList);
        if (
          missingCookieList.status !== 401 ||
          missingCookieListBody.ok !== false ||
          missingCookieListBody.code !== "UNAUTHENTICATED"
        ) {
          throw new Error("Missing-cookie source list was not denied safely");
        }

        const missingScopeList = await handleKnowledgeSourcesListRoute(
          authRepository,
          knowledgeRepository,
          requestWithCookie("https://operation.local/api/knowledge/sources", reviewerReference),
        );
        expectNoStore("missing-scope list", missingScopeList);
        const missingScopeListBody = await readJson(missingScopeList);
        if (
          missingScopeList.status !== 400 ||
          missingScopeListBody.code !== "AUTH_SCOPE_REQUIRED"
        ) {
          throw new Error("Missing-scope source list was not explicit");
        }

        const csrfBlockedSource = await handleKnowledgeSourcesCreateRoute(
          null,
          null,
          jsonRequest({
            url,
            method: "POST",
            sessionReference: reviewerReference,
            csrf: false,
            body: sourceInput(),
          }),
        );
        expectNoStore("csrf-blocked source create", csrfBlockedSource);
        const csrfBlockedSourceBody = await readJson(csrfBlockedSource);
        if (
          csrfBlockedSource.status !== 403 ||
          csrfBlockedSourceBody.code !== "CSRF_HEADER_REQUIRED"
        ) {
          throw new Error("Source create without CSRF header was not blocked");
        }

        const createdSourceResponse = await handleKnowledgeSourcesCreateRoute(
          authRepository,
          knowledgeRepository,
          jsonRequest({
            url,
            method: "POST",
            sessionReference: reviewerReference,
            csrf: true,
            body: {
              ...sourceInput(),
              tenantId: "client_supplied_tenant",
              teamId: "client_supplied_team",
              actorId: "client_supplied_actor",
            },
          }),
        );
        expectNoStore("authorized source create", createdSourceResponse);
        const createdSourceBody = await readJson(createdSourceResponse);
        const createdSource = createdSourceBody.source as JsonObject | undefined;
        if (
          createdSourceResponse.status !== 201 ||
          createdSourceBody.ok !== true ||
          createdSource?.title !== "ASTROX 100ZZ product page" ||
          createdSource?.reviewState !== "registered"
        ) {
          throw new Error("Authorized source create did not return source view");
        }
        expectNoSensitive("authorized source create", createdSourceBody);
        const sourceId = String(createdSource.id);

        const listResponse = await handleKnowledgeSourcesListRoute(
          authRepository,
          knowledgeRepository,
          requestWithCookie(url, reviewerReference),
        );
        expectNoStore("authorized source list", listResponse);
        const listBody = await readJson(listResponse);
        const sources = listBody.sources as JsonObject[] | undefined;
        if (
          listResponse.status !== 200 ||
          listBody.ok !== true ||
          !Array.isArray(sources) ||
          sources.length !== 1 ||
          sources[0]?.id !== sourceId
        ) {
          throw new Error("Authorized source list did not return scoped source");
        }

        const detailResponse = await handleKnowledgeSourceDetailRoute(
          authRepository,
          knowledgeRepository,
          requestWithCookie(
            scopedUrl(tenantId, teamId, `/api/knowledge/sources/${sourceId}`),
            reviewerReference,
          ),
          { sourceId },
        );
        expectNoStore("authorized source detail", detailResponse);
        const detailBody = await readJson(detailResponse);
        if (
          detailResponse.status !== 200 ||
          detailBody.ok !== true ||
          (detailBody.source as JsonObject | undefined)?.id !== sourceId
        ) {
          throw new Error("Authorized source detail did not return source view");
        }

        const claimResponse = await handleKnowledgeClaimsCreateRoute(
          authRepository,
          knowledgeRepository,
          jsonRequest({
            url: scopedUrl(tenantId, teamId, "/api/knowledge/claims"),
            method: "POST",
            sessionReference: reviewerReference,
            csrf: true,
            body: {
              sourceId,
              claimType: "racket_spec",
              subject: "ASTROX 100ZZ",
              claimText: "ASTROX 100ZZ 是面向进攻打法的高端球拍。",
              language: "zh",
              confidence: "high",
              extractionMethod: "manual",
              knowledgeKey: "racket:astrox-100zz:positioning",
              tenantId: "client_supplied_tenant",
            },
          }),
        );
        expectNoStore("authorized claim create", claimResponse);
        const claimBody = await readJson(claimResponse);
        const claim = claimBody.claim as JsonObject | undefined;
        if (
          claimResponse.status !== 201 ||
          claimBody.ok !== true ||
          claim?.reviewState !== "pending"
        ) {
          throw new Error("Authorized claim create did not return claim view");
        }
        const claimId = String(claim.id);

        const noteResponse = await handleKnowledgeTeamNotesCreateRoute(
          authRepository,
          knowledgeRepository,
          jsonRequest({
            url: scopedUrl(tenantId, teamId, "/api/knowledge/team-notes"),
            method: "POST",
            sessionReference: reviewerReference,
            csrf: true,
            body: {
              noteType: "selling_experience",
              content: "直播讲解时先说明发力门槛，再引导到进攻型球友。",
              sensitiveLevel: "internal",
              sourceIds: [sourceId],
              knowledgeKey: "racket:astrox-100zz:positioning",
            },
          }),
        );
        expectNoStore("authorized team note create", noteResponse);
        const noteBody = await readJson(noteResponse);
        const teamNote = noteBody.teamNote as JsonObject | undefined;
        if (
          noteResponse.status !== 201 ||
          noteBody.ok !== true ||
          teamNote?.reviewState !== "draft"
        ) {
          throw new Error("Authorized team note create did not return note view");
        }
        const teamNoteId = String(teamNote.id);

        const queueResponse = await handleKnowledgeReviewQueueRoute(
          authRepository,
          knowledgeRepository,
          requestWithCookie(
            scopedUrl(tenantId, teamId, "/api/knowledge/review-queue"),
            reviewerReference,
          ),
        );
        expectNoStore("authorized review queue", queueResponse);
        const queueBody = await readJson(queueResponse);
        const queueItems = queueBody.items as JsonObject[] | undefined;
        if (
          queueResponse.status !== 200 ||
          queueBody.ok !== true ||
          !Array.isArray(queueItems) ||
          queueItems.length < 3
        ) {
          throw new Error("Review queue did not return scoped pending items");
        }

        for (const target of [
          { targetType: "source", targetId: sourceId },
          { targetType: "claim", targetId: claimId },
          { targetType: "team_note", targetId: teamNoteId },
        ] as const) {
          const decisionResponse = await handleKnowledgeReviewDecisionRoute(
            authRepository,
            knowledgeRepository,
            jsonRequest({
              url: scopedUrl(tenantId, teamId, "/api/knowledge/review-decisions"),
              method: "POST",
              sessionReference: reviewerReference,
              csrf: true,
              body: {
                ...target,
                decision: "approve",
                reason: "来源和团队口径已核对。",
              },
            }),
          );
          expectNoStore(`${target.targetType} approval`, decisionResponse);
          const decisionBody = await readJson(decisionResponse);
          if (decisionResponse.status !== 200 || decisionBody.ok !== true) {
            throw new Error(`${target.targetType} approval did not succeed`);
          }
        }

        const conflictResponse = await handleKnowledgeConflictsCreateRoute(
          authRepository,
          knowledgeRepository,
          jsonRequest({
            url: scopedUrl(tenantId, teamId, "/api/knowledge/conflicts"),
            method: "POST",
            sessionReference: reviewerReference,
            csrf: true,
            body: {
              knowledgeKey: "racket:astrox-100zz:positioning",
              claimIds: [claimId],
              conflictType: "team_note_conflict",
              severity: "medium",
            },
          }),
        );
        expectNoStore("authorized conflict create", conflictResponse);
        const conflictBody = await readJson(conflictResponse);
        const conflict = conflictBody.conflict as JsonObject | undefined;
        if (
          conflictResponse.status !== 201 ||
          conflictBody.ok !== true ||
          conflict?.resolutionState !== "open"
        ) {
          throw new Error("Authorized conflict create did not return conflict");
        }
        const conflictId = String(conflict.id);

        const blockedPublishResponse = await handleKnowledgeVersionsCreateRoute(
          authRepository,
          knowledgeRepository,
          jsonRequest({
            url: scopedUrl(tenantId, teamId, "/api/knowledge/versions"),
            method: "POST",
            sessionReference: reviewerReference,
            csrf: true,
            body: {
              knowledgeKey: "racket:astrox-100zz:positioning",
              claimIds: [claimId],
              teamNoteIds: [teamNoteId],
              sourceIds: [sourceId],
              summary: "ASTROX 100ZZ 适合有发力基础的进攻型球友。",
            },
          }),
        );
        expectNoStore("conflict-blocked publish", blockedPublishResponse);
        const blockedPublishBody = await readJson(blockedPublishResponse);
        if (
          blockedPublishResponse.status !== 409 ||
          blockedPublishBody.code !== "CONFLICTING_CLAIM"
        ) {
          throw new Error("Open conflict did not block publication");
        }

        const resolveConflictResponse = await handleKnowledgeConflictResolveRoute(
          authRepository,
          knowledgeRepository,
          jsonRequest({
            url: scopedUrl(
              tenantId,
              teamId,
              `/api/knowledge/conflicts/${conflictId}`,
            ),
            method: "PATCH",
            sessionReference: reviewerReference,
            csrf: true,
            body: {
              conflictId: "client_supplied_conflict",
              tenantId: "client_supplied_tenant",
              decision: "resolved",
              reason: "团队口径已与来源字段对齐。",
            },
          }),
          { conflictId },
        );
        expectNoStore("authorized conflict resolve", resolveConflictResponse);
        const resolveConflictBody = await readJson(resolveConflictResponse);
        if (
          resolveConflictResponse.status !== 200 ||
          resolveConflictBody.ok !== true ||
          (resolveConflictBody.conflict as JsonObject | undefined)
            ?.resolutionState !== "resolved"
        ) {
          throw new Error("Authorized conflict resolve did not update conflict");
        }

        const publishResponse = await handleKnowledgeVersionsCreateRoute(
          authRepository,
          knowledgeRepository,
          jsonRequest({
            url: scopedUrl(tenantId, teamId, "/api/knowledge/versions"),
            method: "POST",
            sessionReference: reviewerReference,
            csrf: true,
            body: {
              knowledgeKey: "racket:astrox-100zz:positioning",
              claimIds: [claimId],
              teamNoteIds: [teamNoteId],
              sourceIds: [sourceId],
              summary: "ASTROX 100ZZ 适合有发力基础的进攻型球友。",
            },
          }),
        );
        expectNoStore("authorized publish", publishResponse);
        const publishBody = await readJson(publishResponse);
        const version = publishBody.version as JsonObject | undefined;
        if (
          publishResponse.status !== 201 ||
          publishBody.ok !== true ||
          version?.status !== "published"
        ) {
          throw new Error("Authorized publish did not return published version");
        }

        const duplicateSourceResponse = await handleKnowledgeSourcesCreateRoute(
          authRepository,
          knowledgeRepository,
          jsonRequest({
            url,
            method: "POST",
            sessionReference: reviewerReference,
            csrf: true,
            body: sourceInput({ title: " ASTROX 100ZZ Product Page " }),
          }),
        );
        expectNoStore("duplicate source", duplicateSourceResponse);
        const duplicateSourceBody = await readJson(duplicateSourceResponse);
        if (
          duplicateSourceResponse.status !== 409 ||
          duplicateSourceBody.code !== "DUPLICATE_SOURCE"
        ) {
          throw new Error("Duplicate source was not reported as conflict");
        }

        const invalidClaimResponse = await handleKnowledgeClaimsCreateRoute(
          authRepository,
          knowledgeRepository,
          jsonRequest({
            url: scopedUrl(tenantId, teamId, "/api/knowledge/claims"),
            method: "POST",
            sessionReference: reviewerReference,
            csrf: true,
            body: { sourceId, claimText: "" },
          }),
        );
        expectNoStore("invalid claim", invalidClaimResponse);
        const invalidClaimBody = await readJson(invalidClaimResponse);
        if (
          invalidClaimResponse.status !== 400 ||
          invalidClaimBody.code !== "VALIDATION_ERROR"
        ) {
          throw new Error("Invalid claim did not return validation error");
        }

        const longNoteResponse = await handleKnowledgeTeamNotesCreateRoute(
          authRepository,
          knowledgeRepository,
          jsonRequest({
            url: scopedUrl(tenantId, teamId, "/api/knowledge/team-notes"),
            method: "POST",
            sessionReference: reviewerReference,
            csrf: true,
            body: {
              noteType: "selling_experience",
              content: "x".repeat(9000),
              sensitiveLevel: "internal",
              sourceIds: [sourceId],
              knowledgeKey: "racket:astrox-100zz:positioning",
            },
          }),
        );
        expectNoStore("long team note", longNoteResponse);
        const longNoteBody = await readJson(longNoteResponse);
        if (
          longNoteResponse.status !== 413 ||
          longNoteBody.code !== "LONG_INPUT_LIMIT_EXCEEDED"
        ) {
          throw new Error("Long team note did not return payload-too-large");
        }

        const viewerDecisionResponse = await handleKnowledgeReviewDecisionRoute(
          authRepository,
          knowledgeRepository,
          jsonRequest({
            url: scopedUrl(tenantId, teamId, "/api/knowledge/review-decisions"),
            method: "POST",
            sessionReference: viewerReference,
            csrf: true,
            body: {
              targetType: "source",
              targetId: sourceId,
              decision: "archive",
              reason: "viewer 不应能审核。",
            },
          }),
        );
        expectNoStore("viewer decision", viewerDecisionResponse);
        const viewerDecisionBody = await readJson(viewerDecisionResponse);
        if (
          viewerDecisionResponse.status !== 403 ||
          viewerDecisionBody.code !== "FORBIDDEN_PERMISSION"
        ) {
          throw new Error("Viewer review decision was not denied");
        }

        const otherTeamSourceResponse = await handleKnowledgeSourcesCreateRoute(
          authRepository,
          knowledgeRepository,
          jsonRequest({
            url: scopedUrl(tenantId, otherTeamId),
            method: "POST",
            sessionReference: reviewerReference,
            csrf: true,
            body: sourceInput({
              title: "other_team_hidden_source",
              url: "https://example.invalid/other-team-source",
            }),
          }),
        );
        if (otherTeamSourceResponse.status !== 201) {
          throw new Error("Other-team setup source was not created");
        }
        const otherTeamSourceBody = await readJson(otherTeamSourceResponse);
        const otherTeamSourceId = String(
          (otherTeamSourceBody.source as JsonObject | undefined)?.id,
        );

        const crossTeamListResponse = await handleKnowledgeSourcesListRoute(
          authRepository,
          knowledgeRepository,
          requestWithCookie(url, reviewerReference),
        );
        const crossTeamListBody = await readJson(crossTeamListResponse);
        expectNoSensitive("cross-team list", crossTeamListBody);
        const crossTeamSources = crossTeamListBody.sources as
          | JsonObject[]
          | undefined;
        if (!Array.isArray(crossTeamSources) || crossTeamSources.length !== 1) {
          throw new Error("Source list leaked or lost scoped records");
        }

        const crossTeamDetailResponse = await handleKnowledgeSourceDetailRoute(
          authRepository,
          knowledgeRepository,
          requestWithCookie(
            scopedUrl(
              tenantId,
              teamId,
              `/api/knowledge/sources/${otherTeamSourceId}`,
            ),
            reviewerReference,
          ),
          { sourceId: otherTeamSourceId },
        );
        expectNoStore("cross-team detail", crossTeamDetailResponse);
        const crossTeamDetailBody = await readJson(crossTeamDetailResponse);
        expectNoSensitive("cross-team detail", crossTeamDetailBody);
        if (
          crossTeamDetailResponse.status !== 404 ||
          crossTeamDetailBody.code !== "NOT_FOUND"
        ) {
          throw new Error("Cross-team detail did not return safe not-found");
        }

        const csrfBlockedConflict = await handleKnowledgeConflictsCreateRoute(
          null,
          null,
          jsonRequest({
            url: scopedUrl(tenantId, teamId, "/api/knowledge/conflicts"),
            method: "POST",
            sessionReference: reviewerReference,
            csrf: false,
            body: {
              knowledgeKey: "racket:astrox-100zz:positioning",
              claimIds: [claimId],
              conflictType: "team_note_conflict",
            },
          }),
        );
        expectNoStore("csrf-blocked conflict", csrfBlockedConflict);
        if ((await readJson(csrfBlockedConflict)).code !== "CSRF_HEADER_REQUIRED") {
          throw new Error("Conflict create without CSRF was not blocked");
        }

        const redactedResponse = await handleKnowledgeSourcesListRoute(
          authRepository,
          knowledgeRepository,
          new Request(url, {
            headers: {
              cookie: `${authSessionCookieName}=raw_cookie_value`,
              authorization: "Bearer raw_session_secret",
              "x-provider-session-id": "provider_session_raw",
            },
          }),
        );
        const redactedBody = await readJson(redactedResponse);
        expectNoSensitive("redacted route error", redactedBody);

        throw new ExpectedRollback();
      });
    } catch (error) {
      if (!(error instanceof ExpectedRollback)) {
        throw error;
      }
    }

    console.log("Knowledge lifecycle route check passed; transaction rolled back.");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(
    error instanceof Error
      ? error.message
      : "Unknown knowledge:route-check failure",
  );
  process.exitCode = 1;
});
