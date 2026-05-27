import {
  createAuthSessionRepository,
  readAuthSessionReferenceFromRequestCookie,
} from "@/server/auth";
import { createDatabaseConnection } from "@/server/db/client";
import { createV0TrialRunRepository } from "@/server/trial-runs/repository";
import {
  handleV0TrialRunCreateRoute,
  handleV0TrialRunListRoute,
  V0_TRIAL_RUN_MUTATION_CSRF_HEADER_NAME,
  V0_TRIAL_RUN_MUTATION_CSRF_HEADER_VALUE,
} from "@/server/trial-runs/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  if (!readAuthSessionReferenceFromRequestCookie(request)) {
    return handleV0TrialRunListRoute(null, null, request);
  }

  const { client, db } = createDatabaseConnection();

  try {
    return await handleV0TrialRunListRoute(
      createAuthSessionRepository(db),
      createV0TrialRunRepository(db),
      request,
    );
  } finally {
    await client.end();
  }
}

export async function POST(request: Request): Promise<Response> {
  const hasValidCsrfHeader =
    request.headers.get(V0_TRIAL_RUN_MUTATION_CSRF_HEADER_NAME) ===
    V0_TRIAL_RUN_MUTATION_CSRF_HEADER_VALUE;

  if (!hasValidCsrfHeader || !readAuthSessionReferenceFromRequestCookie(request)) {
    return handleV0TrialRunCreateRoute(null, null, request);
  }

  const { client, db } = createDatabaseConnection();

  try {
    return await handleV0TrialRunCreateRoute(
      createAuthSessionRepository(db),
      createV0TrialRunRepository(db),
      request,
    );
  } finally {
    await client.end();
  }
}
