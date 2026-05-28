import {
  trialWorkflowSteps,
  type TrialWorkflowReadinessSummary,
  type TrialWorkflowStepId,
  type TrialWorkflowStepSummary,
} from "./trial-workflow-readiness"
import type {
  V0TrialFeedbackEvidenceFocus,
  V0TrialFeedbackEvidenceSummary,
  V0TrialFeedbackIssueType,
  V0TrialFeedbackWorkbench,
} from "./v0-trial-feedback"
import type {
  V0TrialRunDetail,
  V0TrialRunStepId,
} from "./v0-trial-runs"

export type V0TrialReadinessStage =
  | "collect_evidence"
  | "fix_blockers"
  | "ready_for_internal_trial"
  | "prepare_production_gate"

export type V0TrialAcceptanceDecision =
  | "collect_more_evidence"
  | "fix_blockers"
  | "expand_internal_trial"
  | "plan_production_gate"

export type V0TrialAcceptanceEvidenceStatus =
  | "attention"
  | "blocked"
  | "missing"
  | "pass"

export type V0TrialAcceptanceEvidenceItem = {
  detail: string
  id: "feedback" | "risk" | "run" | "workflow"
  label: string
  status: V0TrialAcceptanceEvidenceStatus
  statusLabel: string
  value: string
}

export type V0TrialAcceptancePackage = {
  blockerSummary: string
  decision: V0TrialAcceptanceDecision
  decisionLabel: string
  evidenceItems: V0TrialAcceptanceEvidenceItem[]
  gateSummary: string
  headline: string
  nextAction: {
    href: string | null
    label: string
  }
  summary: string
}

export type V0TrialEvidenceReviewActionId =
  | "collect_feedback"
  | "complete_path"
  | "expand_internal_trial"
  | "fix_blocker"
  | "production_gate"

export type V0TrialEvidenceReviewAction = {
  detail: string
  href: string | null
  id: V0TrialEvidenceReviewActionId
  label: string
}

export type V0TrialEvidenceReview = {
  actions: V0TrialEvidenceReviewAction[]
  boundaryLabel: string
  completePathLabel: string
  evidenceBalance: string
  evidenceStrengthLabel: string
  headline: string
  summary: string
}

export type V0TrialReadinessChecklistItem = {
  evidence: string
  feedbackFocus: string
  href: string
  id: TrialWorkflowStepId
  task: string
  title: string
}

export type V0TrialReadinessCockpit = {
  acceptancePackage: V0TrialAcceptancePackage
  checklist: V0TrialReadinessChecklistItem[]
  evidenceReview: V0TrialEvidenceReview
  headline: string
  nextAction: {
    href: string | null
    label: string
  }
  productionGateItems: string[]
  rationale: string
  stage: V0TrialReadinessStage
  stageLabel: string
}

const minimumFeedbackForReadiness = 3

const productionGateItems = [
  "生产登录/邀请",
  "HTTPS 域名",
  "备份恢复",
  "敏感数据治理",
  "RAG/Q&A 评测",
  "监控与脱敏日志",
]

const workbenchHrefByFeedbackWorkbench: Partial<
  Record<V0TrialFeedbackWorkbench, string>
> = {
  ai_review: "/ai-review",
  knowledge: "/knowledge",
  next_actions: "/next-actions",
  overview: "/",
  rackets: "/rackets",
  sessions: "/sessions",
  talk_tracks: "/talk-tracks",
  trial: "/trial",
}

const blockerFocuses = new Set<V0TrialFeedbackEvidenceFocus>([
  "ai_quality",
  "downstream_workflow",
  "experience_polish",
  "sample_data",
  "source_trust",
])

const issueHrefByType: Partial<Record<V0TrialFeedbackIssueType, string>> = {
  ai_quality: "/ai-review",
  downstream_action: "/next-actions",
  missing_data: "/sessions",
  source_trust: "/knowledge",
}

const runStepHref: Record<V0TrialRunStepId, string> = {
  ai_review: "/ai-review",
  knowledge: "/knowledge",
  next_actions: "/next-actions",
  rackets: "/rackets",
  sessions: "/sessions",
  talk_tracks: "/talk-tracks",
}

const runStepLabel: Record<V0TrialRunStepId, string> = {
  ai_review: "智能复盘",
  knowledge: "资料来源",
  next_actions: "下场任务",
  rackets: "球拍产品",
  sessions: "直播场次",
  talk_tracks: "话术资产",
}

