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
import { createV0TrialRunRepository } from "./repository";
import {
  handleV0TrialRunCompleteRoute,
  handleV0TrialRunCreateRoute,
  handleV0TrialRunDetailRoute,
  handleV0TrialRunListRoute,
  handleV0TrialRunStepUpdateRoute,
  V0_TRIAL_RUN_MUTATION_CSRF_HEADER_NAME,
  V0_TRIAL_RUN_MUTATION_CSRF_HEADER_VALUE,
} from "./route";

class ExpectedRollback extends Error {
  constructor() {
    super("Rollback local V0 trial run route check");
  }
}

type JsonObject = Record<string, unknown>;

function scopedUrl(
  tenantId: string,
  teamId: string,
  path = "/api/trial-runs",
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
  body?: unknown;
  csrf?: boolean;
  method?: "PATCH" | "POST";
  sessionReference?: string;
  url: string;
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
      V0_TRIAL_RUN_MUTATION_CSRF_HEADER_NAME,
      V0_TRIAL_RUN_MUTATION_CSRF_HEADER_VALUE,
    );
  }

  return new Request(input.url, {
    body: JSON.stringify(input.body ?? {}),
    headers,
    method: input.method ?? "POST",
  });
}

async function readJson(response: Response): Promise<JsonObject> {
  const body = await response.json();

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new Error("Trial run route response was not a JSON object");
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
    "other_team_hidden_run",
  ]) {
    if (serialized.includes(leaked)) {
      throw new Error(`${label} leaked sensitive metadata`);
    }
  }
}

function getResponseObject(body: JsonObject, key: string): JsonObject {
  const value = body[key];

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`Trial run route response missing object ${key}`);
  }

  return value as JsonObject;
}

function getResponseArray(body: JsonObject, key: string): JsonObject[] {
  const value = body[key];

  if (!Array.isArray(value)) {
    throw new Error(`Trial run route response missing array ${key}`);
  }

  return value as JsonObject[];
}

