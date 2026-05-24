import {
  createAuthSessionRepository,
  readAuthSessionReferenceFromRequestCookie,
} from "@/server/auth";
import { createDatabaseConnection } from "@/server/db/client";
import {
  createRacketProductRepository,
} from "@/server/rackets/repository";
import {
  RACKET_PRODUCT_MUTATION_CSRF_HEADER_NAME,
  RACKET_PRODUCT_MUTATION_CSRF_HEADER_VALUE,
  handleRacketProductsCreateRoute,
  handleRacketProductsListRoute,
} from "@/server/rackets/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  if (!readAuthSessionReferenceFromRequestCookie(request)) {
    return handleRacketProductsListRoute(null, null, request);
  }

  const { client, db } = createDatabaseConnection();

  try {
    return await handleRacketProductsListRoute(
      createAuthSessionRepository(db),
      createRacketProductRepository(db),
      request,
    );
  } finally {
    await client.end();
  }
}

export async function POST(request: Request): Promise<Response> {
  const hasValidCsrfHeader =
    request.headers.get(RACKET_PRODUCT_MUTATION_CSRF_HEADER_NAME) ===
    RACKET_PRODUCT_MUTATION_CSRF_HEADER_VALUE;

  if (
    !hasValidCsrfHeader ||
    !readAuthSessionReferenceFromRequestCookie(request)
  ) {
    return handleRacketProductsCreateRoute(null, null, request);
  }

  const { client, db } = createDatabaseConnection();

  try {
    return await handleRacketProductsCreateRoute(
      createAuthSessionRepository(db),
      createRacketProductRepository(db),
      request,
    );
  } finally {
    await client.end();
  }
}
