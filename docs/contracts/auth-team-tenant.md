# Auth Team Tenant Contract

Status: draft
Runtime: partially implemented, local-only guard foundation, session runtime, and cookie/request runtime

本契约定义未来认证、团队、租户、角色、成员、邀请、会话、provider adapter、server-side
authorization 和审计边界。当前没有任何面向浏览器的登录页、auth provider SDK、middleware、
公开登录/登出 Route Handler、Server Action、团队管理 UI 或受保护业务持久化行为。当前已
具备 provider-neutral 的本地授权守卫基础，用于从应用自有 user/tenant/team/membership 记录
解析 `AuthContext`、执行 role/permission/scope 检查，并转换为 repository 使用的 data access
context；同时已具备本地-only 应用会话 ledger、session resolver 和 server-only cookie/request
bridge，用于把高熵 opaque session 引用映射到现有 `AuthContext`，并为未来 Route Handler /
Server Action 提供 cookie 读写和登出失效边界。

## Use Case

面向直播运营、主播/助播、商品负责人、审核人员和团队负责人，让每个用户只能在自己有权限的
团队上下文中创建、查看、审核和使用业务数据。

核心目标：

- 在保存真实产品、场次、知识、AI 复盘、Q&A、话术和任务前，先固定身份和权限边界。
- 防止跨团队、跨租户或离职/停用成员继续访问敏感业务数据。
- 让审核、反馈、AI run、来源发布和任务分配都能追溯到明确 actor、team、tenant 和 role。
- 保留 auth provider 替换能力，避免 UI、domain、repository 或 AI 层直接绑定 provider SDK。
- 为后续数据库、受保护 API、Server Action、RAG 和外部集成提供统一授权上下文。

## Implemented Local Guard Runtime Surface

当前本地实现范围：

- `apps/web/src/server/auth/types.ts` 定义权限、角色、授权请求、授权上下文和安全 decision shape。
- `apps/web/src/server/auth/policy.ts` 定义 viewer、host、operator、product_owner、reviewer、
  admin 的单一 role-permission 映射。
- `apps/web/src/server/auth/errors.ts` 定义结构化 `AuthGuardError`、安全用户提示和脱敏 metadata。
- `apps/web/src/server/auth/repository.ts` 从现有 tenants、teams、app_users、tenant_memberships
  和 team_memberships 解析 provider-neutral `AuthContext`。
- `apps/web/src/server/auth/guard.ts` 执行 required permission、allowed role、active membership
  和 tenant/team target scope 检查，并把成功上下文转换为 `DataAccessContext`。
- `apps/web/src/server/auth/check.ts` 提供本地 PostgreSQL 回滚式 smoke check，覆盖允许访问、
  缺权限拒绝、inactive membership 拒绝和 cross-team target 拒绝。
- 根级 `auth:check` 脚本代理到 web app。

## Implemented Local Session Runtime Surface

当前本地实现范围：

- `apps/web/src/server/db/schema.ts` 定义 `auth_sessions` ledger、`auth_session_status` 和
  `auth_session_invalidation_reason`，只保存 session reference hash、用户归属、状态、过期时间、
  最近验证时间、provider session 引用和失效原因。
- `apps/web/src/server/auth/session.ts` 定义 server-only session reference helper、hash helper、
  安全 session summary、cookie option 常量和 provider-neutral session resolver。
- `createAuthSessionReference()` 使用高熵 opaque reference；`hashAuthSessionReference()` 只把 hash
  写入 ledger。resolver 不返回原始 session reference、cookie、token 或 provider payload。
- `createAuthSessionRepository()` 先校验 session 存在、状态、过期时间和用户，再委托现有
  auth guard 检查 tenant/team membership、role、permission 和 target scope。
- `apps/web/src/server/auth/session-check.ts` 提供本地 PostgreSQL 回滚式 smoke check，覆盖 active
  session 解析、expired/revoked/invalidated 拒绝、inactive membership 拒绝、缺权限拒绝、
  cross-team target 拒绝、脱敏和事务回滚。
