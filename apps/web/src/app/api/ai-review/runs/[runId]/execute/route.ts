import {
  createAuthSessionRepository,
  readAuthSessionReferenceFromRequestCookie,
} from "@/server/auth";
import {
  createAiReviewLiveModelProvider,
} from "@/server/ai-review/live-model-gate";
import { createDatabaseConnection } from "@/server/db/client";
import { createAiReviewRunRepository } from "@/server/ai-review/repository";
import {
  AI_REVIEW_MUTATION_CSRF_HEADER_NAME,
  AI_REVIEW_MUTATION_CSRF_HEADER_VALUE,
  handleAiReviewRunExecuteRoute,
} from "@/server/ai-review/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AiReviewRunExecuteRouteContext = {
  params: Promise<{
    runId?: string;
  }>;
};

export async function POST(
  request: Request,
  context: AiReviewRunExecuteRouteContext,
): Promise<Response> {
  const params = await context.params;
  const hasValidCsrfHeader =
    request.headers.get(AI_REVIEW_MUTATION_CSRF_HEADER_NAME) ===
    AI_REVIEW_MUTATION_CSRF_HEADER_VALUE;

  if (
    !hasValidCsrfHeader ||
    !readAuthSessionReferenceFromRequestCookie(request)
  ) {
    return handleAiReviewRunExecuteRoute(null, null, null, request, params);
  }

  const { client, db } = createDatabaseConnection();
  const liveModel = createAiReviewLiveModelProvider();

  try {
    return await handleAiReviewRunExecuteRoute(
      createAuthSessionRepository(db),
      createAiReviewRunRepository(db),
      liveModel.provider,
      request,
      params,
      {
        liveModelStatus: liveModel.status,
      },
    );
  } finally {
    await client.end();
  }
}
