import type { LucideIcon } from "lucide-react"
import {
  BadgeCheck,
  BrainCircuit,
  ClipboardCheck,
  Database,
  FileSearch,
  GitCompareArrows,
  MessageSquareText,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
} from "lucide-react"

export type SourceTrustLevel =
  | "official_brand"
  | "official_platform"
  | "official_sport_rule"
  | "academic_research"
  | "authorized_retailer"

export type KnowledgeSource = {
  name: string
  owner: string
  sourceType: string
  trustLevel: SourceTrustLevel
  url: string
  reviewState: string
  refreshCadence: string
  intendedFields: string[]
  aiUse: string
}

export type LearningStage = {
  title: string
  description: string
  status: string
  icon: LucideIcon
}

export type FeedbackSignal = {
  label: string
  description: string
  futureUse: string
  icon: LucideIcon
}

export const trustLevelLabels: Record<SourceTrustLevel, string> = {
  official_brand: "官方品牌",
  official_platform: "官方平台",
  official_sport_rule: "官方规则",
  academic_research: "研究参考",
  authorized_retailer: "授权零售参考",
}

export const knowledgeSources: KnowledgeSource[] = [
  {
    name: "Yonex ASTROX 100ZZ product page",
    owner: "Yonex USA",
    sourceType: "球拍官方商品页",
    trustLevel: "official_brand",
    url: "https://us.yonex.com/products/astrox-100zz",
    reviewState: "待人工复核",
    refreshCadence: "每月或新型号上架时",
    intendedFields: ["型号", "重量/握柄", "适合打法", "中杆/平衡", "官方技术标签"],
    aiUse: "用于核对球拍规格和型号对比",
  },
  {
    name: "BWF Laws of Badminton",
    owner: "Badminton World Federation",
    sourceType: "羽毛球官方规则",
    trustLevel: "official_sport_rule",
    url: "https://corporate.bwfbadminton.com/statutes/",
    reviewState: "规则引用",
    refreshCadence: "季度或规则更新时",
    intendedFields: ["球拍结构", "长度/宽度限制", "术语定义"],
    aiUse: "用于核对规则表述",
  },
  {
    name: "Douyin E-commerce Learning Center",
    owner: "抖音电商学习中心",
    sourceType: "平台运营学习资料",
    trustLevel: "official_platform",
    url: "https://school.jinritemai.com/doudian/wap/?btm_ppre=a0.b0.c0.d0",
    reviewState: "待人工复核",
    refreshCadence: "每月或平台规则变化前",
    intendedFields: ["商品运营", "直播运营", "短视频运营", "客服/订单/评价"],
    aiUse: "用于参考直播运营建议",
  },
  {
    name: "TikTok live shopping metrics",
    owner: "TikTok Ads Manager Help",
    sourceType: "直播购物指标说明",
    trustLevel: "official_platform",
    url: "https://ads.tiktok.com/help/article/key-reporting-metrics-for-live-shopping-ads",
    reviewState: "指标参考",
    refreshCadence: "每月或指标口径变化时",
    intendedFields: ["观看", "商品点击", "加购", "成交", "收入", "ROAS"],
    aiUse: "用于理解直播指标",
  },
  {
    name: "Live-commerce interaction research",
    owner: "Open-access academic sources",
    sourceType: "直播电商研究",
    trustLevel: "academic_research",
    url: "https://www.frontiersin.org/",
    reviewState: "研究假设",
    refreshCadence: "季度",
    intendedFields: ["主播专业度", "互动质量", "信任", "购买意愿", "持续观看"],
    aiUse: "用于参考互动和信任相关问题",
  },
]

export const learningStages: LearningStage[] = [
  {
    title: "添加来源",
    description: "记录链接、类型和检查频率。",
    status: "待添加",
    icon: FileSearch,
  },
  {
    title: "整理内容",
    description: "提取规格、规则、指标和运营经验。",
    status: "待整理",
    icon: Database,
  },
  {
    title: "人工审核",
    description: "确认冲突、缺失和过期内容。",
    status: "待审核",
    icon: ClipboardCheck,
  },
  {
    title: "标记可用",
    description: "审核通过后再用于复盘。",
    status: "待确认",
    icon: ShieldCheck,
  },
  {
    title: "生成建议",
    description: "复盘、话术和任务都显示来源。",
    status: "待生成",
    icon: Sparkles,
  },
  {
    title: "记录反馈",
    description: "记录采纳、编辑、拒绝和重生成原因。",
    status: "待记录",
    icon: BrainCircuit,
  },
]

export const feedbackSignals: FeedbackSignal[] = [
  {
    label: "采纳",
    description: "建议被直接用于复盘、话术或任务。",
    futureUse: "保留为高质量参考",
    icon: BadgeCheck,
  },
  {
    label: "编辑后采纳",
    description: "运营修改后继续使用。",
    futureUse: "帮助改进表达",
    icon: MessageSquareText,
  },
  {
    label: "拒绝",
    description: "建议不适合当前场景。",
    futureUse: "避免重复错误",
    icon: GitCompareArrows,
  },
  {
    label: "要求重新生成",
    description: "方向可用，但需要重新整理。",
    futureUse: "帮助改进生成效果",
    icon: RefreshCcw,
  },
  {
    label: "知识缺失",
    description: "缺少某个型号、规则或常见问题。",
    futureUse: "触发来源补充、人工复核或刷新任务",
    icon: FileSearch,
  },
]
