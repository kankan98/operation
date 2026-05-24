import {
  createAuthSessionRepository,
  readAuthSessionReferenceFromRequestCookie,
} from "@/server/auth";
import { createDatabaseConnection } from "@/server/db/client";
import { createKnowledgeLifecycleRepository } from "@/server/knowledge/repository";
import { handleKnowledgeReviewQueueRoute } from "@/server/knowledge/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  if (!readAuthSessionReferenceFromRequestCookie(request)) {
    return handleKnowledgeReviewQueueRoute(null, null, request);
  }

  const { client, db } = createDatabaseConnection();

  try {
    return await handleKnowledgeReviewQueueRoute(
      createAuthSessionRepository(db),
      createKnowledgeLifecycleRepository(db),
      request,
    );
  } finally {
    await client.end();
  }
}
