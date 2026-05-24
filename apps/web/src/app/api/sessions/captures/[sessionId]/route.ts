import {
  createAuthSessionRepository,
  readAuthSessionReferenceFromRequestCookie,
} from "@/server/auth";
import { createDatabaseConnection } from "@/server/db/client";
import { createSessionCaptureRepository } from "@/server/sessions/repository";
import { handleSessionCaptureDetailRoute } from "@/server/sessions/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SessionCaptureRouteContext = {
  params: Promise<{
    sessionId?: string;
  }>;
};

export async function GET(
  request: Request,
  context: SessionCaptureRouteContext,
): Promise<Response> {
  const params = await context.params;

  if (!readAuthSessionReferenceFromRequestCookie(request)) {
    return handleSessionCaptureDetailRoute(null, null, request, params);
  }

  const { client, db } = createDatabaseConnection();

  try {
    return await handleSessionCaptureDetailRoute(
      createAuthSessionRepository(db),
      createSessionCaptureRepository(db),
      request,
      params,
    );
  } finally {
    await client.end();
  }
}
