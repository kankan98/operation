import {
  createAuthSessionRepository,
  readAuthSessionReferenceFromRequestCookie,
} from "@/server/auth";
import { createDatabaseConnection } from "@/server/db/client";
import { createV0TrialRunRepository } from "@/server/trial-runs/repository";
import {
  handleV0TrialRunCompleteRoute,
  handleV0TrialRunDetailRoute,
  V0_TRIAL_RUN_MUTATION_CSRF_HEADER_NAME,
  V0_TRIAL_RUN_MUTATION_CSRF_HEADER_VALUE,
} from "@/server/trial-runs/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type V0TrialRunRouteContext = {
  params: Promise<{
    runId?: string;
  }>;
};

export async function GET(
  request: Request,
  context: V0TrialRunRouteContext,
): Promise<Response> {
  const params = await context.params;

  if (!readAuthSessionReferenceFromRequestCookie(request)) {
    return handleV0TrialRunDetailRoute(null, null, request, params);
  }

  const { client, db } = createDatabaseConnection();

  try {
    return await handleV0TrialRunDetailRoute(
      createAuthSessionRepository(db),
      createV0TrialRunRepository(db),
      request,
      params,
    );
  } finally {
    await client.end();
  }
}

export async function PATCH(
  request: Request,
  context: V0TrialRunRouteContext,
): Promise<Response> {
  const params = await context.params;
  const hasValidCsrfHeader =
    request.headers.get(V0_TRIAL_RUN_MUTATION_CSRF_HEADER_NAME) ===
    V0_TRIAL_RUN_MUTATION_CSRF_HEADER_VALUE;

  if (!hasValidCsrfHeader || !readAuthSessionReferenceFromRequestCookie(request)) {
    return handleV0TrialRunCompleteRoute(null, null, request, params);
  }

  const { client, db } = createDatabaseConnection();

  try {
    return await handleV0TrialRunCompleteRoute(
      createAuthSessionRepository(db),
      createV0TrialRunRepository(db),
      request,
      params,
    );
  } finally {
    await client.end();
  }
}
