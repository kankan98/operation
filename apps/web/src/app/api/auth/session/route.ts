import {
  createAuthSessionRepository,
  handleAuthSessionRoute,
  readAuthSessionReferenceFromRequestCookie,
} from "@/server/auth";
import { createDatabaseConnection } from "@/server/db/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  if (!readAuthSessionReferenceFromRequestCookie(request)) {
    return handleAuthSessionRoute(null, request);
  }

  const { client, db } = createDatabaseConnection();

  try {
    const repository = createAuthSessionRepository(db);

    return await handleAuthSessionRoute(repository, request);
  } finally {
    await client.end();
  }
}
