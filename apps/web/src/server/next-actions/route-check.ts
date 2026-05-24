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
  createNextSessionTaskRepository,
  type NextSessionTaskRepositoryDatabase,
} from "./repository";
import {
  handleNextActionTaskChecklistRoute,
  handleNextActionTaskCompleteRoute,
  handleNextActionTaskDependencyCreateRoute,
  handleNextActionTaskDependencyUpdateRoute,
  handleNextActionTaskDetailRoute,
  handleNextActionTaskFeedbackSignalRoute,
  handleNextActionTaskReviewResultRoute,
  handleNextActionTasksCreateRoute,
  handleNextActionTasksListRoute,
  handleNextActionTaskStatusRoute,
  NEXT_SESSION_TASK_MUTATION_CSRF_HEADER_NAME,
  NEXT_SESSION_TASK_MUTATION_CSRF_HEADER_VALUE,
} from "./route";

class ExpectedRollback extends Error {
  constructor() {
    super("Rollback local next-session task route check");
  }
}

type JsonObject = Record<string, unknown>;

function scopedUrl(
  tenantId: string,
  teamId: string,
  path = "/api/next-actions/tasks",
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
      NEXT_SESSION_TASK_MUTATION_CSRF_HEADER_NAME,
      NEXT_SESSION_TASK_MUTATION_CSRF_HEADER_VALUE,
    );
  }

  return new Request(input.url, {
    method: input.method ?? "POST",
    headers,
    body: JSON.stringify(input.body ?? {}),
  });
}

function createTaskInput(seed: string, ownerId: string) {
  return {
    task: {
      title: "补齐高端进攻拍价格异议回应",
      summary: "把本场高频价格异议整理成直播前可审核的回应准备项。",
      taskType: "fix_talk_track" as const,
      priority: "high" as const,
      ownerId,
      targetSessionId: `${seed}_next_session`,
      deadlinePolicy: "before_next_session" as const,
      reviewRequired: true,
      relatedRacketProductIds: [`${seed}_racket_astrox_100zz`],
    },
    source: {
      sourceWorkflow: "manual" as const,
      sourceId: `${seed}_manual_follow_up`,
      sourceState: "manual" as const,
      sensitiveRedactionState: "not_needed" as const,
    },
    checklist: [
      {
        title: "整理价格异议的两句回应",
        required: true,
      },
      {
        title: "标注适用球拍和适合人群",
        required: false,
      },
    ],
  };
}