- 根级 `auth:session-check` 脚本代理到 web app。

## Implemented Local Cookie Runtime Surface

当前本地实现范围：

- `apps/web/src/server/auth/cookie.ts` 定义 server-only cookie helper，用于生成 auth session
  `Set-Cookie` header、clear-cookie header、解析标准 `Cookie` header、从 request cookie 解析
  `AuthContext`，以及从 request cookie 执行 logout/invalidation。
- `createAuthSessionSetCookieHeader()` 使用现有 `operation_session` cookie name 和明确的
  `HttpOnly`、`Secure`、`SameSite=Lax`、`Path=/`、`Max-Age` 属性；helper 只生成 header，不创建公开登录路由。
- `createAuthSessionClearCookieHeader()` 生成清理浏览器 cookie 的 header；`invalidateAuthSessionFromRequestCookie()`
  先从 request cookie 提取 session reference，再通过 hash 更新现有 `auth_sessions` ledger。
- `apps/web/src/server/auth/session.ts` 新增 `invalidateSessionByReference()`，按 hash 查找 session，
  将 active session 标记为 `revoked` / `invalidated` / `expired`，记录失效原因和最近验证时间，
  并只返回安全 session summary。
- `apps/web/src/server/auth/cookie-check.ts` 提供本地 PostgreSQL 回滚式 smoke check，覆盖 cookie
  签发属性、request cookie 解析、missing cookie 拒绝、expired/revoked/invalidated 拒绝、
  logout 失效、clear-cookie、脱敏和事务回滚。
- 根级 `auth:cookie-check` 脚本代理到 web app。

当前仍未实现：

- Auth.js、OAuth、magic link、密码、SSO、托管身份服务或任何生产 auth provider。
- middleware、登录页、公开登出路由、provider callback、完整 session strategy 和 CSRF 策略。
- 邀请发送/接受、团队管理 UI、角色变更 UI、step-up auth 和 provider account/session 表。
- 面向用户的受保护业务 CRUD、AI/RAG 访问、导出或公网预览数据持久化。

## Stage Gates

本契约已经有阶段 2 的本地授权守卫、本地 session resolver 和本地 cookie/request bridge 基础，
但仍必须按技术实施路线分阶段扩展：

| 阶段 | 可实现内容 | 不能提前做的事 |
| --- | --- | --- |
| 阶段 2 | 认证 provider 比较、`AuthPort`、tenant/team/role 契约、server-side guard、app-owned session ledger、server-only cookie/request bridge；当前已本地部分实现 provider-neutral guard、session resolver 和 cookie runtime | 保存受保护业务记录前跳过授权、把 guard/session/cookie runtime 误认为完整登录系统 |
| 阶段 3 | PostgreSQL 用户、团队、成员、邀请、会话、审计 schema 和 repository | 让 UI 直接依赖 provider user object |
| 阶段 4 | 产品、场次、知识、话术、任务的 tenant/team-scoped CRUD | 用前端隐藏按钮替代权限检查 |
| 阶段 5-8 | AI review、Q&A、RAG、反馈和评测的 actor/team/run 审计 | AI 或 RAG 读取跨团队数据 |
| 阶段 9 | 生产化、观测、备份、外部集成和正式部署 provider | 在未定义日志脱敏和恢复策略前处理真实敏感数据 |

## Provider Boundary

未来实现必须通过 `AuthPort` 或等价项目边界接入 provider。

`AuthPort` 负责：

- 解析当前请求的认证状态。
- 验证 provider session 或 callback。
- 映射 provider identity 到应用 `AppUser`。
- 生成 `AuthContext`，包含 actor、tenant/team membership、role 和 session 摘要。
- 提供 sign-in、sign-out、session refresh、session invalidation 的 provider adapter。

