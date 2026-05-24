import {
  createAuthSessionRepository,
  readAuthSessionReferenceFromRequestCookie,
} from "@/server/auth";
import { createDatabaseConnection } from "@/server/db/client";
import { createNextSessionTaskRepository } from "@/server/next-actions/repository";
import {
  handleNextActionTasksCreateRoute,
  handleNextActionTasksListRoute,
  NEXT_SESSION_TASK_MUTATION_CSRF_HEADER_NAME,
  NEXT_SESSION_TASK_MUTATION_CSRF_HEADER_VALUE,
} from "@/server/next-actions/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  if (!readAuthSessionReferenceFromRequestCookie(request)) {
    return handleNextActionTasksListRoute(null, null, request);
  }

  const { client, db } = createDatabaseConnection();

  try {
    return await handleNextActionTasksListRoute(
      createAuthSessionRepository(db),
      createNextSessionTaskRepository(db),
      request,
    );
  } finally {
    await client.end();
  }
}

export async function POST(request: Request): Promise<Response> {
  const hasValidCsrfHeader =
    request.headers.get(NEXT_SESSION_TASK_MUTATION_CSRF_HEADER_NAME) ===
    NEXT_SESSION_TASK_MUTATION_CSRF_HEADER_VALUE;

  if (
    !hasValidCsrfHeader ||
    !readAuthSessionReferenceFromRequestCookie(request)
  ) {
    return handleNextActionTasksCreateRoute(null, null, request);
  }

  const { client, db } = createDatabaseConnection();

  try {
    return await handleNextActionTasksCreateRoute(
      createAuthSessionRepository(db),
      createNextSessionTaskRepository(db),
      request,
    );
  } finally {
    await client.end();
  }
}
