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
    aiUse: "用于校验产品讲解事实和相近型号对比边界",
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
    aiUse: "用于避免讲解中出现违反运动规则的规格表述",
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
    aiUse: "用于约束直播运营建议和下一场任务分类",
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
    aiUse: "用于未来复盘指标解释和运营漏斗诊断",
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
    aiUse: "用于构造复盘启发式，不作为商品事实来源",
  },
]

export const learningStages: LearningStage[] = [
  {
    title: "登记允许来源",
    description: "记录 URL、来源类型、采集方式、可信度和刷新周期。",
    status: "规划中",
    icon: FileSearch,
  },
  {
    title: "规范化候选知识",
    description: "把规格、规则、指标和运营策略整理成可审核字段。",
    status: "规划中",
    icon: Database,
  },
  {
    title: "人工审核和版本化",
    description: "对冲突、缺失、过期字段做人工决策并保留历史版本。",
    status: "规划中",
    icon: ClipboardCheck,
  },
  {
    title: "发布可引用快照",
    description: "AI 分析只引用已审核或明确标记为参考的知识快照。",
    status: "规划中",
    icon: ShieldCheck,
  },
  {
    title: "AI 生成运营建议",
    description: "复盘、话术、短视频选题和下场任务都显示引用来源。",
    status: "后续",
    icon: Sparkles,
  },
  {
    title: "反馈反哺评估",
    description: "采纳、编辑、拒绝和重新生成原因进入评估样例库。",
    status: "后续",
    icon: BrainCircuit,
  },
]

export const feedbackSignals: FeedbackSignal[] = [
  {
    label: "采纳",
    description: "建议被直接用于复盘、话术或任务。",
    futureUse: "提升相似知识快照和提示词路径的置信度",
    icon: BadgeCheck,
  },
  {
    label: "编辑后采纳",
    description: "运营保留方向但修改表达或事实边界。",
    futureUse: "生成高价值评估样例，定位措辞或字段缺口",
    icon: MessageSquareText,
  },
  {
    label: "拒绝",
    description: "建议不适合当前产品、场次或平台规则。",
    futureUse: "标记错误启发式，避免相同模式重复出现",
    icon: GitCompareArrows,
  },
  {
    label: "要求重新生成",
    description: "建议方向可用但结构、粒度或证据不足。",
    futureUse: "改进输出 schema、引用要求和 prompt 版本",
    icon: RefreshCcw,
  },
  {
    label: "知识缺失",
    description: "AI 无法解释某型号、规则、指标或常见问题。",
    futureUse: "触发来源补充、人工复核或刷新任务",
    icon: FileSearch,
  },
]
