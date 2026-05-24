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
    description: "先由运营手动整理",
    tone: "info",
  },
  {
    label: "商品顺序",
    value: "必填",
    description: "按直播讲解顺序填写",
    tone: "success",
  },
  {
    label: "问题/异议",
    value: "分组",
    description: "记录观众关注点和购买阻力",
    tone: "default",
  },
  {
    label: "保存能力",
    value: "暂不能保存",
    description: "补齐后再保存",
    tone: "warning",
  },
]

export const sessionFacts: readonly SessionFact[] = [
  {
    label: "场次主题",
    value: "高端进攻拍对比与中高级球友选择",
    required: "必填字段",
    boundary: "人工整理",
  },
  {
    label: "主播 / 讲解人",
    value: "主讲、助播、场控可分开记录",
    required: "必填字段",
    boundary: "需要团队权限",
  },
  {
    label: "直播日期",
    value: "用于安排复盘和下场任务",
    required: "必填字段",
    boundary: "待确认",
  },
  {
    label: "目标人群",
    value: "中高级、进攻型、双打后场、控球型等",
    required: "建议填写",
    boundary: "用于话术和问题聚类",
  },
]

export const productOrderRows: readonly ProductOrderRow[] = [
  {
    order: "01",
    racketModel: "速度型主推拍",
    role: "开场建立对比",
    checkpoint: "重量级别、平衡点、挥速感受",
    customerFit: "双打前中场、追求连贯速度",
    evidence: "规格需先审核",
  },
  {
    order: "02",
    racketModel: "进攻型高端拍",
    role: "核心成交讲解",
    checkpoint: "中杆硬度、发力门槛、推荐磅数",
    customerFit: "中高级后场、重杀和点杀需要",
    evidence: "卖点可编辑",
  },
  {
    order: "03",
    racketModel: "均衡型替代拍",
    role: "异议承接和替代推荐",
    checkpoint: "上手难度、控球稳定性、预算带",
    customerFit: "升级第一支高端拍的进阶用户",
    evidence: "对比需复核",
  },
]

export const questionPrompts: readonly CapturePrompt[] = [
  {
    label: "客户问题",
    description: "记录用户怎么问，不写个人信息。",
    examples: ["这支拍手腕负担大吗", "26 磅能不能拉", "双打后场适合吗"],
    icon: MessageSquareText,
  },
  {
    label: "购买异议",
    description: "记录价格、上手难度、耐用性等顾虑。",
    examples: ["预算超出", "担心太硬", "已有相近型号"],
    icon: AlertCircle,
  },
  {
    label: "讲解缺口",
    description: "标记本场没讲清的地方。",
    examples: ["平衡点未解释", "推荐人群太宽", "缺对比型号"],
    icon: FileWarning,
  },
]

export const draftStates: readonly DraftState[] = [
  {
    label: "未保存草稿",
    description: "离开前需要提醒。",
    state: "暂不能保存",
    icon: Clock3,
    tone: "warning",
  },
  {
    label: "缺必填字段",
    description: "主题、主播、日期、商品顺序缺失时不能进入复盘。",
    state: "需补齐",
    icon: ShieldCheck,
    tone: "info",
  },
  {
    label: "长笔记处理",
    description: "长内容需要分段处理。",
    state: "待处理",
    icon: ClipboardList,
    tone: "muted",
  },
  {
    label: "刷新恢复",
    description: "用户刷新或关闭页面后需要恢复未提交内容。",
    state: "待恢复",
    icon: RefreshCcw,
    tone: "default",
  },
  {
    label: "可进入复盘",
    description: "资料齐全后才能进入复盘。",
    state: "待满足",
    icon: BadgeCheck,
    tone: "success",
  },
]

export const downstreamReadiness: readonly DownstreamReadiness[] = [
  {
    label: "智能复盘",
    description: "根据场次、商品和问题生成建议。",
    target: "需要保存记录",
  },
  {
    label: "话术资产",
    description: "把问题和讲解缺口整理成话术。",
    target: "需要审核流程",
  },
  {
    label: "下场任务",
    description: "把要补的内容变成任务。",
    target: "需要任务设置",
  },
]

export const captureBoundaries: readonly BoundaryItem[] = [
  {
    label: "草稿未保存",
    description: "场次内容暂不能保存。",
    icon: ShieldCheck,
  },
  {
    label: "转录未上传",
    description: "转录文件暂不能上传或解析。",
    icon: Upload,
  },
  {
    label: "复盘未生成",
    description: "暂不能生成复盘建议。",
    icon: Target,
  },
  {
    label: "平台未同步",
    description: "暂不同步抖音、电商后台、订单或私信数据。",
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
