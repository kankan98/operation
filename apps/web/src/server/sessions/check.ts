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
  createSessionCaptureRepository,
  type SessionCaptureRepositoryDatabase,
} from "./repository";

class ExpectedRollback extends Error {
  constructor() {
    super("Rollback local session capture persistence check");
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

function createSessionInput(input: {
  title: string;
  sessionDate: Date;
  hostId: string;
}) {
  return {
    title: input.title,
    sessionDate: input.sessionDate,
    platform: "douyin" as const,
    sourceMode: "manual" as const,
    summary: "围绕中高级球友的进攻拍选择做手动复盘。",
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

function expectBlockedBy(
  context: string,
  blockedBy: string[],
  expectedBlocker: string,
) {
  if (!blockedBy.includes(expectedBlocker)) {
    throw new Error(`${context} missing blocker ${expectedBlocker}`);
  }
}

async function main() {
  const { client, db } = createDatabaseConnection();
  const checkId = `sessions_check_${Date.now()}`;

  try {
    try {
      await db.transaction(async (transaction) => {
        const tenantId = `${checkId}_tenant`;
        const teamId = `${checkId}_team`;
        const otherTeamId = `${checkId}_other_team`;
        const operatorId = `${checkId}_operator`;
        const viewerId = `${checkId}_viewer`;
        const hostId = `${checkId}_host`;

        await transaction.insert(tenants).values({
          id: tenantId,
          name: "Local session capture persistence check",
          defaultTeamId: teamId,
        });

        await transaction.insert(teams).values([
          {
            id: teamId,
            tenantId,
            name: "Live operations team",
            createdBy: operatorId,
          },
          {
            id: otherTeamId,
            tenantId,
            name: "Second live operations team",
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
            joinedAt: new Date(),
          },
          {
            id: `${viewerId}_tenant_membership`,
            tenantId,
            userId: viewerId,
            status: "active",
            tenantRole: "viewer",
            joinedAt: new Date(),
          },
          {
            id: `${hostId}_tenant_membership`,
            tenantId,
            userId: hostId,
            status: "active",
            tenantRole: "member",
            joinedAt: new Date(),
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
            joinedAt: new Date(),
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
            id: `${viewerId}_team_membership`,
            tenantId,
            teamId,
            userId: viewerId,
            status: "active",
            role: "viewer",
            joinedAt: new Date(),
          },
          {
            id: `${hostId}_team_membership`,
            tenantId,
            teamId,
            userId: hostId,
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
          permissions: ["read_workspace", "capture_session"],
        });

        const otherTeamContext = parseDataAccessContext({
          ...operatorContext,
          requestId: `${checkId}_other_team_request`,
          teamId: otherTeamId,
        });

        const viewerContext: DataAccessContext = parseDataAccessContext({
          requestId: `${checkId}_viewer_request`,
          actorId: viewerId,
          tenantId,
          teamId,
          role: "viewer",
          permissions: ["read_workspace"],
        });

        const repository = createSessionCaptureRepository(
          transaction as unknown as SessionCaptureRepositoryDatabase,
        );

        const sessionDate = new Date("2026-05-23T12:00:00.000Z");
        const created = await repository.createSessionCapture(
          operatorContext,
          createSessionInput({
            title: "高端进攻拍对比",
            sessionDate,
            hostId,
          }),
        );

        if (
          created.title !== "高端进攻拍对比" ||
          created.draftVersion !== 1 ||
          created.hostRoles.length !== 1 ||
          created.productOrder.length !== 1
        ) {
          throw new Error("Created session view is missing structured details");
        }

        expectBlockedBy(
          "draft AI readiness",
          created.downstreamReadiness.find((entry) => entry.workflow === "ai_review")
            ?.blockedBy ?? [],
          "not_submitted",
        );

        const listed = await repository.listSessionCaptures(operatorContext, {
          limit: 10,
        });

        if (listed.items.length !== 1 || listed.items[0]?.id !== created.id) {
          throw new Error("Scoped session list did not return the created record");
        }

        await expectRejected(
          "duplicate session label",
          () =>
            repository.createSessionCapture(
              operatorContext,
              createSessionInput({
                title: " 高端 进攻拍 对比 ",
                sessionDate: new Date("2026-05-23T19:30:00.000Z"),
                hostId,
              }),
            ),
          "DUPLICATE_SESSION_LABEL",
        );

        await expectRejected(
          "missing permission",
          () =>
            repository.createSessionCapture(
              viewerContext,
              createSessionInput({
                title: "速度拍答疑专场",
                sessionDate,
                hostId,
              }),
            ),
          "FORBIDDEN_PERMISSION",
        );

        const autosaved = await repository.autosaveSessionDraft(
          operatorContext,
          {
            sessionId: created.id,
            draftVersion: created.draftVersion,
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
        );

        if (autosaved.draftVersion !== created.draftVersion + 1) {
          throw new Error("Autosave did not increment draft version");
        }

        await expectRejected(
          "stale draft",
          () =>
            repository.autosaveSessionDraft(operatorContext, {
              sessionId: created.id,
              draftVersion: created.draftVersion,
              summary: "旧版本草稿不应覆盖新版本。",
            }),
          "STALE_DRAFT_VERSION",
        );

        const submitted = await repository.submitSessionCapture(
          operatorContext,
          {
            sessionId: created.id,
            draftVersion: autosaved.draftVersion,
          },
        );

        const aiReadiness = submitted.downstreamReadiness.find(
          (entry) => entry.workflow === "ai_review",
        );

        if (submitted.status !== "review_ready" || !aiReadiness?.ready) {
          throw new Error("Submitted session should be review-ready for AI review");
        }

        await repository.createSessionCapture(
          otherTeamContext,
          createSessionInput({
            title: "高端进攻拍对比",
            sessionDate,
            hostId,
          }),
        );

        const afterOtherTeamCreate = await repository.listSessionCaptures(
          operatorContext,
          { limit: 10 },
        );

        if (afterOtherTeamCreate.items.length !== 1) {
          throw new Error("Scoped session list leaked another team's record");
        }

        throw new ExpectedRollback();
      });
    } catch (error) {
      if (!(error instanceof ExpectedRollback)) {
        throw error;
      }
    }

    console.log("Session capture persistence check passed; transaction rolled back.");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(
    error instanceof Error
      ? error.message
      : "Unknown sessions:check failure",
  );
  process.exitCode = 1;
});