const checklistCopy: Record<
  TrialWorkflowStepId,
  {
    evidence: string
    feedbackFocus: string
    task: string
  }
> = {
  "ai-review": {
    evidence: "验证复盘建议能否给出可审核的话术、选题和下场动作。",
    feedbackFocus: "重点反馈复盘质量、来源信任和是否需要重新生成。",
    task: "用已提交场次生成一次复盘，并记录采纳或暂不用。",
  },
  knowledge: {
    evidence: "验证资料来源和团队经验不会绕过审核直接变成权威知识。",
    feedbackFocus: "重点反馈来源可信度、审核状态和缺资料卡点。",
    task: "查看资料来源，补一条团队经验或官方来源并走审核。",
  },
  "next-actions": {
    evidence: "验证复盘动作能沉淀为下场可执行任务。",
    feedbackFocus: "重点反馈负责人、检查项和完成状态是否清楚。",
    task: "查看下场任务，推进一个检查项或状态。",
  },
  rackets: {
    evidence: "验证球拍型号、别名、规格和来源审核能支撑讲解一致性。",
    feedbackFocus: "重点反馈缺少字段、别名冲突和产品资料是否可信。",
    task: "查看主推球拍，确认型号、卖点、来源和发布状态。",
  },
  sessions: {
    evidence: "验证直播记录能承接问题、异议和复盘输入。",
    feedbackFocus: "重点反馈记录字段是否够用、是否贴近直播后整理。",
    task: "打开场次样例，检查摘要、客户问题和购买异议。",
  },
  "talk-tracks": {
    evidence: "验证已采纳复盘内容能沉淀为可复用话术资产。",
    feedbackFocus: "重点反馈话术是否可直接上播、是否需要来源补强。",
    task: "查看话术资产，确认候选话术的审核和发布边界。",
  },
}

function hasFeedbackBlockers(
  evidence: V0TrialFeedbackEvidenceSummary | null,
): boolean {
  if (!evidence) {
    return false
  }

  return (
    evidence.lowUsefulnessCount > 0 ||
    evidence.lowClarityCount > 0 ||
    evidence.realWorkSignals.no > 0 ||
    blockerFocuses.has(evidence.recommendation.focus)
  )
}

function feedbackCount(evidence: V0TrialFeedbackEvidenceSummary | null): number {
  return evidence?.totalCount ?? 0
}

function stageLabel(stage: V0TrialReadinessStage): string {
  switch (stage) {
    case "collect_evidence":
      return "继续收集"
    case "fix_blockers":
      return "先修卡点"
    case "ready_for_internal_trial":
      return "V0.9 可试用"
    case "prepare_production_gate":
      return "准备生产门禁"
  }
}

function acceptanceDecision(
  stage: V0TrialReadinessStage,
): V0TrialAcceptanceDecision {
  switch (stage) {
    case "collect_evidence":
      return "collect_more_evidence"
    case "fix_blockers":
      return "fix_blockers"
    case "ready_for_internal_trial":
      return "expand_internal_trial"
    case "prepare_production_gate":
      return "plan_production_gate"
  }
}

function acceptanceDecisionLabel(decision: V0TrialAcceptanceDecision): string {
  switch (decision) {
    case "collect_more_evidence":
      return "补齐验收证据"
    case "fix_blockers":
      return "暂缓验收，先修卡点"
    case "expand_internal_trial":
      return "通过内部 V0 验收"
    case "plan_production_gate":
      return "通过内部 V0，进入生产门禁"
  }
}

function acceptanceHeadline(decision: V0TrialAcceptanceDecision): string {
  switch (decision) {
    case "collect_more_evidence":
      return "V0 验收还缺证据"
    case "fix_blockers":
      return "V0 验收被关键卡点阻断"
    case "expand_internal_trial":
      return "V0 可扩大内部试用"
    case "plan_production_gate":
      return "V0 可冻结，生产门禁单独推进"
  }
}

function acceptanceStatusLabel(
  status: V0TrialAcceptanceEvidenceStatus,
): string {
  switch (status) {
    case "attention":
      return "需关注"
    case "blocked":
      return "有阻断"
    case "missing":
      return "待补齐"
    case "pass":
      return "已满足"
  }
}

