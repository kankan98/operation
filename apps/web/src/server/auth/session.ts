import "server-only";

import { createHash, randomBytes } from "node:crypto";

import { eq } from "drizzle-orm";
import { z } from "zod";

import type { DatabaseClient } from "../db/client";
import {
  authSessions,
  type AuthSessionRecord,
} from "../db/schema";
import { AuthGuardError } from "./errors";
import {
  createAuthGuardRepository,
  type AuthRepositoryDatabase,
} from "./repository";
import { requireAuthContext } from "./guard";
import {
  authGuardTargetSchema,
  authPermissionSchema,
  authTeamRoleSchema,
  type AuthContext,
} from "./types";

export const authSessionCookieName = "operation_session";
export const authSessionMaxAgeSeconds = 60 * 60 * 24 * 7;

export const authSessionCookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "lax",
  path: "/",
  maxAge: authSessionMaxAgeSeconds,
} as const;

const authSessionResolveRequestSchema = z.object({
  requestId: z.string().min(1),
  sessionReference: z.string().min(1).max(512),
  tenantId: z.string().min(1),
  teamId: z.string().min(1),
  requiredPermission: authPermissionSchema,
  allowedRoles: z.array(authTeamRoleSchema).optional(),
  target: authGuardTargetSchema.optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type AuthSessionResolveRequest = z.infer<
  typeof authSessionResolveRequestSchema
>;

export type AuthSessionSummary = {
  id: string;
  userId: string;
  status: AuthSessionRecord["status"];
  issuedAt: Date;
  expiresAt: Date;
  lastVerifiedAt: Date | null;
};

export type AuthSessionResolution = {
  context: AuthContext;
  session: AuthSessionSummary;
};

export type AuthSessionRepositoryDatabase = Pick<
  DatabaseClient,
  "select" | "update"
>;

function parseRequest(input: unknown): AuthSessionResolveRequest {
  const parsed = authSessionResolveRequestSchema.safeParse(input);

  if (parsed.success) {
    return parsed.data;
  }

  throw new AuthGuardError(
    "AUTH_CONTEXT_INVALID",
    "Auth session request is invalid",
    {
      requestId: "unknown",
      details: {
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
    },
  );
}

export function createAuthSessionReference(): string {
  return randomBytes(32).toString("base64url");
}

export function hashAuthSessionReference(sessionReference: string): string {
  return createHash("sha256").update(sessionReference, "utf8").digest("hex");
}

function toSessionSummary(session: AuthSessionRecord): AuthSessionSummary {
  return {
    id: session.id,
    userId: session.userId,
    status: session.status,
    issuedAt: session.issuedAt,
    expiresAt: session.expiresAt,
    lastVerifiedAt: session.lastVerifiedAt,
  };
}

function throwSessionDenied(
  code: "UNAUTHENTICATED" | "SESSION_EXPIRED" | "SESSION_REVOKED",
  message: string,
  request: AuthSessionResolveRequest,
): never {
  throw new AuthGuardError(code, message, {
    requestId: request.requestId,
    details: {
      sessionReference: request.sessionReference,
      metadata: request.metadata,
    },
  });
}

function assertUsableSession(
  session: AuthSessionRecord | undefined,
  request: AuthSessionResolveRequest,
  now: Date,
): asserts session is AuthSessionRecord {
  if (!session) {
    throwSessionDenied("UNAUTHENTICATED", "Auth session was not found", request);
  }

  if (session.status === "expired" || session.expiresAt <= now) {
    throwSessionDenied("SESSION_EXPIRED", "Auth session has expired", request);
  }

  if (session.status !== "active") {
    throwSessionDenied(
      "SESSION_REVOKED",
      "Auth session is no longer active",
      request,
    );
  }
}

export function createAuthSessionRepository(
  database: AuthSessionRepositoryDatabase,
) {
  return {
    async resolveAuthContextFromSession(
      input: AuthSessionResolveRequest,
    ): Promise<AuthSessionResolution> {
      const request = parseRequest(input);
      const now = new Date();
      const referenceHash = hashAuthSessionReference(request.sessionReference);
      const [session] = await database
        .select()
        .from(authSessions)
        .where(eq(authSessions.sessionReferenceHash, referenceHash))
        .limit(1);

      assertUsableSession(session, request, now);

      await database
        .update(authSessions)
        .set({
          lastVerifiedAt: now,
          updatedAt: now,
        })
        .where(eq(authSessions.id, session.id));

      const authRepository = createAuthGuardRepository(
        database as unknown as AuthRepositoryDatabase,
      );
      const context = await requireAuthContext(authRepository, {
        requestId: request.requestId,
        actorId: session.userId,
        tenantId: request.tenantId,
        teamId: request.teamId,
        requiredPermission: request.requiredPermission,
        allowedRoles: request.allowedRoles,
        target: request.target,
      });

      return {
        context,
        session: {
          ...toSessionSummary(session),
          lastVerifiedAt: now,
        },
      };
    },
  };
}

export type AuthSessionRepository = ReturnType<
  typeof createAuthSessionRepository
>;

export async function requireAuthContextFromSession(
  repository: AuthSessionRepository,
  request: AuthSessionResolveRequest,
): Promise<AuthSessionResolution> {
  return repository.resolveAuthContextFromSession(request);
}
