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
    value: "预览",
    description: "主题、商品顺序、问题与异议的未来检查入口",
    tone: "info",
  },
  {
    label: "知识依据",
    value: "3 类",
    description: "公开规格、规则口径、团队经验需分层展示",
    tone: "success",
  },
  {
    label: "输出校验",
    value: "待接入",
    description: "未来 AI JSON schema 与质量规则的位置",
    tone: "warning",
  },
  {
    label: "人工反馈",
    value: "7 种",
    description: "采纳、编辑、拒绝、重生成等可审计信号",
    tone: "default",
  },
]

export const reviewInputFacts: readonly ReviewInputFact[] = [
  {
    label: "直播主题",
    value: "进攻型中高级球友的高端拍讲解",
    source: "operator",
    state: "人工样例",
  },
  {
    label: "商品顺序",
    value: "速度拍 -> 进攻拍 -> 均衡拍，对比节奏明确",
    source: "operator",
    state: "人工样例",
  },
  {
    label: "高频问题",
    value: "杀球发力、手腕负担、推荐磅数、双打适配",
    source: "operator",
    state: "人工样例",
  },
  {
    label: "依据边界",
    value: "规格事实来自已审核知识，卖点建议必须可编辑",
    source: "review-rule",
    state: "规则预览",
  },
]

export const groundingReferences: readonly GroundingReference[] = [
  {
    title: "官方/品牌规格页",
    sourceType: "公开来源",
    reviewState: "需人工审核",
    confidence: "高可信候选",
    intendedUse: "重量、平衡点、中杆硬度、推荐磅数等事实字段",
    boundary: "本页不抓取、不复制长内容，仅展示未来引用位置",
  },
  {
    title: "平台规则与指标口径",
    sourceType: "规则来源",
    reviewState: "版本待定义",
    confidence: "按来源分级",
    intendedUse: "解释点击、转化、停留、违规风险等运营判断",
    boundary: "真实平台集成与规则刷新需要后续 OpenSpec",
  },
  {
    title: "团队复盘经验",
    sourceType: "内部知识",
    reviewState: "租户保护",
    confidence: "需审核记录",
    intendedUse: "沉淀常见异议、讲解节奏、话术改进经验",
    boundary: "本切片不展示真实业务笔记或客户内容",
  },
]

export const reviewPipelineStages: readonly ReviewPipelineStage[] = [
  {
    title: "人工事实",
    description: "主播、主题、商品顺序、问题与异议由运营录入",
    state: "样例展示",
    icon: ClipboardList,
  },
  {
    title: "知识快照",
    description: "选择已审核的规格、规则和团队经验作为依据",
    state: "未来接入",
    icon: ShieldCheck,
  },
  {
    title: "结构化分析",
    description: "AI 输出按 schema 分成复盘、诊断、话术和任务",
    state: "未来接入",
    icon: Sparkles,
  },
  {
    title: "人工审核",
    description: "运营编辑、采纳、拒绝或要求重生成",
    state: "未来接入",
    icon: ClipboardCheck,
  },
  {
    title: "反馈评估",
    description: "反馈进入提示词、评测样例和知识刷新队列",
    state: "未来接入",
    icon: GitBranch,
  },
]

export const analysisSections: readonly AnalysisSection[] = [
  {
    title: "直播摘要",
    artifact: "复盘主线",
    preview: "归纳本场主题、讲解节奏、商品切换和关键问题。",
    evidence: "依赖人工场次笔记与商品顺序",
    state: "AI 建议预览",
    icon: ClipboardList,
  },
  {
    title: "讲解诊断",
    artifact: "商品表达",
    preview: "识别规格事实是否说清，卖点是否贴合打法和水平。",
    evidence: "依赖球拍知识快照与团队讲解规则",
    state: "AI 建议预览",
    icon: Target,
  },
  {
    title: "问题聚类",
    artifact: "观众问题",
    preview: "聚合关于发力、控球、磅数、手感和双打适配的问题。",
    evidence: "依赖运营整理的问题清单",
    state: "AI 建议预览",
    icon: MessageSquareText,
  },
  {
    title: "异议模式",
    artifact: "购买阻力",
    preview: "标记价格、上手难度、耐用性、替代型号等异议。",
    evidence: "依赖人工标注与历史话术资产",
    state: "AI 建议预览",
    icon: Split,
  },
  {
    title: "话术改进",
    artifact: "可复用资产",
    preview: "生成可编辑的开场、对比、异议回应和转场建议。",
    evidence: "依赖已审核知识和被采纳的团队经验",
    state: "AI 建议预览",
    icon: Lightbulb,
  },
  {
    title: "下场任务草案",
    artifact: "运营动作",
    preview: "拆成补知识、改顺序、准备短视频、复核话术等动作。",
    evidence: "依赖人工审核后的建议",
    state: "AI 建议预览",
    icon: ListChecks,
  },
]