function chooseStage(input: {
  evidence: V0TrialFeedbackEvidenceSummary | null
  trialRun?: V0TrialRunDetail | null
  workflow: TrialWorkflowReadinessSummary | null
}): V0TrialReadinessStage {
  if (input.workflow?.status === "error" || hasFeedbackBlockers(input.evidence)) {
    return "fix_blockers"
  }

  if (trialRunBlockerStep(input.trialRun)) {
    return "fix_blockers"
  }

  if (
    !input.workflow ||
    input.workflow.status !== "complete" ||
    !hasCompleteTrialRunEvidence(input.trialRun) ||
    feedbackCount(input.evidence) < minimumFeedbackForReadiness
  ) {
    return "collect_evidence"
  }

  if (input.evidence?.recommendation.focus === "production_readiness") {
    return "prepare_production_gate"
  }

  return "ready_for_internal_trial"
}

function recommendationHref(
  evidence: V0TrialFeedbackEvidenceSummary | null,
): string | null {
  const workbench = evidence?.recommendation.workbench
  const issueType = evidence?.recommendation.issueType

  if (!workbench) {
    return issueType ? (issueHrefByType[issueType] ?? null) : null
  }

  if (workbench === "overview" || workbench === "trial") {
    return issueType
      ? (issueHrefByType[issueType] ?? workbenchHrefByFeedbackWorkbench[workbench] ?? null)
      : (workbenchHrefByFeedbackWorkbench[workbench] ?? null)
  }

  return workbenchHrefByFeedbackWorkbench[workbench] ?? null
}

function workflowNextAction(
  workflow: TrialWorkflowReadinessSummary | null,
): TrialWorkflowStepSummary | null {
  return workflow?.nextStep ?? null
}

function trialRunPendingStep(
  trialRun: V0TrialRunDetail | null | undefined,
) {
  return trialRun?.steps.find((step) => step.status === "pending") ?? null
}

function trialRunBlockerStep(
  trialRun: V0TrialRunDetail | null | undefined,
) {
  return (
    trialRun?.steps.find(
      (step) => step.status === "issue" || step.status === "skipped",
    ) ?? null
  )
}

function hasCompleteTrialRunEvidence(
  trialRun: V0TrialRunDetail | null | undefined,
): boolean {
  return Boolean(
    trialRun &&
      trialRun.status === "completed" &&
      trialRun.steps.length === 6 &&
      trialRun.steps.every((step) => step.status !== "pending"),
  )
}

function nextActionForStage(input: {
  evidence: V0TrialFeedbackEvidenceSummary | null
  stage: V0TrialReadinessStage
  trialRun?: V0TrialRunDetail | null
  workflow: TrialWorkflowReadinessSummary | null
}): V0TrialReadinessCockpit["nextAction"] {
  const nextWorkflow = workflowNextAction(input.workflow)
  const pendingRunStep = trialRunPendingStep(input.trialRun)
  const blockerRunStep = trialRunBlockerStep(input.trialRun)

  switch (input.stage) {
    case "collect_evidence":
      if (input.workflow?.status !== "complete" && nextWorkflow) {
        return {
          href: nextWorkflow.href,
          label: nextWorkflow.nextActionLabel,
        }
      }

      if (!input.trialRun) {
        return {
          href: null,
          label: "开始试用运行",
        }
      }

      if (pendingRunStep) {
        return {
          href: runStepHref[pendingRunStep.stepId],
          label: `继续检查${runStepLabel[pendingRunStep.stepId]}`,
        }
      }

      return {
        href: null,
        label: "补足 3 条以上试用反馈",
      }
    case "fix_blockers":
      if (blockerRunStep) {
        return {
          href: runStepHref[blockerRunStep.stepId],
          label: `处理${runStepLabel[blockerRunStep.stepId]}卡点`,
        }
      }

      return {
        href: recommendationHref(input.evidence) ?? nextWorkflow?.href ?? null,
        label:
          input.workflow?.status === "error"
            ? "重试进度检查"
            : "处理最高优先级卡点",
      }
    case "ready_for_internal_trial":
      return {
        href: "/sessions",
        label: "继续跑完整试用路径",
      }
    case "prepare_production_gate":
      return {
        href: null,
        label: "梳理生产门禁清单",
      }
  }
}

function headlineForStage(stage: V0TrialReadinessStage): string {
  switch (stage) {
    case "collect_evidence":
      return "V0.9 还需要更多试用证据"
    case "fix_blockers":
      return "先处理会阻碍真实使用的卡点"
    case "ready_for_internal_trial":
      return "V0.9 已可继续扩大内部试用"
    case "prepare_production_gate":
      return "可以开始梳理生产化前置门禁"
  }
}

