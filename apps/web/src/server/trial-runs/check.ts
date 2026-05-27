import { createDatabaseConnection } from "../db/client";
import type { DataAccessContext } from "../db/context";
import {
  appUsers,
  authSessions,
  teamMemberships,
  teams,
  tenantMemberships,
  tenants,
} from "../db/schema";
import {
  createAuthSessionReference,
  hashAuthSessionReference,
} from "../auth";
import { createV0TrialFeedbackRepository } from "../trial-feedback/repository";
import { createV0TrialRunRepository } from "./repository";

class ExpectedRollback extends Error {
  constructor() {
    super("Rollback local V0 trial run check");
  }
}

function expect(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function expectNoSensitive(label: string, value: unknown) {
  const serialized = JSON.stringify(value);

  for (const leaked of [
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

function dataContext(input: {
  actorId: string;
  requestId: string;
  teamId: string;
  tenantId: string;
}): DataAccessContext {
  return {
    actorId: input.actorId,
    permissions: ["read_workspace"],
    requestId: input.requestId,
    role: "operator",
    teamId: input.teamId,
    tenantId: input.tenantId,
  };
}

async function main() {
  const { client, db } = createDatabaseConnection();
  const checkId = `trial_run_check_${Date.now()}`;

  try {
    try {
      await db.transaction(async (transaction) => {
        const tenantId = `${checkId}_tenant`;
        const teamId = `${checkId}_team`;
        const otherTeamId = `${checkId}_other_team`;
        const operatorId = `${checkId}_operator`;
        const otherOperatorId = `${checkId}_other_operator`;
        const operatorReference = createAuthSessionReference();
        const now = new Date();
        const future = new Date(Date.now() + 60 * 60 * 1000);
        const context = dataContext({
          actorId: operatorId,
          requestId: `${checkId}_request`,
          teamId,
          tenantId,
        });
        const otherContext = dataContext({
          actorId: otherOperatorId,
          requestId: `${checkId}_other_request`,
          teamId: otherTeamId,
          tenantId,
        });

        await transaction.insert(tenants).values({
          defaultTeamId: teamId,
          id: tenantId,
          name: "Local trial run check",
        });

        await transaction.insert(teams).values([
          {
            createdBy: operatorId,
            id: teamId,
            name: "Trial run team",
            tenantId,
          },
          {
            createdBy: otherOperatorId,
            id: otherTeamId,
            name: "Other trial run team",
            tenantId,
          },
        ]);

        await transaction.insert(appUsers).values([
          {
            displayName: "Trial Run Operator",
            id: operatorId,
            primaryEmail: `${operatorId}@example.invalid`,
            status: "active",
          },
          {
            displayName: "Other Trial Run Operator",
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

        await transaction.insert(authSessions).values({
          expiresAt: future,
          id: `${operatorId}_session`,
          issuedAt: now,
          providerSessionId: `${operatorId}_provider_session`,
          sessionReferenceHash: hashAuthSessionReference(operatorReference),
          status: "active",
          userId: operatorId,
        });

        const trialRuns = createV0TrialRunRepository(transaction);
        const feedback = createV0TrialFeedbackRepository(transaction);

        const started = await trialRuns.startRun(context, {
          evaluatorRole: "live_operator",
        });

        expect(started.status === "active", "started run should be active");
        expect(started.steps.length === 6, "started run should create six steps");
        expect(
          started.steps.every((step) => step.status === "pending"),
          "started run steps should be pending",
        );

        const afterOneStep = await trialRuns.updateStep(context, started.id, "sessions", {
          note: "",
          status: "passed",
        });

        expect(
          afterOneStep.steps.find((step) => step.stepId === "sessions")?.status === "passed",
          "sessions step should be passed",
        );

        let missingIssueNoteRejected = false;
        try {
          await trialRuns.updateStep(context, started.id, "ai_review", {
            frictionType: "ai_quality",
            note: "",
            status: "issue",
          });
        } catch {
          missingIssueNoteRejected = true;
        }
        expect(missingIssueNoteRejected, "issue step without note should be rejected");

        const withIssue = await trialRuns.updateStep(context, started.id, "ai_review", {
          frictionType: "ai_quality",
          note: "复盘建议能用，但证据说明还需要更清楚。",
          status: "issue",
        });

        expect(
          withIssue.summary.issueStepCount === 1,
          "summary should count issue steps",
        );

        let sensitiveNoteRejected = false;
        try {
          await trialRuns.updateStep(context, started.id, "knowledge", {
            frictionType: "source_trust",
            note: "误粘了 Bearer sk-sensitive-value",
            status: "issue",
          });
        } catch {
          sensitiveNoteRejected = true;
        }
        expect(sensitiveNoteRejected, "sensitive step note should be rejected");

        const feedbackItem = await feedback.createFeedback(context, {
          clarityRating: 4,
          evaluatorRole: "live_operator",
          issueType: "ai_quality",
          note: "这条反馈来自完整试用运行中的 AI 复盘步骤。",
          pagePath: "/ai-review",
          realWorkSignal: "maybe",
          trialRunId: started.id,
          trialRunStepId: withIssue.steps.find((step) => step.stepId === "ai_review")?.id,
          usefulnessRating: 4,
          workbench: "ai_review",
        });

        expect(
          feedbackItem.trialRunId === started.id,
          "linked feedback should keep run id",
        );
        expect(
          feedbackItem.trialRunStepId !== null,
          "linked feedback should keep step id",
        );

        const completedSteps = ["rackets", "knowledge", "talk_tracks", "next_actions"] as const;
        for (const stepId of completedSteps) {
          await trialRuns.updateStep(context, started.id, stepId, {
            note: "",
            status: "passed",
          });
        }

        const completed = await trialRuns.completeRun(context, started.id, {
          summaryNote: "完整路径已跑完，AI 复盘步骤仍有证据说明卡点。",
        });

        expect(completed.status === "completed", "run should be completed");
        expect(completed.completedAt !== null, "completed run should have timestamp");
        expect(
          completed.summary.completedRunCount === 1,
          "summary should count completed run",
        );
        expect(
          completed.summary.nextAction.href === "/ai-review",
          "issue step should route next action to AI review",
        );

        const listed = await trialRuns.listRuns(context, { limit: 10 });
        expect(listed.items.length === 1, "list should include scoped run");
        expect(listed.summary.totalRuns === 1, "summary should include one run");
        expectNoSensitive("trial run list", listed);

        const otherStarted = await trialRuns.startRun(otherContext, {
          evaluatorRole: "reviewer",
          metadata: {
            hidden: "other_team_hidden_run",
          },
        });
        expect(otherStarted.id !== started.id, "other run should be separate");

        const listedAgain = await trialRuns.listRuns(context, { limit: 10 });
        expect(
          listedAgain.items.length === 1,
          "list should not include other team run",
        );
        expectNoSensitive("scoped trial run list", listedAgain);

        let crossScopeRejected = false;
        try {
          await trialRuns.getRun(context, otherStarted.id);
        } catch {
          crossScopeRejected = true;
        }
        expect(crossScopeRejected, "cross-scope run detail should be rejected");

        throw new ExpectedRollback();
      });
    } catch (error) {
      if (!(error instanceof ExpectedRollback)) {
        throw error;
      }
    }

    console.log("V0 trial run check passed; transaction rolled back.");
  } finally {
    await client.end();
  }
}

main().catch((error: unknown) => {
  const message =
    error instanceof Error ? error.message : "Unknown V0 trial run check failure";

  console.error(message);
  process.exit(1);
});
