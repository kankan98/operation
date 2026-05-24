import {
  createAuthSessionRepository,
  readAuthSessionReferenceFromRequestCookie,
} from "@/server/auth";
import { createDatabaseConnection } from "@/server/db/client";
import { createAiReviewRunRepository } from "@/server/ai-review/repository";
import {
  AI_REVIEW_MUTATION_CSRF_HEADER_NAME,
  AI_REVIEW_MUTATION_CSRF_HEADER_VALUE,
  handleAiReviewPromptVersionsCreateRoute,
} from "@/server/ai-review/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  const hasValidCsrfHeader =
    request.headers.get(AI_REVIEW_MUTATION_CSRF_HEADER_NAME) ===
    AI_REVIEW_MUTATION_CSRF_HEADER_VALUE;

  if (
    !hasValidCsrfHeader ||
    !readAuthSessionReferenceFromRequestCookie(request)
  ) {
    return handleAiReviewPromptVersionsCreateRoute(null, null, request);
  }

  const { client, db } = createDatabaseConnection();

  try {
    return await handleAiReviewPromptVersionsCreateRoute(
      createAuthSessionRepository(db),
      createAiReviewRunRepository(db),
      request,
    );
  } finally {
    await client.end();
  }
}