function rationaleForStage(input: {
  evidence: V0TrialFeedbackEvidenceSummary | null
  stage: V0TrialReadinessStage
  trialRun?: V0TrialRunDetail | null
  workflow: TrialWorkflowReadinessSummary | null
}): string {
  const feedbackTotal = feedbackCount(input.evidence)
  const pendingRunStep = trialRunPendingStep(input.trialRun)
  const blockerRunStep = trialRunBlockerStep(input.trialRun)

  switch (input.stage) {
    case "collect_evidence":
      if (input.workflow?.status !== "complete") {
        return "先按六个已实现工作面跑完整路径，再用反馈判断下一轮优先级。"
      }

      if (!input.trialRun) {
        return "还没有本次试用运行记录，先用六步运行证据证明评估人员实际跑过完整路径。"
      }

      if (pendingRunStep) {
        return `本次试用运行还有“${runStepLabel[pendingRunStep.stepId]}”未记录，先补齐步骤证据再判断 V0.9。`
      }

      return `当前只有 ${feedbackTotal} 条反馈，先补足至少 ${minimumFeedbackForReadiness} 条再做 broad V0/V1 判断。`
    case "fix_blockers":
      if (blockerRunStep) {
        return `本次试用运行在“${runStepLabel[blockerRunStep.stepId]}”记录了卡点或跳过，先处理该工作面再进入生产门禁。`
      }

      return (
        input.evidence?.recommendation.rationale ??
        "当前试用路径或反馈证据存在卡点，先修复再扩大试用范围。"
      )
    case "ready_for_internal_trial":
      return "六个工作面已形成闭环，反馈暂未显示严重阻塞，可以继续让更多内部评估人员跑完整路径。"
    case "prepare_production_gate":
      return "内部试用证据暂未暴露严重卡点；生产登录、HTTPS、备份、敏感数据和监控仍需单独门禁。"
  }
}

function workflowEvidenceItem(
  workflow: TrialWorkflowReadinessSummary | null,
): V0TrialAcceptanceEvidenceItem {
  if (!workflow) {
    return {
      detail: "工作面进度仍在检查，不能作为验收依据。",
      id: "workflow",
      label: "六个工作面",
      status: "missing",
      statusLabel: acceptanceStatusLabel("missing"),
      value: "检查中",
    }
  }

  if (workflow.status === "error") {
    return {
      detail: "至少一个受保护工作面检查失败，需要先重试或修复访问问题。",
      id: "workflow",
      label: "六个工作面",
      status: "blocked",
      statusLabel: acceptanceStatusLabel("blocked"),
      value: workflow.progressLabel,
    }
  }

  if (workflow.status !== "complete") {
    return {
      detail: `还缺“${workflow.nextStep.title}”证据，先补齐完整 V0 路径。`,
      id: "workflow",
      label: "六个工作面",
      status: "missing",
      statusLabel: acceptanceStatusLabel("missing"),
      value: workflow.progressLabel,
    }
  }

  return {
    detail: "场次、球拍、资料、复盘、话术和下场任务均已有 scoped 记录。",
    id: "workflow",
    label: "六个工作面",
    status: "pass",
    statusLabel: acceptanceStatusLabel("pass"),
    value: workflow.progressLabel,
  }
}

