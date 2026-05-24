import {
  createAuthSessionRepository,
  readAuthSessionReferenceFromRequestCookie,
} from "@/server/auth";
import {
  createDeepSeekProvider,
  parseDeepSeekProviderEnv,
} from "@/server/ai-provider";
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

function createProviderOrNull() {
  try {
    return createDeepSeekProvider(parseDeepSeekProviderEnv());
  } catch {
    return null;
  }
}

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

  try {
    return await handleAiReviewRunExecuteRoute(
      createAuthSessionRepository(db),
      createAiReviewRunRepository(db),
      createProviderOrNull(),
      request,
      params,
    );
  } finally {
    await client.end();
  }
}
