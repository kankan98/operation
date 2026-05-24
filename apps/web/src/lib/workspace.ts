import type { LucideIcon } from "lucide-react"
import {
  BadgeCheck,
  Bot,
  ClipboardList,
  Database,
  HelpCircle,
  ListChecks,
  MicVocal,
  PackageSearch,
  RefreshCcw,
  ShieldAlert,
  Video,
} from "lucide-react"

export type WorkflowRouteId =
  | "sessions"
  | "rackets"
  | "knowledge"
  | "ai-review"
  | "talk-tracks"
  | "next-actions"

export type WorkspaceRouteId = "overview" | WorkflowRouteId

export type WorkspaceRoute = {
  id: WorkspaceRouteId
  title: string
  description: string
  href: string
  status: string
  eyebrow: string
  unavailableReason: string
  primaryAction: string
  readiness: string[]
  preview: string[]
  icon: LucideIcon
}

export type WorkflowRoute = WorkspaceRoute & {
  id: WorkflowRouteId
}

export const workspaceRoutes: readonly WorkspaceRoute[] = [
  {
    id: "overview",
    title: "总览",
    description: "查看今天要处理的内容",
    href: "/",
    status: "当前入口",
    eyebrow: "运营总览",
    unavailableReason: "先选择一个工作面继续。",
    primaryAction: "查看工作面",
    readiness: [
      "整理直播主题",
      "确认主推型号",
      "标记观众问题",
      "检查资料来源",
    ],
    preview: [
      "今日场次",
      "主推产品",
      "待审核资料",
      "下场任务",
    ],
    icon: ClipboardList,
  },
  {
    id: "sessions",
    title: "直播场次",
    description: "记录本场重点",
    href: "/sessions",
    status: "待记录",
    eyebrow: "场次记录",
    unavailableReason: "暂不能保存草稿。请先整理主题、主播、商品和问题。",
    primaryAction: "新建直播草稿",
    readiness: [
      "填写主题和主播",
      "排序讲解商品",
      "记录问题和异议",
      "检查草稿是否完整",
    ],
    preview: [
      "主题 / 主播 / 时间",
      "商品讲解顺序",
      "观众问题与异议",
      "下场跟进动作",
    ],
    icon: Video,
  },
  {
    id: "rackets",
    title: "球拍产品",
    description: "维护型号和卖点",
    href: "/rackets",
    status: "待审核",
    eyebrow: "产品资料",
    unavailableReason: "暂不能保存产品。请先核对规格、别名和卖点。",
    primaryAction: "添加球拍型号",
    readiness: [
      "填写品牌和型号",
      "核对重量和平衡点",
      "记录磅数和打法",
      "合并重复别名",
    ],
    preview: [
      "型号与别名",
      "规格与适合人群",
      "价格带和卖点",
      "相近型号对比",
    ],
    icon: PackageSearch,
  },
  {
    id: "knowledge",
    title: "资料来源",
    description: "保存可信来源",
    href: "/knowledge",
    status: "待复核",
    eyebrow: "知识来源",
    unavailableReason: "暂不能登记来源。请先确认资料是否可信。",
    primaryAction: "登记公开来源",
    readiness: [
      "添加来源链接",
      "标记来源类型",
      "检查冲突内容",
      "记录更新时间",
    ],
    preview: [
      "品牌规格",
      "平台规则",
      "行业资料",
      "团队经验",
    ],
    icon: Database,
  },
  {
    id: "ai-review",
    title: "智能复盘",
    description: "生成建议并确认",
    href: "/ai-review",
    status: "待生成",
    eyebrow: "复盘建议",
    unavailableReason: "暂不能生成复盘。请先准备场次、产品和资料。",
    primaryAction: "生成复盘建议",
    readiness: [
      "选择直播场次",
      "确认产品资料",
      "生成复盘建议",
      "确认或重新生成",
    ],
    preview: [
      "直播摘要",
      "讲解问题",
      "问题聚类",
      "下场任务草案",
    ],
    icon: Bot,
  },
  {
    id: "talk-tracks",
    title: "话术资产",
    description: "整理可复用话术",
    href: "/talk-tracks",
    status: "暂无资产",
    eyebrow: "话术沉淀",
    unavailableReason: "暂无可用话术。请先从问题和复盘中筛选。",
    primaryAction: "整理讲解话术",
    readiness: [
      "选择球拍型号",
      "整理常见异议",
      "确认规格和经验",
      "准备短视频选题",
    ],
    preview: [
      "开场讲解结构",
      "卖点表达",
      "异议回应模板",
      "短视频选题",
    ],
    icon: MicVocal,
  },
  {
    id: "next-actions",
    title: "下场任务",
    description: "安排下一步",
    href: "/next-actions",
    status: "暂无任务",
    eyebrow: "下场准备",
    unavailableReason: "暂无任务。请先完成场次记录和复盘确认。",
    primaryAction: "创建下场任务",
    readiness: [
      "选择任务来源",
      "填写任务内容",
      "设置负责人",
      "标记完成状态",
    ],
    preview: [
      "补充型号对比",
      "复核讲解顺序",
      "整理高频问题",
      "准备短视频脚本",
    ],
    icon: ListChecks,
  },
]

export const workflowRoutes = workspaceRoutes.filter(
  (route): route is WorkflowRoute => route.id !== "overview",
)

export const primaryNavItems = workflowRoutes

export const overviewReadinessItems = [
  {
    label: "今日场次",
    value: "暂无记录",
    icon: BadgeCheck,
  },
  {
    label: "产品资料",
    value: "待补充",
    icon: ShieldAlert,
  },
  {
    label: "知识来源",
    value: "待审核",
    icon: RefreshCcw,
  },
  {
    label: "下场任务",
    value: "暂无任务",
    icon: HelpCircle,
  },
]

export const bootstrapChecks = [
  "补齐本周场次",
  "核对主推型号",
  "整理观众问题",
  "确认下场任务",
  "检查资料来源",
]

export const deferredCapabilities = [
  "团队登录",
  "保存记录",
  "自动复盘",
  "来源自动刷新",
  "文件导出",
  "平台数据同步",
]

export function getWorkspaceRoute(routeId: WorkspaceRouteId) {
  return workspaceRoutes.find((route) => route.id === routeId)
}

export function getRequiredWorkspaceRoute(routeId: WorkspaceRouteId) {
  const route = getWorkspaceRoute(routeId)

  if (!route) {
    throw new Error(`Unknown workspace route: ${routeId}`)
  }

  return route
}
