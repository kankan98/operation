import {
  createAuthSessionRepository,
  readAuthSessionReferenceFromRequestCookie,
} from "@/server/auth";
import { createDatabaseConnection } from "@/server/db/client";
import { createNextSessionTaskRepository } from "@/server/next-actions/repository";
import {
  handleNextActionTaskDependencyUpdateRoute,
  NEXT_SESSION_TASK_MUTATION_CSRF_HEADER_NAME,
  NEXT_SESSION_TASK_MUTATION_CSRF_HEADER_VALUE,
} from "@/server/next-actions/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type NextActionDependencyRouteContext = {
  params: Promise<{
    taskId?: string;
    dependencyId?: string;
  }>;
};

export async function PATCH(
  request: Request,
  context: NextActionDependencyRouteContext,
): Promise<Response> {
  const params = await context.params;
  const hasValidCsrfHeader =
    request.headers.get(NEXT_SESSION_TASK_MUTATION_CSRF_HEADER_NAME) ===
    NEXT_SESSION_TASK_MUTATION_CSRF_HEADER_VALUE;

  if (
    !hasValidCsrfHeader ||
    !readAuthSessionReferenceFromRequestCookie(request)
  ) {
    return handleNextActionTaskDependencyUpdateRoute(null, null, request, params);
  }

  const { client, db } = createDatabaseConnection();

  try {
    return await handleNextActionTaskDependencyUpdateRoute(
      createAuthSessionRepository(db),
      createNextSessionTaskRepository(db),
      request,
      params,
    );
  } finally {
    await client.end();
  }
}