`AuthPort` 不负责：

- 决定业务权限。
- 绕过 tenant/team ownership。
- 直接返回 provider token、cookie、完整 profile 或 provider 原始 payload 给业务层。
- 让 UI、domain、repository、AI 或 integration 层直接依赖 provider SDK shape。

## Domain Entities

### Tenant

租户是未来数据隔离边界。第一阶段可以与团队一对一，但契约保留一租户多团队能力。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 租户 ID |
| `name` | string | 租户名称 |
| `status` | enum | `active`、`suspended`、`archived` |
| `defaultTeamId` | string | 默认团队 ID，可为空 |
| `createdAt` / `updatedAt` | datetime | 审计时间 |

### Team

团队是运营工作空间和业务数据归属边界。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 团队 ID |
| `tenantId` | string | 租户 ID |
| `name` | string | 团队名称 |
| `teamType` | enum | `live_operations`、`product_team`、`review_team`、`admin_team` |
| `status` | enum | `active`、`suspended`、`archived` |
| `createdBy` | string | 创建人 |
| `createdAt` / `updatedAt` | datetime | 审计时间 |

### AppUser

应用用户 profile。只保存应用需要的最小字段，不等同于 provider profile。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 应用用户 ID |
| `displayName` | string | 展示名 |
| `primaryEmail` | string | 主邮箱，未来需规范化和验证 |
| `status` | enum | `active`、`pending`、`suspended`、`deleted` |
| `lastActiveAt` | datetime | 最近活动时间 |
| `createdAt` / `updatedAt` | datetime | 审计时间 |

### AuthProviderAccount

外部 provider 身份映射。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 账号映射 ID |
| `userId` | string | 应用用户 ID |
| `provider` | string | 例如 `authjs`、`clerk`、`auth0`、`descope`、`custom` |
| `providerAccountId` | string | provider 账号 ID，不能作为业务权限 |
| `emailVerified` | boolean | provider 或应用确认的邮箱状态 |
| `linkedAt` | datetime | 绑定时间 |
| `lastSeenAt` | datetime | 最近使用时间 |
| `status` | enum | `active`、`revoked`、`relinked` |

### TenantMembership

租户级成员关系。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 成员关系 ID |
| `tenantId` | string | 租户 ID |
| `userId` | string | 用户 ID |
| `status` | enum | `invited`、`active`、`suspended`、`removed`、`expired`、`archived` |
| `tenantRole` | enum | `owner`、`admin`、`member`、`viewer` |
| `joinedAt` | datetime | 加入时间 |
| `removedAt` | datetime | 移除时间，可为空 |

### TeamMembership

团队级成员关系和默认业务角色。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 成员关系 ID |
| `tenantId` | string | 租户 ID |
| `teamId` | string | 团队 ID |
| `userId` | string | 用户 ID |
| `status` | enum | `invited`、`active`、`suspended`、`removed`、`expired`、`archived` |
| `role` | enum | `operator`、`host`、`product_owner`、`reviewer`、`admin`、`viewer` |
| `permissionOverrides` | string[] | 未来临时权限，默认空 |
| `joinedAt` | datetime | 加入时间 |
| `lastRoleChangedAt` | datetime | 最近角色变化 |

### RolePermission

角色到权限的映射。运行时可从配置或数据库生成，但必须可审计。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `role` | enum | `operator`、`host`、`product_owner`、`reviewer`、`admin`、`viewer` |
| `permission` | enum | `read_workspace`、`manage_products`、`capture_session`、`review_knowledge`、`run_ai_review`、`ask_qa`、`manage_talk_tracks`、`manage_next_tasks`、`manage_members`、`export_data`、`admin_settings` |
| `scope` | enum | `tenant`、`team`、`own_records` |
| `status` | enum | `active`、`deprecated` |

### TeamInvitation

