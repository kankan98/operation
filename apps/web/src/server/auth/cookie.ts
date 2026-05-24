import "server-only";

import { AuthGuardError } from "./errors";
import {
  authSessionCookieName,
  authSessionCookieOptions,
  authSessionMaxAgeSeconds,
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
> & {
  cookiePolicy?: AuthSessionCookiePolicy;
};

export type AuthCookieInvalidationResult = AuthSessionInvalidationResult & {
  clearCookieHeader: string;
};

export type AuthSessionCookiePolicy = {
  secure?: boolean;
  maxAge?: number;
};

export const internalV0PreviewSessionMaxAgeSeconds = 60 * 60 * 4;
export const internalV0PreviewCookieEnvName =
  "OPERATION_ALLOW_INSECURE_V0_PREVIEW_COOKIE";

function serializeAuthCookie(
  value: string,
  options: {
    maxAge: number;
    expires?: Date;
    secure?: boolean;
  },
): string {
  const secure = options.secure ?? authSessionCookieOptions.secure;
  const segments = [
    `${authSessionCookieName}=${encodeURIComponent(value)}`,
    `Max-Age=${options.maxAge}`,
    `Path=${authSessionCookieOptions.path}`,
    "HttpOnly",
    secure ? "Secure" : "",
    `SameSite=${authSessionCookieOptions.sameSite[0].toUpperCase()}${authSessionCookieOptions.sameSite.slice(1)}`,
  ].filter(Boolean);

  if (options.expires) {
    segments.push(`Expires=${options.expires.toUTCString()}`);
  }

  return segments.join("; ");
}

export function createAuthSessionSetCookieHeader(
  sessionReference: string,
  policy: AuthSessionCookiePolicy = {},
): string {
  return serializeAuthCookie(sessionReference, {
    maxAge: policy.maxAge ?? authSessionCookieOptions.maxAge,
    secure: policy.secure,
  });
}

export function createAuthSessionClearCookieHeader(
  policy: AuthSessionCookiePolicy = {},
): string {
  return serializeAuthCookie("", {
    maxAge: 0,
    expires: new Date(0),
    secure: policy.secure,
  });
}

export function isInternalV0PreviewCookiePolicyEnabled(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): boolean {
  return (
    env.OPERATION_ENABLE_V0_BOOTSTRAP === "1" &&
    env[internalV0PreviewCookieEnvName] === "1"
  );
}

export function getInternalV0PreviewCookiePolicy(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): AuthSessionCookiePolicy | undefined {
  if (!isInternalV0PreviewCookiePolicyEnabled(env)) {
    return undefined;
  }

  return {
    secure: false,
    maxAge: internalV0PreviewSessionMaxAgeSeconds,
  };
}

export function getAuthSessionMaxAgeForCookiePolicy(
  policy: AuthSessionCookiePolicy | undefined,
): number {
  return policy?.maxAge ?? authSessionMaxAgeSeconds;
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
  const { cookiePolicy, ...sessionInput } = input;
  const clearCookieHeader = createAuthSessionClearCookieHeader(cookiePolicy);

  if (!sessionReference) {
    return {
      invalidated: false,
      code: "session_not_found",
      clearCookieHeader,
    };
  }

  const result = await invalidateAuthSessionByReference(repository, {
    ...sessionInput,
    sessionReference,
  });

  return {
    ...result,
    clearCookieHeader,
  };
}
