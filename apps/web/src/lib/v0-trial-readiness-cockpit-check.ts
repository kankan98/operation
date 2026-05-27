import {
  buildTrialWorkflowReadinessSummary,
  type TrialWorkflowStepCheck,
} from "./trial-workflow-readiness"
import { buildV0TrialReadinessCockpit } from "./v0-trial-readiness-cockpit"
import type { V0TrialFeedbackEvidenceSummary } from "./v0-trial-feedback"

function expect(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message)
  }
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
    hotspots: [],
    includedCount: 3,
    issueTypeCounts: [],
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

function main() {
  const partial = buildV0TrialReadinessCockpit({
    evidence: null,
    workflow: workflow([1, 0, 0, 0, 0, 0]),
  })
  expect(partial.stage === "collect_evidence", "partial workflow should collect evidence")
  expect(partial.nextAction.href === "/rackets", "partial workflow should point at first empty step")
  expect(partial.checklist.length === 6, "checklist should cover six V0 steps")

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
    workflow: workflow([1, 1, 1, 1, 1, 1]),
  })
  expect(ready.stage === "ready_for_internal_trial", "complete low-risk workflow should be internal ready")

  const productionGate = buildV0TrialReadinessCockpit({
    evidence: evidence(),
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

  console.log("V0 trial readiness cockpit check passed")
}

main()
