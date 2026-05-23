import type { LucideIcon } from "lucide-react"
import {
  BadgeCheck,
  Bot,
  CircleAlert,
  Database,
  FileSearch,
  GitCompareArrows,
  ListChecks,
  PackagePlus,
  RefreshCcw,
  SearchCheck,
  ShieldCheck,
  Sparkles,
  Tags,
} from "lucide-react"

export type RacketTone = "default" | "success" | "warning" | "info" | "muted"

export type RacketMetric = {
  label: string
  value: string
  description: string
  tone: RacketTone
}

export type RacketProductRecord = {
  model: string
  aliases: string[]
  weightClass: string
  balance: string
  shaftStiffness: string
  recommendedTension: string
  playerLevel: string
  playStyle: string
  priceBand: string
  sellingFocus: string
  reviewState: string
  sourceFreshness: string
  tone: RacketTone
}

export type SpecCoverage = {
  label: string
  description: string
  state: string
  icon: LucideIcon
  tone: RacketTone
}

export type ReviewQueueItem = {
  label: string
  description: string
  state: string
  icon: LucideIcon
  tone: RacketTone
}

export type DownstreamReadiness = {
  workflow: string
  useCase: string
  blockedBy: string
  icon: LucideIcon
}

export type RacketLibraryAction = {
  label: string
  description: string
  icon: LucideIcon
}

export const racketMetrics: readonly RacketMetric[] = [
  {
    label: "产品记录",
    value: "示例",
    description: "只展示未来产品库信息结构，不代表已保存数据",
    tone: "info",
  },
  {
    label: "规格完整度",
    value: "字段预览",
    description: "重量、平衡、中杆、磅数等需要来源审核",
    tone: "success",
  },
  {
    label: "别名合并",
    value: "待接入",
    description: "中英文名、系列名、直播口播名需要统一",
    tone: "warning",
  },
  {
    label: "AI 可用性",
    value: "未开放",
    description: "未审核知识不会进入 AI grounding",
    tone: "default",
  },
]

export const racketProductRecords: readonly RacketProductRecord[] = [
  {
    model: "疾速 900 示例拍",
    aliases: ["Speed 900", "疾速900", "双打速度拍"],
    weightClass: "4U / 5U",
    balance: "偏头轻，平衡点待核",
    shaftStiffness: "中硬",
    recommendedTension: "24-28 磅待来源确认",
    playerLevel: "进阶 / 中高级",
    playStyle: "双打连贯、前中场速度",
    priceBand: "中高价位",
    sellingFocus: "挥速快、连贯好、适合快速平抽挡",
    reviewState: "需要来源复核",
    sourceFreshness: "来源未接入",
    tone: "warning",
  },
  {
    model: "强攻 100 示例拍",
    aliases: ["Power 100", "强攻100", "后场进攻拍"],
    weightClass: "3U / 4U",
    balance: "偏头重",
    shaftStiffness: "硬",
    recommendedTension: "26-30 磅待来源确认",
    playerLevel: "中高级 / 高阶",
    playStyle: "单打后场、重杀、点杀",
    priceBand: "高价位",
    sellingFocus: "进攻压迫感强，但需要发力基础",
    reviewState: "讲解规则预览",
    sourceFreshness: "待官方规格",
    tone: "default",
  },
  {
    model: "均衡 70 示例拍",
    aliases: ["Balance 70", "均衡70", "升级入门拍"],
    weightClass: "4U",
    balance: "均衡",
    shaftStiffness: "中等",
    recommendedTension: "22-26 磅待来源确认",
    playerLevel: "入门进阶 / 进阶",
    playStyle: "控球、过渡、单双打通用",
    priceBand: "中价位",
    sellingFocus: "上手门槛低，适合第一支进阶拍",
    reviewState: "团队经验待审核",
    sourceFreshness: "示例数据",
    tone: "muted",
  },
]

export const specCoverage: readonly SpecCoverage[] = [
  {
    label: "规格事实",
    description: "型号、重量、平衡点、中杆硬度、推荐磅数必须来自可追溯来源。",
    state: "契约必填",
    icon: ShieldCheck,
    tone: "success",
  },
  {
    label: "别名归并",
    description: "处理中英文名、系列简称、直播口播名和重复型号。",
    state: "高风险",
    icon: Tags,
    tone: "warning",
  },
  {
    label: "适用人群",
    description: "区分入门、进阶、中高级、打法偏好和发力门槛。",
    state: "需审核",
    icon: SearchCheck,
    tone: "default",
  },
  {
    label: "卖点边界",
    description: "卖点可以来自团队经验，但不能覆盖官方规格事实。",
    state: "可编辑",
    icon: BadgeCheck,
    tone: "info",
  },
]

export const reviewQueueItems: readonly ReviewQueueItem[] = [
  {
    label: "平衡点冲突",
    description: "不同来源或团队口径不一致时，需要展示冲突值和 reviewer 结论。",
    state: "后续审核",
    icon: GitCompareArrows,
    tone: "warning",
  },
  {
    label: "推荐磅数缺失",
    description: "未找到来源时保持未知，不为 AI 或话术编造推荐值。",
    state: "缺来源",
    icon: CircleAlert,
    tone: "warning",
  },
  {
    label: "相近型号对比",
    description: "同价位、同打法或同系列替代款需要人工确认比较维度。",
    state: "规划中",
    icon: RefreshCcw,
    tone: "muted",
  },
]

export const downstreamReadiness: readonly DownstreamReadiness[] = [
  {
    workflow: "直播场次",
    useCase: "讲解顺序中引用产品规格和适合人群",
    blockedBy: "需要产品 ID、别名合并和审核状态",
    icon: ListChecks,
  },
  {
    workflow: "AI 复盘",
    useCase: "诊断讲解是否说清规格事实和打法匹配",
    blockedBy: "需要 reviewed knowledge snapshot",
    icon: Bot,
  },
  {
    workflow: "话术资产",
    useCase: "沉淀开场、对比、异议回应和短视频选题",
    blockedBy: "需要团队话术审核和版本记录",
    icon: Sparkles,
  },
  {
    workflow: "Q&A Agent",
    useCase: "回答型号、磅数、打法和替代推荐问题",
    blockedBy: "需要 RAG 契约、评测集和引用展示",
    icon: Database,
  },
]

export const racketActions: readonly RacketLibraryAction[] = [
  {
    label: "添加型号",
    description: "未来创建团队产品记录",
    icon: PackagePlus,
  },
  {
    label: "导入规格",
    description: "未来登记公开来源和候选字段",
    icon: FileSearch,
  },
]
