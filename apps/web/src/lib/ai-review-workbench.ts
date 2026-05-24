import type { LucideIcon } from "lucide-react"
import {
  BadgeCheck,
  Ban,
  ClipboardCheck,
  ClipboardList,
  FileWarning,
  GitBranch,
  History,
  Lightbulb,
  ListChecks,
  MessageSquareText,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Split,
  Target,
  TimerReset,
} from "lucide-react"

export type ReviewTone = "default" | "success" | "warning" | "info" | "muted"

export type ReviewMetric = {
  label: string
  value: string
  description: string
  tone: ReviewTone
}

export type ReviewInputFact = {
  label: string
  value: string
  source: "operator" | "public-knowledge" | "review-rule"
  state: string
}

export type GroundingReference = {
  title: string
  sourceType: string
  reviewState: string
  confidence: string
  intendedUse: string
  boundary: string
}

export type ReviewPipelineStage = {
  title: string
  description: string
  state: string
  icon: LucideIcon
}

export type AnalysisSection = {
  title: string
  artifact: string
  preview: string
  evidence: string
  state: string
  icon: LucideIcon
}

export type ValidationState = {
  label: string
  description: string
  state: string
  icon: LucideIcon
  tone: ReviewTone
}

export type FeedbackSignal = {
  label: string
  description: string
  futureUse: string
  icon: LucideIcon
  tone: ReviewTone
}

export type ReviewAction = {
  label: string
  description: string
  icon: LucideIcon
}

export type DownstreamArtifact = {
  label: string
  description: string
  state: string
}

export const reviewMetrics: readonly ReviewMetric[] = [
  {
    label: "输入完整度",
    value: "待确认",
    description: "先确认主题、商品顺序和问题",
    tone: "info",
  },
  {
    label: "参考资料",
    value: "3 类",
    description: "规格、规则和团队经验",
    tone: "success",
  },
  {
    label: "输出校验",
    value: "待审核",
    description: "生成后需要人工确认",
    tone: "warning",
  },
  {
    label: "人工反馈",
    value: "7 种",
    description: "记录采纳、编辑、拒绝等结果",
    tone: "default",
  },
]

export const reviewInputFacts: readonly ReviewInputFact[] = [
  {
    label: "直播主题",
    value: "进攻型中高级球友的高端拍讲解",
    source: "operator",
    state: "待确认",
  },
  {
    label: "商品顺序",
    value: "速度拍 -> 进攻拍 -> 均衡拍，对比节奏明确",
    source: "operator",
    state: "待确认",
  },
  {
    label: "高频问题",
    value: "杀球发力、手腕负担、推荐磅数、双打适配",
    source: "operator",
    state: "待确认",
  },
  {
    label: "使用规则",
    value: "规格要先审核，卖点可人工修改",
    source: "review-rule",
    state: "需遵守",
  },
]

export const groundingReferences: readonly GroundingReference[] = [
  {
    title: "官方/品牌规格页",
    sourceType: "公开来源",
    reviewState: "待审核",
    confidence: "较可信",
    intendedUse: "重量、平衡点、中杆硬度、推荐磅数等事实字段",
    boundary: "审核后再使用",
  },
  {
    title: "平台规则与指标口径",
    sourceType: "规则来源",
    reviewState: "待更新",
    confidence: "按来源判断",
    intendedUse: "解释点击、转化、停留等运营指标",
    boundary: "需要定期检查",
  },
  {
    title: "团队复盘经验",
    sourceType: "内部知识",
    reviewState: "需权限",
    confidence: "需审核",
    intendedUse: "沉淀常见异议、讲解节奏、话术改进经验",
    boundary: "注意保护团队资料",
  },
]

export const reviewPipelineStages: readonly ReviewPipelineStage[] = [
  {
    title: "人工事实",
    description: "主播、主题、商品顺序、问题与异议由运营录入",
    state: "待确认",
    icon: ClipboardList,
  },
  {
    title: "参考资料",
    description: "选择已审核的规格、规则和团队经验作为依据",
    state: "待选择",
    icon: ShieldCheck,
  },
  {
    title: "生成建议",
    description: "生成复盘、诊断、话术和任务",
    state: "待生成",
    icon: Sparkles,
  },
  {
    title: "人工审核",
    description: "运营编辑、采纳、拒绝或要求重生成",
    state: "待审核",
    icon: ClipboardCheck,
  },
  {
    title: "反馈评估",
    description: "记录采纳、编辑、拒绝和重生成原因",
    state: "待记录",
    icon: GitBranch,
  },
]