function trialRunEvidenceItem(
  trialRun: V0TrialRunDetail | null | undefined,
): V0TrialAcceptanceEvidenceItem {
  const blockerStep = trialRunBlockerStep(trialRun)
  const pendingStep = trialRunPendingStep(trialRun)

  if (!trialRun) {
    return {
      detail: "还没有本次六步试用运行记录，不能证明评估人员实际跑过完整路径。",
      id: "run",
      label: "试用运行",
      status: "missing",
      statusLabel: acceptanceStatusLabel("missing"),
      value: "未开始",
    }
  }

  if (blockerStep) {
    return {
      detail: `“${runStepLabel[blockerStep.stepId]}”记录了卡点或跳过，先处理后再验收。`,
      id: "run",
      label: "试用运行",
      status: "blocked",
      statusLabel: acceptanceStatusLabel("blocked"),
      value: runStepLabel[blockerStep.stepId],
    }
  }

  if (pendingStep) {
    return {
      detail: `“${runStepLabel[pendingStep.stepId]}”还未记录，通过前需要补齐运行证据。`,
      id: "run",
      label: "试用运行",
      status: "missing",
      statusLabel: acceptanceStatusLabel("missing"),
      value: runStepLabel[pendingStep.stepId],
    }
  }

  if (hasCompleteTrialRunEvidence(trialRun)) {
    return {
      detail: "六步试用运行已完成，且未记录 issue 或 skipped 步骤。",
      id: "run",
      label: "试用运行",
      status: "pass",
      statusLabel: acceptanceStatusLabel("pass"),
      value: "6/6 完成",
    }
  }

  return {
    detail: "六步状态已记录，但运行尚未完成，需要先完成本次试用运行。",
    id: "run",
    label: "试用运行",
    status: "attention",
    statusLabel: acceptanceStatusLabel("attention"),
    value: "待完成",
  }
}

function feedbackEvidenceItem(
  evidence: V0TrialFeedbackEvidenceSummary | null,
): V0TrialAcceptanceEvidenceItem {
  const total = feedbackCount(evidence)

  if (!evidence || total === 0) {
    return {
      detail: "还没有 scoped 反馈样本，先让评估人员跑完路径并提交反馈。",
      id: "feedback",
      label: "反馈样本",
      status: "missing",
      statusLabel: acceptanceStatusLabel("missing"),
      value: `0/${minimumFeedbackForReadiness}`,
    }
  }

  if (hasFeedbackBlockers(evidence)) {
    return {
      detail: evidence.recommendation.rationale,
      id: "feedback",
      label: "反馈样本",
      status: "blocked",
      statusLabel: acceptanceStatusLabel("blocked"),
      value: `${total} 条`,
    }
  }

  if (total < minimumFeedbackForReadiness) {
    return {
      detail: `当前只有 ${total} 条反馈，至少需要 ${minimumFeedbackForReadiness} 条再做 V0 验收判断。`,
      id: "feedback",
      label: "反馈样本",
      status: "missing",
      statusLabel: acceptanceStatusLabel("missing"),
      value: `${total}/${minimumFeedbackForReadiness}`,
    }
  }

  return {
    detail:
      evidence.recommendation.focus === "production_readiness"
        ? "反馈暂未暴露严重卡点，可开始梳理生产门禁，但不等于生产可用。"
        : "反馈样本已达到内部 V0 验收下限，暂未出现严重阻断信号。",
    id: "feedback",
    label: "反馈样本",
    status:
      evidence.recommendation.focus === "production_readiness"
        ? "attention"
        : "pass",
    statusLabel: acceptanceStatusLabel(
      evidence.recommendation.focus === "production_readiness"
        ? "attention"
        : "pass",
    ),
    value: `${total} 条`,
  }
}

function riskEvidenceItem(input: {
  evidence: V0TrialFeedbackEvidenceSummary | null
  stage: V0TrialReadinessStage
  trialRun?: V0TrialRunDetail | null
  workflow: TrialWorkflowReadinessSummary | null
}): V0TrialAcceptanceEvidenceItem {
  if (input.stage === "fix_blockers") {
    return {
      detail: blockerSummary(input),
      id: "risk",
      label: "风险结论",
      status: "blocked",
      statusLabel: acceptanceStatusLabel("blocked"),
      value: "先修卡点",
    }
  }

  if (input.stage === "collect_evidence") {
    return {
      detail: "证据未完整前不冻结 V0，也不进入生产门禁。",
      id: "risk",
      label: "风险结论",
      status: "missing",
      statusLabel: acceptanceStatusLabel("missing"),
      value: "证据不足",
    }
  }

  if (input.stage === "prepare_production_gate") {
    return {
      detail: "内部试用证据可支持 V0 冻结，生产登录、HTTPS 和敏感数据仍需单独门禁。",
      id: "risk",
      label: "风险结论",
      status: "attention",
      statusLabel: acceptanceStatusLabel("attention"),
      value: "生产门禁",
    }
  }

  return {
    detail: "当前证据未显示严重阻断，可继续扩大内部试用并继续收集反馈。",
    id: "risk",
    label: "风险结论",
    status: "pass",
    statusLabel: acceptanceStatusLabel("pass"),
    value: "可内测",
  }
}

