export const authSessionCookieName = "operation_session"

export const publicTrialEntryPath = "/trial"
export const defaultPublicTrialNextPath = "/sessions"

export const publicTrialProtectedPaths = [
  "/sessions",
  "/rackets",
  "/knowledge",
  "/ai-review",
  "/talk-tracks",
  "/next-actions",
] as const

export type PublicTrialProtectedPath =
  (typeof publicTrialProtectedPaths)[number]

export type PublicTrialRouteDecision =
  | {
      action: "allow"
      pathname: string
    }
  | {
      action: "redirect"
      pathname: string
      location: string
      nextPath: PublicTrialProtectedPath
    }

const publicTrialExcludedPrefixes = ["/api", "/_next"]

function isKnownProtectedPath(pathname: string): pathname is PublicTrialProtectedPath {
  return publicTrialProtectedPaths.includes(
    pathname as PublicTrialProtectedPath,
  )
}

function getProtectedBasePath(
  pathname: string,
): PublicTrialProtectedPath | null {
  for (const protectedPath of publicTrialProtectedPaths) {
    if (pathname === protectedPath || pathname.startsWith(`${protectedPath}/`)) {
      return protectedPath
    }
  }

  return null
}

function isExcludedPath(pathname: string): boolean {
  if (
    pathname === "/" ||
    pathname === publicTrialEntryPath ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml"
  ) {
    return true
  }

  return publicTrialExcludedPrefixes.some((prefix) => pathname.startsWith(prefix))
}

export function getSafePublicTrialNextPath(
  value: string | null | undefined,
): PublicTrialProtectedPath {
  const fallback = defaultPublicTrialNextPath
  const trimmed = value?.trim()

  if (!trimmed || !trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return fallback
  }

  if (trimmed.includes("\\") || trimmed.includes("\u0000")) {
    return fallback
  }

  try {
    const url = new URL(trimmed, "https://operation.local")

    if (url.origin !== "https://operation.local") {
      return fallback
    }

    if (isKnownProtectedPath(url.pathname)) {
      return url.pathname
    }
  } catch {
    return fallback
  }

  return fallback
}

export function createPublicTrialRedirectLocation(input: {
  origin: string
  pathname: string
}): string {
  const redirectUrl = new URL(publicTrialEntryPath, input.origin)
  redirectUrl.searchParams.set(
    "next",
    getSafePublicTrialNextPath(input.pathname),
  )

  return `${redirectUrl.pathname}${redirectUrl.search}`
}

export function publicTrialRedirectHeaders(): Record<string, string> {
  return {
    "Cache-Control": "no-store",
  }
}

export function decidePublicTrialRoute(input: {
  hasSessionCookie: boolean
  origin?: string
  pathname: string
}): PublicTrialRouteDecision {
  const protectedPath = getProtectedBasePath(input.pathname)

  if (isExcludedPath(input.pathname) || !protectedPath) {
    return {
      action: "allow",
      pathname: input.pathname,
    }
  }

  if (input.hasSessionCookie) {
    return {
      action: "allow",
      pathname: input.pathname,
    }
  }

  return {
    action: "redirect",
    pathname: input.pathname,
    nextPath: protectedPath,
    location: createPublicTrialRedirectLocation({
      origin: input.origin ?? "https://operation.local",
      pathname: protectedPath,
    }),
  }
}
