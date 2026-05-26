import {
  createAuthSessionRepository,
  readAuthSessionReferenceFromRequestCookie,
} from "@/server/auth";
import { createDatabaseConnection } from "@/server/db/client";
import { createV0TrialFeedbackRepository } from "@/server/trial-feedback/repository";
import {
  handleV0TrialFeedbackCreateRoute,
  handleV0TrialFeedbackListRoute,
  V0_TRIAL_FEEDBACK_MUTATION_CSRF_HEADER_NAME,
  V0_TRIAL_FEEDBACK_MUTATION_CSRF_HEADER_VALUE,
} from "@/server/trial-feedback/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  if (!readAuthSessionReferenceFromRequestCookie(request)) {
    return handleV0TrialFeedbackListRoute(null, null, request);
  }

  const { client, db } = createDatabaseConnection();

  try {
    return await handleV0TrialFeedbackListRoute(
      createAuthSessionRepository(db),
      createV0TrialFeedbackRepository(db),
      request,
    );
  } finally {
    await client.end();
  }
}

export async function POST(request: Request): Promise<Response> {
  const hasValidCsrfHeader =
    request.headers.get(V0_TRIAL_FEEDBACK_MUTATION_CSRF_HEADER_NAME) ===
    V0_TRIAL_FEEDBACK_MUTATION_CSRF_HEADER_VALUE;

  if (!hasValidCsrfHeader || !readAuthSessionReferenceFromRequestCookie(request)) {
    return handleV0TrialFeedbackCreateRoute(null, null, request);
  }

  const { client, db } = createDatabaseConnection();

  try {
    return await handleV0TrialFeedbackCreateRoute(
      createAuthSessionRepository(db),
      createV0TrialFeedbackRepository(db),
      request,
    );
  } finally {
    await client.end();
  }
}
