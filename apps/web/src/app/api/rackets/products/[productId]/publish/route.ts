import {
  createAuthSessionRepository,
  readAuthSessionReferenceFromRequestCookie,
} from "@/server/auth";
import { createDatabaseConnection } from "@/server/db/client";
import { createRacketProductRepository } from "@/server/rackets/repository";
import {
  handleRacketProductPublishRoute,
  RACKET_PRODUCT_MUTATION_CSRF_HEADER_NAME,
  RACKET_PRODUCT_MUTATION_CSRF_HEADER_VALUE,
} from "@/server/rackets/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RacketProductRouteContext = {
  params: Promise<{
    productId?: string;
  }>;
};

export async function POST(
  request: Request,
  context: RacketProductRouteContext,
): Promise<Response> {
  const params = await context.params;
  const hasValidCsrfHeader =
    request.headers.get(RACKET_PRODUCT_MUTATION_CSRF_HEADER_NAME) ===
    RACKET_PRODUCT_MUTATION_CSRF_HEADER_VALUE;

  if (
    !hasValidCsrfHeader ||
    !readAuthSessionReferenceFromRequestCookie(request)
  ) {
    return handleRacketProductPublishRoute(null, null, request, params);
  }

  const { client, db } = createDatabaseConnection();

  try {
    return await handleRacketProductPublishRoute(
      createAuthSessionRepository(db),
      createRacketProductRepository(db),
      request,
      params,
    );
  } finally {
    await client.end();
  }
}
