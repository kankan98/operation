export type ProductionAccessTransportGateStage = "implementation_ready"

export type ProductionAccessTransportGateStatus = "blocked" | "planned" | "ready"

export type ProductionAccessTransportSectionId =
  | "production_access"
  | "https_transport"

export type ProductionAccessGateItemId =
  | "provider_decision"
  | "public_login_routes"
  | "session_lifecycle"
  | "team_entry"
  | "team_switching"
  | "csrf_origin"
  | "authorization_guard"
  | "admin_recovery"

export type HttpsTransportGateItemId =
  | "domain_control"
  | "tls_certificate"
  | "https_redirect"
  | "secure_cookie_origin"
  | "preview_production_split"
  | "rollback_path"

export type ProductionAccessTransportGateItemId =
  | ProductionAccessGateItemId
  | HttpsTransportGateItemId

export type ProductionAccessTransportGateItem = {
  blocker: string
  evidence: string
  id: ProductionAccessTransportGateItemId
  nextAction: string
  passCriteria: string
  status: ProductionAccessTransportGateStatus
  statusLabel: string
  title: string
}

export type ProductionAccessTransportSection = {
  id: ProductionAccessTransportSectionId
  items: ProductionAccessTransportGateItem[]
  nextAction: string
  status: ProductionAccessTransportGateStatus
  statusLabel: string
  summary: string
  title: string
}

export type ProductionAccessTransportNextWave = {
  id: "production-auth-https-runtime"
  summary: string
  title: string
}

export type ProductionAccessTransportSafeDataBoundary = {
  allowedDataLabel: "仅演示/脱敏数据"
  blockedDataLabel: "真实客户/订单/私信/完整转录/定价策略"
  summary: string
}

export type ProductionAccessTransportGateAssessment = {
  controlledRealTrialReady: boolean
  currentBlockers: string[]
  headline: string
  nextImplementationWave: ProductionAccessTransportNextWave
  providerSelectionCriteria: string[]
  safeDataBoundary: ProductionAccessTransportSafeDataBoundary
  sections: ProductionAccessTransportSection[]
  stage: ProductionAccessTransportGateStage
  stageLabel: string
  summary: string
  supportingEvidence: string[]
  transportPassCriteria: string[]
}

export const accessGateItemIds: ProductionAccessGateItemId[] = [
  "provider_decision",
  "public_login_routes",
  "session_lifecycle",
  "team_entry",
  "team_switching",
  "csrf_origin",
  "authorization_guard",
  "admin_recovery",
]

export const transportGateItemIds: HttpsTransportGateItemId[] = [
  "domain_control",
  "tls_certificate",
  "https_redirect",
  "secure_cookie_origin",
  "preview_production_split",
  "rollback_path",
]

const statusLabel: Record<ProductionAccessTransportGateStatus, string> = {
  blocked: "阻断",
  planned: "已拆解",
  ready: "可实施",
}