async function readJson(response: Response): Promise<JsonObject> {
  const body = await response.json();

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new Error("Next-action route response was not a JSON object");
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
    "other_team_hidden_next_task",
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

function getFirstChecklistItem(task: JsonObject): string {
  const checklist = task.checklist;

  if (!Array.isArray(checklist)) {
    throw new Error("task response did not include checklist");
  }

  const item = checklist[0];

  if (!item || typeof item !== "object" || Array.isArray(item)) {
    throw new Error("task response did not include first checklist item");
  }

  return getNestedString(item as JsonObject, "id", "task checklist");
}

async function main() {
  const { client, db } = createDatabaseConnection();
  const checkId = `next_actions_route_check_${Date.now()}`;

  try {
    try {
      await db.transaction(async (transaction) => {
        const tenantId = `${checkId}_tenant`;
        const teamId = `${checkId}_team`;
        const otherTeamId = `${checkId}_other_team`;
        const operatorId = `${checkId}_operator`;
        const ownerId = `${checkId}_host`;
        const reviewerId = `${checkId}_reviewer`;
        const viewerId = `${checkId}_viewer`;
        const inactiveOwnerId = `${checkId}_inactive_owner`;
        const operatorReference = createAuthSessionReference();
        const ownerReference = createAuthSessionReference();
        const reviewerReference = createAuthSessionReference();
        const viewerReference = createAuthSessionReference();
        const now = new Date();
        const future = new Date(Date.now() + 60 * 60 * 1000);

        await transaction.insert(tenants).values({
          id: tenantId,
          name: "Local next-action route check",
          defaultTeamId: teamId,
        });

        await transaction.insert(teams).values([
          {
            id: teamId,
            tenantId,
            name: "Next-action route team",
            createdBy: operatorId,
          },
          {
            id: otherTeamId,
            tenantId,
            name: "Other next-action route team",
            createdBy: operatorId,
          },
        ]);

        await transaction.insert(appUsers).values([
          {
            id: operatorId,
            displayName: "Task Operator",
            primaryEmail: `${operatorId}@example.invalid`,
            status: "active",
          },
          {
            id: ownerId,
            displayName: "Task Owner",
            primaryEmail: `${ownerId}@example.invalid`,
            status: "active",
          },
          {
            id: reviewerId,
            displayName: "Task Reviewer",
            primaryEmail: `${reviewerId}@example.invalid`,
            status: "active",
          },
          {
            id: viewerId,
            displayName: "Readonly Viewer",
            primaryEmail: `${viewerId}@example.invalid`,
            status: "active",
          },
          {
            id: inactiveOwnerId,
            displayName: "Inactive Owner",
            primaryEmail: `${inactiveOwnerId}@example.invalid`,
            status: "active",
          },
        ]);

        await transaction.insert(tenantMemberships).values(
          [operatorId, ownerId, reviewerId, viewerId, inactiveOwnerId].map(
            (userId) => ({
              id: `${userId}_tenant_membership`,
              tenantId,
              userId,
              status: "active" as const,
              tenantRole: "member" as const,
              joinedAt: now,
            }),
          ),
        );

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
            id: `${ownerId}_team_membership`,
            tenantId,
            teamId,
            userId: ownerId,
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
          {
            id: `${inactiveOwnerId}_team_membership`,
            tenantId,
            teamId,
            userId: inactiveOwnerId,
            status: "suspended",
            role: "host",
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
            id: `${checkId}_owner_session`,
            userId: ownerId,
            sessionReferenceHash: hashAuthSessionReference(ownerReference),
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
        const nextActionRepository = createNextSessionTaskRepository(
          transaction as unknown as NextSessionTaskRepositoryDatabase,
        );

        const noCookie = await handleNextActionTasksListRoute(
          authRepository,
          nextActionRepository,
          new Request(scopedUrl(tenantId, teamId)),
        );
        expectStatus("no-cookie list", noCookie, 401);
        expectNoStore("no-cookie list", noCookie);

        const missingScope = await handleNextActionTasksListRoute(
          authRepository,
          nextActionRepository,
          requestWithCookie("https://operation.local/api/next-actions/tasks", operatorReference),
        );
        expectStatus("missing-scope list", missingScope, 400);

        const noCsrf = await handleNextActionTasksCreateRoute(
          authRepository,
          nextActionRepository,
          jsonRequest({
            url: scopedUrl(tenantId, teamId),
            sessionReference: operatorReference,
            body: createTaskInput(checkId, ownerId),
          }),
        );
        expectStatus("task create without csrf", noCsrf, 403);

        const viewerCreate = await handleNextActionTasksCreateRoute(
          authRepository,
          nextActionRepository,
          jsonRequest({
            url: scopedUrl(tenantId, teamId),
            sessionReference: viewerReference,
            csrf: true,
            body: createTaskInput(`${checkId}_viewer`, ownerId),
          }),
        );
        expectStatus("viewer task create", viewerCreate, 403);

        const createResponse = await handleNextActionTasksCreateRoute(
          authRepository,
          nextActionRepository,
          jsonRequest({
            url: scopedUrl(tenantId, teamId),
            sessionReference: operatorReference,
            csrf: true,
            body: createTaskInput(checkId, ownerId),
          }),
        );
        expectStatus("task create", createResponse, 201);
        const createBody = await readJson(createResponse);
        const task = getNestedObject(createBody, "task", "task create");
        const taskId = getNestedString(task, "id", "task create");
        const checklistItemId = getFirstChecklistItem(task);

        const listResponse = await handleNextActionTasksListRoute(
          authRepository,
          nextActionRepository,
          requestWithCookie(scopedUrl(tenantId, teamId), operatorReference),
        );
        expectStatus("task list", listResponse, 200);
        expectNoStore("task list", listResponse);

        const detailResponse = await handleNextActionTaskDetailRoute(
          authRepository,
          nextActionRepository,
          requestWithCookie(
            scopedUrl(tenantId, teamId, `/api/next-actions/tasks/${taskId}`),
            operatorReference,
          ),
          { taskId },
        );
        expectStatus("task detail", detailResponse, 200);

        const duplicateResponse = await handleNextActionTasksCreateRoute(
          authRepository,
          nextActionRepository,
          jsonRequest({
            url: scopedUrl(tenantId, teamId),
            sessionReference: operatorReference,
            csrf: true,
            body: createTaskInput(checkId, ownerId),
          }),
        );
        expectStatus("duplicate task", duplicateResponse, 409);

        const inactiveOwnerResponse = await handleNextActionTasksCreateRoute(
          authRepository,
          nextActionRepository,
          jsonRequest({
            url: scopedUrl(tenantId, teamId),
            sessionReference: operatorReference,
            csrf: true,
            body: createTaskInput(`${checkId}_inactive`, inactiveOwnerId),
          }),
        );
        expectStatus("inactive owner", inactiveOwnerResponse, 422);

        const otherTeamDetail = await handleNextActionTaskDetailRoute(
          authRepository,
          nextActionRepository,
          requestWithCookie(
            scopedUrl(tenantId, otherTeamId, `/api/next-actions/tasks/${taskId}`),
            operatorReference,
          ),
          { taskId },
        );
        expectStatus("cross-team detail", otherTeamDetail, 404);

        const startResponse = await handleNextActionTaskStatusRoute(
          authRepository,
          nextActionRepository,
          jsonRequest({
            url: scopedUrl(tenantId, teamId, `/api/next-actions/tasks/${taskId}/status`),
            method: "PATCH",
            sessionReference: ownerReference,
            csrf: true,
            body: {
              fromStatus: "assigned",
              toStatus: "in_progress",
            },
          }),
          { taskId },
        );
        expectStatus("owner starts task", startResponse, 200);

        const checklistBlockedComplete = await handleNextActionTaskCompleteRoute(
          authRepository,
          nextActionRepository,
          jsonRequest({
            url: scopedUrl(tenantId, teamId, `/api/next-actions/tasks/${taskId}/complete`),
            sessionReference: ownerReference,
            csrf: true,
            body: {
              fromStatus: "in_progress",
              resultSummary: "已整理价格异议回应。",
            },
          }),
          { taskId },
        );
        expectStatus("checklist blocked complete", checklistBlockedComplete, 422);

        const checklistResponse = await handleNextActionTaskChecklistRoute(
          authRepository,
          nextActionRepository,
          jsonRequest({
            url: scopedUrl(
              tenantId,
              teamId,
              `/api/next-actions/tasks/${taskId}/checklist/${checklistItemId}`,
            ),
            method: "PATCH",
            sessionReference: ownerReference,
            csrf: true,
            body: {
              status: "done",
            },
          }),
          { taskId, itemId: checklistItemId },
        );
        expectStatus("checklist update", checklistResponse, 200);

        const dependencyResponse = await handleNextActionTaskDependencyCreateRoute(
          authRepository,
          nextActionRepository,
          jsonRequest({
            url: scopedUrl(tenantId, teamId, `/api/next-actions/tasks/${taskId}/dependencies`),
            sessionReference: operatorReference,
            csrf: true,
            body: {
              dependsOnType: "knowledge_version",
              dependsOnId: `${checkId}_knowledge_version`,
              dependencyState: "pending",
              reason: "等待商品负责人核对知识版本。",
            },
          }),
          { taskId },
        );
        expectStatus("dependency create", dependencyResponse, 201);
        const dependencyBody = await readJson(dependencyResponse);
        const dependencyId = getNestedString(
          getNestedObject(dependencyBody, "dependency", "dependency create"),
          "id",
          "dependency create",
        );

        const dependencyBlockedComplete = await handleNextActionTaskCompleteRoute(
          authRepository,
          nextActionRepository,
          jsonRequest({
            url: scopedUrl(tenantId, teamId, `/api/next-actions/tasks/${taskId}/complete`),
            sessionReference: ownerReference,
            csrf: true,
            body: {
              fromStatus: "in_progress",
              resultSummary: "已整理价格异议回应。",
            },
          }),
          { taskId },
        );
        expectStatus("dependency blocked complete", dependencyBlockedComplete, 422);

        const dependencyUpdate = await handleNextActionTaskDependencyUpdateRoute(
          authRepository,
          nextActionRepository,
          jsonRequest({
            url: scopedUrl(
              tenantId,
              teamId,
              `/api/next-actions/tasks/${taskId}/dependencies/${dependencyId}`,
            ),
            method: "PATCH",
            sessionReference: operatorReference,
            csrf: true,
            body: {
              dependencyState: "satisfied",
              reason: "知识版本已核对。",
            },
          }),
          { taskId, dependencyId },
        );
        expectStatus("dependency update", dependencyUpdate, 200);

        const completeResponse = await handleNextActionTaskCompleteRoute(
          authRepository,
          nextActionRepository,
          jsonRequest({
            url: scopedUrl(tenantId, teamId, `/api/next-actions/tasks/${taskId}/complete`),
            sessionReference: ownerReference,
            csrf: true,
            body: {
              fromStatus: "in_progress",
              resultSummary: "已整理价格异议回应。",
            },
          }),
          { taskId },
        );
        expectStatus("task complete", completeResponse, 200);
        const completeBody = await readJson(completeResponse);
        const completedTask = getNestedObject(completeBody, "task", "task complete");

        if (completedTask.status !== "reviewing") {
          throw new Error("review-required complete should move task to reviewing");
        }

        const reviewResponse = await handleNextActionTaskReviewResultRoute(
          authRepository,
          nextActionRepository,
          jsonRequest({
            url: scopedUrl(tenantId, teamId, `/api/next-actions/tasks/${taskId}/review-results`),
            sessionReference: reviewerReference,
            csrf: true,
            body: {
              decision: "approve_close",
              reason: "下场准备项已完成。",
              resultSummary: "价格异议回应已整理并核对。",
            },
          }),
          { taskId },
        );
        expectStatus("task review close", reviewResponse, 200);

        const feedbackResponse = await handleNextActionTaskFeedbackSignalRoute(
          authRepository,
          nextActionRepository,
          jsonRequest({
            url: scopedUrl(tenantId, teamId, `/api/next-actions/tasks/${taskId}/feedback-signals`),
            sessionReference: operatorReference,
            csrf: true,
            body: {
              sourceWorkflow: "manual",
              signalType: "helped_next_session",
              reason: "主播下场前直接使用了该准备项。",
              routesTo: "workflow_review",
            },
          }),
          { taskId },
        );
        expectStatus("task feedback", feedbackResponse, 201);

        expectNoSensitive("task response", createBody, [
          operatorReference,
          ownerReference,
          reviewerReference,
          viewerReference,
        ]);
        expectNoSensitive("feedback response", await readJson(feedbackResponse), [
          operatorReference,
          ownerReference,
          reviewerReference,
          viewerReference,
        ]);

        throw new ExpectedRollback();
      });
    } catch (error) {
      if (error instanceof ExpectedRollback) {
        console.log("Next-session task route check passed with rollback");
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
