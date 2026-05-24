import {
  createAuthSessionRepository,
  readAuthSessionReferenceFromRequestCookie,
} from "@/server/auth";
import { createDatabaseConnection } from "@/server/db/client";
import { createAiReviewRunRepository } from "@/server/ai-review/repository";
import { handleAiReviewRunDetailRoute } from "@/server/ai-review/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AiReviewRunRouteContext = {
  params: Promise<{
    runId?: string;
  }>;
};

export async function GET(
  request: Request,
  context: AiReviewRunRouteContext,
): Promise<Response> {
  const params = await context.params;

  if (!readAuthSessionReferenceFromRequestCookie(request)) {
    return handleAiReviewRunDetailRoute(null, null, request, params);
  }

  const { client, db } = createDatabaseConnection();

  try {
    return await handleAiReviewRunDetailRoute(
      createAuthSessionRepository(db),
      createAiReviewRunRepository(db),
      request,
      params,
    );
  } finally {
    await client.end();
  }
}
