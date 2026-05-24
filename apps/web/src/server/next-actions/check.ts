import { createDatabaseConnection } from "../db/client";
import { parseDataAccessContext, type DataAccessContext } from "../db/context";
import {
  appUsers,
  teamMemberships,
  teams,
  tenantMemberships,
  tenants,
} from "../db/schema";
import {
  createNextSessionTaskRepository,
  type NextSessionTaskRepositoryDatabase,
} from "./repository";

class ExpectedRollback extends Error {
  constructor() {
    super("Rollback local next-session task persistence check");
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
    if (
      error instanceof Error &&
      "code" in error &&
      error.code === expectedCode
    ) {
      return;
    }

    throw new Error(`${label} failed with unexpected rejection`);
  }

  throw new Error(`${label} should have been rejected`);
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

async function main() {
  const { client, db } = createDatabaseConnection();
  const checkId = `next_actions_check_${Date.now()}`;

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

        await transaction.insert(tenants).values({
          id: tenantId,
          name: "Local next-session task persistence check",
          defaultTeamId: teamId,
        });

        await transaction.insert(teams).values([
          {
            id: teamId,
            tenantId,
            name: "Next actions team",
            createdBy: operatorId,
          },
          {
            id: otherTeamId,
            tenantId,
            name: "Other next actions team",
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
              joinedAt: new Date(),
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
            joinedAt: new Date(),
          },
          {
            id: `${ownerId}_team_membership`,
            tenantId,
            teamId,
            userId: ownerId,
            status: "active",
            role: "host",
            joinedAt: new Date(),
          },
          {
            id: `${reviewerId}_team_membership`,
            tenantId,
            teamId,
            userId: reviewerId,
            status: "active",
            role: "reviewer",
            joinedAt: new Date(),
          },
          {
            id: `${viewerId}_team_membership`,
            tenantId,
            teamId,
            userId: viewerId,
            status: "active",
            role: "viewer",
            joinedAt: new Date(),
          },
          {
            id: `${inactiveOwnerId}_team_membership`,
            tenantId,
            teamId,
            userId: inactiveOwnerId,
            status: "suspended",
            role: "host",
          },
          {
            id: `${operatorId}_other_team_membership`,
            tenantId,
            teamId: otherTeamId,
            userId: operatorId,
            status: "active",
            role: "operator",
            joinedAt: new Date(),
          },
          {
            id: `${ownerId}_other_team_membership`,
            tenantId,
            teamId: otherTeamId,
            userId: ownerId,
            status: "active",
            role: "host",
            joinedAt: new Date(),
          },
        ]);

        const operatorContext = parseDataAccessContext({
          requestId: `${checkId}_operator_request`,
          actorId: operatorId,
          tenantId,
          teamId,
          role: "operator",
          permissions: ["read_workspace", "manage_next_tasks"],
        });

        const ownerContext = parseDataAccessContext({
          requestId: `${checkId}_owner_request`,
          actorId: ownerId,
          tenantId,
          teamId,
          role: "host",
          permissions: ["read_workspace"],
        });

        const reviewerContext = parseDataAccessContext({
          requestId: `${checkId}_reviewer_request`,
          actorId: reviewerId,
          tenantId,
          teamId,
          role: "reviewer",
          permissions: ["read_workspace", "manage_next_tasks"],
        });

        const viewerContext: DataAccessContext = parseDataAccessContext({
          requestId: `${checkId}_viewer_request`,
          actorId: viewerId,
          tenantId,
          teamId,
          role: "viewer",
          permissions: ["read_workspace"],
        });

        const otherTeamContext = parseDataAccessContext({
          ...operatorContext,
          requestId: `${checkId}_other_team_request`,
          teamId: otherTeamId,
        });

        const repository = createNextSessionTaskRepository(
          transaction as unknown as NextSessionTaskRepositoryDatabase,
        );

        const task = await repository.createNextSessionTask(
          operatorContext,
          createTaskInput(checkId, ownerId),
        );

        if (
          task.title !== "补齐高端进攻拍价格异议回应" ||
          task.status !== "assigned" ||
          task.checklistProgress.total !== 2 ||
          task.checklistProgress.completed !== 0
        ) {
          throw new Error("Created task view is missing task details");
        }

        await expectRejected(
          "duplicate active task",
          () =>
            repository.createNextSessionTask(
              operatorContext,
              createTaskInput(checkId, ownerId),
            ),
          "DUPLICATE_TASK",
        );

        await expectRejected(
          "missing permission",
          () =>
            repository.createNextSessionTask(
              viewerContext,
              createTaskInput(`${checkId}_viewer`, ownerId),
            ),
          "FORBIDDEN_PERMISSION",
        );

        await expectRejected(
          "inactive owner",
          () =>
            repository.createNextSessionTask(
              operatorContext,
              createTaskInput(`${checkId}_inactive`, inactiveOwnerId),
            ),
          "ASSIGNEE_NOT_ACTIVE",
        );

        await expectRejected(
          "blocked sensitive source",
          () =>
            repository.createNextSessionTask(operatorContext, {
              ...createTaskInput(`${checkId}_sensitive`, ownerId),
              source: {
                sourceWorkflow: "manual" as const,
                sourceId: `${checkId}_blocked_source`,
                sourceState: "manual" as const,
                sensitiveRedactionState: "blocked" as const,
              },
            }),
          "SENSITIVE_DATA_BLOCKED",
        );

        const sensitiveDraft = await repository.createNextSessionTask(
          operatorContext,
          {
            ...createTaskInput(`${checkId}_needs_review`, ownerId),
            task: {
              ...createTaskInput(`${checkId}_needs_review`, ownerId).task,
              ownerId: undefined,
            },
            source: {
              sourceWorkflow: "manual" as const,
              sourceId: `${checkId}_needs_review_source`,
              sourceState: "manual" as const,
              sensitiveRedactionState: "needs_review" as const,
            },
          },
        );

        if (
          sensitiveDraft.status !== "draft" ||
          !sensitiveDraft.readiness.blockedBy.includes("sensitive_data_needs_review")
        ) {
          throw new Error("Sensitive review task should remain a blocked draft");
        }

        const listed = await repository.listNextSessionTasks(operatorContext, {
          limit: 20,
        });

        if (listed.items.length !== 2) {
          throw new Error("Scoped task list should include only current team tasks");
        }

        await repository.createNextSessionTask(
          otherTeamContext,
          createTaskInput(checkId, ownerId),
        );

        const afterOtherTeamCreate = await repository.listNextSessionTasks(
          operatorContext,
          { limit: 20 },
        );

        if (afterOtherTeamCreate.items.length !== 2) {
          throw new Error("Scoped task list leaked another team's task");
        }

        const started = await repository.updateNextSessionTaskStatus(
          ownerContext,
          {
            taskId: task.id,
            fromStatus: "assigned",
            toStatus: "in_progress",
            reason: "开始整理下场直播话术。",
          },
        );

        if (started.status !== "in_progress") {
          throw new Error("Owner progress transition should start the task");
        }

        await expectRejected(
          "stale status update",
          () =>
            repository.updateNextSessionTaskStatus(ownerContext, {
              taskId: task.id,
              fromStatus: "assigned",
              toStatus: "in_progress",
              reason: "旧状态不应再能更新。",
            }),
          "TASK_STATE_CONFLICT",
        );

        const detail = await repository.getNextSessionTask(operatorContext, {
          taskId: task.id,
        });
        const requiredItem = detail.checklist.find((item) => item.required);

        if (!requiredItem) {
          throw new Error("Task detail should include required checklist item");
        }

        await expectRejected(
          "required checklist blocks completion",
          () =>
            repository.completeNextSessionTask(ownerContext, {
              taskId: task.id,
              fromStatus: "in_progress",
              resultSummary: "价格异议回应已整理。",
            }),
          "CHECKLIST_REQUIRED_INCOMPLETE",
        );

        await repository.updateTaskChecklistItem(ownerContext, {
          taskId: task.id,
          itemId: requiredItem.id,
          status: "done",
        });

        const dependency = await repository.recordTaskDependency(
          operatorContext,
          {
            taskId: task.id,
            dependsOnType: "knowledge_version",
            dependsOnId: `${checkId}_knowledge_version`,
            dependencyState: "pending",
            reason: "等待知识审核通过后再关闭任务。",
          },
        );

        await expectRejected(
          "dependency blocks completion",
          () =>
            repository.completeNextSessionTask(ownerContext, {
              taskId: task.id,
              fromStatus: "in_progress",
              resultSummary: "价格异议回应已整理。",
            }),
          "DEPENDENCY_BLOCKED",
        );

        await repository.updateTaskDependencyState(operatorContext, {
          taskId: task.id,
          dependencyId: dependency.id,
          dependencyState: "satisfied",
          reason: "知识审核已完成。",
        });

        const reviewing = await repository.completeNextSessionTask(ownerContext, {
          taskId: task.id,
          fromStatus: "in_progress",
          resultSummary: "价格异议回应已整理并等待审核。",
        });

        if (reviewing.status !== "reviewing") {
          throw new Error("Review-required task should enter reviewing");
        }

        const closed = await repository.recordTaskReviewResult(reviewerContext, {
          taskId: task.id,
          decision: "approve_close",
          reason: "回应内容可用于下一场直播。",
          resultSummary: "已关闭，可复用。",
        });

        if (closed.status !== "closed") {
          throw new Error("Reviewer approval should close the task");
        }

        await repository.recordTaskFeedbackSignal(operatorContext, {
          taskId: task.id,
          sourceWorkflow: "manual",
          signalType: "helped_next_session",
          reason: "主播下一场直播前直接复用了该准备项。",
          routesTo: "team_review",
        });

        throw new ExpectedRollback();
      });
    } catch (error) {
      if (!(error instanceof ExpectedRollback)) {
        throw error;
      }
    }

    console.log(
      "Next-session task persistence check passed; transaction rolled back.",
    );
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(
    error instanceof Error
      ? error.message
      : "Unknown next-actions:check failure",
  );
  process.exitCode = 1;
});
