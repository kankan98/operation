import {
  buildTrialWorkflowReadinessSummary,
  type TrialWorkflowStepCheck,
} from "./trial-workflow-readiness"
import { buildV0TrialReadinessCockpit } from "./v0-trial-readiness-cockpit"
import type { V0TrialFeedbackEvidenceSummary } from "./v0-trial-feedback"
import type {
  V0TrialRunDetail,
  V0TrialRunStepId,
  V0TrialRunStepStatus,
  V0TrialRunSummary,
} from "./v0-trial-runs"

function expect(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message)
  }
}

function acceptancePackage(
  cockpit: ReturnType<typeof buildV0TrialReadinessCockpit>,
) {
  return (
    cockpit as ReturnType<typeof buildV0TrialReadinessCockpit> & {
      acceptancePackage?: {
        decision: string
        decisionLabel: string
        evidenceItems: {
          id: string
          status: string
        }[]
        nextAction: {
          href: string | null
          label: string
        }
      }
    }
  ).acceptancePackage
}

function evidenceReview(
  cockpit: ReturnType<typeof buildV0TrialReadinessCockpit>,
) {
  return (
    cockpit as ReturnType<typeof buildV0TrialReadinessCockpit> & {
      evidenceReview?: {
        actions: {
          href: string | null
          id: string
          label: string
        }[]
        boundaryLabel: string
        completePathLabel: string
        evidenceBalance: string
        evidenceStrengthLabel: string
        headline: string
      }
    }
  ).evidenceReview
}

function workflow(counts: number[]): ReturnType<typeof buildTrialWorkflowReadinessSummary> {
  const ids = [
    "sessions",
    "rackets",
    "knowledge",
    "ai-review",
    "talk-tracks",
    "next-actions",
  ] as const
  const checks: TrialWorkflowStepCheck[] = ids.map((id, index) => ({
    count: counts[index] ?? 0,
    id,
    ok: true,
  }))

  return buildTrialWorkflowReadinessSummary(checks)
}

function workflowWithError(): ReturnType<typeof buildTrialWorkflowReadinessSummary> {
  return buildTrialWorkflowReadinessSummary([
    {
      id: "sessions",
      message: "failed",
      ok: false,
    },
  ])
}

function evidence(
  overrides: Partial<V0TrialFeedbackEvidenceSummary> = {},
): V0TrialFeedbackEvidenceSummary {
  return {
    completedRunFeedbackCount: 0,
    hotspots: [],
    includedCount: 3,
    issueTypeCounts: [],
    linkedRunFeedbackCount: 0,
    lowClarityCount: 0,
    lowUsefulnessCount: 0,
    realWorkSignals: {
      maybe: 1,
      no: 0,
      not_sure: 0,
      unknown: 0,
      yes: 2,
    },
    recentNotes: [],
    recommendation: {
      focus: "production_readiness",
      issueType: null,
      rationale: "可以开始梳理生产门禁。",
      workbench: null,
    },
    totalCount: 3,
    workbenchCounts: [],
    ...overrides,
  }
}

const trialRunStepIds: V0TrialRunStepId[] = [
  "sessions",
  "rackets",
  "knowledge",
  "ai_review",
  "talk_tracks",
  "next_actions",
]

function trialRun(input: {
  runStatus?: V0TrialRunDetail["status"]
  statuses: Record<V0TrialRunStepId, V0TrialRunStepStatus>
}): V0TrialRunDetail {
  const completedAt =
    input.runStatus === "completed" ? "2026-05-28T00:00:00.000Z" : null

  return {
    actorId: "operator_v0",
    completedAt,
    createdAt: "2026-05-28T00:00:00.000Z",
    evaluatorRole: "live_operator",
    id: "trialrun_readiness_check",
    startedAt: "2026-05-28T00:00:00.000Z",
    status: input.runStatus ?? "active",
    steps: trialRunStepIds.map((stepId) => ({
      completedAt:
        input.statuses[stepId] === "pending"
          ? null
          : "2026-05-28T00:00:00.000Z",
      frictionType: input.statuses[stepId] === "issue" ? "workflow_break" : null,
      id: `trialstep_${stepId}`,
      note: input.statuses[stepId] === "pending" ? "" : "已记录步骤状态。",
      runId: "trialrun_readiness_check",
      status: input.statuses[stepId],
      stepId,
      updatedAt: "2026-05-28T00:00:00.000Z",
    })),
    summary: trialRunSummary(input.statuses, input.runStatus ?? "active"),
    summaryNote: "",
    teamId: "operation_v0_live_team",
    tenantId: "operation_v0_tenant",
    updatedAt: "2026-05-28T00:00:00.000Z",
  }
}

