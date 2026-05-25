import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

import {
  authSessionCookieName,
  decidePublicTrialRoute,
  publicTrialRedirectHeaders,
} from "@/lib/public-trial-auth"

export function proxy(request: NextRequest) {
  const decision = decidePublicTrialRoute({
    hasSessionCookie: request.cookies.has(authSessionCookieName),
    origin: request.nextUrl.origin,
    pathname: request.nextUrl.pathname,
  })

  if (decision.action === "allow") {
    return NextResponse.next()
  }

  const redirectUrl = new URL(decision.location, request.url)
  const response = NextResponse.redirect(redirectUrl)

  for (const [name, value] of Object.entries(publicTrialRedirectHeaders())) {
    response.headers.set(name, String(value))
  }

  return response
}

export const config = {
  matcher: [
    "/sessions/:path*",
    "/rackets/:path*",
    "/knowledge/:path*",
    "/ai-review/:path*",
    "/talk-tracks/:path*",
    "/next-actions/:path*",
  ],
}