async function main() {
  const { client, db } = createDatabaseConnection();
  const checkId = `trial_run_route_check_${Date.now()}`;

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
          defaultTeamId: teamId,
          id: tenantId,
          name: "Local trial run route check",
        });

        await transaction.insert(teams).values([
          {
            createdBy: operatorId,
            id: teamId,
            name: "Trial run route team",
            tenantId,
          },
          {
            createdBy: otherOperatorId,
            id: otherTeamId,
            name: "Other trial run route team",
            tenantId,
          },
        ]);

        await transaction.insert(appUsers).values([
          {
            displayName: "Trial Run Route Operator",
            id: operatorId,
            primaryEmail: `${operatorId}@example.invalid`,
            status: "active",
          },
          {
            displayName: "Other Trial Run Route Operator",
            id: otherOperatorId,
            primaryEmail: `${otherOperatorId}@example.invalid`,
            status: "active",
          },
        ]);

        await transaction.insert(tenantMemberships).values([
          {
            id: `${operatorId}_tenant_membership`,
            joinedAt: now,
            status: "active",
            tenantId,
            tenantRole: "member",
            userId: operatorId,
          },
          {
            id: `${otherOperatorId}_tenant_membership`,
            joinedAt: now,
            status: "active",
            tenantId,
            tenantRole: "member",
            userId: otherOperatorId,
          },
        ]);

        await transaction.insert(teamMemberships).values([
          {
            id: `${operatorId}_team_membership`,
            joinedAt: now,
            role: "operator",
            status: "active",
            teamId,
            tenantId,
            userId: operatorId,
          },
          {
            id: `${otherOperatorId}_other_team_membership`,
            joinedAt: now,
            role: "operator",
            status: "active",
            teamId: otherTeamId,
            tenantId,
            userId: otherOperatorId,
          },
        ]);

        await transaction.insert(authSessions).values([
          {
            expiresAt: future,
            id: `${operatorId}_session`,
            issuedAt: now,
            providerSessionId: `${operatorId}_provider_session`,
            sessionReferenceHash: hashAuthSessionReference(operatorReference),
            status: "active",
            userId: operatorId,
          },
          {
            expiresAt: future,
            id: `${otherOperatorId}_session`,
            issuedAt: now,
            providerSessionId: `${otherOperatorId}_provider_session`,
            sessionReferenceHash: hashAuthSessionReference(otherOperatorReference),
            status: "active",
            userId: otherOperatorId,
          },
        ]);

        const authRepository = createAuthSessionRepository(transaction);
        const trialRunRepository = createV0TrialRunRepository(transaction);

        const missingCookie = await handleV0TrialRunListRoute(
          authRepository,
          trialRunRepository,
          new Request(scopedUrl(tenantId, teamId)),
        );
        expectStatus("missing cookie", missingCookie, 401);
        expectNoStore("missing cookie", missingCookie);
        expectNoSensitive("missing cookie", await readJson(missingCookie));

        const missingScope = await handleV0TrialRunListRoute(
          authRepository,
          trialRunRepository,
          requestWithCookie("https://operation.local/api/trial-runs", operatorReference),
        );
        expectStatus("missing scope", missingScope, 400);
        expectNoStore("missing scope", missingScope);

        const missingCsrf = await handleV0TrialRunCreateRoute(
          authRepository,
          trialRunRepository,
          jsonRequest({
            body: {
              evaluatorRole: "live_operator",
            },
            sessionReference: operatorReference,
            url: scopedUrl(tenantId, teamId),
          }),
        );
        expectStatus("missing csrf", missingCsrf, 403);
        expectNoStore("missing csrf", missingCsrf);

        const created = await handleV0TrialRunCreateRoute(
          authRepository,
          trialRunRepository,
          jsonRequest({
            body: {
              evaluatorRole: "live_operator",
            },
            csrf: true,
            sessionReference: operatorReference,
            url: scopedUrl(tenantId, teamId),
          }),
        );
        expectStatus("create run", created, 201);
        expectNoStore("create run", created);
        const createdBody = await readJson(created);
        const run = getResponseObject(createdBody, "run");
        const runId = String(run.id);
        const steps = getResponseArray(run, "steps");
        expect(steps.length === 6, "created run should include six steps");
        expectNoSensitive("create run", createdBody);

        const listed = await handleV0TrialRunListRoute(
          authRepository,
          trialRunRepository,
          requestWithCookie(scopedUrl(tenantId, teamId), operatorReference),
        );
        expectStatus("list runs", listed, 200);
        const listedBody = await readJson(listed);
        expect(getResponseArray(listedBody, "runs").length === 1, "list should include scoped run");
        expect(
          getResponseObject(listedBody, "summary").totalRuns === 1,
          "summary should count scoped run",
        );

        const detail = await handleV0TrialRunDetailRoute(
          authRepository,
          trialRunRepository,
          requestWithCookie(scopedUrl(tenantId, teamId, `/api/trial-runs/${runId}`), operatorReference),
          { runId },
        );
        expectStatus("run detail", detail, 200);
        expectNoStore("run detail", detail);
        expect(getResponseObject(await readJson(detail), "run").id === runId, "detail should return scoped run");

        const invalidDetail = await handleV0TrialRunDetailRoute(
          authRepository,
          trialRunRepository,
          requestWithCookie(scopedUrl(tenantId, teamId, "/api/trial-runs/missing"), operatorReference),
          { runId: "missing" },
        );
        expectStatus("invalid run detail", invalidDetail, 404);
        expectNoSensitive("invalid run detail", await readJson(invalidDetail));

        const missingStepCsrf = await handleV0TrialRunStepUpdateRoute(
          authRepository,
          trialRunRepository,
          jsonRequest({
            body: {
              note: "",
              status: "passed",
            },
            method: "PATCH",
            sessionReference: operatorReference,
            url: scopedUrl(tenantId, teamId, `/api/trial-runs/${runId}/steps/sessions`),
          }),
          { runId, stepId: "sessions" },
        );
        expectStatus("missing step csrf", missingStepCsrf, 403);

        const issueWithoutNote = await handleV0TrialRunStepUpdateRoute(
          authRepository,
          trialRunRepository,
          jsonRequest({
            body: {
              frictionType: "ai_quality",
              note: "",
              status: "issue",
            },
            csrf: true,
            method: "PATCH",
            sessionReference: operatorReference,
            url: scopedUrl(tenantId, teamId, `/api/trial-runs/${runId}/steps/ai_review`),
          }),
          { runId, stepId: "ai_review" },
        );
        expectStatus("issue without note", issueWithoutNote, 400);

        const sensitiveStepNote = await handleV0TrialRunStepUpdateRoute(
          authRepository,
          trialRunRepository,
          jsonRequest({
            body: {
              frictionType: "source_trust",
              note: "误粘了 Bearer sk-sensitive-value",
              status: "issue",
            },
            csrf: true,
            method: "PATCH",
            sessionReference: operatorReference,
            url: scopedUrl(tenantId, teamId, `/api/trial-runs/${runId}/steps/knowledge`),
          }),
          { runId, stepId: "knowledge" },
        );
        expectStatus("sensitive step note", sensitiveStepNote, 422);
        expectNoSensitive("sensitive step note", await readJson(sensitiveStepNote));

        const passedSessions = await handleV0TrialRunStepUpdateRoute(
          authRepository,
          trialRunRepository,
          jsonRequest({
            body: {
              note: "",
              status: "passed",
            },
            csrf: true,
            method: "PATCH",
            sessionReference: operatorReference,
            url: scopedUrl(tenantId, teamId, `/api/trial-runs/${runId}/steps/sessions`),
          }),
          { runId, stepId: "sessions" },
        );
        expectStatus("pass sessions step", passedSessions, 200);
        expectNoStore("pass sessions step", passedSessions);

        const completeWithPending = await handleV0TrialRunCompleteRoute(
          authRepository,
          trialRunRepository,
          jsonRequest({
            body: {
              status: "completed",
              summaryNote: "尝试提前完成。",
            },
            csrf: true,
            method: "PATCH",
            sessionReference: operatorReference,
            url: scopedUrl(tenantId, teamId, `/api/trial-runs/${runId}`),
          }),
          { runId },
        );
        expectStatus("complete with pending steps", completeWithPending, 400);

        const remainingSteps = ["rackets", "knowledge", "ai_review", "talk_tracks", "next_actions"] as const;
        for (const stepId of remainingSteps) {
          const updated = await handleV0TrialRunStepUpdateRoute(
            authRepository,
            trialRunRepository,
            jsonRequest({
              body: {
                note: "",
                status: "passed",
              },
              csrf: true,
              method: "PATCH",
              sessionReference: operatorReference,
              url: scopedUrl(tenantId, teamId, `/api/trial-runs/${runId}/steps/${stepId}`),
            }),
            { runId, stepId },
          );
          expectStatus(`pass ${stepId} step`, updated, 200);
        }

        const completed = await handleV0TrialRunCompleteRoute(
          authRepository,
          trialRunRepository,
          jsonRequest({
            body: {
              status: "completed",
              summaryNote: "六步演示路径已完成，可继续收集反馈。",
            },
            csrf: true,
            method: "PATCH",
            sessionReference: operatorReference,
            url: scopedUrl(tenantId, teamId, `/api/trial-runs/${runId}`),
          }),
          { runId },
        );
        expectStatus("complete run", completed, 200);
        const completedRun = getResponseObject(await readJson(completed), "run");
        expect(completedRun.status === "completed", "completed route should complete run");

        const otherRun = await trialRunRepository.startRun(
          {
            actorId: otherOperatorId,
            permissions: ["read_workspace"],
            requestId: `${checkId}_other_request`,
            role: "operator",
            teamId: otherTeamId,
            tenantId,
          },
          {
            evaluatorRole: "reviewer",
            metadata: {
              hidden: "other_team_hidden_run",
            },
          },
        );

        const crossScopeDetail = await handleV0TrialRunDetailRoute(
          authRepository,
          trialRunRepository,
          requestWithCookie(scopedUrl(tenantId, teamId, `/api/trial-runs/${otherRun.id}`), operatorReference),
          { runId: otherRun.id },
        );
        expectStatus("cross-scope detail", crossScopeDetail, 404);
        expectNoSensitive("cross-scope detail", await readJson(crossScopeDetail));

        throw new ExpectedRollback();
      });
    } catch (error) {
      if (!(error instanceof ExpectedRollback)) {
        throw error;
      }
    }

    console.log("V0 trial run route check passed; transaction rolled back.");
  } finally {
    await client.end();
  }
}

main().catch((error: unknown) => {
  const message =
    error instanceof Error ? error.message : "Unknown V0 trial run route check failure";

  console.error(message);
  process.exit(1);
});
