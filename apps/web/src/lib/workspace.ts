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
    description: "线路、基线和后续波次",
    href: "/",
    status: "当前入口",
    eyebrow: "运营总览",
    unavailableReason: "总览页只展示项目线路和边界，不读取业务数据。",
    primaryAction: "查看线路状态",
    readiness: [
      "Next.js App Router",
      "pnpm workspace",
      "Docker 构建基线",
      "OpenSpec 变更追踪",
    ],
    preview: [
      "工作区导航已稳定",
      "业务数据仍未接入",
      "AI 与权限后续实现",
    ],
    icon: ClipboardList,
  },
  {
    id: "sessions",
    title: "直播场次",
    description: "记录主题、主播、商品顺序和问题",
    href: "/sessions",
    status: "占位",
    eyebrow: "Wave 4 准备面",
    unavailableReason: "场次草稿、保存和真实转录将在后续变更中实现。",
    primaryAction: "新建直播草稿",
    readiness: [
      "定义场次主题和主播字段",
      "接入商品讲解顺序",
      "支持问题与异议录入",
      "处理刷新或关闭页面后的草稿恢复",
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
    description: "型号、规格、别名和卖点",
    href: "/rackets",
    status: "占位",
    eyebrow: "Wave 2 准备面",
    unavailableReason: "产品库、别名合并和规格审核将在后续变更中实现。",
    primaryAction: "添加球拍型号",
    readiness: [
      "定义品牌、系列和型号字段",
      "处理重量、平衡点和中杆硬度",
      "记录推荐磅数和适合打法",
      "识别重复型号和中英文别名",
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
    title: "种子知识库",
    description: "公开来源、审核、刷新和版本",
    href: "/knowledge",
    status: "占位",
    eyebrow: "Wave 3 准备面",
    unavailableReason: "来源注册、抓取导入和人工审核队列将在后续变更中实现。",
    primaryAction: "登记公开来源",
    readiness: [
      "建立来源信任等级",
      "记录抓取时间和刷新周期",
      "展示冲突字段和审核状态",
      "保留可回滚的版本历史",
    ],
    preview: [
      "官方品牌规格页",
      "平台规则与指标说明",
      "学术/行业研究摘录",
      "内部运营经验",
    ],
    icon: Database,
  },
  {
    id: "ai-review",
    title: "AI 复盘",
    description: "复盘、诊断、建议和任务",
    href: "/ai-review",
    status: "占位",
    eyebrow: "Wave 5 准备面",
    unavailableReason: "AI 调用、结构化输出校验和人工采纳流程将在后续变更中实现。",
    primaryAction: "生成复盘建议",
    readiness: [
      "分离人工事实与 AI 推断",
      "定义结构化输出 schema",
      "处理超时、拒绝和格式错误",
      "允许编辑、采纳、拒绝或重新生成",
    ],
    preview: [
      "直播摘要",
      "讲解诊断",
      "问题聚类",
      "下场任务草案",
    ],
    icon: Bot,
  },
  {
    id: "talk-tracks",
    title: "话术资产",
    description: "讲解结构、异议回应和短视频选题",
    href: "/talk-tracks",
    status: "占位",
    eyebrow: "Wave 5/6 准备面",
    unavailableReason: "话术沉淀、版本管理和导出将在后续变更中实现。",
    primaryAction: "整理讲解话术",
    readiness: [
      "绑定球拍型号和适合打法",
      "沉淀常见异议回应",
      "区分官方规格和运营经验",
      "生成短视频选题候选",
    ],
    preview: [
      "开场讲解结构",
      "性能卖点表达",
      "异议回应模板",
      "短视频选题",
    ],
    icon: MicVocal,
  },
  {
    id: "next-actions",
    title: "下场任务",
    description: "复用、检查和跟进动作",
    href: "/next-actions",
    status: "占位",
    eyebrow: "Wave 5/6 准备面",
    unavailableReason: "任务创建、指派、完成状态和提醒将在后续变更中实现。",
    primaryAction: "创建下场任务",
    readiness: [
      "从复盘结果生成任务",
      "区分商品、话术和运营动作",
      "支持负责人和截止时间",
      "保留任务完成与复用记录",
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
    label: "应用脚手架",
    value: "已验证",
    icon: BadgeCheck,
  },
  {
    label: "Docker 部署",
    value: "可构建",
    icon: ShieldAlert,
  },
  {
    label: "工作区线路",
    value: "本变更",
    icon: RefreshCcw,
  },
  {
    label: "认证与团队",
    value: "后续变更",
    icon: HelpCircle,
  },
]

export const bootstrapChecks = [
  "Next.js App Router",
  "pnpm workspace",
  "Tailwind + shadcn 基线",
  "lint / typecheck / build",
  "Docker build / run",
]

export const deferredCapabilities = [
  "账号登录与团队权限",
  "PostgreSQL 数据模型",
  "AI 复盘调用",
  "公开来源采集与刷新",
  "对象存储与导出",
  "抖音/电商平台集成",
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
