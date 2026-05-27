import {
  createAuthSessionRepository,
  readAuthSessionReferenceFromRequestCookie,
} from "@/server/auth";
import { createDatabaseConnection } from "@/server/db/client";
import { createV0TrialRunRepository } from "@/server/trial-runs/repository";
import {
  handleV0TrialRunStepUpdateRoute,
  V0_TRIAL_RUN_MUTATION_CSRF_HEADER_NAME,
  V0_TRIAL_RUN_MUTATION_CSRF_HEADER_VALUE,
} from "@/server/trial-runs/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type V0TrialRunStepRouteContext = {
  params: Promise<{
    runId?: string;
    stepId?: string;
  }>;
};

export async function PATCH(
  request: Request,
  context: V0TrialRunStepRouteContext,
): Promise<Response> {
  const params = await context.params;
  const hasValidCsrfHeader =
    request.headers.get(V0_TRIAL_RUN_MUTATION_CSRF_HEADER_NAME) ===
    V0_TRIAL_RUN_MUTATION_CSRF_HEADER_VALUE;

  if (!hasValidCsrfHeader || !readAuthSessionReferenceFromRequestCookie(request)) {
    return handleV0TrialRunStepUpdateRoute(null, null, request, params);
  }

  const { client, db } = createDatabaseConnection();

  try {
    return await handleV0TrialRunStepUpdateRoute(
      createAuthSessionRepository(db),
      createV0TrialRunRepository(db),
      request,
      params,
    );
  } finally {
    await client.end();
  }
}
