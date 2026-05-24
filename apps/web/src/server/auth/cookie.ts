import "server-only";

import { AuthGuardError } from "./errors";
import {
  authSessionCookieName,
  authSessionCookieOptions,
  invalidateAuthSessionByReference,
  requireAuthContextFromSession,
  type AuthSessionInvalidateRequest,
  type AuthSessionInvalidationResult,
  type AuthSessionRepository,
  type AuthSessionResolution,
  type AuthSessionResolveRequest,
} from "./session";

export type AuthCookieRequestLike = {
  headers: {
    get(name: string): string | null;
  };
};

export type AuthCookieResolveRequest = Omit<
  AuthSessionResolveRequest,
  "sessionReference"
>;

export type AuthCookieInvalidationRequest = Omit<
  AuthSessionInvalidateRequest,
  "sessionReference"
>;

export type AuthCookieInvalidationResult = AuthSessionInvalidationResult & {
  clearCookieHeader: string;
};

function serializeAuthCookie(
  value: string,
  options: {
    maxAge: number;
    expires?: Date;
  },
): string {
  const segments = [
    `${authSessionCookieName}=${encodeURIComponent(value)}`,
    `Max-Age=${options.maxAge}`,
    `Path=${authSessionCookieOptions.path}`,
    "HttpOnly",
    authSessionCookieOptions.secure ? "Secure" : "",
    `SameSite=${authSessionCookieOptions.sameSite[0].toUpperCase()}${authSessionCookieOptions.sameSite.slice(1)}`,
  ].filter(Boolean);

  if (options.expires) {
    segments.push(`Expires=${options.expires.toUTCString()}`);
  }

  return segments.join("; ");
}

export function createAuthSessionSetCookieHeader(
  sessionReference: string,
): string {
  return serializeAuthCookie(sessionReference, {
    maxAge: authSessionCookieOptions.maxAge,
  });
}

export function createAuthSessionClearCookieHeader(): string {
  return serializeAuthCookie("", {
    maxAge: 0,
    expires: new Date(0),
  });
}

export function readAuthSessionReferenceFromCookieHeader(
  cookieHeader: string | null | undefined,
): string | null {
  if (!cookieHeader) {
    return null;
  }

  const cookies = cookieHeader.split(";");

  for (const cookie of cookies) {
    const [rawName, ...rawValueParts] = cookie.trim().split("=");
    const name = rawName.trim();

    if (name !== authSessionCookieName) {
      continue;
    }

    const rawValue = rawValueParts.join("=");

    if (!rawValue) {
      return null;
    }

    try {
      return decodeURIComponent(rawValue);
    } catch {
      return rawValue;
    }
  }

  return null;
}

export function readAuthSessionReferenceFromRequestCookie(
  request: AuthCookieRequestLike,
): string | null {
  return readAuthSessionReferenceFromCookieHeader(request.headers.get("cookie"));
}

export async function resolveAuthContextFromRequestCookie(
  repository: AuthSessionRepository,
  request: AuthCookieRequestLike,
  input: AuthCookieResolveRequest,
): Promise<AuthSessionResolution> {
  const sessionReference = readAuthSessionReferenceFromRequestCookie(request);

  if (!sessionReference) {
    throw new AuthGuardError(
      "UNAUTHENTICATED",
      "Auth session cookie was not found",
      {
        requestId: input.requestId,
        details: {
          metadata: input.metadata,
        },
      },
    );
  }

  return requireAuthContextFromSession(repository, {
    ...input,
    sessionReference,
  });
}

export async function invalidateAuthSessionFromRequestCookie(
  repository: AuthSessionRepository,
  request: AuthCookieRequestLike,
  input: AuthCookieInvalidationRequest,
): Promise<AuthCookieInvalidationResult> {
  const sessionReference = readAuthSessionReferenceFromRequestCookie(request);
  const clearCookieHeader = createAuthSessionClearCookieHeader();

  if (!sessionReference) {
    return {
      invalidated: false,
      code: "session_not_found",
      clearCookieHeader,
    };
  }

  const result = await invalidateAuthSessionByReference(repository, {
    ...input,
    sessionReference,
  });

  return {
    ...result,
    clearCookieHeader,
  };
}
