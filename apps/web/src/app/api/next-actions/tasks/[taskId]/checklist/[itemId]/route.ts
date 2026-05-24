import {
  createAuthSessionRepository,
  readAuthSessionReferenceFromRequestCookie,
} from "@/server/auth";
import { createDatabaseConnection } from "@/server/db/client";
import { createNextSessionTaskRepository } from "@/server/next-actions/repository";
import {
  handleNextActionTaskChecklistRoute,
  NEXT_SESSION_TASK_MUTATION_CSRF_HEADER_NAME,
  NEXT_SESSION_TASK_MUTATION_CSRF_HEADER_VALUE,
} from "@/server/next-actions/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type NextActionChecklistRouteContext = {
  params: Promise<{
    taskId?: string;
    itemId?: string;
  }>;
};

export async function PATCH(
  request: Request,
  context: NextActionChecklistRouteContext,
): Promise<Response> {
  const params = await context.params;
  const hasValidCsrfHeader =
    request.headers.get(NEXT_SESSION_TASK_MUTATION_CSRF_HEADER_NAME) ===
    NEXT_SESSION_TASK_MUTATION_CSRF_HEADER_VALUE;

  if (
    !hasValidCsrfHeader ||
    !readAuthSessionReferenceFromRequestCookie(request)
  ) {
    return handleNextActionTaskChecklistRoute(null, null, request, params);
  }

  const { client, db } = createDatabaseConnection();

  try {
    return await handleNextActionTaskChecklistRoute(
      createAuthSessionRepository(db),
      createNextSessionTaskRepository(db),
      request,
      params,
    );
  } finally {
    await client.end();
  }
}
