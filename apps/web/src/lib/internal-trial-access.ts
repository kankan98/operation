export const internalTrialScopeStorageKey = "operation.operatorV0Scope"

export const operatorV0BootstrapCsrfHeaderName = "x-operation-csrf"
export const operatorV0BootstrapCsrfHeaderValue = "operator-v0"
export const authLogoutCsrfHeaderName = "x-operation-csrf"
export const authLogoutCsrfHeaderValue = "logout"

export const operatorV0TenantId = "operation_v0_tenant"
export const operatorV0TeamId = "operation_v0_live_team"

export type OperatorV0Scope = {
  tenantId: string
  teamId: string
  tenantName: string
  teamName: string
  actorName: string
}

export type InternalTrialApiErrorBody = {
  ok?: false
  authenticated?: false
  loggedOut?: boolean
  code?: string
  requestId?: string
  retryable?: boolean
  userMessage?: string
}

export type InternalTrialBootstrapBody =
  | InternalTrialApiErrorBody
  | {
      ok: true
      actor: {
        displayName: string
      }
      tenant: {
        id: string
        name: string
      }
      team: {
        id: string
        name: string
      }
      nextPath?: string
    }

export type InternalTrialAuthSessionBody =
  | InternalTrialApiErrorBody
  | {
      authenticated: true
      actor: {
        displayName: string
      }
      tenant: {
        id: string
        name: string
      }
      team: {
        id: string
        name: string
      }
    }

export type InternalTrialLogoutBody =
  | InternalTrialApiErrorBody
  | {
      authenticated: false
      loggedOut: boolean
      code: "invalidated" | "session_not_found" | "already_inactive"
      requestId: string
    }

export type InternalTrialAccessResult =
  | {
      ok: true
      scope: OperatorV0Scope
    }
  | {
      ok: false
      code?: string
      status?: number
      userMessage: string
    }

type TrialFetch = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value))
}

function errorCodeFromBody(body: unknown): string | undefined {
  if (!isRecord(body) || typeof body.code !== "string") {
    return undefined
  }

  return body.code
}

function safeDisplayText(value: unknown, fallback: string): string {
  if (typeof value !== "string") {
    return fallback
  }

  const trimmed = value.trim()

  if (!trimmed) {
    return fallback
  }

  return trimmed.slice(0, 80)
}

export function defaultInternalTrialScope(): OperatorV0Scope {
  return {
    tenantId: operatorV0TenantId,
    teamId: operatorV0TeamId,
    tenantName: "V0 内部演示租户",
    teamName: "直播运营 V0 小组",
    actorName: "V0 运营",
  }
}

function toSafeScope(input: Partial<OperatorV0Scope>): OperatorV0Scope {
  const fallback = defaultInternalTrialScope()

  return {
    tenantId: safeDisplayText(input.tenantId, fallback.tenantId),
    teamId: safeDisplayText(input.teamId, fallback.teamId),
    tenantName: safeDisplayText(input.tenantName, fallback.tenantName),
    teamName: safeDisplayText(input.teamName, fallback.teamName),
    actorName: safeDisplayText(input.actorName, fallback.actorName),
  }
}

export function readStoredInternalTrialScope(): OperatorV0Scope | null {
  if (typeof window === "undefined") {
    return null
  }

  const stored = window.localStorage.getItem(internalTrialScopeStorageKey)

  if (!stored) {
    return null
  }

  try {
    const parsed = JSON.parse(stored) as Partial<OperatorV0Scope>

    if (parsed.tenantId && parsed.teamId) {
      return toSafeScope(parsed)
    }
  } catch {
    window.localStorage.removeItem(internalTrialScopeStorageKey)
  }

  return null
}

export function readStoredInternalTrialScopeOrDefault(): OperatorV0Scope {
  return readStoredInternalTrialScope() ?? defaultInternalTrialScope()
}

export function storeInternalTrialScope(scope: OperatorV0Scope) {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.setItem(
    internalTrialScopeStorageKey,
    JSON.stringify(toSafeScope(scope)),
  )
}

export function clearStoredInternalTrialScope() {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.removeItem(internalTrialScopeStorageKey)
}

export function scopedInternalTrialApiUrl(
  path: string,
  scope: OperatorV0Scope,
): string {
  const separator = path.includes("?") ? "&" : "?"

  return `${path}${separator}tenantId=${encodeURIComponent(scope.tenantId)}&teamId=${encodeURIComponent(scope.teamId)}`
}

export async function readInternalTrialApiBody<T>(
  response: Response,
): Promise<T> {
  return (await response.json()) as T
}

export function bootstrapBodyToInternalTrialScope(
  body: Extract<InternalTrialBootstrapBody, { ok: true }>,
): OperatorV0Scope {
  return toSafeScope({
    tenantId: body.tenant.id,
    teamId: body.team.id,
    tenantName: body.tenant.name,
    teamName: body.team.name,
    actorName: body.actor.displayName,
  })
}

