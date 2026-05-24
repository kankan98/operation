import {
  createAuthSessionRepository,
  readAuthSessionReferenceFromRequestCookie,
} from "@/server/auth";
import { createDatabaseConnection } from "@/server/db/client";
import { createRacketProductRepository } from "@/server/rackets/repository";
import {
  handleRacketReviewDecisionRoute,
  RACKET_PRODUCT_MUTATION_CSRF_HEADER_NAME,
  RACKET_PRODUCT_MUTATION_CSRF_HEADER_VALUE,
} from "@/server/rackets/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  const hasValidCsrfHeader =
    request.headers.get(RACKET_PRODUCT_MUTATION_CSRF_HEADER_NAME) ===
    RACKET_PRODUCT_MUTATION_CSRF_HEADER_VALUE;

  if (
    !hasValidCsrfHeader ||
    !readAuthSessionReferenceFromRequestCookie(request)
  ) {
    return handleRacketReviewDecisionRoute(null, null, request);
  }

  const { client, db } = createDatabaseConnection();

  try {
    return await handleRacketReviewDecisionRoute(
      createAuthSessionRepository(db),
      createRacketProductRepository(db),
      request,
    );
  } finally {
    await client.end();
  }
}