function trialRunSummary(
  statuses: Record<V0TrialRunStepId, V0TrialRunStepStatus>,
  runStatus: V0TrialRunDetail["status"],
): V0TrialRunSummary {
  const pendingStep = trialRunStepIds.find((stepId) => statuses[stepId] === "pending")
  const blockerStep = trialRunStepIds.find(
    (stepId) => statuses[stepId] === "issue" || statuses[stepId] === "skipped",
  )

  return {
    activeRunCount: runStatus === "active" ? 1 : 0,
    completedRunCount: runStatus === "completed" ? 1 : 0,
    issueStepCount: trialRunStepIds.filter((stepId) => statuses[stepId] === "issue").length,
    latestRunId: "trialrun_readiness_check",
    nextAction: blockerStep
      ? {
          href: stepHref(blockerStep),
          label: "处理试用卡点",
          stepId: blockerStep,
        }
      : pendingStep
        ? {
            href: stepHref(pendingStep),
            label: "继续试用路径",
            stepId: pendingStep,
          }
        : {
            href: null,
            label: "试用运行已完成",
            stepId: null,
          },
    skippedStepCount: trialRunStepIds.filter((stepId) => statuses[stepId] === "skipped").length,
    stepCoverage: trialRunStepIds.reduce(
      (coverage, stepId) => ({
        ...coverage,
        [stepId]: statuses[stepId] === "pending" ? 0 : 1,
      }),
      {} as V0TrialRunSummary["stepCoverage"],
    ),
    totalRuns: 1,
  }
}

function stepHref(stepId: V0TrialRunStepId): string {
  switch (stepId) {
    case "sessions":
      return "/sessions"
    case "rackets":
      return "/rackets"
    case "knowledge":
      return "/knowledge"
    case "ai_review":
      return "/ai-review"
    case "talk_tracks":
      return "/talk-tracks"
    case "next_actions":
      return "/next-actions"
  }
}

const passedStatuses: Record<V0TrialRunStepId, V0TrialRunStepStatus> = {
  ai_review: "passed",
  knowledge: "passed",
  next_actions: "passed",
  rackets: "passed",
  sessions: "passed",
  talk_tracks: "passed",
}

