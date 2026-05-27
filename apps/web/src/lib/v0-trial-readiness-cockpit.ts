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

export type V0TrialReadinessStage =
  | "collect_evidence"
  | "fix_blockers"
  | "ready_for_internal_trial"
  | "prepare_production_gate"

export type V0TrialReadinessChecklistItem = {
  evidence: string
  feedbackFocus: string
  href: string
  id: TrialWorkflowStepId
  task: string
  title: string
}

export type V0TrialReadinessCockpit = {
  checklist: V0TrialReadinessChecklistItem[]
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

function chooseStage(input: {
  evidence: V0TrialFeedbackEvidenceSummary | null
  workflow: TrialWorkflowReadinessSummary | null
}): V0TrialReadinessStage {
  if (input.workflow?.status === "error" || hasFeedbackBlockers(input.evidence)) {
    return "fix_blockers"
  }

  if (
    !input.workflow ||
    input.workflow.status !== "complete" ||
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

function nextActionForStage(input: {
  evidence: V0TrialFeedbackEvidenceSummary | null
  stage: V0TrialReadinessStage
  workflow: TrialWorkflowReadinessSummary | null
}): V0TrialReadinessCockpit["nextAction"] {
  const nextWorkflow = workflowNextAction(input.workflow)

  switch (input.stage) {
    case "collect_evidence":
      if (input.workflow?.status !== "complete" && nextWorkflow) {
        return {
          href: nextWorkflow.href,
          label: nextWorkflow.nextActionLabel,
        }
      }

      return {
        href: null,
        label: "补足 3 条以上试用反馈",
      }
    case "fix_blockers":
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
  workflow: TrialWorkflowReadinessSummary | null
}): string {
  const feedbackTotal = feedbackCount(input.evidence)

  switch (input.stage) {
    case "collect_evidence":
      if (input.workflow?.status !== "complete") {
        return "先按六个已实现工作面跑完整路径，再用反馈判断下一轮优先级。"
      }

      return `当前只有 ${feedbackTotal} 条反馈，先补足至少 ${minimumFeedbackForReadiness} 条再做 broad V0/V1 判断。`
    case "fix_blockers":
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
  workflow: TrialWorkflowReadinessSummary | null
}): V0TrialReadinessCockpit {
  const stage = chooseStage(input)

  return {
    checklist: buildChecklist(input.workflow),
    headline: headlineForStage(stage),
    nextAction: nextActionForStage({
      ...input,
      stage,
    }),
    productionGateItems,
    rationale: rationaleForStage({
      ...input,
      stage,
    }),
    stage,
    stageLabel: stageLabel(stage),
  }
}
