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
    value: "待整理",
    description: "先整理型号、别名和规格",
    tone: "info",
  },
  {
    label: "规格完整度",
    value: "待复核",
    description: "重量、平衡、中杆、磅数需要确认",
    tone: "success",
  },
  {
    label: "别名合并",
    value: "待处理",
    description: "统一中英文名和直播口播名",
    tone: "warning",
  },
  {
    label: "复盘使用",
    value: "待审核",
    description: "审核后再用于复盘",
    tone: "default",
  },
]

export const racketProductRecords: readonly RacketProductRecord[] = [
  {
    model: "疾速 900",
    aliases: ["Speed 900", "疾速900", "双打速度拍"],
    weightClass: "4U / 5U",
    balance: "偏头轻，待核",
    shaftStiffness: "中硬",
    recommendedTension: "24-28 磅，待确认",
    playerLevel: "进阶 / 中高级",
    playStyle: "双打连贯、前中场速度",
    priceBand: "中高价位",
    sellingFocus: "挥速快、连贯好、适合快速平抽挡",
    reviewState: "需要来源复核",
    sourceFreshness: "待登记来源",
    tone: "warning",
  },
  {
    model: "强攻 100",
    aliases: ["Power 100", "强攻100", "后场进攻拍"],
    weightClass: "3U / 4U",
    balance: "偏头重",
    shaftStiffness: "硬",
    recommendedTension: "26-30 磅，待确认",
    playerLevel: "中高级 / 高阶",
    playStyle: "单打后场、重杀、点杀",
    priceBand: "高价位",
    sellingFocus: "进攻压迫感强，但需要发力基础",
    reviewState: "待确认",
    sourceFreshness: "待官方规格",
    tone: "default",
  },
  {
    model: "均衡 70",
    aliases: ["Balance 70", "均衡70", "升级入门拍"],
    weightClass: "4U",
    balance: "均衡",
    shaftStiffness: "中等",
    recommendedTension: "22-26 磅，待确认",
    playerLevel: "入门进阶 / 进阶",
    playStyle: "控球、过渡、单双打通用",
    priceBand: "中价位",
    sellingFocus: "上手门槛低，适合第一支进阶拍",
    reviewState: "待审核",
    sourceFreshness: "待复核",
    tone: "muted",
  },
]

export const specCoverage: readonly SpecCoverage[] = [
  {
    label: "规格事实",
    description: "型号、重量、平衡点、中杆硬度和磅数需要来源。",
    state: "必须填写",
    icon: ShieldCheck,
    tone: "success",
  },
  {
    label: "别名归并",
    description: "合并中英文名、简称和重复型号。",
    state: "高风险",
    icon: Tags,
    tone: "warning",
  },
  {
    label: "适用人群",
    description: "标清水平、打法和发力要求。",
    state: "需审核",
    icon: SearchCheck,
    tone: "default",
  },
  {
    label: "卖点",
    description: "卖点可编辑，但不能改动规格。",
    state: "可编辑",
    icon: BadgeCheck,
    tone: "info",
  },
]

export const reviewQueueItems: readonly ReviewQueueItem[] = [
  {
    label: "平衡点冲突",
    description: "多个说法不一致，需要先确认。",
    state: "待审核",
    icon: GitCompareArrows,
    tone: "warning",
  },
  {
    label: "推荐磅数缺失",
    description: "找不到来源时先标记为空。",
    state: "缺来源",
    icon: CircleAlert,
    tone: "warning",
  },
  {
    label: "相近型号对比",
    description: "同价位、同打法或同系列替代款需要人工确认比较维度。",
    state: "待整理",
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
    workflow: "智能复盘",
    useCase: "检查讲解是否说清规格和适合人群",
    blockedBy: "已审核资料",
    icon: Bot,
  },
  {
    workflow: "话术资产",
    useCase: "整理开场、对比、异议回应和短视频选题",
    blockedBy: "话术审核",
    icon: Sparkles,
  },
  {
    workflow: "问答助手",
    useCase: "回答型号、磅数、打法和替代推荐",
    blockedBy: "已审核资料",
    icon: Database,
  },
]

export const racketActions: readonly RacketLibraryAction[] = [
  {
    label: "添加型号",
    description: "创建团队产品记录",
    icon: PackagePlus,
  },
  {
    label: "导入规格",
    description: "登记公开来源和候选字段",
    icon: FileSearch,
  },
]