function main() {
  const partial = buildV0TrialReadinessCockpit({
    evidence: null,
    workflow: workflow([1, 0, 0, 0, 0, 0]),
  })
  expect(partial.stage === "collect_evidence", "partial workflow should collect evidence")
  expect(partial.nextAction.href === "/rackets", "partial workflow should point at first empty step")
  expect(partial.checklist.length === 6, "checklist should cover six V0 steps")
  expect(
    acceptancePackage(partial)?.decision === "collect_more_evidence",
    "partial workflow should keep acceptance in evidence collection",
  )
  expect(
    acceptancePackage(partial)?.evidenceItems.some(
      (item) => item.id === "workflow" && item.status === "missing",
    ) === true,
    "partial workflow acceptance should mark workflow evidence missing",
  )

  const sparse = buildV0TrialReadinessCockpit({
    evidence: evidence({
      includedCount: 2,
      totalCount: 2,
      recommendation: {
        focus: "collect_more_feedback",
        issueType: null,
        rationale: "反馈样本还不足。",
        workbench: null,
      },
    }),
    workflow: workflow([1, 1, 1, 1, 1, 1]),
  })
  expect(sparse.stage === "collect_evidence", "sparse feedback should collect evidence")
  expect(sparse.nextAction.href === null, "sparse feedback should not force a workbench href")

  const blocker = buildV0TrialReadinessCockpit({
    evidence: evidence({
      lowUsefulnessCount: 1,
      recommendation: {
        focus: "ai_quality",
        issueType: "ai_quality",
        rationale: "AI 复盘质量影响真实工作信心。",
        workbench: "trial",
      },
      totalCount: 3,
    }),
    workflow: workflow([1, 1, 1, 1, 1, 1]),
  })
  expect(blocker.stage === "fix_blockers", "low rating should fix blockers")
  expect(blocker.nextAction.href === "/ai-review", "trial AI blocker should point at AI review")
  expect(
    acceptancePackage(blocker)?.decision === "fix_blockers",
    "feedback blocker should keep acceptance in blocker repair",
  )
  expect(
    acceptancePackage(blocker)?.nextAction.href === "/ai-review",
    "feedback blocker acceptance should point at blocker workbench",
  )

  const errored = buildV0TrialReadinessCockpit({
    evidence: evidence(),
    workflow: workflowWithError(),
  })
  expect(errored.stage === "fix_blockers", "workflow error should fix blockers")

  const ready = buildV0TrialReadinessCockpit({
    evidence: evidence({
      recommendation: {
        focus: "collect_more_feedback",
        issueType: null,
        rationale: "反馈可继续补充。",
        workbench: null,
      },
      totalCount: 3,
    }),
    trialRun: trialRun({
      runStatus: "completed",
      statuses: passedStatuses,
    }),
    workflow: workflow([1, 1, 1, 1, 1, 1]),
  })
  expect(ready.stage === "ready_for_internal_trial", "complete low-risk workflow should be internal ready")
  expect(
    acceptancePackage(ready)?.decision === "expand_internal_trial",
    "complete low-risk workflow should pass internal V0 acceptance",
  )
  expect(
    acceptancePackage(ready)?.evidenceItems.every(
      (item) => item.status === "pass" || item.status === "attention",
    ) === true,
    "accepted internal V0 package should have passing or attention evidence only",
  )

  const missingRunEvidence = buildV0TrialReadinessCockpit({
    evidence: evidence(),
    trialRun: null,
    workflow: workflow([1, 1, 1, 1, 1, 1]),
  })
  expect(
    missingRunEvidence.stage === "collect_evidence",
    "missing trial run evidence should keep collecting evidence",
  )
  expect(
    missingRunEvidence.nextAction.label.includes("试用运行"),
    "missing trial run evidence should recommend starting a guided run",
  )
  expect(
    evidenceReview(missingRunEvidence)?.actions[0]?.id === "complete_path",
    "missing trial run review should prioritize complete-path evidence",
  )
  expect(
    evidenceReview(missingRunEvidence)?.evidenceBalance.includes("反馈未绑定完整路径"),
    "missing trial run review should avoid overweighting loose feedback",
  )

  const pendingRunEvidence = buildV0TrialReadinessCockpit({
    evidence: evidence(),
    trialRun: trialRun({
      statuses: {
        ...passedStatuses,
        ai_review: "pending",
      },
    }),
    workflow: workflow([1, 1, 1, 1, 1, 1]),
  })
  expect(
    pendingRunEvidence.stage === "collect_evidence",
    "pending trial run should keep collecting evidence",
  )
  expect(
    pendingRunEvidence.nextAction.href === "/ai-review",
    "pending trial run should point at the pending workbench",
  )

  const blockerRunEvidence = buildV0TrialReadinessCockpit({
    evidence: evidence(),
    trialRun: trialRun({
      runStatus: "completed",
      statuses: {
        ...passedStatuses,
        knowledge: "issue",
      },
    }),
    workflow: workflow([1, 1, 1, 1, 1, 1]),
  })
  expect(
    blockerRunEvidence.stage === "fix_blockers",
    "trial run blockers should keep readiness in fix-blockers",
  )
  expect(
    blockerRunEvidence.nextAction.href === "/knowledge",
    "trial run blocker should point at blocker workbench",
  )
  expect(
    evidenceReview(blockerRunEvidence)?.actions[0]?.href === "/knowledge",
    "trial run blocker review should point at blocker workbench first",
  )
  expect(
    evidenceReview(blockerRunEvidence)?.actions[0]?.label.includes("先修卡点"),
    "trial run blocker review should label blocker priority",
  )

  const productionGate = buildV0TrialReadinessCockpit({
    evidence: evidence(),
    trialRun: trialRun({
      runStatus: "completed",
      statuses: passedStatuses,
    }),
    workflow: workflow([1, 1, 1, 1, 1, 1]),
  })
  expect(
    productionGate.stage === "prepare_production_gate",
    "production recommendation should prepare production gate",
  )
  expect(
    productionGate.productionGateItems.includes("HTTPS 域名"),
    "production gate copy should keep HTTPS as separate gate",
  )
  expect(
    acceptancePackage(productionGate)?.decision === "plan_production_gate",
    "production recommendation should map acceptance to production gate planning",
  )
  expect(
    acceptancePackage(productionGate)?.decisionLabel.includes("生产门禁"),
    "production acceptance label should keep production gate wording",
  )
  expect(
    evidenceReview(productionGate)?.completePathLabel === "完整路径已通过",
    "production review should identify complete-path evidence",
  )
  expect(
    evidenceReview(productionGate)?.evidenceStrengthLabel === "强证据",
    "production review should mark completed path and sufficient feedback as strong evidence",
  )
  expect(
    evidenceReview(productionGate)?.actions[0]?.id === "production_gate",
    "production review should point at production gate planning first",
  )
  expect(
    evidenceReview(productionGate)?.boundaryLabel.includes("生产门禁"),
    "production review should preserve production boundary",
  )

  console.log("V0 trial readiness cockpit check passed")
}

main()