邀请记录。邀请 secret/token 不能明文记录在普通日志或普通查询响应中。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 邀请 ID |
| `tenantId` | string | 租户 ID |
| `teamId` | string | 团队 ID |
| `invitedEmail` | string | 被邀请邮箱或外部标识 |
| `invitedRole` | enum | 目标团队角色 |
| `status` | enum | `draft`、`sent`、`accepted`、`revoked`、`expired`、`failed` |
| `invitedBy` | string | 邀请人 |
| `acceptedBy` | string | 接受人，可为空 |
| `expiresAt` | datetime | 过期时间 |
| `createdAt` / `updatedAt` | datetime | 审计时间 |

### AuthSession

应用会话摘要。具体 cookie/token 由 provider/adapter 管理，不暴露给业务层。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 会话 ID 或应用侧引用 |
| `userId` | string | 用户 ID |
| `providerSessionId` | string | provider session 引用，可为空 |
| `sessionReferenceHash` | string | 应用侧 opaque session reference 的不可逆摘要 |
| `status` | enum | `active`、`expired`、`revoked`、`invalidated`、`archived` |
| `issuedAt` | datetime | 发放时间 |
| `expiresAt` | datetime | 过期时间 |
| `lastVerifiedAt` | datetime | 最近验证时间 |
| `invalidatedReason` | enum | `logout`、`membership_removed`、`role_changed`、`security_event`、`provider_revoked`、`expired`、`unknown` |

### AuthContext

每次受保护操作使用的授权上下文。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `actorId` | string | 当前用户 ID |
| `tenantId` | string | 当前租户 ID |
| `teamId` | string | 当前团队 ID |
| `sessionId` | string | 当前会话 ID |
| `tenantMembershipId` | string | 租户成员关系 ID |
| `teamMembershipId` | string | 团队成员关系 ID |
| `role` | enum | 当前团队角色 |
| `permissions` | string[] | 当前操作可用权限 |
| `authStrength` | enum | `unknown`、`single_factor`、`multi_factor`、`step_up_verified` |
| `createdAt` | datetime | 上下文生成时间 |

### AuthorizationDecision

服务端 guard 的判定记录。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 判定 ID |
| `requestId` | string | 请求 ID |
| `actorId` | string | 当前 actor |
| `tenantId` | string | 当前租户 |
| `teamId` | string | 当前团队 |
| `targetType` | enum | `product`、`session`、`knowledge`、`ai_review`、`qa_answer`、`talk_track`、`next_task`、`member`、`export`、`settings` |
| `targetId` | string | 目标记录 ID，可为空 |
| `action` | string | 请求动作 |
| `decision` | enum | `allow`、`deny`、`needs_step_up` |
| `reason` | string | 判定原因 |
| `createdAt` | datetime | 判定时间 |

### AuthAuditEvent

认证和授权审计事件。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 审计事件 ID |
| `eventType` | enum | `sign_in`、`sign_out`、`session_refreshed`、`session_invalidated`、`provider_linked`、`provider_unlinked`、`invitation_sent`、`invitation_accepted`、`invitation_revoked`、`role_changed`、`membership_suspended`、`authorization_denied`、`step_up_required` |
| `actorId` | string | 操作人，可为空 |
| `targetUserId` | string | 目标用户，可为空 |
| `tenantId` | string | 租户 ID，可为空 |
| `teamId` | string | 团队 ID，可为空 |
| `metadata` | object | 脱敏元数据 |
| `createdAt` | datetime | 事件时间 |

## Commands / Queries

### Commands

未来命令边界：

- `ResolveAuthContextCommand`
- `LinkAuthProviderAccountCommand`
- `CreateTenantCommand`
- `CreateTeamCommand`
- `InviteTeamMemberCommand`
- `AcceptTeamInvitationCommand`
- `RevokeTeamInvitationCommand`
- `ChangeTeamMemberRoleCommand`
- `SuspendTeamMemberCommand`
- `RemoveTeamMemberCommand`
- `InvalidateAuthSessionCommand`
- `RecordAuthorizationDecisionCommand`
- `RecordAuthAuditEventCommand`

