import {
  createAuthSessionRepository,
  readAuthSessionReferenceFromRequestCookie,
} from "@/server/auth";
import { createDatabaseConnection } from "@/server/db/client";
import { createRacketProductRepository } from "@/server/rackets/repository";
import { handleRacketReviewQueueRoute } from "@/server/rackets/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  if (!readAuthSessionReferenceFromRequestCookie(request)) {
    return handleRacketReviewQueueRoute(null, null, request);
  }

  const { client, db } = createDatabaseConnection();

  try {
    return await handleRacketReviewQueueRoute(
      createAuthSessionRepository(db),
      createRacketProductRepository(db),
      request,
    );
  } finally {
    await client.end();
  }
}
