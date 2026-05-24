import {
  AUTH_LOGOUT_CSRF_HEADER_NAME,
  AUTH_LOGOUT_CSRF_HEADER_VALUE,
  createAuthSessionRepository,
  handleAuthLogoutRoute,
  readAuthSessionReferenceFromRequestCookie,
} from "@/server/auth";
import { createDatabaseConnection } from "@/server/db/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  const hasValidCsrfHeader =
    request.headers.get(AUTH_LOGOUT_CSRF_HEADER_NAME) ===
    AUTH_LOGOUT_CSRF_HEADER_VALUE;

  if (
    !hasValidCsrfHeader ||
    !readAuthSessionReferenceFromRequestCookie(request)
  ) {
    return handleAuthLogoutRoute(null, request);
  }

  const { client, db } = createDatabaseConnection();

  try {
    const repository = createAuthSessionRepository(db);

    return await handleAuthLogoutRoute(repository, request);
  } finally {
    await client.end();
  }
}