function blockerSummary(input: {
  evidence: V0TrialFeedbackEvidenceSummary | null
  stage: V0TrialReadinessStage
  trialRun?: V0TrialRunDetail | null
  workflow: TrialWorkflowReadinessSummary | null
}): string {
  const blockerStep = trialRunBlockerStep(input.trialRun)
  const pendingStep = trialRunPendingStep(input.trialRun)

  if (input.workflow?.status === "error") {
    return "工作面进度检查失败，先恢复受保护数据访问和 scoped API 检查。"
  }

  if (blockerStep) {
    return `试用运行卡在“${runStepLabel[blockerStep.stepId]}”，先修复该工作面。`
  }

  if (input.stage === "fix_blockers" && input.evidence?.recommendation.rationale) {
    return input.evidence.recommendation.rationale
  }

  if (!input.trialRun) {
    return "还缺六步试用运行记录。"
  }

  if (pendingStep) {
    return `还缺“${runStepLabel[pendingStep.stepId]}”运行证据。`
  }

  if (feedbackCount(input.evidence) < minimumFeedbackForReadiness) {
    return `还需补足至少 ${minimumFeedbackForReadiness} 条 scoped 反馈。`
  }

  if (input.stage === "prepare_production_gate") {
    return "内部 V0 证据暂未显示严重卡点，生产门禁仍需单独规划。"
  }

  return "暂无严重阻断信号。"
}

function gateSummary(): string {
  return `生产化仍需：${productionGateItems.join("、")}。`
}

function acceptanceNextAction(input: {
  nextAction: V0TrialReadinessCockpit["nextAction"]
  stage: V0TrialReadinessStage
}): V0TrialAcceptancePackage["nextAction"] {
  switch (input.stage) {
    case "collect_evidence":
    case "fix_blockers":
      return input.nextAction
    case "ready_for_internal_trial":
      return {
        href: "/sessions",
        label: "安排下一轮内部试用",
      }
    case "prepare_production_gate":
      return {
        href: null,
        label: "梳理生产门禁清单",
      }
  }
}

function acceptanceSummary(decision: V0TrialAcceptanceDecision): string {
  switch (decision) {
    case "collect_more_evidence":
      return "当前 V0 不应冻结验收，先补齐完整路径、运行记录和反馈样本。"
    case "fix_blockers":
      return "当前 V0 不应扩大试用，先处理会影响真实工作的最高优先级卡点。"
    case "expand_internal_trial":
      return "当前证据支持继续扩大内部试用，但仍需持续收集反馈并保留人工审核。"
    case "plan_production_gate":
      return "当前证据支持冻结内部 V0 验收，下一步只讨论生产门禁，不把内部试用等同生产可用。"
  }
}

function buildAcceptancePackage(input: {
  evidence: V0TrialFeedbackEvidenceSummary | null
  nextAction: V0TrialReadinessCockpit["nextAction"]
  stage: V0TrialReadinessStage
  trialRun?: V0TrialRunDetail | null
  workflow: TrialWorkflowReadinessSummary | null
}): V0TrialAcceptancePackage {
  const decision = acceptanceDecision(input.stage)

  return {
    blockerSummary: blockerSummary(input),
    decision,
    decisionLabel: acceptanceDecisionLabel(decision),
    evidenceItems: [
      workflowEvidenceItem(input.workflow),
      trialRunEvidenceItem(input.trialRun),
      feedbackEvidenceItem(input.evidence),
      riskEvidenceItem(input),
    ],
    gateSummary: gateSummary(),
    headline: acceptanceHeadline(decision),
    nextAction: acceptanceNextAction({
      nextAction: input.nextAction,
      stage: input.stage,
    }),
    summary: acceptanceSummary(decision),
  }
}

function completePathLabel(
  trialRun: V0TrialRunDetail | null | undefined,
): string {
  const blockerStep = trialRunBlockerStep(trialRun)
  const pendingStep = trialRunPendingStep(trialRun)

  if (!trialRun) {
    return "完整路径未开始"
  }

  if (blockerStep) {
    return "完整路径有卡点"
  }

  if (pendingStep) {
    return "完整路径待补齐"
  }

  if (hasCompleteTrialRunEvidence(trialRun)) {
    return "完整路径已通过"
  }

  return "完整路径待完成"
}