export function sessionBodyToInternalTrialScope(
  body: Extract<InternalTrialAuthSessionBody, { authenticated: true }>,
): OperatorV0Scope {
  return toSafeScope({
    tenantId: body.tenant.id,
    teamId: body.team.id,
    tenantName: body.tenant.name,
    teamName: body.team.name,
    actorName: body.actor.displayName,
  })
}

export function trialAccessUserMessage(body: unknown): string {
  if (isRecord(body) && typeof body.userMessage === "string") {
    if (body.code === "OPERATOR_V0_BOOTSTRAP_DISABLED") {
      return "当前环境未开启内部试用"
    }

    return body.userMessage
  }

  if (isRecord(body)) {
    switch (body.code) {
      case "UNAUTHENTICATED":
      case "SESSION_EXPIRED":
      case "SESSION_REVOKED":
        return "请重新进入内部试用"
      case "AUTH_SCOPE_REQUIRED":
        return "请选择试用团队后再继续"
      case "CSRF_HEADER_REQUIRED":
        return "请求无效，请刷新后重试"
      case "OPERATOR_V0_BOOTSTRAP_DISABLED":
        return "当前环境未开启内部试用"
      case "BOOTSTRAP_UNAVAILABLE":
      case "AUTH_OPERATION_FAILED":
      case "DATABASE_OPERATION_FAILED":
        return "内部试用暂时不可用"
    }
  }

  return "操作暂时失败，请稍后重试"
}

function isBootstrapSuccess(
  body: InternalTrialBootstrapBody,
): body is Extract<InternalTrialBootstrapBody, { ok: true }> {
  return body.ok === true
}

function isSessionSuccess(
  body: InternalTrialAuthSessionBody,
): body is Extract<InternalTrialAuthSessionBody, { authenticated: true }> {
  return body.authenticated === true
}

export async function verifyInternalTrialSession(input: {
  scope?: OperatorV0Scope
  fetcher?: TrialFetch
} = {}): Promise<InternalTrialAccessResult> {
  const scope = input.scope ?? readStoredInternalTrialScopeOrDefault()
  const fetcher = input.fetcher ?? fetch
  const response = await fetcher(scopedInternalTrialApiUrl("/api/auth/session", scope), {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  })
  const body = await readInternalTrialApiBody<InternalTrialAuthSessionBody>(
    response,
  )

  if (response.ok && isSessionSuccess(body)) {
    const verifiedScope = sessionBodyToInternalTrialScope(body)
    storeInternalTrialScope(verifiedScope)

    return {
      ok: true,
      scope: verifiedScope,
    }
  }

  const code = errorCodeFromBody(body)

  if (
    code === "UNAUTHENTICATED" ||
    code === "SESSION_EXPIRED" ||
    code === "SESSION_REVOKED"
  ) {
    clearStoredInternalTrialScope()
  }

  return {
    ok: false,
    code,
    status: response.status,
    userMessage: trialAccessUserMessage(body),
  }
}

export async function enterInternalTrial(input: {
  fetcher?: TrialFetch
} = {}): Promise<InternalTrialAccessResult> {
  const fetcher = input.fetcher ?? fetch
  const response = await fetcher("/api/auth/operator-v0-session", {
    method: "POST",
    credentials: "include",
    cache: "no-store",
    headers: {
      [operatorV0BootstrapCsrfHeaderName]: operatorV0BootstrapCsrfHeaderValue,
    },
  })
  const body = await readInternalTrialApiBody<InternalTrialBootstrapBody>(
    response,
  )

  if (!response.ok || !isBootstrapSuccess(body)) {
    const code = errorCodeFromBody(body)

    return {
      ok: false,
      code,
      status: response.status,
      userMessage: trialAccessUserMessage(body),
    }
  }

  const scope = bootstrapBodyToInternalTrialScope(body)
  const verified = await verifyInternalTrialSession({ scope, fetcher })

  if (!verified.ok) {
    clearStoredInternalTrialScope()
  }

  return verified
}

export async function leaveInternalTrial(input: {
  fetcher?: TrialFetch
} = {}): Promise<InternalTrialAccessResult> {
  const fetcher = input.fetcher ?? fetch
  const currentScope = readStoredInternalTrialScopeOrDefault()
  const response = await fetcher("/api/auth/logout", {
    method: "POST",
    credentials: "include",
    cache: "no-store",
    headers: {
      [authLogoutCsrfHeaderName]: authLogoutCsrfHeaderValue,
    },
  })
  const body = await readInternalTrialApiBody<InternalTrialLogoutBody>(response)
  const code = errorCodeFromBody(body)

  clearStoredInternalTrialScope()

  if (
    response.ok &&
    (body.loggedOut === true || code === "session_not_found")
  ) {
    return {
      ok: true,
      scope: currentScope,
    }
  }

  return {
    ok: false,
    code,
    status: response.status,
    userMessage: trialAccessUserMessage(body),
  }
}
