import {
  createAuthSessionRepository,
  readAuthSessionReferenceFromRequestCookie,
} from "@/server/auth";
import { isOperatorV0BootstrapEnabled } from "@/server/auth/operator-v0";
import { createDatabaseConnection } from "@/server/db/client";
import { createAiReviewRunRepository } from "@/server/ai-review/repository";
import { handleOperatorV0AiReviewExecuteRoute } from "@/server/ai-review/operator-v0";
import {
  AI_REVIEW_MUTATION_CSRF_HEADER_NAME,
  AI_REVIEW_MUTATION_CSRF_HEADER_VALUE,
} from "@/server/ai-review/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AiReviewRunExecuteV0RouteContext = {
  params: Promise<{
    runId?: string;
  }>;
};

export async function POST(
  request: Request,
  context: AiReviewRunExecuteV0RouteContext,
): Promise<Response> {
  const params = await context.params;
  const enabled = isOperatorV0BootstrapEnabled();
  const hasValidCsrfHeader =
    request.headers.get(AI_REVIEW_MUTATION_CSRF_HEADER_NAME) ===
    AI_REVIEW_MUTATION_CSRF_HEADER_VALUE;

  if (
    !enabled ||
    !hasValidCsrfHeader ||
    !readAuthSessionReferenceFromRequestCookie(request)
  ) {
    return handleOperatorV0AiReviewExecuteRoute(null, null, request, params, {
      enabled,
    });
  }

  const { client, db } = createDatabaseConnection();

  try {
    return await handleOperatorV0AiReviewExecuteRoute(
      createAuthSessionRepository(db),
      createAiReviewRunRepository(db),
      request,
      params,
      { enabled },
    );
  } finally {
    await client.end();
  }
}
