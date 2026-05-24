import {
  createAuthSessionRepository,
  readAuthSessionReferenceFromRequestCookie,
} from "@/server/auth";
import { createDatabaseConnection } from "@/server/db/client";
import { createNextSessionTaskRepository } from "@/server/next-actions/repository";
import { handleNextActionTaskDetailRoute } from "@/server/next-actions/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type NextActionTaskRouteContext = {
  params: Promise<{
    taskId?: string;
  }>;
};

export async function GET(
  request: Request,
  context: NextActionTaskRouteContext,
): Promise<Response> {
  const params = await context.params;

  if (!readAuthSessionReferenceFromRequestCookie(request)) {
    return handleNextActionTaskDetailRoute(null, null, request, params);
  }

  const { client, db } = createDatabaseConnection();

  try {
    return await handleNextActionTaskDetailRoute(
      createAuthSessionRepository(db),
      createNextSessionTaskRepository(db),
      request,
      params,
    );
  } finally {
    await client.end();
  }
}
