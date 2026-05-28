import type { V0TrialReadinessCockpit } from "./v0-trial-readiness-cockpit"

export type V1ProductionGateStage =
  | "v0_evidence_required"
  | "v0_blocker_repair"
  | "internal_trial_expansion"
  | "v1_gate_planning"

export type V1ProductionGateId =
  | "production_access"
  | "https_domain"
  | "backup_restore"
  | "sensitive_data_governance"
  | "ai_rag_evaluation"
  | "observability_redaction"

export type V1ProductionGateStatus = "blocked" | "deferred" | "planned"

export type V1ProductionGateItem = {
  blocker: string
  evidence: string
  id: V1ProductionGateId
  nextAction: string
  status: V1ProductionGateStatus
  statusLabel: string
  title: string
}

export type V1ProductionGateNextWave = {
  id:
    | "complete-v0-trial-evidence"
    | "repair-v0-trial-blockers"
    | "expand-internal-trial-evidence"
    | "production-access-transport-gate"
  summary: string
  title: string
}

export type V1ProductionGateAssessment = {
  controlledRealTrialReady: boolean
  currentBlockers: string[]
  gates: V1ProductionGateItem[]
  headline: string
  internalV0Label: string
  nextWave: V1ProductionGateNextWave
  stage: V1ProductionGateStage
  stageLabel: string
  summary: string
  supportingEvidence: string[]
}

export const v1ProductionGateIds: V1ProductionGateId[] = [
  "production_access",
  "https_domain",
  "backup_restore",
  "sensitive_data_governance",
  "ai_rag_evaluation",
  "observability_redaction",
]

const gateStatusLabels: Record<V1ProductionGateStatus, string> = {
  blocked: "阻断",
  deferred: "后置",
  planned: "已规划",
}

const baseGates: V1ProductionGateItem[] = [
  {
    blocker: "还没有生产登录 provider、公开登录路由、团队切换和邀请闭环。",
    evidence: "已有本地 guard、session、cookie、logout 和 trial gate，只能支撑内部试用。",
    id: "production_access",
    nextAction: "比较并接受生产登录、邀请和团队切换方案。",
    status: "blocked",
    statusLabel: gateStatusLabels.blocked,
    title: "生产访问",
  },
  {
    blocker: "当前公网预览是 HTTP IP 访问，不能作为正式试用入口。",
    evidence: "Docker 预览可恢复，但 HTTPS 域名和正式发布路径仍未接受。",
    id: "https_domain",
    nextAction: "确定域名、TLS、反向代理或生产部署入口。",
    status: "blocked",
    statusLabel: gateStatusLabels.blocked,
    title: "HTTPS 域名",
  },
  {
    blocker: "真实业务数据需要备份、恢复演练和保留策略。",
    evidence: "本地 PostgreSQL 和迁移已可用，但生产备份恢复策略未定义。",
    id: "backup_restore",
    nextAction: "定义备份频率、恢复演练、保留周期和回滚路径。",
    status: "blocked",
    statusLabel: gateStatusLabels.blocked,
    title: "备份恢复",
  },
  {
    blocker: "真实客户、订单、私信、转录和价格策略需要数据分级与日志边界。",
    evidence: "现有规则要求脱敏和最小必要数据，尚未形成 V1 真实数据策略。",
    id: "sensitive_data_governance",
    nextAction: "定义可录入数据范围、脱敏规则、截图/导出边界和日志禁区。",
    status: "blocked",
    statusLabel: gateStatusLabels.blocked,
    title: "敏感数据",
  },
  {
    blocker: "真实模型、RAG 或 Q&A 不能只靠单次生成证明质量。",
    evidence: "已有 DeepSeek provider gate 和 AI 复盘执行链路，正式评测仍未建立。",
    id: "ai_rag_evaluation",
    nextAction: "建立代表性样例、来源覆盖、失败用例和人工复核门槛。",
    status: "deferred",
    statusLabel: gateStatusLabels.deferred,
    title: "AI/RAG 评测",
  },
  {
    blocker: "真实试用需要请求级排障线索，同时不能记录敏感 payload。",
    evidence: "已有安全规则和 Docker healthcheck，正式观测事件和日志策略未接受。",
    id: "observability_redaction",
    nextAction: "定义 requestId、审计事件、错误分级、脱敏日志和告警边界。",
    status: "deferred",
    statusLabel: gateStatusLabels.deferred,
    title: "观测脱敏",
  },
]

function stageLabel(stage: V1ProductionGateStage): string {
  switch (stage) {
    case "v0_evidence_required":
      return "先补 V0 证据"
    case "v0_blocker_repair":
      return "先修 V0 卡点"
    case "internal_trial_expansion":
      return "继续内测"
    case "v1_gate_planning":
      return "V1 门禁规划"
  }
}

