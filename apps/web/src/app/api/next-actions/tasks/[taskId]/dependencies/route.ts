import {
  createAuthSessionRepository,
  readAuthSessionReferenceFromRequestCookie,
} from "@/server/auth";
import { createDatabaseConnection } from "@/server/db/client";
import { createNextSessionTaskRepository } from "@/server/next-actions/repository";
import {
  handleNextActionTaskDependencyCreateRoute,
  NEXT_SESSION_TASK_MUTATION_CSRF_HEADER_NAME,
  NEXT_SESSION_TASK_MUTATION_CSRF_HEADER_VALUE,
} from "@/server/next-actions/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type NextActionTaskRouteContext = {
  params: Promise<{
    taskId?: string;
  }>;
};

export async function POST(
  request: Request,
  context: NextActionTaskRouteContext,
): Promise<Response> {
  const params = await context.params;
  const hasValidCsrfHeader =
    request.headers.get(NEXT_SESSION_TASK_MUTATION_CSRF_HEADER_NAME) ===
    NEXT_SESSION_TASK_MUTATION_CSRF_HEADER_VALUE;

  if (
    !hasValidCsrfHeader ||
    !readAuthSessionReferenceFromRequestCookie(request)
  ) {
    return handleNextActionTaskDependencyCreateRoute(null, null, request, params);
  }

  const { client, db } = createDatabaseConnection();

  try {
    return await handleNextActionTaskDependencyCreateRoute(
      createAuthSessionRepository(db),
      createNextSessionTaskRepository(db),
      request,
      params,
    );
  } finally {
    await client.end();
  }
}