命令必须带 `requestId`、actor、tenant/team 作用域、幂等键或审计上下文。写操作必须做权限检查、
状态机检查、敏感数据保护和审计记录。

### Queries

未来查询边界：

- `GetCurrentAuthContextQuery`
- `ListUserTenantsQuery`
- `ListTenantTeamsQuery`
- `ListTeamMembersQuery`
- `GetTeamMemberDetailQuery`
- `ListTeamInvitationsQuery`
- `ListAuthSessionsQuery`
- `ListAuthAuditEventsQuery`
- `CanActorPerformActionQuery`

查询必须按 tenant/team 过滤。普通 UI 不得返回 provider token、cookie、session secret、邀请
secret、完整 provider payload、跨团队成员信息或不必要的审计 payload。

## Request Shape

### ResolveAuthContextCommand

```json
{
  "requestId": "req_001",
  "providerSessionRef": "provider-session-ref",
  "requestedTenantId": "tenant_001",
  "requestedTeamId": "team_001",
  "requiredPermission": "capture_session"
}
```

### InviteTeamMemberCommand

```json
{
  "tenantId": "tenant_001",
  "teamId": "team_001",
  "actorId": "admin_001",
  "idempotencyKey": "invite-001",
  "invitedEmail": "operator@example.com",
  "invitedRole": "operator",
  "expiresAt": "2026-06-06T12:00:00+08:00"
}
```

### ChangeTeamMemberRoleCommand

```json
{
  "tenantId": "tenant_001",
  "teamId": "team_001",
  "actorId": "admin_001",
  "membershipId": "team_member_001",
  "newRole": "reviewer",
  "reason": "负责知识来源审核",
  "invalidateActiveSessions": true
}
```

## Response Shape

### AuthContextView

```json
{
  "authenticated": true,
  "actor": {
    "id": "user_001",
    "displayName": "运营一号"
  },
  "tenant": {
    "id": "tenant_001",
    "name": "示例品牌"
  },
  "team": {
    "id": "team_001",
    "name": "直播运营组"
  },
  "membership": {
    "role": "operator",
    "status": "active",
    "permissions": ["read_workspace", "capture_session", "ask_qa"]
  },
  "session": {
    "status": "active",
    "expiresAt": "2026-05-24T12:00:00+08:00"
  }
}
```

### AuthorizationDecisionView

```json
{
  "allowed": false,
  "decision": "deny",
  "reason": "FORBIDDEN_ROLE",
  "userMessage": "需要管理员或审核人员权限",
  "auditEventId": "auth_audit_001"
}
```

### TeamMemberView

```json
{
  "membershipId": "team_member_001",
  "userId": "user_001",
  "displayName": "运营一号",
  "role": "operator",
  "status": "active",
  "joinedAt": "2026-05-23T10:00:00+08:00",
  "lastRoleChangedAt": "2026-05-23T10:00:00+08:00"
}
```

## State Machines

### User

```text
pending -> active -> suspended -> active
pending -> deleted
active -> deleted
```

### Membership

```text
invited -> active -> suspended -> active
invited -> expired
invited -> removed
active -> removed
active -> archived
```

### Invitation

```text
draft -> sent -> accepted
sent -> revoked
sent -> expired
sent -> failed
```

### Session

```text
active -> expired
active -> revoked
active -> invalidated
expired -> archived
revoked -> archived
invalidated -> archived
```

### Authorization Decision

```text
evaluate -> allow
evaluate -> deny
evaluate -> needs_step_up
```

状态规则：

- `active` membership 才能访问受保护团队数据。
- `suspended`、`removed`、`expired`、`archived` membership 必须拒绝团队级命令和查询。
- 角色变更、成员移除或安全事件可以要求重新验证或失效现有 session。
- Invitation secret/token 只能通过安全通道发送，不进入普通查询响应或日志。