function nextWaveForStage(
  stage: V1ProductionGateStage,
): V1ProductionGateNextWave {
  switch (stage) {
    case "v0_evidence_required":
      return {
        id: "complete-v0-trial-evidence",
        summary: "先补完整路径、运行记录和反馈样本，再讨论真实数据试用。",
        title: "补齐 V0 试用证据",
      }
    case "v0_blocker_repair":
      return {
        id: "repair-v0-trial-blockers",
        summary: "先处理当前影响真实使用信心的 V0 卡点。",
        title: "修复 V0 试用卡点",
      }
    case "internal_trial_expansion":
      return {
        id: "expand-internal-trial-evidence",
        summary: "继续扩大内部试用样本，确认不同角色都能跑完闭环。",
        title: "扩大内部试用证据",
      }
    case "v1_gate_planning":
      return {
        id: "production-access-transport-gate",
        summary: "优先把生产登录、邀请、团队边界和 HTTPS 入口作为一个门禁波次推进。",
        title: "生产访问与 HTTPS 门禁",
      }
  }
}

function stageFromCockpit(
  cockpit: V0TrialReadinessCockpit,
): V1ProductionGateStage {
  switch (cockpit.stage) {
    case "collect_evidence":
      return "v0_evidence_required"
    case "fix_blockers":
      return "v0_blocker_repair"
    case "ready_for_internal_trial":
      return "internal_trial_expansion"
    case "prepare_production_gate":
      return "v1_gate_planning"
  }
}

function headlineForStage(stage: V1ProductionGateStage): string {
  switch (stage) {
    case "v0_evidence_required":
      return "真实试用前先补齐 V0 证据"
    case "v0_blocker_repair":
      return "真实试用前先修 V0 卡点"
    case "internal_trial_expansion":
      return "继续扩大内部试用，暂不接真实数据"
    case "v1_gate_planning":
      return "V0 可冻结，V1 真实试用仍需过门禁"
  }
}

function summaryForStage(stage: V1ProductionGateStage): string {
  switch (stage) {
    case "v0_evidence_required":
      return "当前证据不足，不适合启动生产门禁实现。先跑完整路径并收集反馈。"
    case "v0_blocker_repair":
      return "当前仍有会影响真实工作的卡点，先修复 V0 体验和质量问题。"
    case "internal_trial_expansion":
      return "V0 可继续内部试用，但真实数据仍需生产访问、HTTPS、备份和敏感数据门禁。"
    case "v1_gate_planning":
      return "内部 V0 可以作为可用版冻结；受控真实试用仍被生产访问、HTTPS、备份和数据治理阻断。"
  }
}

function currentBlockersForStage(input: {
  cockpit: V0TrialReadinessCockpit
  stage: V1ProductionGateStage
}): string[] {
  switch (input.stage) {
    case "v0_evidence_required":
      return ["V0 完整路径、运行记录或反馈样本仍未补齐。"]
    case "v0_blocker_repair":
      return [`V0 卡点未处理：${input.cockpit.acceptancePackage.blockerSummary}`]
    case "internal_trial_expansion":
      return [
        "内部试用样本还需要扩大。",
        "生产登录、HTTPS、备份和敏感数据门禁尚未通过。",
      ]
    case "v1_gate_planning":
      return baseGates
        .filter((gate) => gate.status === "blocked")
        .map((gate) => `${gate.title}：${gate.blocker}`)
  }
}

function supportingEvidenceForStage(
  stage: V1ProductionGateStage,
  cockpit: V0TrialReadinessCockpit,
): string[] {
  const support = [
    "Docker preview 使用 restart policy，支持服务器或 Docker daemon 重启后的预览恢复。",
  ]

  if (stage === "v1_gate_planning") {
    support.unshift(`${cockpit.evidenceReview.completePathLabel}，可作为 V0 冻结证据。`)
  } else {
    support.unshift("V0 证据尚未完成，不能作为真实数据试用依据。")
  }

  return support
}

export function buildV1ProductionGateWorkflow(input: {
  cockpit: V0TrialReadinessCockpit
}): V1ProductionGateAssessment {
  const stage = stageFromCockpit(input.cockpit)

  return {
    controlledRealTrialReady: false,
    currentBlockers: currentBlockersForStage({
      cockpit: input.cockpit,
      stage,
    }),
    gates: baseGates,
    headline: headlineForStage(stage),
    internalV0Label:
      stage === "v1_gate_planning" ? "内部 V0 可冻结" : "内部 V0 待补证据",
    nextWave: nextWaveForStage(stage),
    stage,
    stageLabel: stageLabel(stage),
    summary: summaryForStage(stage),
    supportingEvidence: supportingEvidenceForStage(stage, input.cockpit),
  }
}
