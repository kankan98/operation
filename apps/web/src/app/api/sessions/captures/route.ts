import {
  createAuthSessionRepository,
  readAuthSessionReferenceFromRequestCookie,
} from "@/server/auth";
import { createDatabaseConnection } from "@/server/db/client";
import { createSessionCaptureRepository } from "@/server/sessions/repository";
import {
  handleSessionCapturesCreateRoute,
  handleSessionCapturesListRoute,
  SESSION_CAPTURE_MUTATION_CSRF_HEADER_NAME,
  SESSION_CAPTURE_MUTATION_CSRF_HEADER_VALUE,
} from "@/server/sessions/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  if (!readAuthSessionReferenceFromRequestCookie(request)) {
    return handleSessionCapturesListRoute(null, null, request);
  }

  const { client, db } = createDatabaseConnection();

  try {
    return await handleSessionCapturesListRoute(
      createAuthSessionRepository(db),
      createSessionCaptureRepository(db),
      request,
    );
  } finally {
    await client.end();
  }
}

export async function POST(request: Request): Promise<Response> {
  const hasValidCsrfHeader =
    request.headers.get(SESSION_CAPTURE_MUTATION_CSRF_HEADER_NAME) ===
    SESSION_CAPTURE_MUTATION_CSRF_HEADER_VALUE;

  if (
    !hasValidCsrfHeader ||
    !readAuthSessionReferenceFromRequestCookie(request)
  ) {
    return handleSessionCapturesCreateRoute(null, null, request);
  }

  const { client, db } = createDatabaseConnection();

  try {
    return await handleSessionCapturesCreateRoute(
      createAuthSessionRepository(db),
      createSessionCaptureRepository(db),
      request,
    );
  } finally {
    await client.end();
  }
}