## Error Cases

| 错误码 | 触发条件 | 处理 |
| --- | --- | --- |
| `UNAUTHENTICATED` | 没有有效认证上下文 | 返回登录需求 |
| `SESSION_EXPIRED` | 会话过期 | 要求重新登录 |
| `SESSION_REVOKED` | provider 或应用撤销 session | 要求重新登录并记录审计 |
| `PROVIDER_CALLBACK_INVALID` | provider 回调校验失败 | 阻止登录并记录脱敏错误 |
| `PROVIDER_ACCOUNT_CONFLICT` | provider 账号已绑定其他用户 | 阻止绑定并转人工处理 |
| `TENANT_NOT_FOUND` | 请求租户不存在或不可见 | 拒绝 |
| `TEAM_NOT_FOUND` | 请求团队不存在或不可见 | 拒绝 |
| `UNAUTHORIZED_TENANT` | actor 不属于租户 | 拒绝 |
| `UNAUTHORIZED_TEAM` | actor 不属于团队 | 拒绝 |
| `MEMBERSHIP_INACTIVE` | 成员状态不是 active | 拒绝 |
| `FORBIDDEN_ROLE` | 角色缺少权限 | 拒绝并返回可操作提示 |
| `STEP_UP_REQUIRED` | 高风险操作需要再次验证 | 返回 step-up 需求 |
| `INVITATION_EXPIRED` | 邀请过期 | 拒绝并允许重新邀请 |
| `INVITATION_REVOKED` | 邀请已撤销 | 拒绝 |
| `INVITATION_EMAIL_MISMATCH` | 接受人和邀请标识不匹配 | 拒绝并记录审计 |
| `ROLE_CHANGE_INVALID` | 角色转换不允许或会移除最后管理员 | 阻止变更 |
| `AUDIT_WRITE_FAILED` | 审计写入失败 | 高风险写操作应失败或进入安全降级 |
| `SENSITIVE_LOG_BLOCKED` | 日志内容包含 token、cookie、secret 或客户数据 | 阻止输出或脱敏 |

当前本地 session runtime 已覆盖 `UNAUTHENTICATED`、`SESSION_EXPIRED`、`SESSION_REVOKED`、
`MEMBERSHIP_INACTIVE`、`FORBIDDEN_PERMISSION` 和 `FORBIDDEN_SCOPE` 的回滚式验证；当前本地
cookie runtime 已覆盖 missing cookie、失效 cookie、logout invalidation 和 clear-cookie 的回滚式验证。
provider callback、邀请和 step-up 错误仍是契约边界，未进入运行时代码。

## Authorization

默认角色权限草案：

| 角色 | 典型权限 |
| --- | --- |
| `viewer` | 查看工作台和已授权资料 |
| `host` | 查看商品、查看话术、提交直播问题反馈 |
| `operator` | 采集场次、提问 Q&A、创建下场任务草案、查看已授权 AI 输出 |
| `product_owner` | 管理球拍产品、别名、规格、卖点和产品审核准备 |
| `reviewer` | 审核知识、AI 建议、web discovery finding、来源冲突和反馈信号 |
| `admin` | 管理成员、邀请、角色、团队设置和高风险导出 |

规则：

- 所有受保护读写必须服务端检查 actor、tenantId、teamId、membership、role 和 target ownership。
- UI 只能作为体验层隐藏不可用操作，不能作为权限边界。
- AI/RAG 检索必须使用授权后的 tenant/team scope。
- 导出、成员管理、角色变更、来源发布、批量删除等高风险操作可要求 step-up auth。
- 不同 tenant/team 的数据默认不可见，不存在“跨团队全局搜索”默认能力。

## Sensitive Data

默认敏感数据：