const accessItems: ProductionAccessTransportGateItem[] = [
  {
    blocker: "尚未选择生产登录 provider，也没有账号、回调和数据处理边界决策。",
    evidence: "已有 provider-neutral AuthPort、guard、session 和 cookie 基础。",
    id: "provider_decision",
    nextAction: "比较自托管与托管身份方案，确认账号归属、网络可达、数据边界和回滚路径。",
    passCriteria: "生产 provider 被 OpenSpec 接受，SDK 或 adapter 不泄漏到业务层。",
    status: "planned",
    statusLabel: statusLabel.planned,
    title: "登录方案",
  },
  {
    blocker: "还没有公开登录页、登录回调、错误态和登出后的重进路径。",
    evidence: "当前只有内部 V0 bootstrap、session 查询和 logout route。",
    id: "public_login_routes",
    nextAction: "定义登录、回调、失败、登出和已登录跳转的生产路由。",
    passCriteria: "浏览器可通过生产登录进入受保护工作面，失败态安全且可恢复。",
    status: "blocked",
    statusLabel: statusLabel.blocked,
    title: "登录路由",
  },
  {
    blocker: "生产 session 刷新、失效、角色变化后的重校验和审计策略未落地。",
    evidence: "已有 app-owned session ledger、hash reference 和失效状态。",
    id: "session_lifecycle",
    nextAction: "补齐生产 session TTL、刷新、撤销、角色变更重校验和审计事件。",
    passCriteria: "过期、撤销、停用、跨团队和角色变化均由服务端拒绝。",
    status: "planned",
    statusLabel: statusLabel.planned,
    title: "会话生命周期",
  },
  {
    blocker: "真实团队的初始进入方式、邀请接受和最小角色尚未确定。",
    evidence: "租户、团队、成员、角色和权限边界已有本地 guard 支撑。",
    id: "team_entry",
    nextAction: "确定 V1-Lite 是管理员预置单团队，还是同时开放邀请接受。",
    passCriteria: "每个生产用户都有应用自有 tenant/team membership 和可审计来源。",
    status: "blocked",
    statusLabel: statusLabel.blocked,
    title: "团队入口",
  },
  {
    blocker: "生产团队切换、默认团队和跨团队误操作防护还没有 UI/服务端闭环。",
    evidence: "当前 protected APIs 已要求显式 tenant/team scope。",
    id: "team_switching",
    nextAction: "定义默认团队、切换状态、URL scope 和服务端再校验策略。",
    passCriteria: "用户不能通过客户端状态访问非授权团队记录。",
    status: "planned",
    statusLabel: statusLabel.planned,
    title: "团队切换",
  },
  {
    blocker: "生产 mutation 的 CSRF header、Origin 校验和跨站策略未统一。",
    evidence: "当前本地业务 Route Handlers 已有 scoped CSRF header 习惯。",
    id: "csrf_origin",
    nextAction: "统一登录、登出、邀请、团队管理和业务 mutation 的 CSRF/origin 规则。",
    passCriteria: "跨站请求、缺少 CSRF、错误 Origin 和重复提交均有安全拒绝路径。",
    status: "planned",
    statusLabel: statusLabel.planned,
    title: "CSRF/Origin",
  },
  {
    blocker: "已有权限守卫需要在生产登录和 team scope 下重新验证全链路。",
    evidence: "产品、场次、知识、AI 复盘、话术和任务 APIs 已使用服务端授权。",
    id: "authorization_guard",
    nextAction: "用生产 session 上下文复测跨租户、跨团队、停用成员和缺权限访问。",
    passCriteria: "所有受保护读写继续由服务端 membership、role 和 record scope 授权。",
    status: "planned",
    statusLabel: statusLabel.planned,
    title: "服务端授权",
  },
  {
    blocker: "管理员误锁、provider 故障、邀请过期和登录失败的恢复流程未定义。",
    evidence: "已有 safe auth error shape，可扩展为生产恢复提示。",
    id: "admin_recovery",
    nextAction: "定义管理员恢复、账号停用、邀请重发和 provider 故障降级策略。",
    passCriteria: "关键账号/团队访问故障可恢复，且恢复过程不泄露 token 或 session。",
    status: "blocked",
    statusLabel: statusLabel.blocked,
    title: "恢复路径",
  },
]

const transportItems: ProductionAccessTransportGateItem[] = [
  {
    blocker: "还没有可用于正式试用的域名和 DNS 控制路径。",
    evidence: "当前公网预览是 HTTP IP 入口。",
    id: "domain_control",
    nextAction: "确认域名、DNS 管理方、解析记录和生产入口归属。",
    passCriteria: "生产入口使用受控域名，且 DNS 变更和回滚责任明确。",
    status: "blocked",
    statusLabel: statusLabel.blocked,
    title: "域名控制",
  },
  {
    blocker: "TLS 证书签发、自动续期和失败告警尚未定义。",
    evidence: "Docker preview 健康，但没有生产 TLS 证书链。",
    id: "tls_certificate",
    nextAction: "选择证书签发/续期路径，并定义续期失败处理。",
    passCriteria: "证书有效、自动续期可验证，续期失败不会静默影响登录。",
    status: "blocked",
    statusLabel: statusLabel.blocked,
    title: "TLS 证书",
  },
  {
    blocker: "HTTP 到 HTTPS 的跳转和生产 origin 策略未实现。",
    evidence: "当前 HTTP 预览只适合内部 V0 评估。",
    id: "https_redirect",
    nextAction: "定义 HTTPS 强制访问、HTTP 跳转和反向代理头处理。",
    passCriteria: "生产入口无法通过明文 HTTP 完成登录或受保护操作。",
    status: "blocked",
    statusLabel: statusLabel.blocked,
    title: "HTTPS 强制",
  },
  {
    blocker: "生产 secure cookie 依赖 HTTPS origin，不能复用 HTTP 预览例外。",
    evidence: "cookie runtime 默认 Secure，HTTP preview 例外需要显式开关。",
    id: "secure_cookie_origin",
    nextAction: "把生产 cookie 策略固定为 Secure、HttpOnly、SameSite，并绑定 HTTPS origin。",
    passCriteria: "生产 session cookie 只在 HTTPS 下签发和清理，不启用 HTTP 预览例外。",
    status: "planned",
    statusLabel: statusLabel.planned,
    title: "Secure Cookie",
  },
  {
    blocker: "预览环境和生产环境的 cookie、数据、开关和真实数据边界尚未拆开。",
    evidence: "当前 OPERATION_ALLOW_INSECURE_V0_PREVIEW_COOKIE 只服务演示预览。",
    id: "preview_production_split",
    nextAction: "定义 preview、staging、production 的环境变量、数据范围和禁止项。",
    passCriteria: "生产环境不能使用 V0 insecure preview cookie policy 或演示 bootstrap。",
    status: "blocked",
    statusLabel: statusLabel.blocked,
    title: "预览/生产分离",
  },
  {
    blocker: "域名、证书、反代和登录上线失败时的回滚路径未定义。",
    evidence: "Docker preview 可回滚为演示环境，但不能承载真实数据回滚。",
    id: "rollback_path",
    nextAction: "定义发布失败、证书失败、provider 失败和路由错误的回滚检查。",
    passCriteria: "生产入口可安全回退到不接收真实数据的状态，并保留排障证据。",
    status: "planned",
    statusLabel: statusLabel.planned,
    title: "回滚路径",
  },
]

