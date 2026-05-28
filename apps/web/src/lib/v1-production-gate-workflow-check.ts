import {
  buildV1ProductionGateWorkflow,
  v1ProductionGateIds,
  type V1ProductionGateAssessment,
} from "./v1-production-gate-workflow"
import type { V0TrialReadinessCockpit } from "./v0-trial-readiness-cockpit"

function expect(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message)
  }
}

function cockpit(
  stage: V0TrialReadinessCockpit["stage"],
): V0TrialReadinessCockpit {
  return {
    acceptancePackage: {
      blockerSummary:
        stage === "fix_blockers"
          ? "AI 复盘质量影响真实工作信心。"
          : "暂无严重阻断信号。",
      decision:
        stage === "prepare_production_gate"
          ? "plan_production_gate"
          : stage === "fix_blockers"
            ? "fix_blockers"
            : stage === "ready_for_internal_trial"
              ? "expand_internal_trial"
              : "collect_more_evidence",
      decisionLabel:
        stage === "prepare_production_gate"
          ? "通过内部 V0，进入生产门禁"
          : "补齐验收证据",
      evidenceItems: [],
      gateSummary:
        "生产化仍需：生产登录/邀请、HTTPS 域名、备份恢复、敏感数据治理、RAG/Q&A 评测、监控与脱敏日志。",
      headline:
        stage === "prepare_production_gate"
          ? "V0 可冻结，生产门禁单独推进"
          : "V0 验收还缺证据",
      nextAction: {
        href: null,
        label:
          stage === "prepare_production_gate"
            ? "梳理生产门禁清单"
            : "补齐试用证据",
      },
      summary:
        stage === "prepare_production_gate"
          ? "当前证据支持冻结内部 V0 验收，下一步只讨论生产门禁。"
          : "当前 V0 不应冻结验收。",
    },
    checklist: [],
    evidenceReview: {
      actions:
        stage === "prepare_production_gate"
          ? [
              {
                detail:
                  "内部 V0 可以冻结，下一轮从生产登录、HTTPS、备份和敏感数据门禁中选一组推进。",
                href: null,
                id: "production_gate",
                label: "规划生产门禁",
              },
            ]
          : [
              {
                detail: "先补齐完整路径证据。",
                href: "/trial",
                id: "complete_path",
                label: "补齐完整路径",
              },
            ],
      boundaryLabel: "内部 V0 完成不等于生产可用，生产门禁单独推进。",
      completePathLabel:
        stage === "prepare_production_gate" ? "完整路径已通过" : "完整路径待补齐",
      evidenceBalance:
        stage === "prepare_production_gate"
          ? "完整路径已通过，反馈适合作为下一轮 V0/V1 排序依据。"
          : "还缺完整路径和反馈样本。",
      evidenceStrengthLabel:
        stage === "prepare_production_gate" ? "强证据" : "证据不足",
      headline:
        stage === "prepare_production_gate"
          ? "V0 可冻结，生产门禁另开"
          : "先补齐试用证据",
      summary:
        stage === "prepare_production_gate"
          ? "内部 V0 可以作为可用版冻结。"
          : "当前还不适合启动新的 V1 大功能。",
    },
    headline:
      stage === "prepare_production_gate"
        ? "可以开始梳理生产化前置门禁"
        : "V0.9 还需要更多试用证据",
    nextAction: {
      href: null,
      label:
        stage === "prepare_production_gate"
          ? "梳理生产门禁清单"
          : "补齐试用证据",
    },
    productionGateItems: [
      "生产登录/邀请",
      "HTTPS 域名",
      "备份恢复",
      "敏感数据治理",
      "RAG/Q&A 评测",
      "监控与脱敏日志",
    ],
    rationale:
      stage === "prepare_production_gate"
        ? "内部试用证据暂未暴露严重卡点；生产登录、HTTPS、备份、敏感数据和监控仍需单独门禁。"
        : "先按六个已实现工作面跑完整路径。",
    stage,
    stageLabel:
      stage === "prepare_production_gate" ? "准备生产门禁" : "继续收集",
  }
}

function assertNoSensitiveLeak(assessment: V1ProductionGateAssessment) {
  const text = JSON.stringify(assessment)
  const forbidden = [
    "sk-sensitive-value",
    "sk-",
    "postgres://",
    "DATABASE_URL",
    "Set-Cookie",
    "Authorization",
    "session_ref",
    "raw prompt",
  ]

  for (const token of forbidden) {
    expect(!text.includes(token), `assessment leaked sensitive token: ${token}`)
  }
}

function main() {
  const collectEvidence = buildV1ProductionGateWorkflow({
    cockpit: cockpit("collect_evidence"),
  })
  expect(
    collectEvidence.stage === "v0_evidence_required",
    "sparse V0 evidence should keep the V1 gate on evidence collection",
  )
  expect(
    collectEvidence.nextWave.id === "complete-v0-trial-evidence",
    "sparse V0 evidence should recommend completing V0 evidence first",
  )

  const blockerRepair = buildV1ProductionGateWorkflow({
    cockpit: cockpit("fix_blockers"),
  })
  expect(
    blockerRepair.stage === "v0_blocker_repair",
    "V0 blockers should keep production gate planning blocked",
  )
  expect(
    blockerRepair.currentBlockers[0]?.includes("V0"),
    "V0 blocker assessment should surface V0 repair first",
  )

  const productionGate = buildV1ProductionGateWorkflow({
    cockpit: cockpit("prepare_production_gate"),
  })
  expect(
    productionGate.stage === "v1_gate_planning",
    "strong V0 evidence should hand off to V1 gate planning",
  )
  expect(
    productionGate.internalV0Label.includes("可冻结"),
    "V1 gate should identify internal V0 as freezable",
  )
  expect(
    productionGate.controlledRealTrialReady === false,
    "V1 gate should keep controlled real trial blocked",
  )
  expect(
    productionGate.gates.map((gate) => gate.id).join(",") ===
      v1ProductionGateIds.join(","),
    "V1 gate order should stay stable",
  )
  expect(
    productionGate.gates.some(
      (gate) => gate.id === "https_domain" && gate.status === "blocked",
    ),
    "HTTPS/domain should remain a blocked production gate",
  )
  expect(
    !productionGate.gates.some((gate) => String(gate.status) === "passed"),
    "no production gate should be passed by internal V0 evidence alone",
  )
  expect(
    productionGate.nextWave.id === "production-access-transport-gate",
    "strong V0 evidence should recommend production access and HTTPS as next wave",
  )
  expect(
    productionGate.supportingEvidence.some((item) =>
      item.includes("Docker"),
    ),
    "preview Docker restart policy should be supporting evidence only",
  )
  assertNoSensitiveLeak(productionGate)

  console.log("V1 production gate workflow check passed")
}

main()