function evidenceStrengthLabel(input: {
  evidence: V0TrialFeedbackEvidenceSummary | null
  stage: V0TrialReadinessStage
  trialRun?: V0TrialRunDetail | null
  workflow: TrialWorkflowReadinessSummary | null
}): string {
  if (input.stage === "fix_blockers") {
    return "有阻断"
  }

  if (input.stage === "collect_evidence") {
    return "证据不足"
  }

  if (
    input.workflow?.status === "complete" &&
    hasCompleteTrialRunEvidence(input.trialRun) &&
    feedbackCount(input.evidence) >= minimumFeedbackForReadiness
  ) {
    return "强证据"
  }

  return "中等证据"
}

function evidenceBalance(input: {
  evidence: V0TrialFeedbackEvidenceSummary | null
  trialRun?: V0TrialRunDetail | null
}): string {
  const total = feedbackCount(input.evidence)
  const linked = input.evidence?.linkedRunFeedbackCount ?? 0
  const completedLinked = input.evidence?.completedRunFeedbackCount ?? 0
  const completePath = hasCompleteTrialRunEvidence(input.trialRun)

  if (!completePath && total > 0) {
    return `反馈未绑定完整路径，当前 ${total} 条反馈只能作为线索，先补六步试用运行。`
  }

  if (!completePath) {
    return "还缺完整路径和反馈样本，先让评估人员按六步路径跑一遍。"
  }

  if (completedLinked > 0) {
    return `${completedLinked} 条反馈来自完整路径，适合作为下一轮 V0/V1 排序依据。`
  }

  if (linked > 0) {
    return `${linked} 条反馈已关联试用运行，继续补完整路径反馈可提高判断信心。`
  }

  if (total > 0) {
    return `完整路径已通过，但 ${total} 条反馈未绑定完整路径，排序时仍需保留人工判断。`
  }

  return "完整路径已通过，仍需补充反馈样本后再冻结 V0 判断。"
}

function evidenceReviewHeadline(stage: V0TrialReadinessStage): string {
  switch (stage) {
    case "collect_evidence":
      return "先补齐试用证据"
    case "fix_blockers":
      return "先修影响 V0 验收的卡点"
    case "ready_for_internal_trial":
      return "V0 可以扩大内部试用"
    case "prepare_production_gate":
      return "V0 可冻结，生产门禁另开"
  }
}

function evidenceReviewSummary(input: {
  evidence: V0TrialFeedbackEvidenceSummary | null
  stage: V0TrialReadinessStage
  trialRun?: V0TrialRunDetail | null
  workflow: TrialWorkflowReadinessSummary | null
}): string {
  switch (input.stage) {
    case "collect_evidence":
      return "当前还不适合启动新的 V1 大功能，先把完整路径、运行记录和反馈样本补齐。"
    case "fix_blockers":
      return blockerSummary(input)
    case "ready_for_internal_trial":
      return "当前证据支持继续扩大内部试用，并用新增反馈决定后续体验打磨或生产准备。"
    case "prepare_production_gate":
      return "内部 V0 可以作为可用版冻结；下一轮重点应从生产登录、HTTPS、备份和敏感数据门禁中选择。"
  }
}

function reviewAction(input: V0TrialEvidenceReviewAction): V0TrialEvidenceReviewAction {
  return input
}