const providerSelectionCriteria = [
  "账号与域名归属清晰，团队可长期维护。",
  "支持应用自有 user、tenant、team、membership 和 role 映射。",
  "支持邀请或可替代的受控团队入口。",
  "支持服务端 session 验证、失效和角色变化重校验。",
  "不把 provider token、profile payload 或 SDK shape 泄漏到业务层。",
  "网络可达性、数据处理边界、审计和成本可接受。",
  "故障时可回滚到不接收真实数据的安全状态。",
  "能覆盖 unauthenticated、expired、revoked、forbidden 和 cross-team 验证。",
]

const transportPassCriteria = [
  "生产入口使用受控域名和有效 TLS 证书。",
  "HTTP 请求会被重定向或拒绝，不能完成登录或受保护 mutation。",
  "生产 session cookie 使用 Secure、HttpOnly、SameSite 和 HTTPS origin。",
  "生产环境不启用 internal V0 HTTP preview cookie exception。",
  "证书续期、反向代理、origin header 和回滚路径都有验证证据。",
]

export function buildProductionAccessTransportGate(): ProductionAccessTransportGateAssessment {
  return {
    controlledRealTrialReady: false,
    currentBlockers: [
      "生产登录 provider、公开登录路由、团队入口和恢复路径未实现。",
      "HTTPS 域名、TLS 证书、HTTP 跳转和预览/生产分离未实现。",
      "未通过这些门禁前，只允许演示或脱敏数据进入公网预览。",
    ],
    headline: "生产访问与 HTTPS 已拆解，真实数据仍未开放",
    nextImplementationWave: {
      id: "production-auth-https-runtime",
      summary:
        "下一轮应一次性实现生产登录入口、团队进入策略、CSRF/origin 统一规则和 HTTPS 生产入口验证。",
      title: "生产登录与 HTTPS 实施",
    },
    providerSelectionCriteria,
    safeDataBoundary: {
      allowedDataLabel: "仅演示/脱敏数据",
      blockedDataLabel: "真实客户/订单/私信/完整转录/定价策略",
      summary:
        "当前预览只能继续承载内部评估数据；生产登录和 HTTPS 通过前不开放真实运营资料。",
    },
    sections: [
      {
        id: "production_access",
        items: accessItems,
        nextAction: "先确定 provider 与团队入口，再实现登录、会话和权限复测。",
        status: "planned",
        statusLabel: statusLabel.planned,
        summary:
          "本地授权基础可复用，但生产登录、团队入口、恢复路径仍是阻断项。",
        title: "生产访问",
      },
      {
        id: "https_transport",
        items: transportItems,
        nextAction: "先确认域名和 TLS 路径，再关闭生产入口的 HTTP 预览例外。",
        status: "blocked",
        statusLabel: statusLabel.blocked,
        summary:
          "HTTP IP 预览不能承载真实数据；生产 cookie 必须绑定 HTTPS origin。",
        title: "HTTPS 传输",
      },
    ],
    stage: "implementation_ready",
    stageLabel: "实施边界已拆解",
    summary:
      "这一步把生产访问和 HTTPS 从泛化阻断拆成可实施门禁；它不等于生产登录或 HTTPS 已上线。",
    supportingEvidence: [
      "已有 AuthPort、app-owned session、secure-by-default cookie 和受保护 Route Handler 边界。",
      "Docker preview 使用 restart policy，可支撑演示环境恢复，但不替代 HTTPS 生产入口。",
      "内部 V0 trial 已能验证主要运营工作流，适合作为 V1-Lite 前置体验证据。",
    ],
    transportPassCriteria,
  }
}