export const analysisSections: readonly AnalysisSection[] = [
  {
    title: "直播摘要",
    artifact: "复盘主线",
    preview: "归纳本场主题、讲解节奏、商品切换和关键问题。",
    evidence: "依赖人工场次笔记与商品顺序",
    state: "待生成",
    icon: ClipboardList,
  },
  {
    title: "讲解诊断",
    artifact: "商品表达",
    preview: "识别规格事实是否说清，卖点是否贴合打法和水平。",
    evidence: "依赖球拍资料和讲解规则",
    state: "待生成",
    icon: Target,
  },
  {
    title: "问题聚类",
    artifact: "观众问题",
    preview: "聚合关于发力、控球、磅数、手感和双打适配的问题。",
    evidence: "依赖运营整理的问题清单",
    state: "待生成",
    icon: MessageSquareText,
  },
  {
    title: "异议模式",
    artifact: "购买阻力",
    preview: "标记价格、上手难度、耐用性、替代型号等异议。",
    evidence: "依赖人工标注与历史话术资产",
    state: "待生成",
    icon: Split,
  },
  {
    title: "话术改进",
    artifact: "可复用资产",
    preview: "生成可编辑的开场、对比、异议回应和转场建议。",
    evidence: "依赖已审核知识和被采纳的团队经验",
    state: "待生成",
    icon: Lightbulb,
  },
  {
    title: "下场任务草案",
    artifact: "运营动作",
    preview: "拆成补知识、改顺序、准备短视频、复核话术等动作。",
    evidence: "依赖人工审核后的建议",
    state: "待生成",
    icon: ListChecks,
  },
]

export const validationStates: readonly ValidationState[] = [
  {
    label: "空输入",
    description: "缺少主题、商品或问题时，请先补齐资料。",
    state: "需补齐",
    icon: FileWarning,
    tone: "warning",
  },
  {
    label: "依据不足",
    description: "资料不够时，建议只能作为参考。",
    state: "仅参考",
    icon: ShieldCheck,
    tone: "info",
  },
  {
    label: "格式错误",
    description: "结果格式异常时重新生成或人工处理。",
    state: "需处理",
    icon: Ban,
    tone: "warning",
  },
  {
    label: "生成失败",
    description: "生成失败时可以稍后重试，或先人工复盘。",
    state: "稍后重试",
    icon: TimerReset,
    tone: "muted",
  },
  {
    label: "来源过期",
    description: "资料过期时，建议需要重新审核。",
    state: "需更新",
    icon: RefreshCcw,
    tone: "warning",
  },
]

export const feedbackSignals: readonly FeedbackSignal[] = [
  {
    label: "采纳",
    description: "建议可直接进入话术或任务草案。",
    futureUse: "作为优质参考",
    icon: BadgeCheck,
    tone: "success",
  },
  {
    label: "编辑后采纳",
    description: "保留运营修改前后差异。",
    futureUse: "改进表达",
    icon: ClipboardCheck,
    tone: "info",
  },
  {
    label: "拒绝",
    description: "记录原因，如事实错误、表达不适合或无依据。",
    futureUse: "避免重复错误",
    icon: Ban,
    tone: "warning",
  },
  {
    label: "重生成",
    description: "区分缺证据、语气不对、任务不可执行等原因。",
    futureUse: "帮助重新生成",
    icon: RefreshCcw,
    tone: "default",
  },
  {
    label: "知识缺失",
    description: "缺少型号、规则或话术资料。",
    futureUse: "提醒补充资料",
    icon: GitBranch,
    tone: "info",
  },
  {
    label: "依据薄弱",
    description: "来源不足、过期或不适合当前场景。",
    futureUse: "提醒补充来源",
    icon: ShieldCheck,
    tone: "warning",
  },
  {
    label: "下游复用",
    description: "建议被带入话术资产、短视频题目或下场任务。",
    futureUse: "衡量是否好用",
    icon: History,
    tone: "success",
  },
]

export const reviewActions: readonly ReviewAction[] = [
  {
    label: "采纳",
    description: "保存为可用建议",
    icon: BadgeCheck,
  },
  {
    label: "编辑",
    description: "修改后再使用",
    icon: ClipboardCheck,
  },
  {
    label: "拒绝",
    description: "记录拒绝原因",
    icon: Ban,
  },
  {
    label: "重生成",
    description: "选择重生成原因",
    icon: RefreshCcw,
  },
]

export const downstreamArtifacts: readonly DownstreamArtifact[] = [
  {
    label: "话术资产",
    description: "被采纳的讲解结构和异议回应进入版本化话术库。",
    state: "待保存",
  },
  {
    label: "短视频选题",
    description: "高频问题和卖点缺口转成可审核的选题草案。",
    state: "待审核",
  },
  {
    label: "下场任务",
    description: "可执行动作按负责人、截止时间和复用状态管理。",
    state: "待创建",
  },
]

export const aiReviewBoundaries = [
  "暂不能生成复盘建议",
  "暂不能保存审核反馈",
  "暂不能自动获取外部来源",
  "不要输入客户隐私或敏感经营数据",
] as const
