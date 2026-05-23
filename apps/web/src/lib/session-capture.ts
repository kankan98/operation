import type { LucideIcon } from "lucide-react"
import {
  AlertCircle,
  BadgeCheck,
  ClipboardList,
  Clock3,
  FileWarning,
  HelpCircle,
  ListChecks,
  MessageSquareText,
  PackageSearch,
  RefreshCcw,
  ShieldCheck,
  Target,
  TimerReset,
  Upload,
  Video,
} from "lucide-react"

export type CaptureTone = "default" | "success" | "warning" | "info" | "muted"

export type SessionMetric = {
  label: string
  value: string
  description: string
  tone: CaptureTone
}

export type SessionFact = {
  label: string
  value: string
  required: string
  boundary: string
}

export type ProductOrderRow = {
  order: string
  racketModel: string
  role: string
  checkpoint: string
  customerFit: string
  evidence: string
}

export type CapturePrompt = {
  label: string
  description: string
  examples: readonly string[]
  icon: LucideIcon
}

export type DraftState = {
  label: string
  description: string
  state: string
  icon: LucideIcon
  tone: CaptureTone
}

export type DownstreamReadiness = {
  label: string
  description: string
  target: string
}

export type BoundaryItem = {
  label: string
  description: string
  icon: LucideIcon
}

export const sessionMetrics: readonly SessionMetric[] = [
  {
    label: "来源方式",
    value: "手动",
    description: "MVP 先由运营整理场次事实和问题",
    tone: "info",
  },
  {
    label: "商品顺序",
    value: "必填",
    description: "AI 复盘和话术改进依赖讲解顺序",
    tone: "success",
  },
  {
    label: "问题/异议",
    value: "分组",
    description: "沉淀客户关注点和购买阻力",
    tone: "default",
  },
  {
    label: "保存能力",
    value: "未接入",
    description: "当前不写入草稿或数据库",
    tone: "warning",
  },
]

export const sessionFacts: readonly SessionFact[] = [
  {
    label: "场次主题",
    value: "高端进攻拍对比与中高级球友选择",
    required: "必填字段",
    boundary: "人工样例，不是已保存草稿",
  },
  {
    label: "主播 / 讲解人",
    value: "主讲、助播、场控可分开记录",
    required: "必填字段",
    boundary: "后续需要团队成员和权限",
  },
  {
    label: "直播日期",
    value: "用于关联复盘版本、知识快照和任务周期",
    required: "必填字段",
    boundary: "当前不创建时间记录",
  },
  {
    label: "目标人群",
    value: "中高级、进攻型、双打后场、控球型等",
    required: "建议填写",
    boundary: "用于后续推荐话术和问题聚类",
  },
]

export const productOrderRows: readonly ProductOrderRow[] = [
  {
    order: "01",
    racketModel: "速度型主推拍",
    role: "开场建立对比",
    checkpoint: "重量级别、平衡点、挥速感受",
    customerFit: "双打前中场、追求连贯速度",
    evidence: "规格事实需来自已审核知识",
  },
  {
    order: "02",
    racketModel: "进攻型高端拍",
    role: "核心成交讲解",
    checkpoint: "中杆硬度、发力门槛、推荐磅数",
    customerFit: "中高级后场、重杀和点杀需求",
    evidence: "卖点建议需可编辑",
  },
  {
    order: "03",
    racketModel: "均衡型替代拍",
    role: "异议承接和替代推荐",
    checkpoint: "上手难度、控球稳定性、预算带",
    customerFit: "升级第一支高端拍的进阶用户",
    evidence: "相近型号对比需人工复核",
  },
]

export const questionPrompts: readonly CapturePrompt[] = [
  {
    label: "客户问题",
    description: "记录用户真实问法的主题，不保存个人身份信息。",
    examples: ["这支拍手腕负担大吗", "26 磅能不能拉", "双打后场适合吗"],
    icon: MessageSquareText,
  },
  {
    label: "购买异议",
    description: "把阻力分成价格、上手难度、耐用性、替代型号等。",
    examples: ["预算超出", "担心太硬", "已有相近型号"],
    icon: AlertCircle,
  },
  {
    label: "讲解缺口",
    description: "标记本场没有讲清或需要补证据的点。",
    examples: ["平衡点未解释", "推荐人群太宽", "缺对比型号"],
    icon: FileWarning,
  },
]

export const draftStates: readonly DraftState[] = [
  {
    label: "未保存草稿",
    description: "未来需要自动保存和离开提醒。",
    state: "后续接入",
    icon: Clock3,
    tone: "warning",
  },
  {
    label: "缺必填字段",
    description: "主题、主播、日期、商品顺序缺失时不能进入复盘。",
    state: "校验预览",
    icon: ShieldCheck,
    tone: "info",
  },
  {
    label: "长笔记处理",
    description: "长转录或长笔记需要分段、摘要和安全边界。",
    state: "容量预览",
    icon: ClipboardList,
    tone: "muted",
  },
  {
    label: "刷新恢复",
    description: "用户刷新或关闭页面后需要恢复未提交内容。",
    state: "恢复预览",
    icon: RefreshCcw,
    tone: "default",
  },
  {
    label: "可进入复盘",
    description: "字段齐全且来源边界清楚后，才能创建 AI 复盘输入。",
    state: "未来状态",
    icon: BadgeCheck,
    tone: "success",
  },
]

export const downstreamReadiness: readonly DownstreamReadiness[] = [
  {
    label: "AI 复盘",
    description: "把场次事实、商品顺序、问题和异议作为结构化输入。",
    target: "需要保存记录",
  },
  {
    label: "话术资产",
    description: "把被验证的问题、异议和讲解缺口沉淀为可复用话术。",
    target: "需要审核流程",
  },
  {
    label: "下场任务",
    description: "把补知识、改顺序、准备短视频等动作转成任务。",
    target: "需要任务模型",
  },
]

export const captureBoundaries: readonly BoundaryItem[] = [
  {
    label: "不保存草稿",
    description: "本页不写入 localStorage、API 或数据库。",
    icon: ShieldCheck,
  },
  {
    label: "不上传转录",
    description: "文件上传、解析和长文本处理需要后续变更。",
    icon: Upload,
  },
  {
    label: "不调用 AI",
    description: "不会生成复盘建议，也不会创建 AI 运行记录。",
    icon: Target,
  },
  {
    label: "不接平台",
    description: "不读取抖音、电商后台、订单或私信数据。",
    icon: TimerReset,
  },
]

export const captureActions = [
  { label: "保存草稿", icon: ClipboardList },
  { label: "导入转录", icon: Upload },
  { label: "进入复盘", icon: Target },
  { label: "创建任务", icon: ListChecks },
] as const

export const capturePrimarySections = [
  { label: "场次事实", icon: Video },
  { label: "商品顺序", icon: PackageSearch },
  { label: "问题异议", icon: HelpCircle },
  { label: "复盘准备", icon: ListChecks },
] as const
