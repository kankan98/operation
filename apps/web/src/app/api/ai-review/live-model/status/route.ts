import {
  createAuthSessionRepository,
  readAuthSessionReferenceFromRequestCookie,
} from "@/server/auth";
import { getAiReviewLiveModelStatus } from "@/server/ai-review/live-model-gate";
import { handleAiReviewLiveModelStatusRoute } from "@/server/ai-review/route";
import { createDatabaseConnection } from "@/server/db/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  const status = getAiReviewLiveModelStatus();

  if (!readAuthSessionReferenceFromRequestCookie(request)) {
    return handleAiReviewLiveModelStatusRoute(null, request, status);
  }

  const { client, db } = createDatabaseConnection();

  try {
    return await handleAiReviewLiveModelStatusRoute(
      createAuthSessionRepository(db),
      request,
      status,
    );
  } finally {
    await client.end();
  }
}
