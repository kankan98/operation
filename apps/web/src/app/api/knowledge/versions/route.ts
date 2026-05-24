import {
  createAuthSessionRepository,
  readAuthSessionReferenceFromRequestCookie,
} from "@/server/auth";
import { createDatabaseConnection } from "@/server/db/client";
import { createKnowledgeLifecycleRepository } from "@/server/knowledge/repository";
import {
  handleKnowledgeVersionsCreateRoute,
  KNOWLEDGE_LIFECYCLE_MUTATION_CSRF_HEADER_NAME,
  KNOWLEDGE_LIFECYCLE_MUTATION_CSRF_HEADER_VALUE,
} from "@/server/knowledge/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  const hasValidCsrfHeader =
    request.headers.get(KNOWLEDGE_LIFECYCLE_MUTATION_CSRF_HEADER_NAME) ===
    KNOWLEDGE_LIFECYCLE_MUTATION_CSRF_HEADER_VALUE;

  if (
    !hasValidCsrfHeader ||
    !readAuthSessionReferenceFromRequestCookie(request)
  ) {
    return handleKnowledgeVersionsCreateRoute(null, null, request);
  }

  const { client, db } = createDatabaseConnection();

  try {
    return await handleKnowledgeVersionsCreateRoute(
      createAuthSessionRepository(db),
      createKnowledgeLifecycleRepository(db),
      request,
    );
  } finally {
    await client.end();
  }
}