export const validationStates: readonly ValidationState[] = [
  {
    label: "空输入",
    description: "缺少主题、商品或问题时，不生成复盘结论。",
    state: "失败状态预览",
    icon: FileWarning,
    tone: "warning",
  },
  {
    label: "依据不足",
    description: "商品规格或问题证据不够时，建议必须降置信。",
    state: "质量状态预览",
    icon: ShieldCheck,
    tone: "info",
  },
  {
    label: "格式错误",
    description: "未来模型返回非 schema JSON 时进入重试或人工处理。",
    state: "错误状态预览",
    icon: Ban,
    tone: "warning",
  },
  {
    label: "超时/拒绝",
    description: "模型超时、拒绝或限流时保留人工工作流入口。",
    state: "故障状态预览",
    icon: TimerReset,
    tone: "muted",
  },
  {
    label: "来源过期",
    description: "知识快照过期时，输出不能作为高可信建议。",
    state: "刷新状态预览",
    icon: RefreshCcw,
    tone: "warning",
  },
]

export const feedbackSignals: readonly FeedbackSignal[] = [
  {
    label: "采纳",
    description: "建议可直接进入话术或任务草案。",
    futureUse: "评估高质量输出样例",
    icon: BadgeCheck,
    tone: "success",
  },
  {
    label: "编辑后采纳",
    description: "保留运营修改前后差异。",
    futureUse: "改进提示词和输出格式",
    icon: ClipboardCheck,
    tone: "info",
  },
  {
    label: "拒绝",
    description: "记录原因，如事实错误、表达不适合或无依据。",
    futureUse: "加入负例评测集合",
    icon: Ban,
    tone: "warning",
  },
  {
    label: "重生成",
    description: "区分缺证据、语气不对、任务不可执行等原因。",
    futureUse: "定位 prompt 或上下文问题",
    icon: RefreshCcw,
    tone: "default",
  },
  {
    label: "知识缺失",
    description: "建议暴露出型号、规则或话术知识空白。",
    futureUse: "触发知识补充或刷新",
    icon: GitBranch,
    tone: "info",
  },
  {
    label: "依据薄弱",
    description: "建议依赖的来源不足、过期或和场景匹配度低。",
    futureUse: "降低置信并补充评测样例",
    icon: ShieldCheck,
    tone: "warning",
  },
  {
    label: "下游复用",
    description: "建议被带入话术资产、短视频题目或下场任务。",
    futureUse: "衡量运营实用性",
    icon: History,
    tone: "success",
  },
]

export const reviewActions: readonly ReviewAction[] = [
  {
    label: "采纳",
    description: "未来写入审核记录",
    icon: BadgeCheck,
  },
  {
    label: "编辑",
    description: "未来保留修改差异",
    icon: ClipboardCheck,
  },
  {
    label: "拒绝",
    description: "未来要求原因",
    icon: Ban,
  },
  {
    label: "重生成",
    description: "未来选择重生成原因",
    icon: RefreshCcw,
  },
]

export const downstreamArtifacts: readonly DownstreamArtifact[] = [
  {
    label: "话术资产",
    description: "被采纳的讲解结构和异议回应进入版本化话术库。",
    state: "后续变更",
  },
  {
    label: "短视频选题",
    description: "高频问题和卖点缺口转成可审核的选题草案。",
    state: "后续变更",
  },
  {
    label: "下场任务",
    description: "可执行动作按负责人、截止时间和复用状态管理。",
    state: "后续变更",
  },
]

export const aiReviewBoundaries = [
  "不调用 AI provider，不执行 prompt，不生成真实模型输出",
  "不保存复盘、反馈、任务或团队知识到数据库",
  "不抓取公开来源，不读取抖音或电商平台数据",
  "不展示真实客户评论、直播转录、GMV、价格策略或私有提示词",
] as const
