import {
  createAuthSessionRepository,
  readAuthSessionReferenceFromRequestCookie,
} from "@/server/auth";
import { createDatabaseConnection } from "@/server/db/client";
import { createSessionCaptureRepository } from "@/server/sessions/repository";
import {
  handleSessionCaptureDraftAutosaveRoute,
  SESSION_CAPTURE_MUTATION_CSRF_HEADER_NAME,
  SESSION_CAPTURE_MUTATION_CSRF_HEADER_VALUE,
} from "@/server/sessions/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SessionCaptureDraftRouteContext = {
  params: Promise<{
    sessionId?: string;
  }>;
};

export async function PATCH(
  request: Request,
  context: SessionCaptureDraftRouteContext,
): Promise<Response> {
  const params = await context.params;
  const hasValidCsrfHeader =
    request.headers.get(SESSION_CAPTURE_MUTATION_CSRF_HEADER_NAME) ===
    SESSION_CAPTURE_MUTATION_CSRF_HEADER_VALUE;

  if (
    !hasValidCsrfHeader ||
    !readAuthSessionReferenceFromRequestCookie(request)
  ) {
    return handleSessionCaptureDraftAutosaveRoute(null, null, request, params);
  }

  const { client, db } = createDatabaseConnection();

  try {
    return await handleSessionCaptureDraftAutosaveRoute(
      createAuthSessionRepository(db),
      createSessionCaptureRepository(db),
      request,
      params,
    );
  } finally {
    await client.end();
  }
}
