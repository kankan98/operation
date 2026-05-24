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
  createSessionCaptureRepository,
  type SessionCaptureRepositoryDatabase,
} from "./repository";
import {
  handleSessionCaptureDetailRoute,
  handleSessionCaptureDraftAutosaveRoute,
  handleSessionCaptureSubmitRoute,
  handleSessionCapturesCreateRoute,
  handleSessionCapturesListRoute,
  SESSION_CAPTURE_MUTATION_CSRF_HEADER_NAME,
  SESSION_CAPTURE_MUTATION_CSRF_HEADER_VALUE,
} from "./route";

class ExpectedRollback extends Error {
  constructor() {
    super("Rollback local session capture route check");
  }
}

type JsonObject = Record<string, unknown>;

function scopedUrl(
  tenantId: string,
  teamId: string,
  path = "/api/sessions/captures",
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

function sessionInput(input: {
  title: string;
  sessionDate?: Date | string;
  hostId: string;
  summary?: string;
}) {
  return {
    title: input.title,
    sessionDate: input.sessionDate ?? "2026-05-23T12:00:00.000Z",
    platform: "douyin" as const,
    sourceMode: "manual" as const,
    summary: input.summary ?? "围绕中高级球友的进攻拍选择做手动复盘。",
    hostRoles: [
      {
        userId: input.hostId,
        displayName: "主讲",
        role: "host" as const,
        responsibility: "主讲产品卖点和适用人群",
      },
    ],
    productOrder: [
      {
        displayModel: "Astrox 100 ZZ",
        orderIndex: 1,
        roleInSession: "main_offer" as const,
        talkingPoints: ["中杆硬度", "后场进攻", "推荐磅数"],
        customerFit: ["中高级", "后场进攻"],
        evidenceState: "manual_only" as const,
      },
    ],
    notes: [
      {
        noteType: "gap" as const,
        content: "平衡点解释不够清楚，需要下次补充对比话术。",
        source: "manual" as const,
        sequence: 1,
      },
    ],
    customerQuestions: [
      {
        questionText: "双打后场能不能用",
        topic: "fit" as const,
        relatedProductIds: [],
        answerGiven: "适合力量较好的后场进攻型球友。",
        needsKnowledge: false,
        sensitiveRedactionState: "not_needed" as const,
      },
    ],
    customerObjections: [
      {
        objectionType: "price" as const,
        content: "预算超过预期",
        responseUsed: "先对比上手门槛和耐用性，再给替代型号。",
        resolvedState: "partially_resolved" as const,
        followUpNeeded: true,
      },
    ],
  };
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
      SESSION_CAPTURE_MUTATION_CSRF_HEADER_NAME,
      SESSION_CAPTURE_MUTATION_CSRF_HEADER_VALUE,
    );
  }

  return new Request(input.url, {
    method: input.method,
    headers,
    body: JSON.stringify(input.body ?? {}),
  });
}

async function readJson(response: Response): Promise<JsonObject> {
  const body = await response.json();

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new Error("Session capture route response was not a JSON object");
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
    "other_team_hidden_session",
    "Bearer",
  ]) {
    if (serialized.includes(leaked)) {
      throw new Error(`${label} leaked sensitive metadata`);
    }
  }
}

