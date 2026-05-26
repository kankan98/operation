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
} from "../auth";
import { createV0TrialFeedbackRepository } from "./repository";
import {
  handleV0TrialFeedbackCreateRoute,
  handleV0TrialFeedbackListRoute,
  V0_TRIAL_FEEDBACK_MUTATION_CSRF_HEADER_NAME,
  V0_TRIAL_FEEDBACK_MUTATION_CSRF_HEADER_VALUE,
} from "./route";

class ExpectedRollback extends Error {
  constructor() {
    super("Rollback local V0 trial feedback check");
  }
}

type JsonObject = Record<string, unknown>;

function scopedUrl(
  tenantId: string,
  teamId: string,
  path = "/api/trial-feedback",
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
      V0_TRIAL_FEEDBACK_MUTATION_CSRF_HEADER_NAME,
      V0_TRIAL_FEEDBACK_MUTATION_CSRF_HEADER_VALUE,
    );
  }

  return new Request(input.url, {
    method: "POST",
    headers,
    body: JSON.stringify(input.body ?? {}),
  });
}

function feedbackInput(note = "直播场次到复盘的下一步很清楚，移动端备注字段还可以更短。") {
  return {
    evaluatorRole: "live_operator",
    workbench: "trial",
    pagePath: "/trial",
    usefulnessRating: 4,
    clarityRating: 4,
    issueType: "mobile_layout",
    note,
    realWorkSignal: "maybe",
  };
}

async function readJson(response: Response): Promise<JsonObject> {
  const body = await response.json();

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new Error("Trial feedback response was not a JSON object");
  }

  return body as JsonObject;
}