- Provider secret、access token、refresh token、ID token、session cookie、invitation secret。
- 原始 session reference、session cookie value、provider session 原始标识和 authorization header。
- Provider 原始 profile、callback payload、IP/user-agent 等安全元数据。
- 客户评论、私信、订单、手机号、地址和平台账号。
- 直播转录、运营笔记、GMV、转化率、价格策略、供应链和活动策略。
- Prompt 模板、provider 请求体、完整 AI 输出、评测样本和检索上下文。
- 审计日志中的 actor、目标记录、权限拒绝原因和安全事件。

处理规则：

- 普通日志不得包含 token、cookie、secret、完整 provider payload、完整 prompt、完整转录或客户个人信息。
- Provider metadata 只保存应用授权需要的最小字段。
- Invitation secret 只能一次性生成和发送，持久化时必须使用不可逆摘要或 provider 安全机制。
- 角色、成员、session 和权限拒绝日志必须可审计但默认脱敏。
- 本地 session ledger 只能保存 session reference hash，不得保存 raw session reference。
- Cookie runtime 只能在 request/response header 边界短暂处理 raw session reference；安全 summary、
  错误、日志、验证输出和普通查询响应不得返回 raw cookie value。

## Audit Metadata

未来持久化记录必须保留：

- `createdBy`、`updatedBy`、`invitedBy`、`acceptedBy`、`roleChangedBy`、`removedBy`。
- `createdAt`、`updatedAt`、`invitedAt`、`acceptedAt`、`expiresAt`、`revokedAt`、`removedAt`。
- `requestId`、`idempotencyKey`、`tenantId`、`teamId`、`actorId`、`sessionId`。
- `provider`、`providerAccountId`、`providerSessionId` 的脱敏或引用形式。
- `membershipId`、`role`、`previousRole`、`newRole`、`permission`、`targetType`、`targetId`。
- `authorizationDecisionId`、`authAuditEventId`。

## Verification

未来实现本契约时至少验证：

- OpenSpec：对应 change 通过 `openspec validate <change-name>`。
- Provider：有效登录、无效 callback、provider session revoked、账号冲突、provider 不可用。
- Session：未登录、过期、退出、角色变化后失效、成员移除后失效。
- Tenant/team：跨租户访问、跨团队访问、team switch、不可见 team、inactive team。
- Role/RBAC：viewer/operator/host/product_owner/reviewer/admin 的允许和拒绝路径。
- Invitation：发送、接受、过期、撤销、邮箱不匹配、重复邀请、最后管理员保护。
- Repository/API：每个 protected query/mutation 都验证 tenant/team ownership。
- Sensitive data：日志、错误响应、截图和最终报告不包含 token、cookie、secret 或客户个人数据。
- Browser：未来 UI 变化需覆盖登录、退出、无权限、邀请、空团队、切换团队、移动端和桌面端。
- Regression：未来 provider 或 role policy 变化前后验证代表性业务操作。

当前本地验证命令：

```bash
DATABASE_URL="postgres://..." pnpm auth:check
DATABASE_URL="postgres://..." pnpm auth:session-check
DATABASE_URL="postgres://..." pnpm auth:cookie-check
```

这些命令只使用本地 PostgreSQL fixture 和回滚事务，不创建浏览器登录、provider callback
或公开受保护 CRUD。`auth:cookie-check` 只验证 server-only cookie/request bridge 和 logout
invalidation，不代表已有公开登录页或登出路由。

## Open Questions

- 首个 provider/login runtime 选择仍未确定：Auth.js、自托管会话、Clerk、Auth0、Descope 或其他方案。
- 首个登录方式：邮箱、magic link、OAuth、SSO、密码还是托管 provider flow。
- tenant 和 team 初期是否一对一，还是从第一版就允许多团队。
- 哪些操作必须 step-up auth，例如导出、成员移除、知识发布、AI prompt 管理。
- 会话、审计、邀请和 inactive membership 的保留时长。
- 真实业务团队是否需要更细的角色，例如外部主播、临时助播、只读老板账号。