function buildEvidenceReviewActions(input: {
  evidence: V0TrialFeedbackEvidenceSummary | null
  nextAction: V0TrialReadinessCockpit["nextAction"]
  stage: V0TrialReadinessStage
  trialRun?: V0TrialRunDetail | null
  workflow: TrialWorkflowReadinessSummary | null
}): V0TrialEvidenceReviewAction[] {
  const actions: V0TrialEvidenceReviewAction[] = []
  const blockerStep = trialRunBlockerStep(input.trialRun)
  const pendingStep = trialRunPendingStep(input.trialRun)
  const nextWorkflow = workflowNextAction(input.workflow)
  const feedbackTotal = feedbackCount(input.evidence)

  if (input.stage === "fix_blockers") {
    actions.push(
      reviewAction({
        detail: blockerStep
          ? `先回到“${runStepLabel[blockerStep.stepId]}”处理本次试用记录的卡点。`
          : "先处理会影响真实使用信心的最高优先级问题。",
        href: blockerStep
          ? runStepHref[blockerStep.stepId]
          : input.nextAction.href,
        id: "fix_blocker",
        label: "先修卡点",
      }),
    )
  } else if (input.workflow?.status !== "complete" && nextWorkflow) {
    actions.push(
      reviewAction({
        detail: `还缺“${nextWorkflow.title}”工作面证据，先补齐六步 V0 路径。`,
        href: nextWorkflow.href,
        id: "complete_path",
        label: "补齐完整路径",
      }),
    )
  } else if (!input.trialRun) {
    actions.push(
      reviewAction({
        detail: "还没有六步试用运行记录，先开始一次 guided run 再判断 V0 是否冻结。",
        href: null,
        id: "complete_path",
        label: "补齐完整路径",
      }),
    )
  } else if (pendingStep) {
    actions.push(
      reviewAction({
        detail: `继续记录“${runStepLabel[pendingStep.stepId]}”，避免只靠零散反馈排序。`,
        href: runStepHref[pendingStep.stepId],
        id: "complete_path",
        label: "补齐完整路径",
      }),
    )
  } else if (input.stage === "prepare_production_gate") {
    actions.push(
      reviewAction({
        detail: "内部 V0 可以冻结，下一轮从生产登录、HTTPS、备份和敏感数据门禁中选一组推进。",
        href: null,
        id: "production_gate",
        label: "规划生产门禁",
      }),
    )
  } else if (input.stage === "ready_for_internal_trial") {
    actions.push(
      reviewAction({
        detail: "继续让更多内部评估人员跑完整路径，确认不同角色是否都能完成核心任务。",
        href: "/trial",
        id: "expand_internal_trial",
        label: "扩大内部试用",
      }),
    )
  }

  if (
    actions.length < 3 &&
    input.stage !== "fix_blockers" &&
    feedbackTotal < minimumFeedbackForReadiness
  ) {
    actions.push(
      reviewAction({
        detail: `当前只有 ${feedbackTotal} 条反馈，至少补到 ${minimumFeedbackForReadiness} 条再做 broad V0/V1 判断。`,
        href: null,
        id: "collect_feedback",
        label: "补反馈样本",
      }),
    )
  }

  if (actions.length === 0) {
    actions.push(
      reviewAction({
        detail: "继续用完整路径证据和反馈样本判断下一轮优先级。",
        href: input.nextAction.href,
        id: "collect_feedback",
        label: input.nextAction.label,
      }),
    )
  }

  return actions.slice(0, 3)
}

function buildEvidenceReview(input: {
  evidence: V0TrialFeedbackEvidenceSummary | null
  nextAction: V0TrialReadinessCockpit["nextAction"]
  stage: V0TrialReadinessStage
  trialRun?: V0TrialRunDetail | null
  workflow: TrialWorkflowReadinessSummary | null
}): V0TrialEvidenceReview {
  return {
    actions: buildEvidenceReviewActions(input),
    boundaryLabel: "内部 V0 完成不等于生产可用，生产门禁单独推进。",
    completePathLabel: completePathLabel(input.trialRun),
    evidenceBalance: evidenceBalance(input),
    evidenceStrengthLabel: evidenceStrengthLabel(input),
    headline: evidenceReviewHeadline(input.stage),
    summary: evidenceReviewSummary(input),
  }
}

function buildChecklist(
  workflow: TrialWorkflowReadinessSummary | null,
): V0TrialReadinessChecklistItem[] {
  const steps = workflow?.steps ?? trialWorkflowSteps

  return steps.map((step) => ({
    evidence: checklistCopy[step.id].evidence,
    feedbackFocus: checklistCopy[step.id].feedbackFocus,
    href: step.href,
    id: step.id,
    task: checklistCopy[step.id].task,
    title: step.title,
  }))
}

export function buildV0TrialReadinessCockpit(input: {
  evidence: V0TrialFeedbackEvidenceSummary | null
  trialRun?: V0TrialRunDetail | null
  workflow: TrialWorkflowReadinessSummary | null
}): V0TrialReadinessCockpit {
  const stage = chooseStage(input)
  const nextAction = nextActionForStage({
    ...input,
    stage,
  })

  return {
    acceptancePackage: buildAcceptancePackage({
      ...input,
      nextAction,
      stage,
    }),
    checklist: buildChecklist(input.workflow),
    evidenceReview: buildEvidenceReview({
      ...input,
      nextAction,
      stage,
    }),
    headline: headlineForStage(stage),
    nextAction,
    productionGateItems,
    rationale: rationaleForStage({
      ...input,
      stage,
    }),
    stage,
    stageLabel: stageLabel(stage),
  }
}
