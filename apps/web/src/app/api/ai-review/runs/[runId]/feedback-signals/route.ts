import {
  createAuthSessionRepository,
  readAuthSessionReferenceFromRequestCookie,
} from "@/server/auth";
import { createDatabaseConnection } from "@/server/db/client";
import { createAiReviewRunRepository } from "@/server/ai-review/repository";
import {
  AI_REVIEW_MUTATION_CSRF_HEADER_NAME,
  AI_REVIEW_MUTATION_CSRF_HEADER_VALUE,
  handleAiReviewFeedbackSignalRoute,
} from "@/server/ai-review/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AiReviewFeedbackRouteContext = {
  params: Promise<{
    runId?: string;
  }>;
};

export async function POST(
  request: Request,
  context: AiReviewFeedbackRouteContext,
): Promise<Response> {
  const params = await context.params;
  const hasValidCsrfHeader =
    request.headers.get(AI_REVIEW_MUTATION_CSRF_HEADER_NAME) ===
    AI_REVIEW_MUTATION_CSRF_HEADER_VALUE;

  if (
    !hasValidCsrfHeader ||
    !readAuthSessionReferenceFromRequestCookie(request)
  ) {
    return handleAiReviewFeedbackSignalRoute(null, null, request, params);
  }

  const { client, db } = createDatabaseConnection();

  try {
    return await handleAiReviewFeedbackSignalRoute(
      createAuthSessionRepository(db),
      createAiReviewRunRepository(db),
      request,
      params,
    );
  } finally {
    await client.end();
  }
}
