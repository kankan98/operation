import {
  createAuthSessionRepository,
  readAuthSessionReferenceFromRequestCookie,
} from "@/server/auth";
import { createDatabaseConnection } from "@/server/db/client";
import { createTalkTrackAssetRepository } from "@/server/talk-tracks/repository";
import {
  handleTalkTrackUsageSignalRoute,
  TALK_TRACK_ASSET_MUTATION_CSRF_HEADER_NAME,
  TALK_TRACK_ASSET_MUTATION_CSRF_HEADER_VALUE,
} from "@/server/talk-tracks/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  const hasValidCsrfHeader =
    request.headers.get(TALK_TRACK_ASSET_MUTATION_CSRF_HEADER_NAME) ===
    TALK_TRACK_ASSET_MUTATION_CSRF_HEADER_VALUE;

  if (
    !hasValidCsrfHeader ||
    !readAuthSessionReferenceFromRequestCookie(request)
  ) {
    return handleTalkTrackUsageSignalRoute(null, null, request);
  }

  const { client, db } = createDatabaseConnection();

  try {
    return await handleTalkTrackUsageSignalRoute(
      createAuthSessionRepository(db),
      createTalkTrackAssetRepository(db),
      request,
    );
  } finally {
    await client.end();
  }
}
