import {
  createAuthSessionRepository,
  readAuthSessionReferenceFromRequestCookie,
} from "@/server/auth";
import { createDatabaseConnection } from "@/server/db/client";
import { createKnowledgeLifecycleRepository } from "@/server/knowledge/repository";
import {
  handleKnowledgeConflictResolveRoute,
  KNOWLEDGE_LIFECYCLE_MUTATION_CSRF_HEADER_NAME,
  KNOWLEDGE_LIFECYCLE_MUTATION_CSRF_HEADER_VALUE,
} from "@/server/knowledge/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type KnowledgeConflictRouteContext = {
  params: Promise<{
    conflictId?: string;
  }>;
};

export async function PATCH(
  request: Request,
  context: KnowledgeConflictRouteContext,
): Promise<Response> {
  const params = await context.params;
  const hasValidCsrfHeader =
    request.headers.get(KNOWLEDGE_LIFECYCLE_MUTATION_CSRF_HEADER_NAME) ===
    KNOWLEDGE_LIFECYCLE_MUTATION_CSRF_HEADER_VALUE;

  if (
    !hasValidCsrfHeader ||
    !readAuthSessionReferenceFromRequestCookie(request)
  ) {
    return handleKnowledgeConflictResolveRoute(null, null, request, params);
  }

  const { client, db } = createDatabaseConnection();

  try {
    return await handleKnowledgeConflictResolveRoute(
      createAuthSessionRepository(db),
      createKnowledgeLifecycleRepository(db),
      request,
      params,
    );
  } finally {
    await client.end();
  }
}