async function main() {
  const { client, db } = createDatabaseConnection();
  const checkId = `sessions_route_check_${Date.now()}`;

  try {
    try {
      await db.transaction(async (transaction) => {
        const tenantId = `${checkId}_tenant`;
        const teamId = `${checkId}_team`;
        const otherTeamId = `${checkId}_other_team`;
        const operatorId = `${checkId}_operator`;
        const viewerId = `${checkId}_viewer`;
        const hostId = `${checkId}_host`;
        const operatorReference = createAuthSessionReference();
        const viewerReference = createAuthSessionReference();
        const now = new Date();
        const future = new Date(Date.now() + 60 * 60 * 1000);

        await transaction.insert(tenants).values({
          id: tenantId,
          name: "Local session capture route check",
          defaultTeamId: teamId,
        });

        await transaction.insert(teams).values([
          {
            id: teamId,
            tenantId,
            name: "Live operations",
            createdBy: operatorId,
          },
          {
            id: otherTeamId,
            tenantId,
            name: "Other live team",
            createdBy: operatorId,
          },
        ]);

        await transaction.insert(appUsers).values([
          {
            id: operatorId,
            displayName: "Session Operator",
            primaryEmail: `${operatorId}@example.invalid`,
            status: "active",
          },
          {
            id: viewerId,
            displayName: "Readonly Viewer",
            primaryEmail: `${viewerId}@example.invalid`,
            status: "active",
          },
          {
            id: hostId,
            displayName: "Session Host",
            primaryEmail: `${hostId}@example.invalid`,
            status: "active",
          },
        ]);

        await transaction.insert(tenantMemberships).values([
          {
            id: `${operatorId}_tenant_membership`,
            tenantId,
            userId: operatorId,
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
          {
            id: `${hostId}_tenant_membership`,
            tenantId,
            userId: hostId,
            status: "active",
            tenantRole: "member",
            joinedAt: now,
          },
        ]);

        await transaction.insert(teamMemberships).values([
          {
            id: `${operatorId}_team_membership`,
            tenantId,
            teamId,
            userId: operatorId,
            status: "active",
            role: "operator",
            joinedAt: now,
          },
          {
            id: `${operatorId}_other_team_membership`,
            tenantId,
            teamId: otherTeamId,
            userId: operatorId,
            status: "active",
            role: "operator",
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
          {
            id: `${hostId}_team_membership`,
            tenantId,
            teamId,
            userId: hostId,
            status: "active",
            role: "host",
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
          transaction as unknown as AuthSessionRepositoryDatabase,
        );
        const sessionRepository = createSessionCaptureRepository(
          transaction as unknown as SessionCaptureRepositoryDatabase,
        );
        const url = scopedUrl(tenantId, teamId);

        const missingCookieList = await handleSessionCapturesListRoute(
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
          throw new Error("Missing-cookie list was not denied safely");
        }

        const missingScopeList = await handleSessionCapturesListRoute(
          authRepository,
          sessionRepository,
          requestWithCookie(
            "https://operation.local/api/sessions/captures",
            operatorReference,
          ),
        );
        expectNoStore("missing-scope list", missingScopeList);
        const missingScopeListBody = await readJson(missingScopeList);
        if (
          missingScopeList.status !== 400 ||
          missingScopeListBody.code !== "AUTH_SCOPE_REQUIRED"
        ) {
          throw new Error("Missing-scope list was not explicit");
        }

        const csrfBlockedCreate = await handleSessionCapturesCreateRoute(
          null,
          null,
          jsonRequest({
            url,
            method: "POST",
            sessionReference: operatorReference,
            csrf: false,
            body: sessionInput({
              title: "高端进攻拍对比",
              hostId,
            }),
          }),
        );
        expectNoStore("csrf-blocked create", csrfBlockedCreate);
        const csrfBlockedCreateBody = await readJson(csrfBlockedCreate);
        if (
          csrfBlockedCreate.status !== 403 ||
          csrfBlockedCreateBody.code !== "CSRF_HEADER_REQUIRED"
        ) {
          throw new Error("Create without CSRF header was not blocked safely");
        }

        const createdResponse = await handleSessionCapturesCreateRoute(
          authRepository,
          sessionRepository,
          jsonRequest({
            url,
            method: "POST",
            sessionReference: operatorReference,
            csrf: true,
            body: {
              ...sessionInput({
                title: "高端进攻拍对比",
                hostId,
              }),
              tenantId: "client_supplied_tenant",
              teamId: "client_supplied_team",
              actorId: "client_supplied_actor",
            },
          }),
        );
        expectNoStore("authorized create", createdResponse);
        const createdBody = await readJson(createdResponse);
        const createdSession = createdBody.session as JsonObject | undefined;
        if (
          createdResponse.status !== 201 ||
          createdBody.ok !== true ||
          createdSession?.title !== "高端进攻拍对比" ||
          createdSession?.draftVersion !== 1
        ) {
          throw new Error("Authorized create did not return session view");
        }
        expectNoSensitive("authorized create", createdBody);

        const createdSessionId = String(createdSession.id);
        const createdDraftVersion = Number(createdSession.draftVersion);

        const listResponse = await handleSessionCapturesListRoute(
          authRepository,
          sessionRepository,
          requestWithCookie(url, operatorReference),
        );
        expectNoStore("authorized list", listResponse);
        const listBody = await readJson(listResponse);
        const sessions = listBody.sessions as JsonObject[] | undefined;
        if (
          listResponse.status !== 200 ||
          listBody.ok !== true ||
          !Array.isArray(sessions) ||
          sessions.length !== 1 ||
          sessions[0]?.id !== createdSessionId
        ) {
          throw new Error("Authorized list did not return scoped session");
        }

        const detailResponse = await handleSessionCaptureDetailRoute(
          authRepository,
          sessionRepository,
          requestWithCookie(
            scopedUrl(tenantId, teamId, `/api/sessions/captures/${createdSessionId}`),
            operatorReference,
          ),
          { sessionId: createdSessionId },
        );
        expectNoStore("authorized detail", detailResponse);
        const detailBody = await readJson(detailResponse);
        if (
          detailResponse.status !== 200 ||
          detailBody.ok !== true ||
          (detailBody.session as JsonObject | undefined)?.id !== createdSessionId
        ) {
          throw new Error("Authorized detail did not return session view");
        }

        const autosaveResponse = await handleSessionCaptureDraftAutosaveRoute(
          authRepository,
          sessionRepository,
          jsonRequest({
            url: scopedUrl(
              tenantId,
              teamId,
              `/api/sessions/captures/${createdSessionId}/draft`,
            ),
            method: "PATCH",
            sessionReference: operatorReference,
            csrf: true,
            body: {
              sessionId: "client_supplied_session",
              tenantId: "client_supplied_tenant",
              teamId: "client_supplied_team",
              draftVersion: createdDraftVersion,
              summary: "本场重点记录进攻拍选择、磅数问题和价格异议。",
              notes: [
                {
                  noteType: "customer_question",
                  content: "用户反复问 26 磅能不能拉。",
                  source: "manual",
                  sequence: 2,
                },
              ],
              customerQuestions: [
                {
                  questionText: "26 磅能不能拉",
                  topic: "tension",
                  relatedProductIds: [],
                  answerGiven: "需要结合线种和球友力量。",
                  needsKnowledge: true,
                  sensitiveRedactionState: "not_needed",
                },
              ],
              customerObjections: [],
            },
          }),
          { sessionId: createdSessionId },
        );
        expectNoStore("authorized autosave", autosaveResponse);
        const autosaveBody = await readJson(autosaveResponse);
        const autosavedSession = autosaveBody.session as JsonObject | undefined;
        if (
          autosaveResponse.status !== 200 ||
          autosaveBody.ok !== true ||
          autosavedSession?.id !== createdSessionId ||
          autosavedSession?.draftVersion !== createdDraftVersion + 1
        ) {
          throw new Error("Authorized autosave did not update draft");
        }

        const staleAutosaveResponse = await handleSessionCaptureDraftAutosaveRoute(
          authRepository,
          sessionRepository,
          jsonRequest({
            url: scopedUrl(
              tenantId,
              teamId,
              `/api/sessions/captures/${createdSessionId}/draft`,
            ),
            method: "PATCH",
            sessionReference: operatorReference,
            csrf: true,
            body: {
              draftVersion: createdDraftVersion,
              summary: "旧版本草稿不应覆盖新版本。",
            },
          }),
          { sessionId: createdSessionId },
        );
        expectNoStore("stale autosave", staleAutosaveResponse);
        const staleAutosaveBody = await readJson(staleAutosaveResponse);
        if (
          staleAutosaveResponse.status !== 409 ||
          staleAutosaveBody.code !== "STALE_DRAFT_VERSION"
        ) {
          throw new Error("Stale autosave was not reported as conflict");
        }

        const submitResponse = await handleSessionCaptureSubmitRoute(
          authRepository,
          sessionRepository,
          jsonRequest({
            url: scopedUrl(
              tenantId,
              teamId,
              `/api/sessions/captures/${createdSessionId}/submit`,
            ),
            method: "POST",
            sessionReference: operatorReference,
            csrf: true,
            body: {
              draftVersion: createdDraftVersion + 1,
            },
          }),
          { sessionId: createdSessionId },
        );
        expectNoStore("authorized submit", submitResponse);
        const submitBody = await readJson(submitResponse);
        const submittedSession = submitBody.session as JsonObject | undefined;
        if (
          submitResponse.status !== 200 ||
          submitBody.ok !== true ||
          submittedSession?.status !== "review_ready"
        ) {
          throw new Error("Authorized submit did not return review-ready session");
        }

        const duplicateResponse = await handleSessionCapturesCreateRoute(
          authRepository,
          sessionRepository,
          jsonRequest({
            url,
            method: "POST",
            sessionReference: operatorReference,
            csrf: true,
            body: sessionInput({
              title: " 高端 进攻拍 对比 ",
              sessionDate: "2026-05-23T19:30:00.000Z",
              hostId,
            }),
          }),
        );
        expectNoStore("duplicate create", duplicateResponse);
        const duplicateBody = await readJson(duplicateResponse);
        if (
          duplicateResponse.status !== 409 ||
          duplicateBody.code !== "DUPLICATE_SESSION_LABEL"
        ) {
          throw new Error("Duplicate session label was not reported as conflict");
        }

        const invalidResponse = await handleSessionCapturesCreateRoute(
          authRepository,
          sessionRepository,
          jsonRequest({
            url,
            method: "POST",
            sessionReference: operatorReference,
            csrf: true,
            body: { title: "", hostRoles: [], productOrder: [] },
          }),
        );
        expectNoStore("invalid create", invalidResponse);
        const invalidBody = await readJson(invalidResponse);
        if (
          invalidResponse.status !== 400 ||
          invalidBody.code !== "VALIDATION_ERROR"
        ) {
          throw new Error("Invalid create did not return validation error");
        }

        const longInputResponse = await handleSessionCapturesCreateRoute(
          authRepository,
          sessionRepository,
          jsonRequest({
            url,
            method: "POST",
            sessionReference: operatorReference,
            csrf: true,
            body: sessionInput({
              title: "超长笔记专场",
              hostId,
              summary: "x".repeat(13000),
            }),
          }),
        );
        expectNoStore("long-input create", longInputResponse);
        const longInputBody = await readJson(longInputResponse);
        if (
          longInputResponse.status !== 413 ||
          longInputBody.code !== "LONG_INPUT_LIMIT_EXCEEDED"
        ) {
          throw new Error("Long input did not return a safe payload-too-large error");
        }

        const viewerCreateResponse = await handleSessionCapturesCreateRoute(
          authRepository,
          sessionRepository,
          jsonRequest({
            url,
            method: "POST",
            sessionReference: viewerReference,
            csrf: true,
            body: sessionInput({
              title: "速度拍答疑专场",
              hostId,
            }),
          }),
        );
        expectNoStore("viewer create", viewerCreateResponse);
        const viewerCreateBody = await readJson(viewerCreateResponse);
        if (
          viewerCreateResponse.status !== 403 ||
          viewerCreateBody.code !== "FORBIDDEN_PERMISSION"
        ) {
          throw new Error("Viewer create was not denied by permission");
        }

        const otherTeamCreateResponse = await handleSessionCapturesCreateRoute(
          authRepository,
          sessionRepository,
          jsonRequest({
            url: scopedUrl(tenantId, otherTeamId),
            method: "POST",
            sessionReference: operatorReference,
            csrf: true,
            body: sessionInput({
              title: "other_team_hidden_session",
              hostId,
            }),
          }),
        );
        if (otherTeamCreateResponse.status !== 201) {
          throw new Error("Other-team setup session was not created");
        }
        const otherTeamCreateBody = await readJson(otherTeamCreateResponse);
        const otherTeamSessionId = String(
          (otherTeamCreateBody.session as JsonObject | undefined)?.id,
        );

        const afterOtherTeamList = await handleSessionCapturesListRoute(
          authRepository,
          sessionRepository,
          requestWithCookie(url, operatorReference),
        );
        const afterOtherTeamListBody = await readJson(afterOtherTeamList);
        expectNoSensitive("cross-team list", afterOtherTeamListBody);
        const afterOtherTeamSessions = afterOtherTeamListBody.sessions as
          | JsonObject[]
          | undefined;
        if (
          !Array.isArray(afterOtherTeamSessions) ||
          afterOtherTeamSessions.length !== 1
        ) {
          throw new Error("List leaked or lost scoped session records");
        }

        const crossTeamDetailResponse = await handleSessionCaptureDetailRoute(
          authRepository,
          sessionRepository,
          requestWithCookie(
            scopedUrl(
              tenantId,
              teamId,
              `/api/sessions/captures/${otherTeamSessionId}`,
            ),
            operatorReference,
          ),
          { sessionId: otherTeamSessionId },
        );
        expectNoStore("cross-team detail", crossTeamDetailResponse);
        const crossTeamDetailBody = await readJson(crossTeamDetailResponse);
        expectNoSensitive("cross-team detail", crossTeamDetailBody);
        if (
          crossTeamDetailResponse.status !== 404 ||
          crossTeamDetailBody.code !== "NOT_FOUND"
        ) {
          throw new Error("Cross-team detail did not return a safe not-found error");
        }

        const csrfBlockedAutosave =
          await handleSessionCaptureDraftAutosaveRoute(
            null,
            null,
            jsonRequest({
              url: scopedUrl(
                tenantId,
                teamId,
                `/api/sessions/captures/${createdSessionId}/draft`,
              ),
              method: "PATCH",
              sessionReference: operatorReference,
              csrf: false,
              body: {
                draftVersion: createdDraftVersion + 1,
                summary: "缺少 CSRF 不应保存。",
              },
            }),
            { sessionId: createdSessionId },
          );
        expectNoStore("csrf-blocked autosave", csrfBlockedAutosave);
        if ((await readJson(csrfBlockedAutosave)).code !== "CSRF_HEADER_REQUIRED") {
          throw new Error("Autosave without CSRF header was not blocked safely");
        }

        const csrfBlockedSubmit = await handleSessionCaptureSubmitRoute(
          null,
          null,
          jsonRequest({
            url: scopedUrl(
              tenantId,
              teamId,
              `/api/sessions/captures/${createdSessionId}/submit`,
            ),
            method: "POST",
            sessionReference: operatorReference,
            csrf: false,
            body: {
              draftVersion: createdDraftVersion + 1,
            },
          }),
          { sessionId: createdSessionId },
        );
        expectNoStore("csrf-blocked submit", csrfBlockedSubmit);
        if ((await readJson(csrfBlockedSubmit)).code !== "CSRF_HEADER_REQUIRED") {
          throw new Error("Submit without CSRF header was not blocked safely");
        }

        const redactedResponse = await handleSessionCapturesListRoute(
          authRepository,
          sessionRepository,
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

    console.log("Session capture route check passed; transaction rolled back.");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(
    error instanceof Error
      ? error.message
      : "Unknown sessions:route-check failure",
  );
  process.exitCode = 1;
});
