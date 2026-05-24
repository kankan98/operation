import {
  createAuthSessionRepository,
  readAuthSessionReferenceFromRequestCookie,
} from "@/server/auth";
import { createDatabaseConnection } from "@/server/db/client";
import { createKnowledgeLifecycleRepository } from "@/server/knowledge/repository";
import { handleKnowledgeSourceDetailRoute } from "@/server/knowledge/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type KnowledgeSourceRouteContext = {
  params: Promise<{
    sourceId?: string;
  }>;
};

export async function GET(
  request: Request,
  context: KnowledgeSourceRouteContext,
): Promise<Response> {
  const params = await context.params;

  if (!readAuthSessionReferenceFromRequestCookie(request)) {
    return handleKnowledgeSourceDetailRoute(null, null, request, params);
  }

  const { client, db } = createDatabaseConnection();

  try {
    return await handleKnowledgeSourceDetailRoute(
      createAuthSessionRepository(db),
      createKnowledgeLifecycleRepository(db),
      request,
      params,
    );
  } finally {
    await client.end();
  }
}