function expect(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function expectStatus(label: string, response: Response, status: number) {
  if (response.status !== status) {
    throw new Error(`${label} returned ${response.status}, expected ${status}`);
  }
}

function expectNoStore(label: string, response: Response) {
  expect(
    response.headers.get("cache-control") === "no-store",
    `${label} did not return Cache-Control: no-store`,
  );
}

function expectNoSensitive(label: string, value: unknown, blocked: string[] = []) {
  const serialized = JSON.stringify(value);

  for (const leaked of [
    ...blocked,
    "raw_cookie_value",
    "raw_session_secret",
    "provider_session_raw",
    "postgres://operation:operation_dev_password@",
    "Bearer",
    "sk-",
    "other_team_hidden_feedback",
  ]) {
    if (serialized.includes(leaked)) {
      throw new Error(`${label} leaked sensitive metadata`);
    }
  }
}

async function main() {
  const { client, db } = createDatabaseConnection();
  const checkId = `trial_feedback_check_${Date.now()}`;

  try {
    try {
      await db.transaction(async (transaction) => {
        const tenantId = `${checkId}_tenant`;
        const teamId = `${checkId}_team`;
        const otherTeamId = `${checkId}_other_team`;
        const operatorId = `${checkId}_operator`;
        const otherOperatorId = `${checkId}_other_operator`;
        const operatorReference = createAuthSessionReference();
        const otherOperatorReference = createAuthSessionReference();
        const now = new Date();
        const future = new Date(Date.now() + 60 * 60 * 1000);

        await transaction.insert(tenants).values({
          id: tenantId,
          name: "Local trial feedback check",
          defaultTeamId: teamId,
        });

        await transaction.insert(teams).values([
          {
            id: teamId,
            tenantId,
            name: "Trial feedback team",
            createdBy: operatorId,
          },
          {
            id: otherTeamId,
            tenantId,
            name: "Other feedback team",
            createdBy: otherOperatorId,
          },
        ]);

        await transaction.insert(appUsers).values([
          {
            id: operatorId,
            displayName: "Trial Feedback Operator",
            primaryEmail: `${operatorId}@example.invalid`,
            status: "active",
          },
          {
            id: otherOperatorId,
            displayName: "Other Feedback Operator",
            primaryEmail: `${otherOperatorId}@example.invalid`,
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
            id: `${otherOperatorId}_tenant_membership`,
            tenantId,
            userId: otherOperatorId,
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
            id: `${otherOperatorId}_other_team_membership`,
            tenantId,
            teamId: otherTeamId,
            userId: otherOperatorId,
            status: "active",
            role: "operator",
            joinedAt: now,
          },
        ]);

        await transaction.insert(authSessions).values([
          {
            id: `${operatorId}_session`,
            userId: operatorId,
            sessionReferenceHash: hashAuthSessionReference(operatorReference),
            providerSessionId: `${operatorId}_provider_session`,
            status: "active",
            issuedAt: now,
            expiresAt: future,
          },
          {
            id: `${otherOperatorId}_session`,
            userId: otherOperatorId,
            sessionReferenceHash: hashAuthSessionReference(otherOperatorReference),
            providerSessionId: `${otherOperatorId}_provider_session`,
            status: "active",
            issuedAt: now,
            expiresAt: future,
          },
        ]);

        const authRepository = createAuthSessionRepository(transaction);
        const feedbackRepository = createV0TrialFeedbackRepository(transaction);

        const missingCookie = await handleV0TrialFeedbackListRoute(
          authRepository,
          feedbackRepository,
          new Request(scopedUrl(tenantId, teamId)),
        );
        expectStatus("missing cookie", missingCookie, 401);
        expectNoStore("missing cookie", missingCookie);
        expectNoSensitive("missing cookie", await readJson(missingCookie));

        const missingScope = await handleV0TrialFeedbackListRoute(
          authRepository,
          feedbackRepository,
          requestWithCookie("https://operation.local/api/trial-feedback", operatorReference),
        );
        expectStatus("missing scope", missingScope, 400);
        expectNoStore("missing scope", missingScope);

        const missingCsrf = await handleV0TrialFeedbackCreateRoute(
          authRepository,
          feedbackRepository,
          jsonRequest({
            url: scopedUrl(tenantId, teamId),
            sessionReference: operatorReference,
            body: feedbackInput(),
          }),
        );
        expectStatus("missing csrf", missingCsrf, 403);
        expectNoStore("missing csrf", missingCsrf);

        const created = await handleV0TrialFeedbackCreateRoute(
          authRepository,
          feedbackRepository,
          jsonRequest({
            url: scopedUrl(tenantId, teamId),
            sessionReference: operatorReference,
            csrf: true,
            body: feedbackInput(),
          }),
        );
        expectStatus("create feedback", created, 201);
        expectNoStore("create feedback", created);
        const createdBody = await readJson(created);
        expect(createdBody.ok === true, "create feedback did not succeed");
        expectNoSensitive("create feedback", createdBody);

        const invalidRating = await handleV0TrialFeedbackCreateRoute(
          authRepository,
          feedbackRepository,
          jsonRequest({
            url: scopedUrl(tenantId, teamId),
            sessionReference: operatorReference,
            csrf: true,
            body: {
              ...feedbackInput(),
              usefulnessRating: 9,
            },
          }),
        );
        expectStatus("invalid rating", invalidRating, 400);
        expectNoSensitive("invalid rating", await readJson(invalidRating));

        const longNote = await handleV0TrialFeedbackCreateRoute(
          authRepository,
          feedbackRepository,
          jsonRequest({
            url: scopedUrl(tenantId, teamId),
            sessionReference: operatorReference,
            csrf: true,
            body: feedbackInput("太长".repeat(600)),
          }),
        );
        expectStatus("long note", longNote, 413);
        expectNoSensitive("long note", await readJson(longNote));

        const sensitiveNote = await handleV0TrialFeedbackCreateRoute(
          authRepository,
          feedbackRepository,
          jsonRequest({
            url: scopedUrl(tenantId, teamId),
            sessionReference: operatorReference,
            csrf: true,
            body: feedbackInput("这里误粘了 Bearer sk-sensitive-value"),
          }),
        );
        expectStatus("sensitive note", sensitiveNote, 422);
        expectNoSensitive("sensitive note", await readJson(sensitiveNote), [
          "sk-sensitive-value",
        ]);

        const otherCreated = await handleV0TrialFeedbackCreateRoute(
          authRepository,
          feedbackRepository,
          jsonRequest({
            url: scopedUrl(tenantId, otherTeamId),
            sessionReference: otherOperatorReference,
            csrf: true,
            body: feedbackInput("other_team_hidden_feedback"),
          }),
        );
        expectStatus("other create feedback", otherCreated, 201);

        const list = await handleV0TrialFeedbackListRoute(
          authRepository,
          feedbackRepository,
          requestWithCookie(scopedUrl(tenantId, teamId), operatorReference),
        );
        expectStatus("list feedback", list, 200);
        expectNoStore("list feedback", list);
        const listBody = await readJson(list);
        expect(listBody.ok === true, "list feedback did not succeed");
        expect(Array.isArray(listBody.feedback), "list feedback missing array");
        expect((listBody.feedback as unknown[]).length === 1, "list feedback leaked scope");
        expectNoSensitive("list feedback", listBody);

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
  process.exitCode = 1;
});
